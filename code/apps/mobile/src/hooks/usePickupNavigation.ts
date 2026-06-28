// Hook quản lý state machine navigation cho tài xế khi đón khách
// Luồng: IDLE → NAVIGATING_TO_PICKUP → NAVIGATING_TO_DESTINATION
// Logic: Sắp xếp thứ tự đón khách theo khoảng cách Haversine (gần nhất trước)

import { useMemo, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { bookingService } from '../services/booking.service';

interface LatLng {
  latitude: number;
  longitude: number;
}

interface BookingData {
  id: string;
  status: string;
  isPickedUp: boolean;
  seats: number;
  passengerLat?: number | null;
  passengerLng?: number | null;
  pickupAddress?: string | null;
  passenger?: {
    id: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string | null;
  };
}

type NavigationTargetType = 'IDLE' | 'PICKUP' | 'DESTINATION';

interface PickupTarget {
  booking: BookingData;
  pickupCoords: LatLng;
  distanceKm: number;
}

interface UsePickupNavigationResult {
  /** Toạ độ đang navigate đến (pickup point hoặc destination) */
  currentTarget: LatLng | null;
  /** Loại target: đang đi đón khách hay đi đến điểm đến */
  currentTargetType: NavigationTargetType;
  /** Booking đang được đón (nếu target = PICKUP) */
  currentBooking: BookingData | null;
  /** Danh sách khách chưa đón, sorted theo khoảng cách gần nhất */
  pendingPickups: PickupTarget[];
  /** Danh sách khách đã đón */
  pickedUpBookings: BookingData[];
  /** Gọi khi tài xế nhấn "Đã đến điểm đón" */
  handlePickedUp: (bookingId: string) => void;
  /** Mutation đang loading */
  isPickingUp: boolean;
}

/**
 * Tính khoảng cách Haversine giữa 2 toạ độ (km).
 * Công thức đường chim bay — đủ chính xác cho use case đón khách trong thành phố.
 * Sai số so với khoảng cách thực tế trên đường: ~10-20% (chấp nhận được).
 */
const haversineDistance = (from: LatLng, to: LatLng): number => {
  const EARTH_RADIUS_KM = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const deltaLat = toRad(to.latitude - from.latitude);
  const deltaLng = toRad(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) *
      Math.cos(toRad(to.latitude)) *
      Math.sin(deltaLng / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Hook quản lý luồng navigation đón khách cho tài xế.
 *
 * @param bookings - Danh sách booking CONFIRMED trên chuyến đi
 * @param driverLocation - GPS hiện tại của tài xế
 * @param rideOrigin - Toạ độ điểm đi mặc định (fallback khi booking không có toạ độ đón riêng)
 * @param rideDestination - Toạ độ điểm đến của chuyến đi
 * @param rideStatus - Trạng thái hiện tại của ride (SCHEDULED / ONGOING)
 */
export const usePickupNavigation = (
  bookings: BookingData[],
  driverLocation: LatLng | null,
  rideOrigin: LatLng | null,
  rideDestination: LatLng | null,
  rideStatus: string
): UsePickupNavigationResult => {
  const queryClient = useQueryClient();

  // Mutation gọi API confirmPickup
  const pickupMutation = useMutation({
    mutationFn: (bookingId: string) => bookingService.confirmPickup(bookingId),
    onSuccess: () => {
      // Invalidate để refetch active booking → cập nhật isPickedUp
      queryClient.invalidateQueries({ queryKey: ['active-booking'] });
    },
    onError: (error: any) => {
      Alert.alert(
        'Lỗi',
        error.response?.data?.message || 'Không thể xác nhận đón khách'
      );
    },
  });

  // Phân loại booking: chưa đón vs đã đón
  // Chỉ xét booking CONFIRMED (PENDING chưa được accept, COMPLETED đã xong)
  const confirmedBookings = useMemo(
    () => bookings.filter((b) => b.status === 'CONFIRMED'),
    [bookings]
  );

  const pickedUpBookings = useMemo(
    () => confirmedBookings.filter((b) => b.isPickedUp),
    [confirmedBookings]
  );

  // Tính toạ độ pickup cho mỗi booking chưa đón + sort theo khoảng cách
  const pendingPickups = useMemo((): PickupTarget[] => {
    const notPickedUp = confirmedBookings.filter((b) => !b.isPickedUp);

    if (notPickedUp.length === 0) return [];

    // Xác định vị trí reference để tính khoảng cách
    // Ưu tiên dùng GPS tài xế, fallback về điểm đi của ride
    const referencePoint = driverLocation || rideOrigin;
    if (!referencePoint) return [];

    return notPickedUp
      .map((booking) => {
        // Booking ONGOING có toạ độ đón riêng (passengerLat/Lng)
        // Booking SCHEDULED dùng origin của ride làm điểm đón
        const pickupCoords: LatLng = {
          latitude: booking.passengerLat ?? rideOrigin?.latitude ?? 0,
          longitude: booking.passengerLng ?? rideOrigin?.longitude ?? 0,
        };

        const distanceKm = haversineDistance(referencePoint, pickupCoords);

        return { booking, pickupCoords, distanceKm };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [confirmedBookings, driverLocation, rideOrigin]);

  // Xác định target hiện tại dựa trên state
  const { currentTarget, currentTargetType, currentBooking } = useMemo(() => {
    // Ride chưa ONGOING → chưa cần navigate đón khách
    // (Khi SCHEDULED, DriverActionBar chỉ hiện nút "Bắt đầu chuyến đi")
    if (rideStatus !== 'ONGOING') {
      return {
        currentTarget: null,
        currentTargetType: 'IDLE' as NavigationTargetType,
        currentBooking: null,
      };
    }

    // Còn khách chưa đón → navigate đến khách gần nhất
    if (pendingPickups.length > 0) {
      const nearest = pendingPickups[0];
      return {
        currentTarget: nearest.pickupCoords,
        currentTargetType: 'PICKUP' as NavigationTargetType,
        currentBooking: nearest.booking,
      };
    }

    // Đã đón hết → navigate đến điểm đến
    if (rideDestination) {
      return {
        currentTarget: rideDestination,
        currentTargetType: 'DESTINATION' as NavigationTargetType,
        currentBooking: null,
      };
    }

    return {
      currentTarget: null,
      currentTargetType: 'IDLE' as NavigationTargetType,
      currentBooking: null,
    };
  }, [rideStatus, pendingPickups, rideDestination]);

  // Handler khi tài xế nhấn "Đã đến điểm đón"
  const handlePickedUp = useCallback(
    (bookingId: string) => {
      const booking = confirmedBookings.find((b) => b.id === bookingId);
      const passengerName = booking?.passenger
        ? `${booking.passenger.firstName} ${booking.passenger.lastName}`
        : 'hành khách';

      Alert.alert(
        'Xác nhận đã đến điểm đón',
        `Bạn đã đến điểm đón ${passengerName}?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xác nhận',
            onPress: () => pickupMutation.mutate(bookingId),
          },
        ]
      );
    },
    [confirmedBookings, pickupMutation]
  );

  return {
    currentTarget,
    currentTargetType,
    currentBooking,
    pendingPickups,
    pickedUpBookings,
    handlePickedUp,
    isPickingUp: pickupMutation.isPending,
  };
};
