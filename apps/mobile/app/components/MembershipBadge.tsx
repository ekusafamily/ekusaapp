/**
 * EKUSA Mobile App - Membership Badge Component
 * Displays membership status with colored badge and icon
 */

import { View, Text, StyleSheet } from 'react-native';
import { CircleDashed, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { useTheme } from '@/hooks/useTheme';

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

const STATUS_ICONS: Record<string, React.ComponentType<any>> = {
  none: CircleDashed,
  pending: Clock,
  verified: CheckCircle2,
  rejected: XCircle,
  suspended: AlertTriangle,
};

export function MembershipBadge({ status, size = 'medium', showIcon = true }: MembershipBadgeProps) {
  const { colors } = useTheme();
  const normalizedStatus = status === 'registered' ? 'none' :
    status === 'membership_pending' ? 'pending' :
    status === 'verified_member' ? 'verified' :
    status === 'deactivated' ? 'suspended' : status;

  const label = STATUS_LABELS[normalizedStatus] || 'Unknown';
  const color = (colors.membership as Record<string, string>)[normalizedStatus] || colors.textTertiary;
  const bgColor = color + '20'; // 12% opacity

  const sizeStyles = {
    small: { paddingHorizontal: Spacing.sm, paddingVertical: 2, fontSize: Typography.sizes.xs, iconSize: 12 },
    medium: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, fontSize: Typography.sizes.sm, iconSize: 14 },
    large: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, fontSize: Typography.sizes.md, iconSize: 16 },
  }[size];

  const Icon = STATUS_ICONS[normalizedStatus] || CircleDashed;

  return (
    <View style={[styles.badge, { backgroundColor: bgColor, borderColor: color, ...sizeStyles }]}>
      {showIcon && <Icon size={sizeStyles.iconSize} color={color} />}
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
  label: {
    fontWeight: Typography.weights.semibold,
  },
});
