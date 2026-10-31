/**
 * EKUSA Mobile App - Theme Hook
 * Provides access to current color scheme and theme colors
 */

import { useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { Colors, type ColorScheme } from '@/constants/DesignTokens';

export function useTheme() {
  const systemColorScheme = useColorScheme();

  const colorScheme = useMemo<ColorScheme>(() => {
    // Could add user preference override here
    return systemColorScheme === 'dark' ? 'dark' : 'light';
  }, [systemColorScheme]);

  const colors = useMemo(() => Colors[colorScheme], [colorScheme]);

  return {
    colorScheme,
    colors,
    isDark: colorScheme === 'dark',
  };
}

export function useColors() {
  const { colors } = useTheme();
  return colors;
}