import {
  colors as sharedColors,
  motion,
  radius as sharedRadius,
  sizing,
  spacing as sharedSpacing,
  typography,
} from '@repo/design-tokens';

export const colors = {
  ...sharedColors,
  navigationPassenger: '#0071E3',
  navigationPassengerSoft: '#EAF4FF',
  navigationDriver: '#15803D',
  navigationDriverSoft: '#EAF9EE',
  navigationDivider: '#E5E5EA',
  navigationPressed: '#F2F2F7',
  surfaceMuted: sharedColors.surfaceSecondary,
  textTertiary: '#737377',
  error: sharedColors.danger,
} as const;

// Compatibility aliases keep existing screens stable while new code uses the shared scale.
export const spacing = {
  xxs: sharedSpacing.xs,
  xs: sharedSpacing.sm,
  sm: sharedSpacing.md,
  md: sharedSpacing.lg,
  lg: sharedSpacing.screen,
  xl: sharedSpacing.xl,
  xxl: sharedSpacing['2xl'],
  xxxl: 40,
} as const;

export const radius = {
  ...sharedRadius,
  pill: sharedRadius.full,
} as const;
export { motion, typography };

export const layout = {
  screenGutter: sharedSpacing.screen,
  minTouchTarget: sizing.touchTarget,
  tabBarHeight: sizing.tabBar,
  tabBarHorizontalInset: 8,
  tabIconCapsuleWidth: 48,
  maxContentWidth: sizing.maxMobileContent,
} as const;
