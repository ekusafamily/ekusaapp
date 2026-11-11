/**
 * EKUSA Mobile App - Chats Screen
 * Conversation list with last seen and offline persistence
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { messagingApi, userApi } from '@ekusa/api-client';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { Avatar } from '@/components/Avatar';
import { storageService } from '@/services/storageService';
import { router } from 'expo-router';
import { Plus, Search, X, MessageSquare, CheckCheck } from 'lucide-react-native';

const CONVERSATION_POLL_INTERVAL = 15000; // Poll for conversations every 15 seconds

export default function ChatsScreen() {
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [localConversations, setLocalConversations] = useState<any[]>([]);

  const { data: conversations, isLoading, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagingApi.listConversations() as Promise<any[]>,
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  // Load locally cached conversations so the list works offline
  useEffect(() => {
    if (!user) return;
    loadLocalConversations();

    const interval = setInterval(() => {
      refetch();
    }, CONVERSATION_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [user]);

  const loadLocalConversations = async () => {
    try {
      const local = await storageService.getConversationList();
      setLocalConversations(local || []);
    } catch (error) {
      console.error('Failed to load local conversations:', error);
    }
  };

  // Cache server conversations locally and merge with the local list
  useEffect(() => {
    if (!conversations) return;
    const serverList: any[] = Array.isArray(conversations) ? conversations : [];

    (async () => {
      for (const conv of serverList) {
        await storageService.saveConversation(conv).catch(() => {});
      }

      const local = await storageService.getConversationList();
      const merged = mergeConversations(local || [], serverList);
      setLocalConversations(merged);
    })();
  }, [conversations]);

  const mergeConversations = (local: any[], server: any[]) => {
    const byId = new Map<string, any>();
    for (const conv of local) byId.set(conv.id, conv);
    for (const conv of server) {
      const existing = byId.get(conv.id);
      byId.set(conv.id, existing ? { ...existing, ...conv } : conv);
    }
    return Array.from(byId.values()).sort(
      (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    );
  };

  const displayList = useMemo(() => {
    const source = (conversations && Array.isArray(conversations) && conversations.length > 0)
      ? conversations
      : localConversations;
    if (!searchQuery.trim()) return source;
    const q = searchQuery.toLowerCase();
    return source.filter((conv: any) => {
      const name = (conv.otherUser?.displayName || conv.otherUser?.username || '').toLowerCase();
      const preview = (conv.lastMessage?.content || '').toLowerCase();
      return name.includes(q) || preview.includes(q);
    });
  }, [conversations, localConversations, searchQuery]);

  // User search for new chat
  useEffect(() => {
    if (!showNewChatModal || !userSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await userApi.searchUsers(userSearchQuery.trim());
        const items: any[] = Array.isArray(results) ? results : (results as any)?.items || [];
        setSearchResults(items.filter((u: any) => u.id !== user?.id));
      } catch (error) {
        console.error('User search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [userSearchQuery, showNewChatModal]);

  const handleStartChat = async (selectedUser: any) => {
    try {
      const conversation: any = await messagingApi.createConversation(selectedUser.id);
      setShowNewChatModal(false);
      setUserSearchQuery('');
      if (conversation?.id) {
        router.push(`/chats/${conversation.id}?recipientName=${encodeURIComponent(
          conversation.otherUser?.displayName || conversation.otherUser?.username || selectedUser.username || ''
        )}`);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const renderConversation = ({ item }: { item: any }) => {
    const other = item.otherUser || {};
    const name = other.displayName || other.username || 'Member';
    const lastMsg = item.lastMessage;
    const isOwnLast = lastMsg?.senderId === user?.id;
    const unread = item.unreadCount > 0;
    const preview = lastMsg
      ? `${isOwnLast ? 'You: ' : ''}${lastMsg.content}`
      : 'No messages yet';

    return (
      <TouchableOpacity
        style={[styles.conversationItem, { borderBottomColor: colors.border }]}
        onPress={() => router.push(`/chats/${item.id}?recipientName=${encodeURIComponent(name)}`)}
        activeOpacity={0.7}
      >
        <Avatar
          source={other.avatarUrl ? { uri: other.avatarUrl } : undefined}
          name={name}
          size="large"
        />
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.conversationName, { color: colors.textPrimary }]} numberOfLines={1}>
              {name}
            </Text>
            {lastMsg ? (
              <Text style={[styles.conversationTime, { color: colors.textTertiary }]}>
                {formatTime(lastMsg.sentAt)}
              </Text>
            ) : null}
          </View>
          <View style={styles.conversationPreviewRow}>
            <Text
              style={[
                styles.conversationPreview,
                { color: unread ? colors.textPrimary : colors.textTertiary },
                unread && { fontWeight: Typography.weights.semibold },
              ]}
              numberOfLines={1}
            >
              {preview}
            </Text>
            {unread && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount > 9 ? '9+' : item.unreadCount}</Text>
              </View>
            )}
          </View>
          <View style={styles.lastSeenRow}>
            {isOwnLast && lastMsg?.status === 'seen' ? (
              <CheckCheck size={13} color={colors.success} />
            ) : null}
            <Text style={[styles.lastSeenText, { color: colors.textTertiary }]} numberOfLines={1}>
              {formatLastSeen(other.lastSeenAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Chats</Text>
        <TouchableOpacity
          style={[styles.newChatButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowNewChatModal(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Plus size={20} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Search size={18} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search chats"
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Conversation list */}
      <FlatList
        data={displayList}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => refetch()} colors={[colors.primary]} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <MessageSquare size={40} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No conversations yet</Text>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                Tap the + button to start chatting with a family member.
              </Text>
            </View>
          ) : null
        }
      />

      {/* New chat modal */}
      <Modal
        visible={showNewChatModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNewChatModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>New chat</Text>
            <TouchableOpacity
              onPress={() => { setShowNewChatModal(false); setUserSearchQuery(''); }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
            <Search size={18} color={colors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search by name or username"
              placeholderTextColor={colors.textTertiary}
              value={userSearchQuery}
              onChangeText={setUserSearchQuery}
              autoFocus
            />
            {isSearching && <ActivityIndicator size="small" color={colors.primary} />}
          </View>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const name = item.displayName || item.username || 'Member';
              return (
                <TouchableOpacity
                  style={[styles.userItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleStartChat(item)}
                  activeOpacity={0.7}
                >
                  <Avatar
                    source={item.avatarUrl ? { uri: item.avatarUrl } : undefined}
                    name={name}
                    size="medium"
                  />
                  <View>
                    <Text style={[styles.userItemName, { color: colors.textPrimary }]}>{name}</Text>
                    {item.username ? (
                      <Text style={[styles.userItemUsername, { color: colors.textTertiary }]}>@{item.username}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              userSearchQuery.trim() && !isSearching ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textTertiary }]}>No users found</Text>
                </View>
              ) : null
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function formatTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) {
    return date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays < 7) {
    return date.toLocaleDateString('en-KE', { weekday: 'short' });
  }
  return date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
}

function formatLastSeen(lastSeenAt?: string | null): string {
  if (!lastSeenAt) return 'Offline';
  const date = new Date(lastSeenAt);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Online now';
  if (diffMins < 60) return `Last seen ${diffMins}m ago`;
  if (diffHours < 24) return `Last seen ${diffHours}h ago`;
  if (diffDays < 7) return `Last seen ${diffDays}d ago`;
  return `Last seen ${date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.md,
    paddingVertical: Spacing.sm,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  conversationContent: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  conversationName: {
    flex: 1,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  conversationTime: {
    fontSize: Typography.sizes.xs,
  },
  conversationPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  conversationPreview: {
    flex: 1,
    fontSize: Typography.sizes.sm,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  lastSeenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastSeenText: {
    fontSize: Typography.sizes.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  emptyText: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    maxWidth: 280,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userItemName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
  },
  userItemUsername: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
});
