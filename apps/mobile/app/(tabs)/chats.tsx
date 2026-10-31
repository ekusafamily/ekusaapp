/**
 * EKUSA Mobile App - Chats Screen
 * Conversation list for private messaging
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { messagingApi } from '@ekusa/api-client';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { Avatar } from '@/components/Avatar';

export default function ChatsScreen() {
  const { user, colorScheme } = useAuthStore();
  const { colorScheme: themeColorScheme } = useTheme();
  const effectiveColorScheme = colorScheme || themeColorScheme;
  const colors = Colors[effectiveColorScheme];

  const { data: conversations, isLoading, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagingApi.listConversations(),
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  const [searchQuery, setSearchQuery] = React.useState('');

  const handleRefresh = async () => {
    await refetch();
  };

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations || [];
    const query = searchQuery.toLowerCase();
    return (conversations || []).filter((conv: any) =>
      conv.otherUser?.displayName?.toLowerCase().includes(query) ||
      conv.otherUser?.username?.toLowerCase().includes(query) ||
      conv.lastMessage?.content?.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  const startNewChat = () => {
    // Navigate to user search screen
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.authPrompt}>
          <Text style={[styles.authPromptTitle, { color: colors.textPrimary }]}>Sign in to access messages</Text>
          <Text style={[styles.authPromptText, { color: colors.textSecondary }]}>You need to be logged in to view and send messages.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <TextInput
          style={[
            styles.searchInput,
            { backgroundColor: colors.surfaceVariant, color: colors.textPrimary },
          ]}
          placeholder="Search conversations..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={startNewChat}
        />
      </View>

      {/* Conversation List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => <ConversationItem conversation={item} colorScheme={effectiveColorScheme} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No conversations yet</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Tap the search bar to start a new conversation
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

function ConversationItem({ conversation, colorScheme }: { conversation: any; colorScheme: 'light' | 'dark' }) {
  const colors = Colors[colorScheme];
  const otherUser = conversation.otherUser;
  const lastMessage = conversation.lastMessage;
  const unreadCount = conversation.unreadCount || 0;

  return (
    <TouchableOpacity style={[styles.conversationItem, { backgroundColor: colors.surface }]} onPress={() => {}} activeOpacity={0.7}>
      <Avatar
        source={otherUser?.avatarUrl ? { uri: otherUser.avatarUrl } : undefined}
        name={otherUser?.displayName || otherUser?.username}
        size="medium"
      />
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.conversationName, { color: colors.textPrimary }]}>
            {otherUser?.displayName || otherUser?.username || 'Unknown'}
          </Text>
          {lastMessage && (
            <Text style={[styles.conversationTime, { color: colors.textTertiary }]}>
              {formatMessageTime(lastMessage.sentAt)}
            </Text>
          )}
        </View>
        <View style={styles.conversationMeta}>
          <Text
            style={[
              styles.lastMessage,
              { color: lastMessage?.status === 'unread' ? colors.textPrimary : colors.textSecondary },
            ]}
            numberOfLines={1}
          >
            {lastMessage?.senderId === 'me' ? 'You: ' : ''}
            {getMessagePreview(lastMessage)}
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function getMessagePreview(message: any): string {
  if (!message) return 'No messages yet';
  switch (message.messageType) {
    case 'image': return '📷 Photo';
    case 'file': return '📎 File';
    case 'voice': return '🎤 Voice message';
    case 'system': return message.content;
    case 'deletion': return 'This message was deleted';
    default: return message.content || 'Encrypted message';
  }
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.divider,
  },
  searchInput: {
    height: 44,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sizes.md,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.divider,
    gap: Spacing.md,
  },
  conversationContent: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.xs,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    flex: 1,
  },
  conversationTime: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  conversationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: Typography.sizes.sm,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.sizes.md,
    textAlign: 'center',
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  authPromptTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  authPromptText: {
    fontSize: Typography.sizes.md,
    textAlign: 'center',
    lineHeight: 22,
  },
});