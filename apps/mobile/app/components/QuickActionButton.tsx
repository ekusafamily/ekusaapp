/**
 * EKUSA Mobile App - Quick Action Button Component
 * Grid button for quick actions on Home screen
 */

import { View, Text, StyleSheet, TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';
import { Megaphone, Calendar, Users, BadgeCheck, Mail, Settings, Bell, Search, Plus, Smartphone } from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import type { ColorPalette } from '@/constants/DesignTokens';

interface QuickActionButtonProps {
  label: string;
  iconName: string;
  onPress: () => void;
  colors: ColorPalette;
  style?: StyleProp<ViewStyle>;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  megaphone: Megaphone,
  calendar: Calendar,
  users: Users,
  badge: BadgeCheck,
  mail: Mail,
  settings: Settings,
  notification: Bell,
  search: Search,
  plus: Plus,
};

export function QuickActionButton({ label, iconName, onPress, colors, style }: QuickActionButtonProps) {
  const IconComponent = ICON_MAP[iconName] || Smartphone;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
        <IconComponent size={20} color={colors.primaryDark} />
      </View>
      <Text style={[styles.label, { color: colors.textPrimary }]} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexGrow: 1,
    flexBasis: '47%',
    minWidth: '45%',
    maxWidth: '50%',
    aspectRatio: 1.6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    textAlign: 'left',
  },
});
