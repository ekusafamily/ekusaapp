/**
 * EKUSA Mobile App - Announcement Card Component
 * Displays an announcement in a card format
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Pin } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';

interface AnnouncementCardProps {
  announcement: {
    id: string;
    title: string;
    body: string;
    category: string;
    priority: 'normal' | 'important' | 'urgent';
    publishedAt?: Date | string;
    pinned: boolean;
    publisherName: string;
  };
  onPress: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  urgent: 'Urgent',
  meeting: 'Meeting',
  event: 'Event',
  leadership: 'Leadership',
  welfare: 'Welfare',
  election: 'Election',
  administrative: 'Admin',
};

export function AnnouncementCard({ announcement, onPress }: AnnouncementCardProps) {
  const { colors } = useTheme();
  const priorityColor = (colors.priority as Record<string, string>)[announcement.priority] || colors.textTertiary;
  const categoryLabel = CATEGORY_LABELS[announcement.category] || announcement.category;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.priorityIndicator,
              { backgroundColor: priorityColor },
            ]}
          />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{announcement.title}</Text>
            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>{categoryLabel}</Text>
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>•</Text>
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                {formatDate(announcement.publishedAt)}
              </Text>
              {announcement.pinned && (
                <>
                  <Text style={[styles.metaText, { color: colors.textTertiary }]}>•</Text>
                  <Text style={[styles.metaText, { color: priorityColor, fontWeight: Typography.weights.semibold }]}>Pinned</Text>
                </>
              )}
            </View>
          </View>
        </View>
        {announcement.pinned && (
          <View style={styles.pinIcon}>
            <Pin size={14} color={priorityColor} />
          </View>
        )}
      </View>

      <Text
        style={[styles.body, { color: colors.textSecondary }]}
        numberOfLines={3}
        ellipsizeMode="tail"
      >
        {announcement.body}
      </Text>

      <View style={[styles.footer, { borderTopColor: colors.divider }]}>
        <Text style={[styles.publisher, { color: colors.textTertiary }]}>
          By {announcement.publisherName}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function formatDate(dateInput?: string | Date): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    flex: 1,
  },
  priorityIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  pinIcon: {
    padding: Spacing.xs,
  },
  body: {
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
  },
  publisher: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
});