// Màn hình chuyến đi đang active — fullscreen bản đồ + panel thông tin + driver actions
// Phân biệt vai trò:
//   - DRIVER: GPS tracking → emit location, navigation đón khách → điểm đến
//   - PASSENGER: Listen driver location → hiển thị marker realtime
//
// Luồng navigation tài xế (khi ONGOING):
//   1. Có khách chưa đón → route đến pickup point gần nhất
//   2. Tài xế nhấn "Đã đến điểm đón" → route đến pickup point tiếp theo (nếu có)
//   3. Đã đón hết → route đến destination

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react-native';

import { ActiveRideMap } from '../../src/components/ActiveRideMap';
import { RideInfoPanel } from '../../src/components/RideInfoPanel';
import { DriverActionBar } from '../../src/components/DriverActionBar';
import { useDriverTracking, usePassengerTrackDriver } from '../../src/hooks/useDriverLocation';
import { usePickupNavigation } from '../../src/hooks/usePickupNavigation';
import { bookingService } from '../../src/services/booking.service';
import { getDirections } from '../../src/services/direction.service';
import { disconnectSocket } from '../../src/services/socket.service';

interface LatLng {
  latitude: number;
  longitude: number;
}

export default function ActiveRideScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // State cho route directions
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [routeDuration, setRouteDuration] = useState<number>(0);

  // Fetch active booking
  const { data: activeData, isLoading } = useQuery({
    queryKey: ['active-booking'],
    queryFn: () => bookingService.getActiveBooking(),
    refetchInterval: 10000,
  });

  // Xác định thông tin ride và role
  const userRole = activeData?.userRole || 'PASSENGER';
  const ride = activeData?.ride;
  const booking = userRole === 'PASSENGER' ? activeData : activeData?.ride?.bookings?.[0];
  const rideId = ride?.id;

  // Tọa độ điểm đi và điểm đến từ ride data
  const originCoords: LatLng | null = ride?.originLat && ride?.originLng
    ? { latitude: ride.originLat, longitude: ride.originLng }
    : null;

  const destinationCoords: LatLng | null = ride?.destinationLat && ride?.destinationLng
    ? { latitude: ride.destinationLat, longitude: ride.destinationLng }
    : null;

  // Driver GPS tracking
  const { currentLocation: driverOwnLocation } = useDriverTracking(
    userRole === 'DRIVER' ? rideId : null
  );

  // Passenger listen driver location
  const driverLocationFromSocket = usePassengerTrackDriver(
    userRole === 'PASSENGER' ? rideId : null
  );

  // Vị trí driver hiển thị trên bản đồ
  const driverDisplayLocation = userRole === 'DRIVER'
    ? driverOwnLocation
    : driverLocationFromSocket;

  // Pickup navigation — chỉ active cho DRIVER
  const confirmedBookings = (userRole === 'DRIVER' && ride?.bookings) || [];
  const {
    currentTarget,
    currentTargetType,
    currentBooking,
    pendingPickups,
    pickedUpBookings,
    handlePickedUp,
    isPickingUp,
  } = usePickupNavigation(
    confirmedBookings,
    driverOwnLocation,
    originCoords,
    destinationCoords,
    ride?.status || 'SCHEDULED'
  );

  // Tránh việc fetchDirections chạy lại mỗi 5s khi driverOwnLocation thay đổi
  const driverLocRef = useRef<LatLng | null>(null);
  useEffect(() => {
    driverLocRef.current = driverOwnLocation;
  }, [driverOwnLocation]);

  // Fetch directions — thông minh theo trạng thái navigation
  const fetchDirections = useCallback(async () => {
    if (!originCoords || !destinationCoords) return;

    try {
      let fromCoords: LatLng;
      let toCoords: LatLng;

      const currentDriverLoc = driverLocRef.current;

      if (userRole === 'DRIVER') {
        if (ride?.status === 'SCHEDULED' && currentDriverLoc) {
          // Giai đoạn 0: Ride chưa bắt đầu → route từ driver đến origin
          fromCoords = currentDriverLoc;
          toCoords = originCoords;
        } else if (ride?.status === 'ONGOING' && currentTargetType === 'PICKUP' && currentTarget && currentDriverLoc) {
          // Giai đoạn 1: Đang đi đón khách → route từ driver đến pickup point
          fromCoords = currentDriverLoc;
          toCoords = currentTarget;
        } else if (ride?.status === 'ONGOING' && currentTargetType === 'DESTINATION' && currentDriverLoc) {
          // Giai đoạn 2: Đã đón hết → route từ driver đến destination
          fromCoords = currentDriverLoc;
          toCoords = destinationCoords;
        } else {
          // Fallback: origin → destination
          fromCoords = originCoords;
          toCoords = destinationCoords;
        }
      } else {
        // Passenger: luôn hiện route origin → destination
        fromCoords = originCoords;
        toCoords = destinationCoords;
      }

      const result = await getDirections(fromCoords, toCoords);
      if (result) {
        setRouteCoords(result.polylineCoords);
        setRouteDistance(result.distance);
        setRouteDuration(result.duration);
      }
    } catch (error) {
      console.error('[ActiveRide] Không thể lấy directions:', error);
    }
  }, [
    originCoords?.latitude,
    originCoords?.longitude,
    destinationCoords?.latitude,
    destinationCoords?.longitude,
    userRole,
    ride?.status,
    currentTargetType,
    currentTarget?.latitude,
    currentTarget?.longitude,
  ]);

  // Gọi fetchDirections khi các dependency thay đổi (route mới, target mới)
  useEffect(() => {
    fetchDirections();
  }, [fetchDirections]);

  // Khi tài xế xác nhận đón khách → currentTarget thay đổi sang điểm đón tiếp theo
  // hoặc sang DESTINATION → cần fetch lại route ngay lập tức
  const prevTargetRef = useRef<string | null>(null);
  useEffect(() => {
    if (userRole !== 'DRIVER') return;

    // Tạo key để so sánh: kết hợp type + tọa độ
    const targetKey = currentTarget
      ? `${currentTargetType}:${currentTarget.latitude}:${currentTarget.longitude}`
      : `${currentTargetType}:null`;

    if (prevTargetRef.current !== null && prevTargetRef.current !== targetKey) {
      // Target đã thay đổi (xác nhận đón khách xong → điểm đón tiếp hoặc destination)
      console.log('[ActiveRide] Target thay đổi, cập nhật route:', prevTargetRef.current, '->', targetKey);
      fetchDirections();
    }

    prevTargetRef.current = targetKey;
  }, [currentTargetType, currentTarget?.latitude, currentTarget?.longitude, userRole, fetchDirections]);

  // Đảm bảo fetch lại một lần đầu tiên khi driver có location để thay thế fallback
  const hasFetchedWithDriverLoc = useRef(false);
  useEffect(() => {
    if (userRole === 'DRIVER' && driverOwnLocation && !hasFetchedWithDriverLoc.current) {
      hasFetchedWithDriverLoc.current = true;
      fetchDirections();
    }
  }, [driverOwnLocation, userRole, fetchDirections]);

  // Khi driver thay đổi status ride
  const handleStatusChange = useCallback((newStatus: string) => {
    if (newStatus === 'COMPLETED') {
      // Cleanup socket và quay về home
      disconnectSocket();
      router.replace('/(tabs)');
    } else if (newStatus === 'ONGOING') {
      // Recalculate route — lúc này cần xác định target (pickup hoặc destination)
      fetchDirections();
    }
  }, [router, fetchDirections]);

  // Xây dựng pickup markers cho bản đồ (chỉ dành cho driver khi ONGOING)
  const pickupMarkers = userRole === 'DRIVER' && ride?.status === 'ONGOING'
    ? pendingPickups.map((p) => ({
        coordinate: p.pickupCoords,
        label: `Đón ${p.booking.passenger?.firstName || 'Khách'}`,
        isActive: p.booking.id === currentBooking?.id,
        bookingId: p.booking.id,
      }))
    : [];

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-500 mt-4">Đang tải thông tin chuyến đi...</Text>
      </View>
    );
  }

  // Không có chuyến active
  if (!activeData || !ride) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-gray-500 text-lg text-center">
          Không có chuyến đi nào đang hoạt động
        </Text>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">Quay về trang chủ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Không có tọa độ
  if (!originCoords || !destinationCoords) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <Text className="text-gray-500 text-lg text-center">
          Không có thông tin tọa độ cho chuyến đi này
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Bản đồ fullscreen */}
      <View className="flex-1">
        <ActiveRideMap
          originCoords={originCoords}
          destinationCoords={destinationCoords}
          routeCoords={routeCoords}
          driverLocation={driverDisplayLocation}
          originLabel={ride.origin}
          destinationLabel={ride.destination}
          pickupMarkers={pickupMarkers}
        />

        {/* Nút back overlay trên bản đồ */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-12 left-4 bg-white p-3 rounded-full shadow-md"
        >
          <ArrowLeft size={22} color="#1F2937" />
        </TouchableOpacity>

        {/* Badge role overlay */}
        <View className="absolute top-12 right-4 bg-blue-600 px-3 py-1.5 rounded-full">
          <Text className="text-white text-xs font-bold">
            {userRole === 'DRIVER' ? 'Tài xế' : 'Hành khách'}
          </Text>
        </View>
      </View>

      {/* Panel thông tin chuyến đi */}
      <RideInfoPanel
        ride={ride}
        booking={booking}
        userRole={userRole}
        distance={routeDistance}
        duration={routeDuration}
        currentTargetType={currentTargetType}
        currentBooking={currentBooking}
        pendingPickups={pendingPickups}
        pickedUpBookings={pickedUpBookings}
      />

      {/* Action bar cho driver */}
      {userRole === 'DRIVER' && (
        <DriverActionBar
          rideId={ride.id}
          rideStatus={ride.status}
          onStatusChange={handleStatusChange}
          currentTargetType={currentTargetType}
          currentBooking={currentBooking}
          onPickedUp={handlePickedUp}
          isPickingUp={isPickingUp}
          pendingPickupsCount={pendingPickups.length}
        />
      )}
    </View>
  );
}
