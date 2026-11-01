/**
 * EKUSA Mobile App - Community Detail Screen
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityApi } from '@ekusa/api-client';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { Avatar } from '@/components/Avatar';
import { router } from 'expo-router';
import type { Community } from '@ekusa/shared-types';

interface RouteParams {
  id: string;
}

export default function CommunityDetailScreen({ route }: { route: { params: RouteParams } }) {
  const { id: communityId } = route.params;
  const { user } = useAuthStore();
  const { colors, colorScheme } = useTheme();
  const queryClient = useQueryClient();
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const { data: community, isLoading, refetch } = useQuery<Community>({
    queryKey: ['community', communityId],
    queryFn: () => communityApi.get(communityId) as Promise<Community>,
    staleTime: 5 * 60 * 1000,
  });

  const joinMutation = useMutation({
    mutationFn: () => communityApi.join(communityId),
    onSuccess: () => {
      setIsMember(true);
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to join community');
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => communityApi.leave(communityId),
    onSuccess: () => {
      setIsMember(false);
      queryClient.invalidateQueries({ queryKey: ['community', communityId] });
      queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to leave community');
    },
  });

  const handleJoinLeave = () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to join communities.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    if (isMember) {
      Alert.alert('Leave Community', 'Are you sure you want to leave this community?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => leaveMutation.mutate() },
      ]);
    } else {
      joinMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" style={styles.loadingContainer} />
      </View>
    );
  }

  if (!community) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.notFoundContainer}>
          <Text style={[styles.notFoundTitle, { color: colors.textPrimary }]}>Community Not Found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={[styles.backButtonText, { color: colors.primary }]}>Back to Communities</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Mock posts for now
  const posts = [
    { id: '1', author: { displayName: 'John Doe', avatarUrl: undefined }, content: 'Welcome to the community!', createdAt: new Date().toISOString(), likes: 5, comments: 2 },
    { id: '2', author: { displayName: 'Jane Smith', avatarUrl: undefined }, content: 'Looking forward to the upcoming events.', createdAt: new Date().toISOString(), likes: 3, comments: 1 },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Community Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <View style={styles.headerContent}>
            <Avatar
              source={community.avatarUrl ? { uri: community.avatarUrl } : undefined}
              name={community.name}
              size="xlarge"
            />
            <View style={styles.headerInfo}>
              <Text style={[styles.headerName, { color: colors.textPrimary }]}>{community.name}</Text>
              <View style={styles.headerMeta}>
                <Text style={[styles.headerMetaText, { color: colors.textSecondary }]}>
                  {community.memberCount} members
                </Text>
                <Text style={[styles.headerMetaText, { color: colors.textSecondary }]}>•</Text>
                <Text style={[styles.headerMetaText, { color: colors.textSecondary }]}>
                  {community.type.charAt(0).toUpperCase() + community.type.slice(1)}
                </Text>
              </View>
            </View>
          </View>
          <Text style={[styles.headerDescription, { color: colors.textSecondary }]}>{community.description}</Text>

          {/* Join/Leave Button */}
          <TouchableOpacity
            style={[
              styles.joinButton,
              {
                backgroundColor: isMember ? colors.errorContainer : colors.primary,
                borderColor: isMember ? colors.error : colors.primary,
              }
            ]}
            onPress={handleJoinLeave}
            disabled={isJoining || joinMutation.isPending || leaveMutation.isPending}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.joinButtonText,
              { color: isMember ? colors.error : colors.onPrimary },
            ]}>
              {isJoining ? 'Joining...' : isMember ? 'Leave Community' : 'Join Community'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Posts Section */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Posts</Text>
            {isMember && (
              <TouchableOpacity style={styles.createPostButton} onPress={() => {}}>
                <Text style={[styles.createPostButtonText, { color: colors.primary }]}>Create Post</Text>
              </TouchableOpacity>
            )}
          </View>

          {isMember ? (
            <View style={styles.createPostInput}>
              <TextInput
                style={[
                  styles.postInput,
                  { backgroundColor: colors.surfaceVariant, color: colors.textPrimary, borderColor: colors.border },
                ]}
                placeholder="What's on your mind?"
                placeholderTextColor={colors.textTertiary}
                value={newPost}
                onChangeText={setNewPost}
                multiline
                maxLength={2000}
                numberOfLines={4}
              />
              <TouchableOpacity
                style={[
                  styles.postSubmitButton,
                  { backgroundColor: colors.primary },
                  !newPost.trim() && { opacity: 0.5 },
                ]}
                onPress={() => {}}
                disabled={!newPost.trim() || isPosting}
              >
                <Text style={[
                  styles.postSubmitButtonText,
                  { color: colors.onPrimary },
                ]}>Post</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.memberOnlyNotice}>
              <Text style={[styles.memberOnlyText, { color: colors.textSecondary }]}>
                Join the community to participate in discussions
              </Text>
            </View>
          )}

          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PostItem post={item} colorScheme={colorScheme} />}
            ListEmptyComponent={
              <View style={styles.emptyPosts}>
                <Text style={[styles.emptyPostsText, { color: colors.textTertiary }]}>
                  No posts yet. Be the first to post!
                </Text>
              </View>
            }
            contentContainerStyle={styles.postsList}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PostItem({ post, colorScheme }: { post: any; colorScheme: 'light' | 'dark' }) {
  const colors = Colors[colorScheme];
  return (
    <View style={[styles.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.postHeader}>
        <Avatar
          source={post.author.avatarUrl ? { uri: post.author.avatarUrl } : undefined}
          name={post.author.displayName}
          size="small"
        />
        <View style={styles.postAuthorInfo}>
          <Text style={[styles.postAuthorName, { color: colors.textPrimary }]}>{post.author.displayName}</Text>
          <Text style={[styles.postTime, { color: colors.textTertiary }]}>
            {formatRelativeTime(post.createdAt)}
          </Text>
        </View>
      </View>
      <Text style={[styles.postContent, { color: colors.textPrimary }]}>{post.content}</Text>
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>💬 {post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>❤️ {post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  headerMetaText: {
    fontSize: Typography.sizes.sm,
  },
  headerDescription: {
    fontSize: Typography.sizes.md,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  joinButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  joinButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  sectionCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  createPostButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  createPostButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  createPostInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.divider,
  },
  postInput: {
    flex: 1,
    minHeight: 80,
    maxHeight: 150,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sizes.md,
  },
  postSubmitButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  postSubmitButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  memberOnlyNotice: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  memberOnlyText: {
    fontSize: Typography.sizes.md,
    textAlign: 'center',
  },
  postsList: {
    gap: Spacing.md,
  },
  postCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  postAuthorInfo: {
    flex: 1,
  },
  postAuthorName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  postTime: {
    fontSize: Typography.sizes.xs,
    marginTop: 2,
  },
  postContent: {
    fontSize: Typography.sizes.md,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  postActions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.divider,
  },
  actionButton: {
    paddingVertical: Spacing.xs,
  },
  actionButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  emptyPosts: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyPostsText: {
    fontSize: Typography.sizes.md,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  notFoundTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
});