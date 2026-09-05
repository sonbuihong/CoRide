import React from 'react';
import { Tabs } from 'expo-router';
import { Bell, ClipboardList, Home, User } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';

import { MobileAppHeader } from '../../src/components/layout/MobileAppHeader';
import {
  getRoleTabColor,
  RoleBottomTabBar,
  RoleTabIcon,
  RoleTabLabel,
} from '../../src/components/navigation/RoleTabBar';
import { useAppModeGuard } from '../../src/hooks/useAppModeGuard';
import { IncomingTripRequestSheet } from '../../src/features/ride-hailing/IncomingTripRequestSheet';
import { colors } from '../../src/theme/tokens';

export default function DriverTabLayout() {
  const { isGuardLoading } = useAppModeGuard();
  const mode = 'driver' as const;
  const activeColor = getRoleTabColor(mode);

  if (isGuardLoading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={activeColor} /></View>;
  }

  return (
    <>
    <Tabs tabBar={(props) => <RoleBottomTabBar {...props} mode={mode} />} screenOptions={{
      headerShown: true,
      header: () => <MobileAppHeader mode="driver" />,
      tabBarActiveTintColor: activeColor,
      tabBarInactiveTintColor: colors.textTertiary,
      tabBarHideOnKeyboard: true,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Trang chủ', tabBarAccessibilityLabel: 'Trang chủ', tabBarLabel: ({ focused }) => <RoleTabLabel color={focused ? activeColor : colors.textTertiary} focused={focused} label="Trang chủ" />, tabBarIcon: ({ focused }) => <RoleTabIcon focused={focused} mode={mode}><Home size={21} color={focused ? activeColor : colors.textTertiary} strokeWidth={focused ? 2.5 : 2} /></RoleTabIcon> }} />
      <Tabs.Screen name="requests" options={{ title: 'Hoạt động', tabBarAccessibilityLabel: 'Hoạt động', tabBarLabel: ({ focused }) => <RoleTabLabel color={focused ? activeColor : colors.textTertiary} focused={focused} label="Hoạt động" />, tabBarIcon: ({ focused }) => <RoleTabIcon focused={focused} mode={mode}><ClipboardList size={21} color={focused ? activeColor : colors.textTertiary} strokeWidth={focused ? 2.5 : 2} /></RoleTabIcon> }} />
      <Tabs.Screen name="notifications" options={{ title: 'Thông báo', tabBarAccessibilityLabel: 'Thông báo', tabBarLabel: ({ focused }) => <RoleTabLabel color={focused ? activeColor : colors.textTertiary} focused={focused} label="Thông báo" />, tabBarIcon: ({ focused }) => <RoleTabIcon focused={focused} mode={mode}><Bell size={21} color={focused ? activeColor : colors.textTertiary} strokeWidth={focused ? 2.5 : 2} /></RoleTabIcon> }} />
      <Tabs.Screen name="profile" options={{ title: 'Hồ sơ', tabBarAccessibilityLabel: 'Hồ sơ cá nhân', tabBarLabel: ({ focused }) => <RoleTabLabel color={focused ? activeColor : colors.textTertiary} focused={focused} label="Hồ sơ" />, tabBarIcon: ({ focused }) => <RoleTabIcon focused={focused} mode={mode}><User size={21} color={focused ? activeColor : colors.textTertiary} strokeWidth={focused ? 2.5 : 2} /></RoleTabIcon> }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="publish" options={{ href: null }} />
    </Tabs>
    <IncomingTripRequestSheet />
    </>
  );
}
