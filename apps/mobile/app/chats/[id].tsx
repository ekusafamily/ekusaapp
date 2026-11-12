/**
 * EKUSA Mobile App - Chat Screen
 * Simple messaging with sent/delivered/seen status and last seen
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingApi } from '@ekusa/api-client';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import type { ColorPalette } from '@/constants/DesignTokens';
import { Avatar } from '@/components/Avatar';
import { storageService } from '@/services/storageService';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Check, CheckCheck, MessageSquare, AlertCircle, Loader } from 'lucide-react-native';

const POLL_INTERVAL = 8000; // Poll for new messages every 8 seconds

export default function ChatScreen() {
  const params = useLocalSearchParams<{ id?: string; conversationId?: string; recipientName?: string }>();
  const rawId = params.conversationId || params.id || '';
  const conversationId = Array.isArray(rawId) ? rawId[0] : rawId;
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Load messages from local storage first, then sync with server
  useEffect(() => {
    if (!conversationId) return;
    loadMessages();

    // Announce presence for last seen tracking
    messagingApi.updateLastSeen().catch(() => {});

    // Poll for new messages
    const interval = setInterval(() => {
      if (!isSending) {
        loadMessages(true);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [conversationId]);

  const loadMessages = async (skipLocalLoad = false) => {
    try {
      // 1. Load cached messages from local storage (only on initial load)
      if (!skipLocalLoad) {
        const localMessages = await storageService.getMessages(conversationId);
        if (localMessages && localMessages.length > 0) {
          setMessages(localMessages);
        }
      }

      // 2. Fetch latest conversation & messages from server
      const conversation: any = await messagingApi.getConversation(conversationId);
      if (conversation) {
        if (conversation.otherUser) {
          setOtherUser(conversation.otherUser);
        }

        if (Array.isArray(conversation.messages)) {
          const parsed = conversation.messages.map((m: any) => ({
            id: m.id,
            conversationId: m.conversationId,
            senderId: m.senderId,
            content: m.content || '',
            status: m.status || 'sent',
            sentAt: m.sentAt,
            deliveredAt: m.deliveredAt,
            seenAt: m.seenAt,
          }));

          // Merge local and server messages, deduplicating by ID
          setMessages(prevMessages => {
            const merged = [...prevMessages];
            for (const serverMsg of parsed) {
              const existingIndex = merged.findIndex((m: any) => m.id === serverMsg.id);
              if (existingIndex >= 0) {
                merged[existingIndex] = { ...merged[existingIndex], ...serverMsg };
              } else {
                merged.push(serverMsg);
              }
            }
            merged.sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
            return merged;
          });

          // Save server messages to local storage for offline access
          for (const msg of parsed) {
            await storageService.saveMessage(msg);
          }

          // Mark incoming messages as delivered, and the conversation as seen
          const incomingUnread = parsed.filter(
            (m: any) => m.senderId !== user?.id && (m.status === 'sent' || m.status === 'delivered')
          );
          if (incomingUnread.length > 0) {
            for (const m of incomingUnread.filter((x: any) => x.status === 'sent')) {
              messagingApi.markDelivered(m.id).catch(() => {});
            }
            messagingApi.markSeen(conversationId).catch(() => {});
          }
        }
      }
      setIsLoading(false);
      setTimeout(scrollToBottom, 150);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setIsLoading(false);
    }
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      return messagingApi.sendMessage(conversationId, text) as Promise<any>;
    },
    onSuccess: (serverMsg: any) => {
      setMessages(prev => prev.map(m =>
        m.id.startsWith('temp_')
          ? {
              ...m,
              id: serverMsg?.id || m.id,
              status: serverMsg?.status || 'sent',
              sentAt: serverMsg?.sentAt || m.sentAt,
            }
          : m
      ));
      setIsSending(false);
      queryClient.invalidateQueries({ queryKey: ['conversations'], refetchType: 'none' });
      scrollToBottom();
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to send message';
      console.warn('Send message error:', msg);
      setMessages(prev => prev.map(m =>
        m.id.startsWith('temp_') ? { ...m, status: 'failed' } : m
      ));
      setIsSending(false);
    },
  });

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    const text = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Optimistic message update
    const tempMessage = {
      id: `temp_${Date.now()}`,
      conversationId,
      senderId: user?.id,
      content: text,
      status: 'pending',
      sentAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();
    storageService.saveMessage(tempMessage).catch(console.warn);

    // Persist last seen while active in chat
    messagingApi.updateLastSeen().catch(() => {});

    sendMessageMutation.mutate(text);
  };

  const scrollToBottom = useCallback(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const renderMessage = ({ item }: { item: any }) => {
    const isOwn = item.senderId === user?.id;

    return (
      <View style={[
        styles.messageContainer,
        isOwn ? styles.messageOwn : styles.messageOther,
      ]}>
        {!isOwn && (
          <Avatar
            source={otherUser?.avatarUrl ? { uri: otherUser.avatarUrl } : undefined}
            name={otherUser?.displayName || otherUser?.username}
            size="small"
            style={styles.messageAvatar}
          />
        )}
        <View style={[
          styles.messageBubble,
          isOwn ? [styles.bubbleOwn, { backgroundColor: colors.primary }] : [styles.bubbleOther, { backgroundColor: colors.surfaceVariant }],
        ]}>
          <Text style={[
            styles.messageText,
            isOwn ? styles.textOwn : [styles.textOther, { color: colors.textPrimary }],
          ]}>
            {item.content}
          </Text>
          <View style={styles.messageMeta}>
            <Text style={[styles.messageTime, { color: isOwn ? 'rgba(255,255,255,0.7)' : colors.textTertiary }]}>
              {formatTime(item.sentAt)}
            </Text>
            {isOwn && (
              <MessageStatus
                status={item.status}
                failed={item.status === 'failed'}
                colors={colors}
                isOwnBubble
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" style={styles.loadingContainer} />
      </View>
    );
  }

  const partnerTitle = otherUser?.displayName || otherUser?.username || params.recipientName || 'Member';

  return (
    <SafeAreaView
      edges={['bottom']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Chat Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Avatar
          source={otherUser?.avatarUrl ? { uri: otherUser.avatarUrl } : undefined}
          name={partnerTitle}
          size="medium"
        />
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {partnerTitle}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]} numberOfLines={1}>
            {formatLastSeen(otherUser?.lastSeenAt)}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatArea}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryContainer }]}>
                <MessageSquare size={28} color={colors.primaryDark} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Start the conversation</Text>
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                Messages stay available even when you are offline.
              </Text>
            </View>
          }
        />

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.surfaceVariant, color: colors.textPrimary, borderColor: colors.border },
            ]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textTertiary}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={4000}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: colors.primary },
              !newMessage.trim() && { opacity: 0.5 },
            ]}
            onPress={handleSend}
            disabled={!newMessage.trim() || isSending}
            activeOpacity={0.7}
          >
            {isSending ? (
              <ActivityIndicator color={colors.onPrimary} size="small" />
            ) : (
              <Send size={18} color={colors.onPrimary} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageStatus({
  status,
  failed,
  colors,
}: {
  status: string;
  failed: boolean;
  colors: ColorPalette;
  isOwnBubble?: boolean;
}) {
  if (failed) {
    return <AlertCircle size={14} color={colors.messageStatus.failed} />;
  }
  if (status === 'pending') {
    return <Loader size={13} color="rgba(255,255,255,0.85)" />;
  }
  if (status === 'sent') {
    return <Check size={14} color="rgba(255,255,255,0.85)" />;
  }
  if (status === 'delivered') {
    return <CheckCheck size={14} color="rgba(255,255,255,0.85)" />;
  }
  if (status === 'seen') {
    return <CheckCheck size={14} color={colors.messageStatus.seen} />;
  }
  return null;
}

function formatTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
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
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  headerSubtitle: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  chatArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  emptyTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  emptyText: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
    maxWidth: 260,
  },
  messageContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginVertical: 2,
  },
  messageOwn: {
    justifyContent: 'flex-end',
  },
  messageOther: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    marginBottom: 4,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  bubbleOwn: {
    borderBottomRightRadius: Spacing.xs,
  },
  bubbleOther: {
    borderBottomLeftRadius: Spacing.xs,
  },
  messageText: {
    fontSize: Typography.sizes.md,
    lineHeight: 22,
  },
  textOwn: {
    color: '#FFFFFF',
  },
  textOther: {},
  messageMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  messageTime: {
    fontSize: Typography.sizes.xs,
  },
  statusLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sizes.md,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
