import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, layout, radius, spacing, typography } from '../../theme/tokens';

export type NavigationMode = 'passenger' | 'driver';

type RoleTabIconProps = {
  children: React.ReactNode;
  focused: boolean;
  mode: NavigationMode;
};

type RoleTabLabelProps = {
  color: string;
  focused: boolean;
  label: string;
};

const modeColors = {
  passenger: {
    active: colors.navigationPassenger,
    soft: colors.navigationPassengerSoft,
  },
  driver: {
    active: colors.navigationDriver,
    soft: colors.navigationDriverSoft,
  },
} as const;

export function getRoleTabColor(mode: NavigationMode) {
  return modeColors[mode].active;
}

export function createRoleTabBarStyle(bottomInset: number) {
  return {
    backgroundColor: colors.surface,
    borderTopColor: colors.navigationDivider,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 4,
    height: layout.tabBarHeight + bottomInset,
    paddingBottom: bottomInset,
    paddingHorizontal: layout.tabBarHorizontalInset,
    paddingTop: spacing.xxs,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  } as const;
}

export function RoleTabIcon({ children, focused, mode }: RoleTabIconProps) {
  const palette = modeColors[mode];

  return (
    <View
      style={[
        styles.iconCapsule,
        focused && { backgroundColor: palette.soft },
      ]}
    >
      {children}
      {focused ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.selectedIndicator, { backgroundColor: palette.active }]}
        />
      ) : null}
    </View>
  );
}

export function RoleTabLabel({ color, focused, label }: RoleTabLabelProps) {
  return (
    <Text
      allowFontScaling
      numberOfLines={1}
      style={[styles.label, { color }, focused && styles.labelFocused]}
    >
      {label}
    </Text>
  );
}

export function RoleTabButton({ style, ...props }: React.ComponentProps<typeof Pressable>) {
  return (
    <Pressable
      {...props}
      focusable
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        styles.button,
        state.pressed && styles.buttonPressed,
      ]}
    />
  );
}

export const roleTabBarStyles = StyleSheet.create({
  item: {
    borderRadius: radius.button,
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.xxs,
  },
});

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.button,
    minHeight: layout.minTouchTarget,
    overflow: 'hidden',
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {},
    }),
  },
  buttonPressed: {
    backgroundColor: colors.navigationPressed,
  },
  iconCapsule: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 30,
    justifyContent: 'center',
    position: 'relative',
    width: layout.tabIconCapsuleWidth,
  },
  selectedIndicator: {
    borderRadius: radius.pill,
    bottom: -2,
    height: 3,
    position: 'absolute',
    width: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.12,
    lineHeight: typography.caption.lineHeight,
    marginTop: 1,
    maxWidth: 76,
    textAlign: 'center',
  },
  labelFocused: {
    fontWeight: '600',
  },
});
