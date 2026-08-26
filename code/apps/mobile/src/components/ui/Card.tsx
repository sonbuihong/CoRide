import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';
import { nativeShadows } from '../../theme/shadows';

export type CardVariant = 'default' | 'outlined' | 'elevated';

export interface CardProps extends PropsWithChildren<ViewProps> {
  variant?: CardVariant;
}

export function Card({ variant = 'default', style, ...props }: CardProps) {
  return <View style={[styles.base, variant === 'outlined' && styles.outlined, variant === 'elevated' && styles.elevated, style]} {...props} />;
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.md },
  outlined: { borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth },
  elevated: nativeShadows.card,
});
