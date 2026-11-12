/**
 * EKUSA Mobile App - Event Card Component
 * Displays an event in a card format
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Calendar, Users, Clock } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    category: string;
    venue: string;
    startAt: string;
    endAt: string;
    registrationDeadline: string;
    capacity?: number;
    registrationFee: number;
    status: string;
  };
  onPress: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  meeting: '#6E8BA8',
  hike: '#5DB872',
  trip: '#CC785C',
  social: '#D4A017',
  sports: '#C64545',
  academic: '#56635C',
  cultural: '#A9583E',
  welfare: '#5DB872',
};

const CATEGORY_LABELS: Record<string, string> = {
  meeting: 'Meeting',
  hike: 'Hike',
  trip: 'Trip',
  social: 'Social',
  sports: 'Sports',
  academic: 'Academic',
  cultural: 'Cultural',
  welfare: 'Welfare',
};

export function EventCard({ event, onPress }: EventCardProps) {
  const { colors } = useTheme();
  const categoryColor = CATEGORY_COLORS[event.category] || colors.primary;
  const categoryLabel = CATEGORY_LABELS[event.category] || event.category;
  const isUpcoming = new Date(event.startAt) > new Date();
  const isRegistrationOpen = new Date(event.registrationDeadline) > new Date();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: categoryColor + '20' },
          ]}
        >
          <Text style={[styles.categoryText, { color: categoryColor }]}>{categoryLabel}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isUpcoming
                  ? (isRegistrationOpen ? colors.success : colors.warning)
                  : colors.textTertiary,
              },
            ]}
          />
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            {isUpcoming ? (isRegistrationOpen ? 'Open' : 'Closing Soon') : 'Completed'}
          </Text>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }]}>{event.title}</Text>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <MapPin size={14} color={categoryColor} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>{event.venue}</Text>
        </View>
        <View style={styles.detailRow}>
          <Calendar size={14} color={categoryColor} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {formatDateRange(event.startAt, event.endAt)}
          </Text>
        </View>
        {event.capacity && (
          <View style={styles.detailRow}>
            <Users size={14} color={categoryColor} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              Limited spots available
            </Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Clock size={14} color={categoryColor} />
          <Text style={[styles.detailText, { color: isRegistrationOpen ? colors.warning : colors.error }]}>
            Register by {formatDate(event.registrationDeadline)}
          </Text>
        </View>
      </View>

      {event.registrationFee > 0 && (
        <View style={[styles.feeContainer, { borderTopColor: colors.divider }]}>
          <Text style={[styles.feeText, { color: colors.textPrimary }]}>
            Fee: KES {formatCurrency(event.registrationFee)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateRange(startString: string, endString: string): string {
  const start = new Date(startString);
  const end = new Date(endString);
  const sameDay = start.toDateString() === end.toDateString();

  if (sameDay) {
    return `${start.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })} • ${start.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return `${formatDate(startString)} - ${formatDate(endString)}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE').format(amount);
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
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  title: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.sm,
  },
  details: {
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: Typography.sizes.sm,
    flex: 1,
  },
  feeContainer: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  feeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
});