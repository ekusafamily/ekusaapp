/**
 * EKUSA Mobile App - Design Tokens
 * Centralized design system values for consistent UI
 * Palette per repo DESIGN.md: cream canvas, coral accent, ink text, dark-navy surface
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Primary brand color - coral
    primary: '#CC785C',
    primaryLight: '#D98E75',
    primaryDark: '#A9583E',
    primaryContainer: '#F3E5DE',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#7A3B27',

    // Secondary - warm ink navy
    secondary: '#141413',
    secondaryLight: '#181715',
    secondaryContainer: '#EFE9DE',
    onSecondary: '#FAF9F5',
    onSecondaryContainer: '#141413',

    // Tertiary/Accent - warm sand
    tertiary: '#B08968',
    tertiaryContainer: '#EFE9DE',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#6B4F35',

    // Surface & Background
    surface: '#FFFFFF',
    surfaceVariant: '#EFE9DE', // warm card surface
    surfaceContainer: '#FAF9F5', // cream canvas
    background: '#FAF9F5',

    // Text colors
    textPrimary: '#141413',
    textSecondary: '#5E5D59',
    textTertiary: '#8E8C84',
    textInverse: '#FAF9F5',
    textOnPrimary: '#FFFFFF',

    // Border & Dividers
    border: '#E6DFD8',
    borderStrong: '#D0C7BD',
    divider: '#EFE9DE',

    // Status colors
    success: '#5DB872',
    successContainer: '#E7F4EA',
    warning: '#D4A017',
    warningContainer: '#FAF2DC',
    error: '#C64545',
    errorContainer: '#F8E5E3',
    info: '#6E8BA8',
    infoContainer: '#E7EEF4',

    // Overlay
    overlay: 'rgba(20, 20, 19, 0.5)',
    scrim: 'rgba(20, 20, 19, 0.32)',

    // Membership status colors
    membership: {
      none: '#8E8C84',
      pending: '#D4A017',
      verified: '#5DB872',
      rejected: '#C64545',
      suspended: '#B08968',
    },

    // Priority colors
    priority: {
      normal: '#8E8C84',
      important: '#D4A017',
      urgent: '#C64545',
    },

    // Message status
    messageStatus: {
      pending: '#8E8C84',
      sent: '#5E5D59',
      delivered: '#CC785C',
      seen: '#5DB872',
      failed: '#C64545',
    },
  },

  dark: {
    // Primary brand color - coral (lightened for dark canvas)
    primary: '#D98E75',
    primaryLight: '#E5A98F',
    primaryDark: '#CC785C',
    primaryContainer: '#3A2A22',
    onPrimary: '#141413',
    onPrimaryContainer: '#E5A98F',

    // Secondary
    secondary: '#FAF9F5',
    secondaryLight: '#EFE9DE',
    secondaryContainer: '#2C2A26',
    onSecondary: '#141413',
    onSecondaryContainer: '#EFE9DE',

    // Tertiary/Accent
    tertiary: '#C9A184',
    tertiaryContainer: '#3A2F26',
    onTertiary: '#141413',
    onTertiaryContainer: '#C9A184',

    // Surface & Background
    surface: '#181715',
    surfaceVariant: '#252320',
    surfaceContainer: '#1F1E1B',
    background: '#141413',

    // Text colors
    textPrimary: '#FAF9F5',
    textSecondary: '#B9B4A9',
    textTertiary: '#8E8C84',
    textInverse: '#141413',
    textOnPrimary: '#141413',

    // Border & Dividers
    border: '#302E2A',
    borderStrong: '#46433D',
    divider: '#252320',

    // Status colors
    success: '#7CC98D',
    successContainer: '#22392A',
    warning: '#E4B84C',
    warningContainer: '#3C3320',
    error: '#E07A6E',
    errorContainer: '#422521',
    info: '#8FA9C4',
    infoContainer: '#22303C',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
    scrim: 'rgba(0, 0, 0, 0.5)',

    // Membership status colors
    membership: {
      none: '#8E8C84',
      pending: '#E4B84C',
      verified: '#7CC98D',
      rejected: '#E07A6E',
      suspended: '#C9A184',
    },

    // Priority colors
    priority: {
      normal: '#8E8C84',
      important: '#E4B84C',
      urgent: '#E07A6E',
    },

    // Message status
    messageStatus: {
      pending: '#8E8C84',
      sent: '#B9B4A9',
      delivered: '#D98E75',
      seen: '#7CC98D',
      failed: '#E07A6E',
    },
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Typography = {
  fontFamilies: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
    // Serif display face for hero/section titles (DESIGN.md display substitute)
    display: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8, // buttons & inputs
  md: 12, // cards
  lg: 16, // hero surfaces
  xl: 24,
  full: 9999, // pills & badges
} as const;

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#141413',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const Breakpoints = {
  sm: 360,
  md: 600,
  lg: 900,
  xl: 1200,
} as const;

export const ZIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  popover: 400,
  tooltip: 500,
  toast: 600,
} as const;

export type ColorScheme = 'light' | 'dark';
export type ColorPalette = typeof Colors.light | typeof Colors.dark;
