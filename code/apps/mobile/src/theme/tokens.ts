export const colors = {
  primary: '#0071E3',
  primaryPressed: '#0066CC',
  primarySoft: '#EAF4FF',
  driverAccent: '#34C759',
  driverAccentSoft: '#EAF9EE',
  driverSurface: '#0A1E3C',
  background: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceMuted: '#FAFAFC',
  textPrimary: '#1D1D1F',
  textSecondary: '#515154',
  textTertiary: '#737377',
  border: '#E5E5EA',
  borderStrong: '#D1D1D6',
  success: '#15803D',
  successSoft: '#F0FDF4',
  warning: '#B45309',
  warningSoft: '#FFFBEB',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  mapRoute: '#0071E3',
  mapPickup: '#0F766E',
  mapDestination: '#DC2626',
  scrim: 'rgba(15, 23, 42, 0.48)',
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  sm: 10,
  input: 14,
  button: 16,
  card: 18,
  sheet: 26,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '600' as const },
  pageTitle: { fontSize: 24, lineHeight: 30, fontWeight: '600' as const },
  sectionTitle: { fontSize: 19, lineHeight: 25, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  secondary: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
} as const;

export const motion = {
  fast: 150,
  standard: 220,
  slow: 300,
} as const;

export const layout = {
  screenGutter: 20,
  minTouchTarget: 48,
  tabBarHeight: 64,
  maxContentWidth: 560,
} as const;
