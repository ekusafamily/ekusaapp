/**
 * EKUSA Mobile App - Event Card Component
 * Displays an event in a card format
 */

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';

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
  colorScheme: 'light' | 'dark';
}

const CATEGORY_COLORS: Record<string, { light: string; dark: string }> = {
  meeting: { light: '#1565C0', dark: '#64B5F6' },
  hike: { light: '#2E7D32', dark: '#81C784' },
  trip: { light: '#6A1B9A', dark: '#BA68C8' },
  social: { light: '#E65100', dark: '#FFB74D' },
  sports: { light: '#C62828', dark: '#EF9A9A' },
  academic: { light: '#006064', dark: '#4DB6AC' },
  cultural: { light: '#AD1457', dark: '#F06292' },
  welfare: { light: '#2E7D32', dark: '#81C784' },
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

export function EventCard({ event, onPress, colorScheme }: EventCardProps) {
  const { colors } = { colors: Colors[colorScheme] };
  const categoryColor = CATEGORY_COLORS[event.category]?.[colorScheme] || colors.primary;
  const categoryLabel = CATEGORY_LABELS[event.category] || event.category;
  const isUpcoming = new Date(event.startAt) > new Date();
  const isRegistrationOpen = new Date(event.registrationDeadline) > new Date();

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.8}>
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
          <Text style={{ color: categoryColor }}>📍</Text>
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>{event.venue}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={{ color: categoryColor }}>📅</Text>
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {formatDateRange(event.startAt, event.endAt)}
          </Text>
        </View>
        {event.capacity && (
          <View style={styles.detailRow}>
            <Text style={{ color: categoryColor }}>👥</Text>
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              Limited spots available
            </Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={{ color: categoryColor }}>⏰</Text>
          <Text style={[styles.detailText, { color: isRegistrationOpen ? colors.warning : colors.error }]}>
            Register by {formatDate(event.registrationDeadline)}
          </Text>
        </View>
      </View>

      {event.registrationFee > 0 && (
        <View style={styles.feeContainer}>
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
    borderColor: Colors.light.border,
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
    borderTopColor: Colors.light.divider,
  },
  feeText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
});