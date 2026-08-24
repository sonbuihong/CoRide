import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Bell, ClipboardList, Home, User } from 'lucide-react-native';
import { ActivityIndicator, Alert, View } from 'react-native';

import { MobileAppHeader } from '../../src/components/layout/MobileAppHeader';
import { GREEN_TAB_COLOR, GreenTabIcon, greenTabBarStyles } from '../../src/components/navigation/GreenTabIcon';
import { useAppModeGuard } from '../../src/hooks/useAppModeGuard';
import { socketService } from '../../src/services/socket.service';
import { colors } from '../../src/theme/tokens';

export default function DriverTabLayout() {
  const router = useRouter();
  const { isGuardLoading } = useAppModeGuard();

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
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator color={GREEN_TAB_COLOR} /></View>;
  }

  return (
    <Tabs screenOptions={{
      headerShown: true,
      header: () => <MobileAppHeader mode="driver" />,
      tabBarActiveTintColor: GREEN_TAB_COLOR,
      tabBarInactiveTintColor: colors.textTertiary,
      tabBarHideOnKeyboard: true,
      tabBarStyle: greenTabBarStyles.bar,
      tabBarItemStyle: greenTabBarStyles.item,
      tabBarLabelStyle: greenTabBarStyles.label,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarAccessibilityLabel: 'Home', tabBarIcon: ({ color, focused }) => <GreenTabIcon focused={focused}><Home size={21} color={color} strokeWidth={focused ? 2.6 : 2} /></GreenTabIcon> }} />
      <Tabs.Screen name="requests" options={{ title: 'Hoạt động', tabBarAccessibilityLabel: 'Hoạt động', tabBarIcon: ({ color, focused }) => <GreenTabIcon focused={focused}><ClipboardList size={21} color={color} strokeWidth={focused ? 2.6 : 2} /></GreenTabIcon> }} />
      <Tabs.Screen name="notifications" options={{ title: 'Thông báo', tabBarAccessibilityLabel: 'Thông báo', tabBarIcon: ({ color, focused }) => <GreenTabIcon focused={focused}><Bell size={21} color={color} strokeWidth={focused ? 2.6 : 2} /></GreenTabIcon> }} />
      <Tabs.Screen name="profile" options={{ title: 'Hồ sơ', tabBarAccessibilityLabel: 'Hồ sơ cá nhân', tabBarIcon: ({ color, focused }) => <GreenTabIcon focused={focused}><User size={21} color={color} strokeWidth={focused ? 2.6 : 2} /></GreenTabIcon> }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="publish" options={{ href: null }} />
    </Tabs>
  );
}
