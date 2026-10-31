/**
 * EKUSA Mobile App - Offline Storage Service
 * Manages local persistence for offline-first functionality
 * Uses MMKV for performance, falls back to AsyncStorage
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { Conversation, Message, Announcement, Event, WelfareRequest } from '@ekusa/shared-types';

// Try to use MMKV for better performance, fallback to AsyncStorage
let MMKV: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { MMKV: MMKVClass } = require('react-native-mmkv');
  MMKV = new MMKVClass();
} catch {
  // MMKV not available, will use AsyncStorage
  console.warn('MMKV not available, falling back to AsyncStorage');
}

const STORAGE_PREFIXES = {
  CONVERSATIONS: 'conv_',
  MESSAGES: 'msg_',
  ANNOUNCEMENTS: 'ann_',
  EVENTS: 'evt_',
  WELFARE: 'wlf_',
  USER_PROFILE: 'profile_',
  SETTINGS: 'settings_',
  DRAFTS: 'draft_',
} as const;

const SECURE_KEYS = {
  ENCRYPTION_KEY: 'ekusa_encryption_key',
  AUTH_TOKENS: 'ekusa_auth_tokens',
  DEVICE_KEYS: 'ekusa_device_keys',
} as const;

class StorageService {
  private static instance: StorageService;
  private useMMKV: boolean;

  private constructor() {
    this.useMMKV = MMKV !== null;
  }

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Generic storage methods
  async set<T>(key: string, value: T): Promise<void> {
    const json = JSON.stringify(value);
    if (this.useMMKV) {
      MMKV.set(key, json);
    } else {
      await AsyncStorage.setItem(key, json);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    let json: string | null = null;
    if (this.useMMKV) {
      json = MMKV.getString(key);
    } else {
      json = await AsyncStorage.getItem(key);
    }
    return json ? JSON.parse(json) : null;
  }

  async delete(key: string): Promise<void> {
    if (this.useMMKV) {
      MMKV.delete(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  }

  async clearAll(): Promise<void> {
    if (this.useMMKV) {
      MMKV.clearAll();
    } else {
      await AsyncStorage.clear();
    }
  }

  // Secure storage for sensitive data
  async setSecure(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  }

  async getSecure(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  }

  async deleteSecure(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }

  // Conversation storage
  async saveConversation(conversation: Conversation): Promise<void> {
    await this.set(`${STORAGE_PREFIXES.CONVERSATIONS}${conversation.id}`, conversation);

    // Update conversation list index
    const list = await this.getConversationList();
    const index = list.findIndex(c => c.id === conversation.id);
    if (index >= 0) {
      list[index] = conversation;
    } else {
      list.unshift(conversation);
    }
    await this.set('conversation_list', list);
  }

  async getConversation(id: string): Promise<Conversation | null> {
    return this.get(`${STORAGE_PREFIXES.CONVERSATIONS}${id}`);
  }

  async getConversationList(): Promise<Conversation[]> {
    return (await this.get('conversation_list')) || [];
  }

  async deleteConversation(id: string): Promise<void> {
    await this.delete(`${STORAGE_PREFIXES.CONVERSATIONS}${id}`);
    const list = await this.getConversationList();
    const filtered = list.filter(c => c.id !== id);
    await this.set('conversation_list', filtered);
  }

  // Message storage
  async saveMessage(message: Message): Promise<void> {
    const key = `${STORAGE_PREFIXES.MESSAGES}${message.conversationId}_${message.id}`;
    await this.set(key, message);

    // Update message list for conversation
    const listKey = `msg_list_${message.conversationId}`;
    const list = (await this.get(listKey)) || [];
    const index = list.findIndex((m: Message) => m.id === message.id);
    if (index >= 0) {
      list[index] = message;
    } else {
      list.push(message);
    }
    // Keep only last 500 messages per conversation
    const sorted = list.sort((a: Message, b: Message) =>
      new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    ).slice(0, 500);
    await this.set(listKey, sorted);
  }

  async getMessages(conversationId: string, limit = 100, before?: string): Promise<Message[]> {
    const listKey = `msg_list_${conversationId}`;
    const list = (await this.get(listKey)) || [];

    let filtered = list;
    if (before) {
      const beforeIndex = list.findIndex((m: Message) => m.id === before);
      if (beforeIndex >= 0) {
        filtered = list.slice(beforeIndex + 1);
      }
    }

    return filtered.slice(0, limit);
  }

  async updateMessageStatus(messageId: string, conversationId: string, status: Message['status']): Promise<void> {
    const key = `${STORAGE_PREFIXES.MESSAGES}${conversationId}_${messageId}`;
    const message = await this.get<Message>(key);
    if (message) {
      message.status = status;
      if (status === 'read') message.readAt = new Date().toISOString();
      if (status === 'delivered') message.deliveredAt = new Date().toISOString();
      await this.saveMessage(message);
    }
  }

  // Announcement storage
  async saveAnnouncement(announcement: Announcement): Promise<void> {
    await this.set(`${STORAGE_PREFIXES.ANNOUNCEMENTS}${announcement.id}`, announcement);

    const list = (await this.get('announcement_list')) || [];
    const index = list.findIndex((a: Announcement) => a.id === announcement.id);
    if (index >= 0) list[index] = announcement;
    else list.unshift(announcement);
    await this.set('announcement_list', list.slice(0, 200));
  }

  async getAnnouncement(id: string): Promise<Announcement | null> {
    return this.get(`${STORAGE_PREFIXES.ANNOUNCEMENTS}${id}`);
  }

  async getAnnouncements(limit = 50): Promise<Announcement[]> {
    const list = (await this.get('announcement_list')) || [];
    return list.slice(0, limit);
  }

  // Event storage
  async saveEvent(event: Event): Promise<void> {
    await this.set(`${STORAGE_PREFIXES.EVENTS}${event.id}`, event);

    const list = (await this.get('event_list')) || [];
    const index = list.findIndex((e: Event) => e.id === event.id);
    if (index >= 0) list[index] = event;
    else list.unshift(event);
    await this.set('event_list', list.slice(0, 200));
  }

  async getEvent(id: string): Promise<Event | null> {
    return this.get(`${STORAGE_PREFIXES.EVENTS}${id}`);
  }

  async getEvents(limit = 50): Promise<Event[]> {
    const list = (await this.get('event_list')) || [];
    return list.slice(0, limit);
  }

  // Welfare storage
  async saveWelfareRequest(request: WelfareRequest): Promise<void> {
    await this.set(`${STORAGE_PREFIXES.WELFARE}${request.id}`, request);

    const list = (await this.get('welfare_list')) || [];
    const index = list.findIndex((w: WelfareRequest) => w.id === request.id);
    if (index >= 0) list[index] = request;
    else list.unshift(request);
    await this.set('welfare_list', list.slice(0, 100));
  }

  async getWelfareRequest(id: string): Promise<WelfareRequest | null> {
    return this.get(`${STORAGE_PREFIXES.WELFARE}${id}`);
  }

  async getWelfareRequests(limit = 50): Promise<WelfareRequest[]> {
    const list = (await this.get('welfare_list')) || [];
    return list.slice(0, limit);
  }

  // Draft messages
  async saveDraft(conversationId: string, draft: string): Promise<void> {
    await this.set(`${STORAGE_PREFIXES.DRAFTS}${conversationId}`, {
      text: draft,
      updatedAt: new Date().toISOString()
    });
  }

  async getDraft(conversationId: string): Promise<string | null> {
    const draft = await this.get<{ text: string }>(`${STORAGE_PREFIXES.DRAFTS}${conversationId}`);
    return draft?.text || null;
  }

  async deleteDraft(conversationId: string): Promise<void> {
    await this.delete(`${STORAGE_PREFIXES.DRAFTS}${conversationId}`);
  }

  // User profile
  async saveProfile(profile: any): Promise<void> {
    await this.set(`${STORAGE_PREFIXES.USER_PROFILE}current`, profile);
  }

  async getProfile(): Promise<any | null> {
    return this.get(`${STORAGE_PREFIXES.USER_PROFILE}current`);
  }

  // Settings
  async saveSetting(key: string, value: any): Promise<void> {
    await this.set(`${STORAGE_PREFIXES.SETTINGS}${key}`, value);
  }

  async getSetting<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const value = await this.get<T>(`${STORAGE_PREFIXES.SETTINGS}${key}`);
    return value !== null ? value : defaultValue;
  }

  // Batch operations for sync
  async getAllUnsyncedMessages(): Promise<Message[]> {
    // In a real implementation, you'd track which messages need sync
    const convList = await this.getConversationList();
    const allMessages: Message[] = [];
    for (const conv of convList) {
      const messages = await this.getMessages(conv.id);
      allMessages.push(...messages.filter(m => m.status === 'pending'));
    }
    return allMessages;
  }

  async markMessagesSynced(messageIds: string[]): Promise<void> {
    for (const id of messageIds) {
      // Would need to know conversation ID - simplified here
      // In real app, maintain a sync queue
    }
  }
}

export const storageService = StorageService.getInstance();