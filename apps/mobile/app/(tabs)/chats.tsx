/**
 * EKUSA Mobile App - Chats Screen
 * Conversation list for private messaging
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { messagingApi, userApi } from '@ekusa/api-client';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { Avatar } from '@/components/Avatar';
import { router } from 'expo-router';
import { Plus, Search, X, MessageSquare } from 'lucide-react-native';

export default function ChatsScreen() {
  const { user } = useAuthStore();
  const { colors, colorScheme } = useTheme();
  const queryClient = useQueryClient();

  const { data: conversations, isLoading, refetch } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagingApi.listConversations(),
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  const [searchQuery, setSearchQuery] = useState('');

  // New Chat Modal States
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleRefresh = async () => {
    await refetch();
  };

  // Perform user search when query changes or modal opens
  useEffect(() => {
    if (!isSearchModalVisible) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const response: any = await userApi.searchUsers(userSearchQuery.trim(), 20, 0);
        const usersList: any[] = response?.items || response || [];
        // Filter out current logged in user
        const filtered = usersList.filter((u: any) => u.id !== user?.id);
        setSearchResults(filtered);
      } catch (err: any) {
        console.error('Failed to search users:', err);
        setSearchError(err.message || 'Unable to load members');
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [userSearchQuery, isSearchModalVisible, user?.id]);

  const handleStartChat = async (selectedUser: any) => {
    if (isStartingChat) return;
    setIsStartingChat(selectedUser.id);
    setSearchError(null);
    try {
      const conv: any = await messagingApi.createConversation({
        recipientId: selectedUser.id,
      });

      // Refresh conversations list cache
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });

      setIsSearchModalVisible(false);
      setUserSearchQuery('');
      setIsStartingChat(null);

      // Navigate into the active conversation
      const conversationId = conv?.id || conv?.data?.id;
      if (conversationId) {
        router.push({
          pathname: '/(tabs)/chats/[id]',
          params: { id: conversationId, conversationId },
        });
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to start conversation. Please try again.';
      console.warn('Failed to start chat session:', errorMsg);
      setSearchError(errorMsg);
      setIsStartingChat(null);
    }
  };

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    const list: any[] = Array.isArray(conversations) ? conversations : ((conversations as any)?.items || []);
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter((conv: any) =>
      conv.otherUser?.displayName?.toLowerCase().includes(query) ||
      conv.otherUser?.username?.toLowerCase().includes(query) ||
      conv.lastMessage?.content?.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.authPrompt}>
          <Text style={[styles.authPromptTitle, { color: colors.textPrimary }]}>Sign in to access messages</Text>
          <Text style={[styles.authPromptText, { color: colors.textSecondary }]}>You need to be logged in to view and send messages.</Text>
          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={[styles.authButtonText, { color: colors.onPrimary }]}>Sign In</Text>
          </TouchableOpacity>
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
        />
      </View>

      {/* Conversation List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => <ConversationItem conversation={item} colorScheme={colorScheme} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No conversations yet</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              Tap the + button below to find members and start a chat session
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Floating Action Button for New Chat */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          setIsSearchModalVisible(true);
          setUserSearchQuery('');
        }}
        activeOpacity={0.85}
        accessibilityLabel="Start new chat"
        accessibilityRole="button"
      >
        <Plus size={26} color={colors.onPrimary} />
      </TouchableOpacity>

      {/* Search Users Modal */}
      <Modal
        visible={isSearchModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (!isStartingChat) setIsSearchModalVisible(false);
        }}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>New Chat</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Select a member to start a chat session
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => setIsSearchModalVisible(false)}
              disabled={!!isStartingChat}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* User Search Input */}
          <View style={[styles.modalSearchBox, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <View style={[styles.modalSearchInputContainer, { backgroundColor: colors.surfaceVariant }]}>
              <Search size={18} color={colors.textTertiary} style={styles.searchIcon} />
              <TextInput
                style={[styles.modalSearchInput, { color: colors.textPrimary }]}
                placeholder="Search by username or name..."
                placeholderTextColor={colors.textTertiary}
                value={userSearchQuery}
                onChangeText={setUserSearchQuery}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
              />
              {userSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setUserSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Search Error Notice */}
          {searchError && (
            <View style={[styles.errorBox, { backgroundColor: colors.errorContainer }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{searchError}</Text>
            </View>
          )}

          {/* Search Results List */}
          {isSearching && searchResults.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.centerText, { color: colors.textSecondary }]}>Searching members...</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item: any) => item.id}
              contentContainerStyle={styles.resultsListContent}
              renderItem={({ item }) => {
                const isSelected = isStartingChat === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.userItem, { backgroundColor: colors.surface }]}
                    onPress={() => handleStartChat(item)}
                    disabled={!!isStartingChat}
                    activeOpacity={0.7}
                  >
                    <Avatar
                      source={item.avatarUrl ? { uri: item.avatarUrl } : undefined}
                      name={item.displayName || item.username}
                      size="medium"
                    />
                    <View style={styles.userInfo}>
                      <Text style={[styles.userDisplayName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {item.displayName || item.username}
                      </Text>
                      <Text style={[styles.userUsername, { color: colors.textSecondary }]} numberOfLines={1}>
                        @{item.username}
                        {item.campus ? ` • ${item.campus}` : ''}
                      </Text>
                    </View>
                    <View style={styles.actionContainer}>
                      {isSelected ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <View style={[styles.chatActionButton, { backgroundColor: colors.surfaceVariant }]}>
                          <MessageSquare size={16} color={colors.primary} />
                          <Text style={[styles.chatActionText, { color: colors.primary }]}>Chat</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                !isSearching ? (
                  <View style={styles.centerContainer}>
                    <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No members found</Text>
                    <Text style={[styles.centerText, { color: colors.textTertiary }]}>
                      {userSearchQuery.trim()
                        ? `No members matching "${userSearchQuery}"`
                        : 'No other members registered yet'}
                    </Text>
                  </View>
                ) : null
              }
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function ConversationItem({ conversation, colorScheme }: { conversation: any; colorScheme: 'light' | 'dark' }) {
  const colors = Colors[colorScheme];
  const otherUser = conversation.otherUser;
  const lastMessage = conversation.lastMessage;
  const unreadCount = conversation.unreadCount || 0;

  const handlePress = () => {
    router.push({ pathname: '/(tabs)/chats/[id]', params: { id: conversation.id } });
  };

  return (
    <TouchableOpacity style={[styles.conversationItem, { backgroundColor: colors.surface }]} onPress={handlePress} activeOpacity={0.7}>
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
    case 'image': return 'Photo';
    case 'file': return 'File';
    case 'voice': return 'Voice message';
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
    marginBottom: Spacing.lg,
  },
  authButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  authButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    zIndex: 10,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  modalSubtitle: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSearchBox: {
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  modalSearchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: Typography.sizes.md,
    height: '100%',
  },
  errorBox: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    fontSize: Typography.sizes.sm,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: 40,
    gap: Spacing.sm,
  },
  centerText: {
    fontSize: Typography.sizes.sm,
    textAlign: 'center',
  },
  resultsListContent: {
    paddingVertical: Spacing.sm,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  userDisplayName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  userUsername: {
    fontSize: Typography.sizes.sm,
  },
  actionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  chatActionText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
});