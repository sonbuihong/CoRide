import { Platform, type ViewStyle } from 'react-native';

/** Platform adapter: shared hierarchy, native shadow implementation. */
export const nativeShadows: Record<'card' | 'floating', ViewStyle> = {
  card: Platform.select({
    web: { boxShadow: '0 4px 18px rgba(29, 29, 31, 0.08)' },
    ios: { shadowColor: '#000000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 3, shadowColor: '#000000' },
    default: {},
  }),
  floating: Platform.select({
    web: { boxShadow: '0 6px 24px rgba(29, 29, 31, 0.12)' },
    ios: { shadowColor: '#000000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
    android: { elevation: 6, shadowColor: '#000000' },
    default: {},
  }),
};
