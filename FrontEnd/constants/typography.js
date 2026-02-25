import { Platform } from 'react-native';

// Premium Font Configuration
export const FONTS = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    default: 'System',
  }),
  semibold: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    default: 'System',
  }),
};

// Typography Styles
export const TYPOGRAPHY = {
  // Headers
  h1: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: FONTS.bold,
    letterSpacing: -1,
    includeFontPadding: false,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    letterSpacing: -0.8,
    includeFontPadding: false,
  },
  h3: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    letterSpacing: -0.5,
    includeFontPadding: false,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: FONTS.semibold,
    letterSpacing: -0.3,
    includeFontPadding: false,
  },
  
  // Body Text
  body: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: FONTS.regular,
    letterSpacing: 0,
    lineHeight: 24,
    includeFontPadding: false,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  bodySemibold: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: FONTS.semibold,
    letterSpacing: -0.1,
    includeFontPadding: false,
  },
  
  // Small Text
  small: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: FONTS.regular,
    letterSpacing: 0.1,
    includeFontPadding: false,
  },
  smallBold: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONTS.semibold,
    letterSpacing: 0.1,
    includeFontPadding: false,
  },
  
  // Caption
  caption: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: FONTS.regular,
    letterSpacing: 0.1,
    includeFontPadding: false,
  },
  captionBold: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.semibold,
    letterSpacing: 0.2,
    includeFontPadding: false,
  },
  
  // Button Text
  button: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    letterSpacing: 0.3,
    includeFontPadding: false,
  },
  buttonLarge: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: FONTS.bold,
    letterSpacing: 0.3,
    includeFontPadding: false,
  },
};

