import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Navigation } from 'lucide-react-native';
import { SocketEvents, type TripStatus } from '@repo/shared';

import { tripService } from '../../src/services/trip.service';
import { socketService } from '../../src/services/socket.service';
import { AppText } from '../../src/components/ui/AppText';
import { AppButton } from '../../src/components/ui/AppButton';
import { useDriverTracking } from '../../src/hooks/useDriverLocation';

export default function DriverActiveTripScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  useDriverTracking(activeTrip?.id ?? null);

  const fetchActiveTrip = useCallback(async () => {
    try {
      const res = await tripService.getActiveDriverTrip();
      if (res.data) {
        setActiveTrip(res.data);
      } else {
        Alert.alert('Lỗi', 'Không có chuyến đi nào đang hoạt động');
        router.back();
      }
    } catch (error) {
      console.log('Error fetching active trip:', error);
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchActiveTrip();

    const handleStatusUpdate = (data: any) => {
      if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
        Alert.alert('Thông báo', 'Chuyến đi đã kết thúc');
        router.back();
      } else {
        setActiveTrip((prev: any) => ({ ...prev, status: data.status }));
      }
    };

    const handleCancelled = () => {
      Alert.alert('Thông báo', 'Khách hàng đã hủy chuyến đi');
      router.back();
    };
    socketService.on(SocketEvents.TRIP_STATUS_UPDATE, handleStatusUpdate);
    socketService.on(SocketEvents.TRIP_UPDATED, handleStatusUpdate);
    socketService.on(SocketEvents.TRIP_CANCELLED, handleCancelled);

    return () => {
      socketService.off(SocketEvents.TRIP_STATUS_UPDATE, handleStatusUpdate);
      socketService.off(SocketEvents.TRIP_UPDATED, handleStatusUpdate);
      socketService.off(SocketEvents.TRIP_CANCELLED, handleCancelled);
    };
  }, [fetchActiveTrip, router]);

  const handleUpdateStatus = async (newStatus: TripStatus) => {
    if (!activeTrip) return;
    try {
      await tripService.updateTripStatus(activeTrip.id, newStatus);
      setActiveTrip((prev: any) => ({ ...prev, status: newStatus }));
      if (newStatus === 'WAITING_PAYMENT') {
        Alert.alert('Đã kết thúc hành trình', 'Đang chờ hành khách thanh toán.');
        router.back();
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!activeTrip) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc', paddingTop: insets.top }}>
      <View style={{ padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#e2e8f0' }}>
        <AppText style={{ fontSize: 20, fontWeight: 'bold' }}>Chuyến đi hiện tại</AppText>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 20, elevation: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            <MapPin size={24} color="#ef4444" />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <AppText style={{ color: '#64748b' }}>Đón khách tại</AppText>
              <AppText style={{ fontWeight: '500' }}>{activeTrip.originAddress}</AppText>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Navigation size={24} color="#3b82f6" />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <AppText style={{ color: '#64748b' }}>Trả khách tại</AppText>
              <AppText style={{ fontWeight: '500' }}>{activeTrip.destAddress}</AppText>
            </View>
          </View>
        </View>

        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 20, elevation: 2 }}>
          <AppText style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Thông tin Khách</AppText>
          <AppText>Tên: {activeTrip.passenger?.firstName} {activeTrip.passenger?.lastName}</AppText>
          <AppText>SĐT: {activeTrip.passenger?.phone || 'Không có'}</AppText>
          <AppText style={{ marginTop: 10, fontSize: 18, fontWeight: 'bold', color: '#10b981' }}>
            Tổng tiền: {activeTrip.estimatedPrice} đ
          </AppText>
        </View>

        <View style={{ marginTop: 10 }}>
          {activeTrip.status === 'ACCEPTED' && (
            <AppButton title="Đang đến điểm đón" onPress={() => handleUpdateStatus('ARRIVING')} />
          )}
          {activeTrip.status === 'ARRIVING' && (
            <AppButton title="Bắt đầu chuyến" onPress={() => handleUpdateStatus('IN_PROGRESS')} />
          )}
          {activeTrip.status === 'IN_PROGRESS' && (
            <AppButton title="Kết thúc và chờ thanh toán" onPress={() => handleUpdateStatus('WAITING_PAYMENT')} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
