import React from 'react';
import { Tabs } from 'expo-router';
import { Bell, ClipboardList, Home, User } from 'lucide-react-native';
import type { ComponentProps } from 'react';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MobileAppHeader } from '../../src/components/layout/MobileAppHeader';
import {
  createRoleTabBarStyle,
  getRoleTabColor,
  RoleTabButton,
  RoleTabIcon,
  RoleTabLabel,
  roleTabBarStyles,
} from '../../src/components/navigation/RoleTabBar';
import { colors } from '../../src/theme/tokens';

export default function PassengerTabLayout() {
  const insets = useSafeAreaInsets();
  const mode = 'passenger' as const;
  const activeColor = getRoleTabColor(mode);

  return (
    <Tabs screenOptions={{
      headerShown: true,
      header: () => <MobileAppHeader mode="passenger" />,
      tabBarActiveTintColor: activeColor,
      tabBarInactiveTintColor: colors.textTertiary,
      tabBarButton: (props) => <RoleTabButton {...(props as ComponentProps<typeof Pressable>)} />,
      tabBarHideOnKeyboard: true,
      tabBarStyle: createRoleTabBarStyle(insets.bottom),
      tabBarItemStyle: roleTabBarStyles.item,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarAccessibilityLabel: 'Home', tabBarLabel: ({ color, focused }) => <RoleTabLabel color={color} focused={focused} label="Home" />, tabBarIcon: ({ color, focused }) => <RoleTabIcon focused={focused} mode={mode}><Home size={21} color={color} strokeWidth={focused ? 2.5 : 2} /></RoleTabIcon> }} />
      <Tabs.Screen name="my-rides" options={{ title: 'Hoạt động', tabBarAccessibilityLabel: 'Hoạt động', tabBarLabel: ({ color, focused }) => <RoleTabLabel color={color} focused={focused} label="Hoạt động" />, tabBarIcon: ({ color, focused }) => <RoleTabIcon focused={focused} mode={mode}><ClipboardList size={21} color={color} strokeWidth={focused ? 2.5 : 2} /></RoleTabIcon> }} />
      <Tabs.Screen name="notifications" options={{ title: 'Thông báo', tabBarAccessibilityLabel: 'Thông báo', tabBarLabel: ({ color, focused }) => <RoleTabLabel color={color} focused={focused} label="Thông báo" />, tabBarIcon: ({ color, focused }) => <RoleTabIcon focused={focused} mode={mode}><Bell size={21} color={color} strokeWidth={focused ? 2.5 : 2} /></RoleTabIcon> }} />
      <Tabs.Screen name="profile" options={{ title: 'Hồ sơ', tabBarAccessibilityLabel: 'Hồ sơ cá nhân', tabBarLabel: ({ color, focused }) => <RoleTabLabel color={color} focused={focused} label="Hồ sơ" />, tabBarIcon: ({ color, focused }) => <RoleTabIcon focused={focused} mode={mode}><User size={21} color={color} strokeWidth={focused ? 2.5 : 2} /></RoleTabIcon> }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="ride-hailing" options={{ href: null }} />
    </Tabs>
  );
}
