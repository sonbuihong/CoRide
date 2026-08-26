import React from 'react';
import { Pressable, PressableProps, StyleSheet, View } from 'react-native';

import { colors, layout, radius } from '../../theme/tokens';

interface IconButtonProps extends Omit<PressableProps, 'children'> {
  icon: React.ReactNode;
  accessibilityLabel: string;
  tone?: 'surface' | 'ghost';
}

export function IconButton({ icon, accessibilityLabel, tone = 'surface', style, ...props }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={(state) => [
        styles.base,
        tone === 'surface' && styles.surface,
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      <View pointerEvents="none">{icon}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.minTouchTarget,
    minWidth: layout.minTouchTarget,
    borderRadius: radius.pill,
  },
  surface: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
    opacity: 0.88,
  },
});
