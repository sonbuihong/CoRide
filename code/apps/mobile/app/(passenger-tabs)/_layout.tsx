import React from 'react';
import { Tabs } from 'expo-router';
import { Bell, ClipboardList, Home, User } from 'lucide-react-native';
import { MobileAppHeader } from '../../src/components/layout/MobileAppHeader';
import {
  getRoleTabColor,
  RoleBottomTabBar,
  RoleTabIcon,
  RoleTabLabel,
} from '../../src/components/navigation/RoleTabBar';
import { colors } from '../../src/theme/tokens';

export default function PassengerTabLayout() {
  const mode = 'passenger' as const;
  const activeColor = getRoleTabColor(mode);

  return (
    <Tabs tabBar={(props) => <RoleBottomTabBar {...props} mode={mode} />} screenOptions={{
      headerShown: true,
      header: () => <MobileAppHeader mode="passenger" />,
      tabBarActiveTintColor: activeColor,
      tabBarInactiveTintColor: colors.textTertiary,
      tabBarHideOnKeyboard: true,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarAccessibilityLabel: 'Home', tabBarLabel: ({ focused }) => <RoleTabLabel color={focused ? activeColor : colors.textTertiary} focused={focused} label="Home" />, tabBarIcon: ({ focused }) => <RoleTabIcon focused={focused} mode={mode}><Home size={21} color={focused ? activeColor : colors.textTertiary} strokeWidth={focused ? 2.5 : 2} /></RoleTabIcon> }} />
      <Tabs.Screen name="my-rides" options={{ title: 'Hoạt động', tabBarAccessibilityLabel: 'Hoạt động', tabBarLabel: ({ focused }) => <RoleTabLabel color={focused ? activeColor : colors.textTertiary} focused={focused} label="Hoạt động" />, tabBarIcon: ({ focused }) => <RoleTabIcon focused={focused} mode={mode}><ClipboardList size={21} color={focused ? activeColor : colors.textTertiary} strokeWidth={focused ? 2.5 : 2} /></RoleTabIcon> }} />
      <Tabs.Screen name="notifications" options={{ title: 'Thông báo', tabBarAccessibilityLabel: 'Thông báo', tabBarLabel: ({ focused }) => <RoleTabLabel color={focused ? activeColor : colors.textTertiary} focused={focused} label="Thông báo" />, tabBarIcon: ({ focused }) => <RoleTabIcon focused={focused} mode={mode}><Bell size={21} color={focused ? activeColor : colors.textTertiary} strokeWidth={focused ? 2.5 : 2} /></RoleTabIcon> }} />
      <Tabs.Screen name="profile" options={{ title: 'Hồ sơ', tabBarAccessibilityLabel: 'Hồ sơ cá nhân', tabBarLabel: ({ focused }) => <RoleTabLabel color={focused ? activeColor : colors.textTertiary} focused={focused} label="Hồ sơ" />, tabBarIcon: ({ focused }) => <RoleTabIcon focused={focused} mode={mode}><User size={21} color={focused ? activeColor : colors.textTertiary} strokeWidth={focused ? 2.5 : 2} /></RoleTabIcon> }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="ride-hailing" options={{ href: null }} />
    </Tabs>
  );
}
