import { Tabs } from 'expo-router';
import { Calendar, Bell, PlusCircle, User, CarFront } from 'lucide-react-native';

import { View, ActivityIndicator } from 'react-native';
import { useAppModeGuard } from '../../src/hooks/useAppModeGuard';

export default function DriverTabLayout() {
  const activeColor = '#3B82F6'; // CoRide Blue
  const inactiveColor = '#64748B'; // Text Secondary

  // Chạy guard để bảo vệ route này
  const { isGuardLoading } = useAppModeGuard();

  if (isGuardLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={activeColor} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Lịch trình',
          tabBarIcon: ({ color, size }) => <Calendar size={24} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Yêu cầu',
          tabBarIcon: ({ color, size }) => <Bell size={24} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="publish"
        options={{
          title: 'Đăng chuyến',
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-2 rounded-xl ${focused ? 'bg-primary' : 'bg-primary-soft'}`}>
              <PlusCircle size={24} color={focused ? '#FFFFFF' : '#3B82F6'} strokeWidth={2.5} />
            </View>
          ),
          tabBarLabel: () => null, // Ẩn label cho tab này để nó nổi bật hơn
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ color, size }) => <Bell size={24} color={color} strokeWidth={2.5} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color, size }) => <User size={24} color={color} strokeWidth={2.5} />,
        }}
      />
    </Tabs>
  );
}
