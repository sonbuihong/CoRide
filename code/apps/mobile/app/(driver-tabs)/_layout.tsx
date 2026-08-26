import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Bell, ClipboardList, Home, User } from 'lucide-react-native';
import { ActivityIndicator, Alert, View } from 'react-native';

import { MobileAppHeader } from '../../src/components/layout/MobileAppHeader';
import {
  getRoleTabColor,
  RoleBottomTabBar,
  RoleTabIcon,
  RoleTabLabel,
} from '../../src/components/navigation/RoleTabBar';
import { useAppModeGuard } from '../../src/hooks/useAppModeGuard';
import { socketService } from '../../src/services/socket.service';
import { colors } from '../../src/theme/tokens';

export default function DriverTabLayout() {
  const router = useRouter();
  const { isGuardLoading } = useAppModeGuard();
  const mode = 'driver' as const;
  const activeColor = getRoleTabColor(mode);

  useEffect(() => {
    const handleNewRequest = (data: any) => {
      Alert.alert(
        'Yêu cầu chuyến mới',
        `Khách: ${data.passenger.firstName}\nĐón: ${data.originAddress}\nĐến: ${data.destAddress}\nGiá: ${data.estimatedPrice}đ`,
        [
          { text: 'Từ chối', style: 'cancel', onPress: () => socketService.emit('trip:reject', { tripId: data.tripId }) },
          { text: 'Nhận chuyến', onPress: () => socketService.emit('trip:accept', { tripId: data.tripId }) },
        ],
      );
    };
    const handleAcceptConfirmed = () => {
      Alert.alert('Đã nhận chuyến', 'Mở hành trình để đến điểm đón.');
      router.push('/driver/active-trip' as any);
    };

    socketService.on('trip:new_request', handleNewRequest);
    socketService.on('trip:accept_confirmed', handleAcceptConfirmed);
    return () => {
      socketService.off('trip:new_request', handleNewRequest);
      socketService.off('trip:accept_confirmed', handleAcceptConfirmed);
    };
  }, [router]);

  if (isGuardLoading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={activeColor} /></View>;
  }

  return (
    <Tabs tabBar={(props) => <RoleBottomTabBar {...props} mode={mode} />} screenOptions={{
      headerShown: true,
      header: () => <MobileAppHeader mode="driver" />,
      tabBarActiveTintColor: activeColor,
      tabBarInactiveTintColor: colors.textTertiary,
      tabBarHideOnKeyboard: true,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarAccessibilityLabel: 'Home', tabBarLabel: ({ color, focused }) => <RoleTabLabel color={color} focused={focused} label="Home" />, tabBarIcon: ({ color, focused }) => <RoleTabIcon focused={focused} mode={mode}><Home size={21} color={color} strokeWidth={focused ? 2.5 : 2} /></RoleTabIcon> }} />
      <Tabs.Screen name="requests" options={{ title: 'Hoạt động', tabBarAccessibilityLabel: 'Hoạt động', tabBarLabel: ({ color, focused }) => <RoleTabLabel color={color} focused={focused} label="Hoạt động" />, tabBarIcon: ({ color, focused }) => <RoleTabIcon focused={focused} mode={mode}><ClipboardList size={21} color={color} strokeWidth={focused ? 2.5 : 2} /></RoleTabIcon> }} />
      <Tabs.Screen name="notifications" options={{ title: 'Thông báo', tabBarAccessibilityLabel: 'Thông báo', tabBarLabel: ({ color, focused }) => <RoleTabLabel color={color} focused={focused} label="Thông báo" />, tabBarIcon: ({ color, focused }) => <RoleTabIcon focused={focused} mode={mode}><Bell size={21} color={color} strokeWidth={focused ? 2.5 : 2} /></RoleTabIcon> }} />
      <Tabs.Screen name="profile" options={{ title: 'Hồ sơ', tabBarAccessibilityLabel: 'Hồ sơ cá nhân', tabBarLabel: ({ color, focused }) => <RoleTabLabel color={color} focused={focused} label="Hồ sơ" />, tabBarIcon: ({ color, focused }) => <RoleTabIcon focused={focused} mode={mode}><User size={21} color={color} strokeWidth={focused ? 2.5 : 2} /></RoleTabIcon> }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="publish" options={{ href: null }} />
    </Tabs>
  );
}
