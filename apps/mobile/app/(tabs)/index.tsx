/**
 * EKUSA Mobile App - Home Screen (EKUSA Dashboard)
 * Primary screen showing announcements, events, quick actions, and association updates
 */

import { View, Text, ScrollView, RefreshControl, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { announcementsApi, eventsApi } from '@ekusa/api-client';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { EventCard } from '@/components/EventCard';
import { QuickActionButton } from '@/components/QuickActionButton';
import { Avatar } from '@/components/Avatar';
import { MembershipBadge } from '@/components/MembershipBadge';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { colors, colorScheme } = useTheme();

  const { data: announcements, isLoading: announcementsLoading, refetch: refetchAnnouncements } = useQuery({
    queryKey: ['announcements', 'home'],
    queryFn: () => announcementsApi.list({ status: 'published', limit: 5, sortBy: 'publishedAt', sortOrder: 'desc' }),
    staleTime: 2 * 60 * 1000,
  });

  const { data: events, isLoading: eventsLoading, refetch: refetchEvents } = useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: () => eventsApi.list({ status: 'published', upcoming: true, limit: 4, sortBy: 'startAt', sortOrder: 'asc' }),
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = async () => {
    await Promise.all([refetchAnnouncements(), refetchEvents()]);
  };

  const quickActions = [
    { label: 'Announcements', icon: 'megaphone', route: '/announcements' },
    { label: 'Events', icon: 'calendar', route: '/events' },
    { label: 'Community', icon: 'users', route: '/community' },
    { label: user?.accountStatus !== 'verified_member' ? 'Apply Membership' : 'My Membership', icon: 'badge', route: '/membership' },
    { label: 'Contact Leadership', icon: 'mail', route: '/contact-leadership' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={announcementsLoading || eventsLoading} onRefresh={handleRefresh} colors={[colors.primary]} />
      }
      contentContainerStyle={styles.contentContainer}
    >
      {/* Welcome Section */}
      <View style={[styles.welcomeSection, { backgroundColor: colors.surface }]}>
        <View style={styles.welcomeContent}>
          <View style={styles.welcomeTextContainer}>
            <Text style={[styles.welcomeGreeting, { color: colors.textPrimary }]}>
              Good {getGreetingTime()}, {user?.displayName || user?.username || 'Member'}
            </Text>
            <View style={styles.welcomeMeta}>
              <MembershipBadge status={user?.accountStatus || 'registered'} size="small" />
              <Text style={[styles.welcomeRole, { color: colors.textSecondary }]}>
                {getCampusText(user)}
              </Text>
            </View>
          </View>
          <Avatar
            source={user?.avatarUrl ? { uri: user.avatarUrl } : undefined}
            name={user?.displayName || user?.username}
            size="large"
          />
        </View>
      </View>

      {/* Important Announcements */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Important Announcements</Text>
          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>

        {announcementsLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading announcements...</Text>
          </View>
        ) : announcements?.items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No announcements at this time</Text>
          </View>
        ) : (
          <View style={styles.announcementsList}>
            {announcements?.items.map((announcement: any) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                onPress={() => {}}
                colorScheme={colorScheme}
              />
            ))}
          </View>
        )}
      </View>

      {/* Upcoming Events */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Upcoming Events</Text>
          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>

        {eventsLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading events...</Text>
          </View>
        ) : events?.items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No upcoming events</Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {events?.items.map((event: any) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => {}}
                colorScheme={colorScheme}
              />
            ))}
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <QuickActionButton
              key={action.label}
              label={action.label}
              iconName={action.icon}
              onPress={() => {}}
              colorScheme={colorScheme}
            />
          ))}
        </View>
      </View>

      {/* Association Updates */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Association Updates</Text>
        <View style={styles.updatesList}>
          <AssociationUpdateItem
            title="New Leadership Elected"
            description="EKUSA congratulates the newly elected officials for the 2024/2025 term."
            time="2 days ago"
            colorScheme={colorScheme}
          />
          <AssociationUpdateItem
            title="Welfare Fund Disbursement"
            description="KES 500,000 disbursed to support 25 students in emergency assistance program."
            time="1 week ago"
            colorScheme={colorScheme}
          />
          <AssociationUpdateItem
            title="Annual General Meeting"
            description="AGM scheduled for March 15th. All verified members are encouraged to attend."
            time="2 weeks ago"
            colorScheme={colorScheme}
          />
        </View>
      </View>
    </ScrollView>
  );
}

function getGreetingTime(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function getCampusText(user: any): string {
  if (user?.campus) return `${user.campus} Campus`;
  if (user?.course) return user.course;
  return 'EKUSA Member';
}

function AssociationUpdateItem({ title, description, time, colorScheme }: { title: string; description: string; time: string; colorScheme: 'light' | 'dark' }) {
  const colors = Colors[colorScheme];
  return (
    <View style={[styles.updateItem, { borderBottomColor: colors.border }]}>
      <View style={styles.updateContent}>
        <Text style={[styles.updateTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.updateDescription, { color: colors.textSecondary }]}>{description}</Text>
        <Text style={[styles.updateTime, { color: colors.textTertiary }]}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing.xl,
  },
  welcomeSection: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeGreeting: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs,
  },
  welcomeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  welcomeRole: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  sectionContainer: {
    marginHorizontal: Spacing.md,
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
  seeAllButton: {
    padding: Spacing.xs,
  },
  seeAllText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  loadingContainer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.sizes.md,
  },
  emptyContainer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.sizes.md,
  },
  announcementsList: {
    gap: Spacing.md,
  },
  eventsList: {
    gap: Spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  updatesList: {
    gap: 0,
  },
  updateItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  updateContent: {
    gap: Spacing.xs,
  },
  updateTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  updateDescription: {
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
  },
  updateTime: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
});