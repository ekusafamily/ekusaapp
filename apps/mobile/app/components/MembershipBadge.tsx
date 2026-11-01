/**
 * EKUSA Mobile App - Membership Badge Component
 * Displays membership status with colored badge
 */

import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';

import type { AccountStatus } from '@ekusa/shared-types';

interface MembershipBadgeProps {
  status: AccountStatus | 'none' | 'pending' | 'verified';
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  none: 'Not Applied',
  registered: 'Registered',
  pending: 'Pending',
  membership_pending: 'Pending',
  verified: 'Verified',
  verified_member: 'Verified',
  rejected: 'Rejected',
  suspended: 'Suspended',
  deactivated: 'Deactivated',
};

export function MembershipBadge({ status, size = 'medium', showIcon = true }: MembershipBadgeProps) {
  const normalizedStatus = status === 'registered' ? 'none' :
    status === 'membership_pending' ? 'pending' :
    status === 'verified_member' ? 'verified' :
    status === 'deactivated' ? 'suspended' : status;

  const label = STATUS_LABELS[normalizedStatus] || 'Unknown';
  const color = Colors.light.membership[normalizedStatus as keyof typeof Colors.light.membership] || Colors.light.textTertiary;
  const bgColor = color + '20'; // 12% opacity

  const sizeStyles = {
    small: { paddingHorizontal: Spacing.sm, paddingVertical: 2, fontSize: Typography.sizes.xs, iconSize: 10 },
    medium: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, fontSize: Typography.sizes.sm, iconSize: 12 },
    large: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, fontSize: Typography.sizes.md, iconSize: 14 },
  }[size];

  const icons: Record<string, string> = {
    none: '○',
    pending: '…',
    verified: '✓',
    rejected: '×',
    suspended: '!',
  };

  return (
    <View style={[styles.badge, { backgroundColor: bgColor, borderColor: color, ...sizeStyles }]}>
      {showIcon && (
        <Text style={[styles.icon, { color, fontSize: sizeStyles.iconSize }]}>
          {icons[normalizedStatus] || '•'}
        </Text>
      )}
      <Text style={[styles.label, { color, fontSize: sizeStyles.fontSize }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  icon: {
    fontWeight: Typography.weights.bold,
  },
  label: {
    fontWeight: Typography.weights.semibold,
  },
});