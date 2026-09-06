import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { colors, layout, radius, spacing } from '../../theme/tokens';

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
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: layout.maxContentWidth,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    width: '100%',
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

