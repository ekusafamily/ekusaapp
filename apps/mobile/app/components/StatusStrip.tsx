/**
 * EKUSA Mobile App - Status Strip
 * Slim presence bar sitting below the camera notch / status bar.
 * Shows connection state: Online, Offline, or Checking.
 */

import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wifi, WifiOff, Loader } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { usePresence, PresenceState } from '@/hooks/usePresence';
import { Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';

const PRESENTATION: Record<PresenceState, { label: string; key: string }> = {
  online: { label: 'Online', key: 'online' },
  offline: { label: 'Offline', key: 'offline' },
  checking: { label: 'Connecting', key: 'checking' },
};

export function StatusStrip() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const presence = usePresence();

  const dotColor =
    presence === 'online' ? colors.success : presence === 'offline' ? colors.error : colors.warning;
  const Icon = presence === 'online' ? Wifi : presence === 'offline' ? WifiOff : Loader;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, Spacing.xs) }]}>
      <View style={[styles.pill, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Icon size={13} color={colors.textSecondary} />
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {PRESENTATION[presence].label}
        </Text>
        <View style={styles.spacer} />
        <Text style={[styles.brand, { color: colors.textTertiary }]}>EKUSA</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 26,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
  },
  spacer: {
    flex: 1,
  },
  brand: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    letterSpacing: 1.5,
  },
});
