import React from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

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

export function RoleBottomTabBar({ mode, state, descriptors, navigation, insets }: BottomTabBarProps & { mode: NavigationMode }) {
  const visibleRoutes = state.routes.slice(0, 4);
  const { width } = useWindowDimensions();

  return (
    <View style={[styles.bottomBar, width >= 768 && styles.bottomBarExpanded, { height: layout.tabBarHeight + insets.bottom, paddingBottom: insets.bottom }]}>
      {visibleRoutes.map((route) => {
        const index = state.routes.indexOf(route);
        const focused = state.index === index;
        const options = descriptors[route.key].options;
        const color = focused ? modeColors[mode].active : colors.textTertiary;
        const label = options.tabBarLabel;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            }}
            style={styles.bottomButton}
          >
            <View style={styles.bottomIconSlot}>
              {options.tabBarIcon?.({ focused, color, size: 21 })}
            </View>
            <View style={styles.bottomLabelSlot}>
              {typeof label === 'function'
                ? label({ focused, color, position: 'below-icon', children: options.title ?? route.name })
                : label}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
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
      maxFontSizeMultiplier={1.3}
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
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 0,
    width: '100%',
  },
  item: {
    alignItems: 'center',
    borderRadius: radius.button,
    justifyContent: 'center',
    minHeight: layout.minTouchTarget,
    paddingHorizontal: spacing.xxs,
  },
});

const styles = StyleSheet.create({
  bottomBar: {
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderTopColor: colors.navigationDivider,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 4,
    flexDirection: 'row',
    paddingHorizontal: layout.tabBarHorizontalInset,
    paddingTop: spacing.xxs,
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    width: '100%',
  },
  // The brief keeps four bottom destinations on every target. Expanded layouts
  // center and cap the bar rather than changing its navigation semantics.
  bottomBarExpanded: { alignSelf: 'center', borderRadius: radius.card, marginBottom: spacing.xs, maxWidth: 720 },
  bottomButton: {
    alignItems: 'center',
    borderRadius: radius.button,
    height: layout.tabBarHeight - spacing.xxs,
    justifyContent: 'flex-start',
    minWidth: 0,
    paddingTop: 1,
    width: '25%',
  },
  bottomIconSlot: { alignItems: 'center', height: 32, justifyContent: 'center', width: '100%' },
  bottomLabelSlot: { alignItems: 'center', justifyContent: 'center', width: '100%' },
  button: {
    alignItems: 'center',
    borderRadius: radius.button,
    flex: 1,
    justifyContent: 'center',
    minHeight: layout.minTouchTarget,
    overflow: 'hidden',
    padding: 0,
    width: '100%',
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
