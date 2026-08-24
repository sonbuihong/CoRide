import React from 'react';
import { Tabs } from 'expo-router';
import { Bell, ClipboardList, Home, User } from 'lucide-react-native';

import { MobileAppHeader } from '../../src/components/layout/MobileAppHeader';
import { GREEN_TAB_COLOR, GreenTabIcon, greenTabBarStyles } from '../../src/components/navigation/GreenTabIcon';
import { colors } from '../../src/theme/tokens';

export default function PassengerTabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: true,
      header: () => <MobileAppHeader mode="passenger" />,
      tabBarActiveTintColor: GREEN_TAB_COLOR,
      tabBarInactiveTintColor: colors.textTertiary,
      tabBarHideOnKeyboard: true,
      tabBarStyle: greenTabBarStyles.bar,
      tabBarItemStyle: greenTabBarStyles.item,
      tabBarLabelStyle: greenTabBarStyles.label,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarAccessibilityLabel: 'Home', tabBarIcon: ({ color, focused }) => <GreenTabIcon focused={focused}><Home size={21} color={color} strokeWidth={focused ? 2.6 : 2} /></GreenTabIcon> }} />
      <Tabs.Screen name="my-rides" options={{ title: 'Hoạt động', tabBarAccessibilityLabel: 'Hoạt động', tabBarIcon: ({ color, focused }) => <GreenTabIcon focused={focused}><ClipboardList size={21} color={color} strokeWidth={focused ? 2.6 : 2} /></GreenTabIcon> }} />
      <Tabs.Screen name="notifications" options={{ title: 'Thông báo', tabBarAccessibilityLabel: 'Thông báo', tabBarIcon: ({ color, focused }) => <GreenTabIcon focused={focused}><Bell size={21} color={color} strokeWidth={focused ? 2.6 : 2} /></GreenTabIcon> }} />
      <Tabs.Screen name="profile" options={{ title: 'Hồ sơ', tabBarAccessibilityLabel: 'Hồ sơ cá nhân', tabBarIcon: ({ color, focused }) => <GreenTabIcon focused={focused}><User size={21} color={color} strokeWidth={focused ? 2.6 : 2} /></GreenTabIcon> }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="ride-hailing" options={{ href: null }} />
    </Tabs>
  );
}
