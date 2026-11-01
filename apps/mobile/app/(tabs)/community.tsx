/**
 * EKUSA Mobile App - Community Screen
 * EKUSA-oriented group engagement
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { communityApi } from '@ekusa/api-client';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';

export default function CommunityScreen() {
  const { user } = useAuthStore();
  const { colors, colorScheme } = useTheme();

  const { data: communities, isLoading, refetch } = useQuery({
    queryKey: ['communities'],
    queryFn: () => communityApi.list({ isPublic: true }),
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = async () => {
    await refetch();
  };

  const communityTypes = [
    { key: 'general', label: 'General', icon: '🏛️' },
    { key: 'campus', label: 'Campus', icon: '🏫' },
    { key: 'constituency', label: 'Constituency', icon: '🗺️' },
    { key: 'committee', label: 'Committees', icon: '👥' },
    { key: 'interest', label: 'Interest Groups', icon: '⭐' },
    { key: 'event', label: 'Event Groups', icon: '📅' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={communityTypes}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.typeCard} onPress={() => {}} activeOpacity={0.7}>
            <View style={styles.typeHeader}>
              <Text style={styles.typeIcon}>{item.icon}</Text>
              <View style={styles.typeInfo}>
                <Text style={[styles.typeTitle, { color: colors.textPrimary }]}>{item.label} Communities</Text>
                <Text style={[styles.typeSubtitle, { color: colors.textSecondary }]}>
                  {getCommunityCount(communities, item.key)} communities
                </Text>
              </View>
            </View>
            <View style={styles.typePreview}>
              {getSampleCommunities(communities, item.key).map((comm: any) => (
                <View key={comm.id} style={styles.previewItem}>
                  <Text style={[styles.previewName, { color: colors.textPrimary }]}>{comm.name}</Text>
                  <Text style={[styles.previewMembers, { color: colors.textTertiary }]}>
                    {comm.memberCount} members
                  </Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.viewAllButton} onPress={() => {}}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View all {item.label.toLowerCase()} communities →</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No communities available</Text>
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

function getCommunityCount(communities: any, type: string): number {
  if (!communities?.items) return 0;
  return communities.items.filter((c: any) => c.type === type).length;
}

function getSampleCommunities(communities: any, type: string): any[] {
  if (!communities?.items) return [];
  return communities.items.filter((c: any) => c.type === type).slice(0, 3);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  typeCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  typeIcon: {
    fontSize: 28,
  },
  typeInfo: {
    flex: 1,
  },
  typeTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  typeSubtitle: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  typePreview: {
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.divider,
  },
  previewName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  previewMembers: {
    fontSize: Typography.sizes.xs,
  },
  viewAllButton: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.divider,
  },
  viewAllText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
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
  },
});