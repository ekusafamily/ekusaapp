/**
 * EKUSA Mobile App - Home Screen (EKUSA Dashboard)
 * Priority hierarchy: identity & actions first, one featured announcement,
 * compact upcoming-events rail. Announcements no longer dominate the page.
 */

import type { ReactNode } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { announcementsApi, eventsApi } from '@ekusa/api-client';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { QuickActionButton } from '@/components/QuickActionButton';
import { Avatar } from '@/components/Avatar';
import { MembershipBadge } from '@/components/MembershipBadge';
import { router } from 'expo-router';
import { Megaphone, ChevronRight, CalendarDays, AlertTriangle, Pin, MessagesSquare } from 'lucide-react-native';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { colors } = useTheme();

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
    { label: 'Events', icon: 'calendar', route: '/(tabs)/events' },
    { label: user?.accountStatus !== 'verified_member' ? 'Apply Membership' : 'My Membership', icon: 'badge', route: user?.accountStatus !== 'verified_member' ? '/(auth)/membership-apply' : '/(tabs)/profile' },
    { label: 'Welfare Support', icon: 'mail', route: '/welfare' },
  ];

  const handleQuickAction = (route: string) => {
    router.push(route as any);
  };

  const items: any[] = announcements?.items || [];
  // The one announcement that matters most: pinned or urgent first, else newest
  const featured =
    items.find((a: any) => a.pinned) ||
    items.find((a: any) => a.priority === 'urgent') ||
    items[0];
  const others = featured ? items.filter((a: any) => a.id !== featured.id) : [];
  const upcomingEvents: any[] = events?.items || [];
  const nextEvent = upcomingEvents[0];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={announcementsLoading || eventsLoading} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />
      }
      contentContainerStyle={styles.contentContainer}
    >
      {/* Priority 1: Identity & membership status */}
      <View style={[styles.hero, { backgroundColor: colors.secondary }]}>
        <TouchableOpacity
          style={styles.heroRow}
          onPress={() => router.push('/(tabs)/profile')}
          activeOpacity={0.9}
        >
          <View style={styles.heroText}>
            <Text style={[styles.heroGreeting, { color: colors.onSecondary, opacity: 0.7 }]}>
              Good {getGreetingTime()},
            </Text>
            <Text style={[styles.heroName, { color: colors.onSecondary }]} numberOfLines={1}>
              {user?.displayName || user?.username || 'Member'}
            </Text>
          </View>
          <Avatar
            source={user?.avatarUrl ? { uri: user.avatarUrl } : undefined}
            name={user?.displayName || user?.username}
            size="large"
          />
        </TouchableOpacity>
        <View style={styles.heroMeta}>
          <MembershipBadge status={user?.accountStatus || 'registered'} size="small" />
          <Text style={[styles.heroCampus, { color: colors.onSecondary, opacity: 0.7 }]}>{getCampusText(user)}</Text>
        </View>

        {!user && (
          <TouchableOpacity
            style={[styles.heroCta, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={[styles.heroCtaText, { color: colors.onPrimary }]}>Sign in to continue</Text>
            <ChevronRight size={16} color={colors.onPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Priority 2: Quick actions */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>What do you want to do?</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <QuickActionButton
              key={action.label}
              label={action.label}
              iconName={action.icon}
              onPress={() => handleQuickAction(action.route)}
              colors={colors}
            />
          ))}
        </View>
      </View>

      {/* Priority 3: One featured announcement + compact alert count */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Announcements</Text>
          <TouchableOpacity style={styles.seeAllButton} onPress={() => router.push('/announcements')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
            <ChevronRight size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {announcementsLoading ? (
          <SkeletonCard color={colors.surfaceVariant} />
        ) : !featured ? (
          <EmptyHint icon={<Megaphone size={18} color={colors.textTertiary} />} text="No announcements right now" color={colors} />
        ) : (
          <>
            <TouchableOpacity
              style={[styles.featuredCard, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/announcements')}
              activeOpacity={0.85}
            >
              <View style={styles.featuredBadgeRow}>
                {featured.pinned ? (
                  <View style={styles.featuredBadge}>
                    <Pin size={11} color="#FFFFFF" />
                    <Text style={styles.featuredBadgeText}>Pinned</Text>
                  </View>
                ) : featured.priority !== 'normal' ? (
                  <View style={styles.featuredBadge}>
                    <AlertTriangle size={11} color="#FFFFFF" />
                    <Text style={styles.featuredBadgeText}>{featured.priority}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.featuredTitle} numberOfLines={2}>{featured.title}</Text>
              <Text style={styles.featuredBody} numberOfLines={2}>{featured.body}</Text>
              <Text style={styles.featuredMeta}>
                {featured.publisherName ? `By ${featured.publisherName}` : ''}
              </Text>
            </TouchableOpacity>

            {others.length > 0 && (
              <View style={[styles.othersCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {others.slice(0, 2).map((a: any, i: number) => (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.otherRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
                    onPress={() => router.push('/announcements')}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.otherDot,
                      { backgroundColor: a.priority === 'urgent' ? colors.error : a.priority === 'important' ? colors.warning : colors.textTertiary },
                    ]} />
                    <Text style={[styles.otherTitle, { color: colors.textSecondary }]} numberOfLines={1}>{a.title}</Text>
                    <ChevronRight size={14} color={colors.textTertiary} />
                  </TouchableOpacity>
                ))}
                {others.length > 2 && (
                  <TouchableOpacity style={styles.moreRow} onPress={() => router.push('/announcements')}>
                    <Text style={[styles.moreText, { color: colors.primary }]}>+{others.length - 2} more</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
      </View>

      {/* Priority 4: Compact upcoming events rail */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Upcoming Events</Text>
          <TouchableOpacity style={styles.seeAllButton} onPress={() => router.push('/(tabs)/events')}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
            <ChevronRight size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {eventsLoading ? (
          <SkeletonCard color={colors.surfaceVariant} />
        ) : upcomingEvents.length === 0 ? (
          <EmptyHint icon={<CalendarDays size={18} color={colors.textTertiary} />} text="No upcoming events" color={colors} />
        ) : (
          <>
            {nextEvent && (
              <TouchableOpacity
                style={[styles.nextEventCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => router.push({ pathname: '/events/[id]', params: { id: nextEvent.id } })}
                activeOpacity={0.8}
              >
                <View style={[styles.nextEventDate, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={[styles.nextEventDay, { color: colors.primaryDark }]}>
                    {new Date(nextEvent.startAt).getDate()}
                  </Text>
                  <Text style={[styles.nextEventMonth, { color: colors.primaryDark }]}>
                    {new Date(nextEvent.startAt).toLocaleDateString('en-KE', { month: 'short' }).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.nextEventInfo}>
                  <Text style={[styles.nextEventLabel, { color: colors.textTertiary }]}>NEXT UP</Text>
                  <Text style={[styles.nextEventTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {nextEvent.title}
                  </Text>
                  <Text style={[styles.nextEventVenue, { color: colors.textSecondary }]} numberOfLines={1}>
                    {nextEvent.venue}
                  </Text>
                </View>
                <ChevronRight size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}

            {upcomingEvents.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.eventRail}>
                {upcomingEvents.slice(1).map((event: any) => (
                  <TouchableOpacity
                    key={event.id}
                    style={[styles.railCard, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
                    onPress={() => router.push({ pathname: '/events/[id]', params: { id: event.id } })}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.railTitle, { color: colors.textPrimary }]} numberOfLines={2}>{event.title}</Text>
                    <Text style={[styles.railDate, { color: colors.textSecondary }]}>
                      {new Date(event.startAt).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </>
        )}
      </View>

      {/* Priority 5: Chats shortcut */}
      <TouchableOpacity
        style={[styles.chatsShortcut, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push('/(tabs)/chats')}
        activeOpacity={0.8}
      >
        <View style={[styles.chatsIconWrap, { backgroundColor: colors.primaryContainer }]}>
          <MessagesSquare size={20} color={colors.primaryDark} />
        </View>
        <View style={styles.chatsShortcutText}>
          <Text style={[styles.chatsShortcutTitle, { color: colors.textPrimary }]}>Messages</Text>
          <Text style={[styles.chatsShortcutSub, { color: colors.textSecondary }]}>
            {user ? 'Catch up with your conversations' : 'Sign in to chat with members'}
          </Text>
        </View>
        <ChevronRight size={18} color={colors.textTertiary} />
      </TouchableOpacity>
    </ScrollView>
  );
}

function SkeletonCard({ color }: { color: string }) {
  return <View style={[styles.skeleton, { backgroundColor: color }]} />;
}

function EmptyHint({ icon, text, color }: { icon: ReactNode; text: string; color: any }) {
  return (
    <View style={[styles.emptyHint, { backgroundColor: color.surfaceVariant }]}>
      {icon}
      <Text style={[styles.emptyHintText, { color: color.textTertiary }]}>{text}</Text>
    </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing.xl,
  },
  hero: {
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroText: {
    flex: 1,
    marginRight: Spacing.md,
  },
  heroGreeting: {
    fontSize: Typography.sizes.sm,
    color: '#B9B4A9',
    fontWeight: Typography.weights.medium,
  },
  heroName: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamilies.display,
    color: '#FAF9F5',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  heroCampus: {
    fontSize: Typography.sizes.sm,
    color: '#B9B4A9',
    fontWeight: Typography.weights.medium,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.sm,
  },
  heroCtaText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  sectionContainer: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xs,
    gap: 2,
  },
  seeAllText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  skeleton: {
    height: 96,
    borderRadius: BorderRadius.md,
  },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  emptyHintText: {
    fontSize: Typography.sizes.sm,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  featuredCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  featuredBadgeRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featuredTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    fontFamily: Typography.fontFamilies.display,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  featuredBody: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 19,
  },
  featuredMeta: {
    fontSize: Typography.sizes.xs,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing.xs,
    fontWeight: Typography.weights.medium,
  },
  othersCard: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  otherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  otherDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  otherTitle: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  moreRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  moreText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    textAlign: 'center',
  },
  nextEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  nextEventDate: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextEventDay: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    lineHeight: 22,
  },
  nextEventMonth: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
  },
  nextEventInfo: {
    flex: 1,
    minWidth: 0,
  },
  nextEventLabel: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
  },
  nextEventTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginTop: 1,
  },
  nextEventVenue: {
    fontSize: Typography.sizes.xs,
    marginTop: 1,
  },
  eventRail: {
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingRight: Spacing.md,
  },
  railCard: {
    width: 150,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  railTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    minHeight: 36,
  },
  railDate: {
    fontSize: Typography.sizes.xs,
  },
  chatsShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  chatsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatsShortcutText: {
    flex: 1,
  },
  chatsShortcutTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
  },
  chatsShortcutSub: {
    fontSize: Typography.sizes.xs,
    marginTop: 1,
  },
});
