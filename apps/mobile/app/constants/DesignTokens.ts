/**
 * EKUSA Mobile App - Design Tokens
 * Centralized design system values for consistent UI
 */

export const Colors = {
  light: {
    // Primary brand colors
    primary: '#1B5E20', // Deep green - EKUSA brand
    primaryLight: '#2E7D32',
    primaryDark: '#145214',
    primaryContainer: '#E8F5E9',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#1B5E20',

    // Secondary colors
    secondary: '#0D47A1', // Deep blue
    secondaryLight: '#1565C0',
    secondaryContainer: '#E3F2FD',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#0D47A1',

    // Tertiary/Accent
    tertiary: '#E65100', // Orange
    tertiaryContainer: '#FFF3E0',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#E65100',

    // Surface & Background
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    surfaceContainer: '#EEEEEE',
    background: '#FAFAFA',

    // Text colors
    textPrimary: '#1A1A2E',
    textSecondary: '#4A4A5A',
    textTertiary: '#757575',
    textInverse: '#FFFFFF',
    textOnPrimary: '#FFFFFF',

    // Border & Dividers
    border: '#E0E0E0',
    borderStrong: '#BDBDBD',
    divider: '#EEEEEE',

    // Status colors
    success: '#2E7D32',
    successContainer: '#E8F5E9',
    warning: '#F57F17',
    warningContainer: '#FFF8E1',
    error: '#C62828',
    errorContainer: '#FDECEA',
    info: '#0288D1',
    infoContainer: '#E1F5FE',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    scrim: 'rgba(0, 0, 0, 0.32)',

    // Membership status colors
    membership: {
      none: '#757575',
      pending: '#F57F17',
      verified: '#2E7D32',
      rejected: '#C62828',
      suspended: '#EF6C00',
    },

    // Priority colors
    priority: {
      normal: '#757575',
      important: '#F57F17',
      urgent: '#C62828',
    },

    // Message status
    messageStatus: {
      pending: '#757575',
      sent: '#1565C0',
      delivered: '#1B5E20',
      read: '#1B5E20',
      failed: '#C62828',
    },
  },

  dark: {
    // Primary brand colors
    primary: '#81C784',
    primaryLight: '#A5D6A7',
    primaryDark: '#4CAF50',
    primaryContainer: '#1B5E20',
    onPrimary: '#1A1A2E',
    onPrimaryContainer: '#A5D6A7',

    // Secondary colors
    secondary: '#90CAF9',
    secondaryLight: '#BBDEFB',
    secondaryContainer: '#0D47A1',
    onSecondary: '#1A1A2E',
    onSecondaryContainer: '#90CAF9',

    // Tertiary/Accent
    tertiary: '#FFB74D',
    tertiaryContainer: '#E65100',
    onTertiary: '#1A1A2E',
    onTertiaryContainer: '#FFB74D',

    // Surface & Background
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    surfaceContainer: '#383838',
    background: '#121212',

    // Text colors
    textPrimary: '#FFFFFF',
    textSecondary: '#BDBDBD',
    textTertiary: '#9E9E9E',
    textInverse: '#1A1A2E',
    textOnPrimary: '#1A1A2E',

    // Border & Dividers
    border: '#424242',
    borderStrong: '#616161',
    divider: '#2C2C2C',

    // Status colors
    success: '#66BB6A',
    successContainer: '#1B5E20',
    warning: '#FFB74D',
    warningContainer: '#E65100',
    error: '#EF9A9A',
    errorContainer: '#B71C1C',
    info: '#64B5F6',
    infoContainer: '#01579B',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.7)',
    scrim: 'rgba(0, 0, 0, 0.5)',

    // Membership status colors
    membership: {
      none: '#9E9E9E',
      pending: '#FFB74D',
      verified: '#66BB6A',
      rejected: '#EF9A9A',
      suspended: '#FFAB40',
    },

    // Priority colors
    priority: {
      normal: '#9E9E9E',
      important: '#FFB74D',
      urgent: '#EF9A9A',
    },

    // Message status
    messageStatus: {
      pending: '#9E9E9E',
      sent: '#64B5F6',
      delivered: '#81C784',
      read: '#81C784',
      failed: '#EF9A9A',
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
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