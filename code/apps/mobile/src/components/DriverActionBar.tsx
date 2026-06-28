      // Thanh action cho driver trên màn hình active ride
// 3 trạng thái:
//   SCHEDULED → "Bắt đầu chuyến đi"
//   ONGOING + đang đón khách → "Đã đến điểm đón [Tên khách]"
//   ONGOING + đã đón hết → "Hoàn thành chuyến đi"

import React from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Play, CheckCircle, MapPin } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rideService } from '../services/ride.service';

interface BookingInfo {
  id: string;
  passenger?: {
    firstName?: string;
    lastName?: string;
  };
}

interface DriverActionBarProps {
  rideId: string;
  rideStatus: string;
  onStatusChange?: (newStatus: string) => void;
  /** Loại target hiện tại: đang đón khách hay đi đến điểm đến */
  currentTargetType?: 'IDLE' | 'PICKUP' | 'DESTINATION';
  /** Booking đang được đón (khi targetType = PICKUP) */
  currentBooking?: BookingInfo | null;
  /** Callback khi tài xế nhấn "Đã đến điểm đón" */
  onPickedUp?: (bookingId: string) => void;
  /** Đang loading pickup mutation */
  isPickingUp?: boolean;
  /** Số khách chưa đón (để hiển thị badge) */
  pendingPickupsCount?: number;
}

export const DriverActionBar: React.FC<DriverActionBarProps> = ({
  rideId,
  rideStatus,
  onStatusChange,
  currentTargetType = 'IDLE',
  currentBooking = null,
  onPickedUp,
  isPickingUp = false,
  pendingPickupsCount = 0,
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
      'Bạn đã sẵn sàng khởi hành?',
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

  const handlePickup = () => {
    if (currentBooking?.id && onPickedUp) {
      onPickedUp(currentBooking.id);
    }
  };

  const isPending =
    startRideMutation.isPending ||
    completeRideMutation.isPending ||
    isPickingUp;

  // Chỉ hiển thị khi ride đang SCHEDULED hoặc ONGOING
  if (rideStatus !== 'SCHEDULED' && rideStatus !== 'ONGOING') {
    return null;
  }

  // Tên khách đang đón
  const passengerName = currentBooking?.passenger
    ? `${currentBooking.passenger.firstName || ''} ${currentBooking.passenger.lastName || ''}`.trim()
    : '';

  return (
    <View className="px-5 pb-5">
      {/* SCHEDULED: Nút bắt đầu chuyến đi */}
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

      {/* ONGOING + đang đón khách: Nút "Đã đến điểm đón" */}
      {rideStatus === 'ONGOING' && currentTargetType === 'PICKUP' && currentBooking && (
        <TouchableOpacity
          onPress={handlePickup}
          disabled={isPending}
          className={`flex-row items-center justify-center p-4 rounded-2xl ${
            isPending ? 'bg-orange-400' : 'bg-orange-500'
          }`}
        >
          {isPending ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <MapPin size={22} color="white" />
              <View className="ml-3">
                <Text className="text-white font-bold text-lg">
                  Đã đến điểm đón
                </Text>
                {passengerName ? (
                  <Text className="text-white text-xs opacity-80">
                    {passengerName}
                    {pendingPickupsCount > 1 && ` (còn ${pendingPickupsCount - 1} khách)`}
                  </Text>
                ) : null}
              </View>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* ONGOING + đã đón hết: Nút hoàn thành chuyến */}
      {rideStatus === 'ONGOING' && currentTargetType === 'DESTINATION' && (
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

      {/* ONGOING nhưng IDLE (chưa có booking confirmed nào): Nút hoàn thành */}
      {rideStatus === 'ONGOING' && currentTargetType === 'IDLE' && (
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
