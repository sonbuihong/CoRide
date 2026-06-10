// Màn hình chuyến đi đang active — fullscreen bản đồ + panel thông tin + driver actions
// Phân biệt vai trò:
//   - DRIVER: GPS tracking → emit location, nút Bắt đầu / Hoàn thành
//   - PASSENGER: Listen driver location → hiển thị marker realtime

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react-native';

import { ActiveRideMap } from '../../src/components/ActiveRideMap';
import { RideInfoPanel } from '../../src/components/RideInfoPanel';
import { DriverActionBar } from '../../src/components/DriverActionBar';
import { useDriverTracking, usePassengerTrackDriver } from '../../src/hooks/useDriverLocation';
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

  // Fetch directions  // Theo dõi tuyến đường
  const fetchDirections = useCallback(async () => {
    if (!originCoords || !destinationCoords) return;

    try {
      let fromCoords: LatLng;
      let toCoords: LatLng;

      if (userRole === 'DRIVER' && ride?.status === 'SCHEDULED' && driverOwnLocation) {
        // Giai đoạn 1: Driver đang đi đón khách (từ vị trí driver hiện tại đến điểm đón)
        fromCoords = driverOwnLocation;
        toCoords = originCoords;
      } else {
        // Giai đoạn 2 (ONGOING) hoặc Passenger: origin → destination
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
    driverOwnLocation?.latitude,
    driverOwnLocation?.longitude
  ]);

  useEffect(() => {
    fetchDirections();
  }, [fetchDirections]);

  // Khi driver thay đổi status ride
  const handleStatusChange = useCallback((newStatus: string) => {
    if (newStatus === 'COMPLETED') {
      // Cleanup socket và quay về home
      disconnectSocket();
      router.replace('/(tabs)');
    } else if (newStatus === 'ONGOING') {
      // Recalculate route — lúc này chỉ cần origin → destination
      fetchDirections();
    }
  }, [router, fetchDirections]);

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
      />

      {/* Action bar cho driver */}
      {userRole === 'DRIVER' && (
        <DriverActionBar
          rideId={ride.id}
          rideStatus={ride.status}
          onStatusChange={handleStatusChange}
        />
      )}
    </View>
  );
}
