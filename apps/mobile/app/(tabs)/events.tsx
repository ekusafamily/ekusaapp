/**
 * EKUSA Mobile App - Events Screen
 * Association activities calendar and directory
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '@ekusa/api-client';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { EventCard } from '@/components/EventCard';
import { router } from 'expo-router';

export default function EventsScreen() {
  const { user } = useAuthStore();
  const { colors, colorScheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');

  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ['events', selectedCategory],
    queryFn: () => eventsApi.list({ category: selectedCategory === 'all' ? undefined : selectedCategory, status: 'published' }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: myRegistrations } = useQuery({
    queryKey: ['my-event-registrations'],
    queryFn: () => eventsApi.list({ status: 'published' }),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = async () => {
    await refetch();
  };

  const handleEventPress = (eventId: string) => {
    router.push({ pathname: '/events/[id]', params: { id: eventId } });
  };

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'meeting', label: 'Meetings' },
    { key: 'hike', label: 'Hikes' },
    { key: 'trip', label: 'Trips' },
    { key: 'social', label: 'Social' },
    { key: 'sports', label: 'Sports' },
    { key: 'academic', label: 'Academic' },
    { key: 'cultural', label: 'Cultural' },
    { key: 'welfare', label: 'Welfare' },
  ];

  const upcomingEvents = useMemo(() => {
    if (!events?.items) return [];
    const now = new Date();
    return events.items.filter((e: any) => new Date(e.startAt) > now);
  }, [events]);

  const pastEvents = useMemo(() => {
    if (!events?.items) return [];
    const now = new Date();
    return events.items.filter((e: any) => new Date(e.startAt) <= now);
  }, [events]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollContent}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryChip,
                selectedCategory === cat.key && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat.key ? { color: colors.onPrimary } : { color: colors.textSecondary },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* My Registrations Section */}
      {user && (myRegistrations?.items?.length ?? 0) > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Registrations</Text>
          </View>
          <FlatList
            data={myRegistrations?.items?.slice(0, 3) || []}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }: { item: any }) => (
              <EventCard event={item} onPress={() => handleEventPress(item.id)} colorScheme={colorScheme} />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
          />
        </View>
      )}

      {/* Upcoming Events */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {selectedCategory === 'all' ? 'Upcoming Events' : `${categories.find(c => c.key === selectedCategory)?.label} Events`}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading events...</Text>
          </View>
        ) : upcomingEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {selectedCategory === 'all' ? 'No upcoming events' : `No upcoming ${categories.find(c => c.key === selectedCategory)?.label.toLowerCase()} events`}
            </Text>
          </View>
        ) : (
          <FlatList
            data={upcomingEvents}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }: { item: any }) => (
              <EventCard event={item} onPress={() => handleEventPress(item.id)} colorScheme={colorScheme} />
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Past Events</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{pastEvents.length} events</Text>
          </View>
          <FlatList
            data={pastEvents}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }: { item: any }) => (
              <EventCard event={item} onPress={() => handleEventPress(item.id)} colorScheme={colorScheme} />
            )}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categoryContainer: {
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.divider,
    paddingVertical: Spacing.sm,
  },
  categoryScrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  sectionContainer: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
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
  sectionSubtitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  horizontalListContent: {
    paddingRight: Spacing.md,
    gap: Spacing.md,
  },
  listContent: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.sizes.md,
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.sizes.md,
    textAlign: 'center',
  },
});