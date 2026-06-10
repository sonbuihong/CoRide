// Thanh action cho driver trên màn hình active ride
// 2 trạng thái: SCHEDULED → "Bắt đầu chuyến đi", ONGOING → "Hoàn thành chuyến"

import React from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Play, CheckCircle } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rideService } from '../services/ride.service';

interface DriverActionBarProps {
  rideId: string;
  rideStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

export const DriverActionBar: React.FC<DriverActionBarProps> = ({
  rideId,
  rideStatus,
  onStatusChange,
}) => {
  const queryClient = useQueryClient();

  const startRideMutation = useMutation({
    mutationFn: () => rideService.updateRideStatus(rideId, 'ONGOING'),
    onSuccess: () => {
      // Invalidate queries để UI cập nhật
      queryClient.invalidateQueries({ queryKey: ['active-booking'] });
      onStatusChange?.('ONGOING');
    },
    onError: (error: any) => {
      Alert.alert(
        'Lỗi',
        error.response?.data?.message || 'Không thể bắt đầu chuyến đi'
      );
    },
  });

  const completeRideMutation = useMutation({
    mutationFn: () => rideService.updateRideStatus(rideId, 'COMPLETED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-booking'] });
      onStatusChange?.('COMPLETED');
      Alert.alert('Hoàn thành', 'Chuyến đi đã hoàn thành. Cảm ơn bạn!');
    },
    onError: (error: any) => {
      Alert.alert(
        'Lỗi',
        error.response?.data?.message || 'Không thể hoàn thành chuyến đi'
      );
    },
  });

  const handleStartRide = () => {
    Alert.alert(
      'Xác nhận bắt đầu',
      'Bạn đã đón khách và sẵn sàng khởi hành?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Bắt đầu',
          onPress: () => startRideMutation.mutate(),
        },
      ]
    );
  };

  const handleCompleteRide = () => {
    Alert.alert(
      'Xác nhận hoàn thành',
      'Bạn đã đến điểm đến và muốn kết thúc chuyến đi?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Hoàn thành',
          style: 'default',
          onPress: () => completeRideMutation.mutate(),
        },
      ]
    );
  };

  const isPending = startRideMutation.isPending || completeRideMutation.isPending;

  // Chỉ hiển thị khi ride đang SCHEDULED hoặc ONGOING
  if (rideStatus !== 'SCHEDULED' && rideStatus !== 'ONGOING') {
    return null;
  }

  return (
    <View className="px-5 pb-5">
      {rideStatus === 'SCHEDULED' && (
        <TouchableOpacity
          onPress={handleStartRide}
          disabled={isPending}
          className={`flex-row items-center justify-center p-4 rounded-2xl ${
            isPending ? 'bg-blue-400' : 'bg-blue-600'
          }`}
        >
          {isPending ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Play size={22} color="white" />
              <Text className="text-white font-bold text-lg ml-3">
                Bắt đầu chuyến đi
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {rideStatus === 'ONGOING' && (
        <TouchableOpacity
          onPress={handleCompleteRide}
          disabled={isPending}
          className={`flex-row items-center justify-center p-4 rounded-2xl ${
            isPending ? 'bg-green-400' : 'bg-green-600'
          }`}
        >
          {isPending ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <CheckCircle size={22} color="white" />
              <Text className="text-white font-bold text-lg ml-3">
                Hoàn thành chuyến đi
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};
