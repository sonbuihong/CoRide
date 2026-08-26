import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';

export function BottomSheetSurface({ children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.sheet, style]} {...props}>
      <View style={styles.handle} accessibilityElementsHidden importantForAccessibility="no" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: colors.borderStrong,
    borderRadius: radius.pill,
    height: 4,
    marginBottom: spacing.md,
    width: 40,
  },
});

