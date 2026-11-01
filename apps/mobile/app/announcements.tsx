/**
 * EKUSA Mobile App - Announcements Screen
 * Full list of official announcements with filtering
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { announcementsApi } from '@ekusa/api-client';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import type { Announcement } from '@ekusa/shared-types';

export default function AnnouncementsScreen() {
  const { user } = useAuthStore();
  const { colors, colorScheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const { data: announcements, isLoading, refetch } = useQuery<{ items: Announcement[]; page: number; limit: number; total: number; totalPages: number }>({
    queryKey: ['announcements', selectedCategory, selectedPriority],
    queryFn: () => announcementsApi.list({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      status: 'published',
      limit: 50,
      sortBy: 'publishedAt',
      sortOrder: 'desc',
    }) as Promise<{ items: Announcement[]; page: number; limit: number; total: number; totalPages: number }>,
    staleTime: 2 * 60 * 1000,
  });

  const handleRefresh = async () => {
    await refetch();
  };

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'general', label: 'General' },
    { key: 'urgent', label: 'Urgent' },
    { key: 'meeting', label: 'Meetings' },
    { key: 'event', label: 'Events' },
    { key: 'leadership', label: 'Leadership' },
    { key: 'welfare', label: 'Welfare' },
    { key: 'election', label: 'Elections' },
    { key: 'administrative', label: 'Admin' },
  ];

  const priorities = [
    { key: 'all', label: 'All Priorities' },
    { key: 'urgent', label: 'Urgent' },
    { key: 'important', label: 'Important' },
    { key: 'normal', label: 'Normal' },
  ];

  const filteredAnnouncements = useMemo(() => {
    if (!announcements?.items) return [];
    let filtered = announcements.items;

    if (selectedPriority !== 'all') {
      filtered = filtered.filter((a: any) => a.priority === selectedPriority);
    }

    return filtered;
  }, [announcements, selectedPriority]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Category Filter */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.filterChip,
                selectedCategory === cat.key && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === cat.key ? { color: colors.onPrimary } : { color: colors.textSecondary },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Priority Filter */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface, borderTopWidth: 0 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
          {priorities.map((pri) => (
            <TouchableOpacity
              key={pri.key}
              style={[
                styles.filterChip,
                selectedPriority === pri.key && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setSelectedPriority(pri.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedPriority === pri.key ? { color: colors.onPrimary } : { color: colors.textSecondary },
                ]}
              >
                {pri.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Announcements List */}
      <FlatList
        data={filteredAnnouncements}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => (
          <AnnouncementCard
            announcement={item}
            onPress={() => {}}
            colorScheme={colorScheme}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No announcements</Text>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              {selectedCategory !== 'all' || selectedPriority !== 'all'
                ? 'Try changing your filters'
                : 'No announcements at this time'}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.divider,
  },
  filterScrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
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
});