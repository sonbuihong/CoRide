// Thanh action cho driver trên màn hình active ride
// 3 trạng thái:
//   SCHEDULED / FULL → "Bắt đầu chuyến đi"
//   ONGOING + đang đón khách → "Đã đến điểm đón [Tên khách]" + Nút kết thúc sớm
//   ONGOING + đã đón hết / IDLE → "Hoàn thành chuyến đi"

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Play, CheckCircle, MapPin } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rideService } from '../services/ride.service';
import { showInfoDialog } from '../utils/dialog';

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
      showInfoDialog(
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
    },
    onError: (error: any) => {
      showInfoDialog(
        'Lỗi',
        error.response?.data?.message || 'Không thể hoàn thành chuyến đi'
      );
    },
  });

  const handleStartRide = () => {
    startRideMutation.mutate();
  };

  const handleCompleteRide = () => {
    completeRideMutation.mutate();
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

  // Chỉ hiển thị khi ride đang SCHEDULED, FULL hoặc ONGOING
  const isStartable = rideStatus === 'SCHEDULED' || rideStatus === 'FULL';
  const isOngoing = rideStatus === 'ONGOING';

  if (!isStartable && !isOngoing) {
    return null;
  }

  // Tên khách đang đón
  const passengerName = currentBooking?.passenger
    ? `${currentBooking.passenger.firstName || ''} ${currentBooking.passenger.lastName || ''}`.trim()
    : '';

  return (
    <View className="px-5 pb-5 pt-1">
      {/* SCHEDULED hoặc FULL: Nút bắt đầu chuyến đi */}
      {isStartable && (
        <TouchableOpacity
          onPress={handleStartRide}
          disabled={isPending}
          className={`flex-row items-center justify-center p-4 rounded-2xl ${
            isPending ? 'bg-blue-400' : 'bg-blue-600 active:bg-blue-700'
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

      {/* ONGOING + đang đón khách: Nút "Đã đến điểm đón" và nút kết thúc sớm */}
      {isOngoing && currentTargetType === 'PICKUP' && currentBooking && (
        <View className="space-y-2.5">
          <TouchableOpacity
            onPress={handlePickup}
            disabled={isPending}
            className={`flex-row items-center justify-center p-4 rounded-2xl ${
              isPending ? 'bg-orange-400' : 'bg-orange-500 active:bg-orange-600'
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
                    <Text className="text-white text-xs opacity-90">
                      {passengerName}
                      {pendingPickupsCount > 1 && ` (còn ${pendingPickupsCount - 1} khách)`}
                    </Text>
                  ) : null}
                </View>
              </>
            )}
          </TouchableOpacity>

          {/* Lối thoát cho tài xế nếu muốn hoàn thành chuyến khi chưa kịp đón hết */}
          <TouchableOpacity
            onPress={handleCompleteRide}
            disabled={isPending}
            className="flex-row items-center justify-center p-3 rounded-2xl border border-green-600 bg-green-50 active:bg-green-100"
          >
            <CheckCircle size={18} color="#16A34A" />
            <Text className="text-green-700 font-semibold text-base ml-2">
              Kết thúc chuyến đi ngay
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ONGOING + đã đón hết hoặc IDLE: Nút hoàn thành chuyến */}
      {isOngoing && (currentTargetType === 'DESTINATION' || currentTargetType === 'IDLE') && (
        <TouchableOpacity
          onPress={handleCompleteRide}
          disabled={isPending}
          className={`flex-row items-center justify-center p-4 rounded-2xl ${
            isPending ? 'bg-green-400' : 'bg-green-600 active:bg-green-700'
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
