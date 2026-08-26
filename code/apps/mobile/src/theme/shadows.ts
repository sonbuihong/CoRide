import { Platform, type ViewStyle } from 'react-native';

/** Platform adapter: shared hierarchy, native shadow implementation. */
export const nativeShadows: Record<'card' | 'floating', ViewStyle> = {
  card: Platform.select({
    ios: { shadowColor: '#000000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 3 },
    default: {},
  }),
  floating: Platform.select({
    ios: { shadowColor: '#000000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
    android: { elevation: 6 },
    default: {},
  }),
};
