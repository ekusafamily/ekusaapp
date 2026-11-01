/**
 * EKUSA Mobile App - Quick Action Button Component
 * Grid button for quick actions on Home screen
 */

import { View, Text, StyleSheet, TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';
import { Megaphone, Calendar, Users, Tag, Mail, Settings, Bell, Search, Plus, Smartphone } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';

interface QuickActionButtonProps {
  label: string;
  iconName: string;
  onPress: () => void;
  colorScheme: 'light' | 'dark';
  style?: StyleProp<ViewStyle>;
}

type IconName = 'megaphone' | 'calendar' | 'users' | 'badge' | 'mail' | 'settings' | 'notification' | 'search' | 'plus';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  megaphone: Megaphone,
  calendar: Calendar,
  users: Users,
  badge: Tag,
  mail: Mail,
  settings: Settings,
  notification: Bell,
  search: Search,
  plus: Plus,
};

export function QuickActionButton({ label, iconName, onPress, colorScheme, style }: QuickActionButtonProps) {
  const { colors } = { colors: Colors[colorScheme] };
  const IconComponent = ICON_MAP[iconName] || Smartphone;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <IconComponent size={24} color={colors.primary} />
      </View>
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '50%',
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    textAlign: 'center',
    lineHeight: 18,
  },
});