import { Platform } from 'react-native';

// ============================================================
// SHIBRA BRAND DESIGN TOKENS — MOBILE APP
// Primary: Electric Blue #2563EB (logo gradient end)
// Accent:  Cyan #00B4D8 (logo gradient start)
// Dark:    Deep Navy #0D1B2A
// ============================================================

export const COLORS = {
  // Primary: Shibra Electric Blue
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#3B82F6',
  primarySoft: '#EFF6FF',

  // Accent: Shibra Cyan
  accent: '#00B4D8',
  accentDark: '#0096B5',
  accentLight: '#CFFAFE',

  // Navy: Shibra Deep Navy (for dark UI elements)
  navy: '#0D1B2A',
  navyLight: '#1A2D45',

  // Gradient (matches the S-logo)
  gradientStart: '#00B4D8',
  gradientEnd: '#2563EB',

  // Backgrounds
  background: '#FFFFFF',
  surface: '#F0F4FF',
  surfaceAlt: '#EFF6FF',

  // Text
  white: '#FFFFFF',
  black: '#000000',
  textPrimary: '#0D1B2A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',

  // Borders
  border: '#DBEAFE',
  borderLight: '#EFF6FF',

  // Status
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#00B4D8',

  // Utility
  shadow: '#0D1B2A',
  overlay: 'rgba(13, 27, 42, 0.5)',
};

export const TYPOGRAPHY = {
  fontFamily: {
    regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    medium: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    bold: Platform.OS === 'ios' ? 'System' : 'sans-serif-bold',
  },
  fontSize: {
    xxs: 10,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    xxxh: 32,
    hero: 36,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  radius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
};
