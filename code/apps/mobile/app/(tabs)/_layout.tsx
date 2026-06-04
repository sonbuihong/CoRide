import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Car, Bell, User } from 'lucide-react-native';

import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const activeColor = '#3B82F6'; // CoRide Blue

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        headerShown: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-rides"
        options={{
          title: 'Chuyến đi',
          tabBarIcon: ({ color, size }) => <Car size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
