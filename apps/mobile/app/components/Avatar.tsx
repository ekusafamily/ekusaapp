/**
 * EKUSA Mobile App - Avatar Component
 * Displays user avatar with fallback to initials
 */

import { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';

interface AvatarProps {
  source?: { uri: string } | number;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: View['style'];
}

const SIZE_MAP = {
  small: 32,
  medium: 44,
  large: 56,
  xlarge: 80,
} as const;

const FONT_SIZE_MAP = {
  small: 12,
  medium: 16,
  large: 20,
  xlarge: 28,
} as const;

export function Avatar({ source, name, size = 'medium', style }: AvatarProps) {
  const { colors } = useTheme();
  const dimension = SIZE_MAP[size];
  const fontSize = FONT_SIZE_MAP[size];

  const initials = useMemo(() => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }, [name]);

  const backgroundColor = useMemo(() => {
    if (!name) return colors.primaryContainer;
    // Generate consistent color from name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 60%, 45%)`;
  }, [name, colors.primaryContainer]);

  if (source) {
    return (
      <View style={[styles.container, { width: dimension, height: dimension }, style]}>
        <Image
          source={source}
          style={[styles.image, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { width: dimension, height: dimension, borderRadius: dimension / 2, backgroundColor },
        style,
      ]}
    >
      <Text
        style={[
          styles.initials,
          { fontSize, color: colors.onPrimaryContainer || colors.textOnPrimary },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    borderRadius: 9999,
  },
  initials: {
    fontWeight: Typography.weights.semibold,
    lineHeight: FONT_SIZE_MAP.medium * 1.2,
  },
});