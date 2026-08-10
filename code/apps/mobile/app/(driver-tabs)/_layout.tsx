import { Tabs } from 'expo-router';
import { Calendar, Bell, PlusCircle, User, CarFront } from 'lucide-react-native';

import { View, ActivityIndicator, Alert } from 'react-native';
import { useAppModeGuard } from '../../src/hooks/useAppModeGuard';
import React, { useEffect, useState } from 'react';
import { socketService } from '../../src/services/socket.service';
import { tripService } from '../../src/services/trip.service';
import { useRouter } from 'expo-router';

export default function DriverTabLayout() {
  const activeColor = '#3B82F6'; // CoRide Blue
  const inactiveColor = '#64748B'; // Text Secondary
  const router = useRouter();

  // Chạy guard để bảo vệ route này
  const { isGuardLoading } = useAppModeGuard();

  if (isGuardLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={activeColor} />
      </View>
    );
  }

  useEffect(() => {
    const handleNewRequest = (data: any) => {
      Alert.alert(
        'Cuốc xe mới!',
        `Khách: ${data.passenger.firstName}\nĐón: ${data.originAddress}\nĐến: ${data.destAddress}\nGiá: ${data.estimatedPrice}đ`,
        [
          {
            text: 'Từ chối',
            onPress: () => socketService.emit('trip:reject', { tripId: data.tripId }),
            style: 'cancel',
          },
          {
            text: 'Nhận cuốc',
            onPress: () => {
              socketService.emit('trip:accept', { tripId: data.tripId });
            },
          },
        ]
      );
    };

    const handleAcceptConfirmed = (data: any) => {
      Alert.alert('Thành công', 'Đã nhận cuốc xe!');
      router.push('/driver/active-trip' as any);
    };

    socketService.on('trip:new_request', handleNewRequest);
    socketService.on('trip:accept_confirmed', handleAcceptConfirmed);

    return () => {
      socketService.off('trip:new_request', handleNewRequest);
      socketService.off('trip:accept_confirmed', handleAcceptConfirmed);
    };
  }, []);

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
