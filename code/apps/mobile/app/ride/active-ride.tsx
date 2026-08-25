import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useAppStore } from '../../src/stores/useAppStore';

import { ActiveRideMap } from '../../src/components/ActiveRideMap';
import { RideInfoPanel } from '../../src/components/RideInfoPanel';
import { DriverActionBar } from '../../src/components/DriverActionBar';
import { useDriverTracking, usePassengerTrackDriver } from '../../src/hooks/useDriverLocation';
import { usePickupNavigation } from '../../src/hooks/usePickupNavigation';
import { bookingService } from '../../src/services/booking.service';
import { getDirections } from '../../src/services/direction.service';
import { socketService } from '../../src/services/socket.service';
import { AppText } from '../../src/components/ui/AppText';
import { AppButton } from '../../src/components/ui/AppButton';

interface LatLng {
  latitude: number;
  longitude: number;
}

export default function ActiveRideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { appMode } = useAppStore();

  // State cho route directions
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [routeDuration, setRouteDuration] = useState<number>(0);

  // State quản lý kết nối socket realtime
  const [socketConnected, setSocketConnected] = useState(socketService.connected);

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
  const rideId = ride?.id ?? null;

  // Tọa độ điểm đi và điểm đến từ ride data
  const originCoords: LatLng | null = useMemo(() => ride?.originLat && ride?.originLng
    ? { latitude: ride.originLat, longitude: ride.originLng }
    : null, [ride?.originLat, ride?.originLng]);

  const destinationCoords: LatLng | null = useMemo(() => ride?.destinationLat && ride?.destinationLng
    ? { latitude: ride.destinationLat, longitude: ride.destinationLng }
    : null, [ride?.destinationLat, ride?.destinationLng]);

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

  // Lắng nghe sự kiện socket connect/disconnect
  useEffect(() => {
    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    socketService.on('connect', onConnect);
    socketService.on('disconnect', onDisconnect);

    // Cập nhật trạng thái tức thời
    setSocketConnected(socketService.connected);

    return () => {
      socketService.off('connect', onConnect);
      socketService.off('disconnect', onDisconnect);
    };
  }, []);

  // Fetch directions — thông minh theo trạng thái navigation
  const fetchDirections = useCallback(async () => {
    if (!originCoords || !destinationCoords) return;

    try {
      let fromCoords: LatLng;
      let toCoords: LatLng;

      const currentDriverLoc = driverLocRef.current;

      if (userRole === 'DRIVER') {
        if (ride?.status === 'SCHEDULED' && currentDriverLoc) {
          fromCoords = currentDriverLoc;
          toCoords = originCoords;
        } else if (ride?.status === 'ONGOING' && currentTargetType === 'PICKUP' && currentTarget && currentDriverLoc) {
          fromCoords = currentDriverLoc;
          toCoords = currentTarget;
        } else if (ride?.status === 'ONGOING' && currentTargetType === 'DESTINATION' && currentDriverLoc) {
          fromCoords = currentDriverLoc;
          toCoords = destinationCoords;
        } else {
          fromCoords = originCoords;
          toCoords = destinationCoords;
        }
      } else {
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
    originCoords,
    destinationCoords,
    userRole,
    ride?.status,
    currentTargetType,
    currentTarget,
  ]);

  useEffect(() => {
    fetchDirections();
  }, [fetchDirections]);

  const prevTargetRef = useRef<string | null>(null);
  useEffect(() => {
    if (userRole !== 'DRIVER') return;

    const targetKey = currentTarget
      ? `${currentTargetType}:${currentTarget.latitude}:${currentTarget.longitude}`
      : `${currentTargetType}:null`;

    if (prevTargetRef.current !== null && prevTargetRef.current !== targetKey) {
      console.log('[ActiveRide] Target thay đổi, cập nhật route:', prevTargetRef.current, '->', targetKey);
      fetchDirections();
    }

    prevTargetRef.current = targetKey;
  }, [currentTargetType, currentTarget?.latitude, currentTarget?.longitude, currentTarget, userRole, fetchDirections]);

  const hasFetchedWithDriverLoc = useRef(false);
  useEffect(() => {
    if (userRole === 'DRIVER' && driverOwnLocation && !hasFetchedWithDriverLoc.current) {
      hasFetchedWithDriverLoc.current = true;
      fetchDirections();
    }
  }, [driverOwnLocation, userRole, fetchDirections]);

  const handleStatusChange = useCallback((newStatus: string) => {
    if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
      socketService.disconnect();
      router.replace((appMode === 'driver' ? '/(driver-tabs)' : '/(passenger-tabs)') as any);
    } else if (newStatus === 'ONGOING') {
      fetchDirections();
    }
  }, [router, fetchDirections, appMode]);

  // Hoàn thiện pickup markers cho driver khi ONGOING
  const pickupMarkers = userRole === 'DRIVER' && ride?.status === 'ONGOING'
    ? pendingPickups.map((p) => ({
        coordinate: p.pickupCoords,
        label: `Đón ${p.booking.passenger?.firstName || 'Khách'}`,
        isActive: p.booking.id === currentBooking?.id,
        bookingId: p.booking.id,
      }))
    : [];

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#3B82F6" />
        <AppText variant="bodySmall" className="text-text-secondary mt-4">Đang tải bản đồ hành trình...</AppText>
      </View>
    );
  }

  if (!activeData || !ride) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <AppText variant="body" className="text-text-secondary text-center mb-4">
          Không có chuyến đi nào đang hoạt động
        </AppText>
        <AppButton
          title="Quay về trang chủ"
          variant="passenger"
          onPress={() => router.replace((appMode === 'driver' ? '/(driver-tabs)' : '/(passenger-tabs)') as any)}
          className="px-6"
        />
      </View>
    );
  }

  if (!originCoords || !destinationCoords) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <AppText variant="body" className="text-text-secondary text-center mb-4">
          Lỗi dữ liệu định vị địa lý của chuyến đi này
        </AppText>
        <AppButton
          title="Quay lại"
          variant="passenger"
          onPress={() => router.back()}
          className="px-6"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Bản đồ định vị toàn màn hình */}
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

        {/* Nút Back nổi */}
        <TouchableOpacity
          onPress={() => router.replace((appMode === 'driver' ? '/(driver-tabs)' : '/(passenger-tabs)') as any)}
          className="absolute left-4 bg-surface p-3 rounded-full shadow-md z-20 border border-border/20 active:bg-slate-50"
          style={{ top: insets.top + 10 }}
          accessibilityRole="button"
          accessibilityLabel="Thoát khỏi bản đồ theo dõi"
        >
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>

        {/* Cụm Panel Trạng thái Realtime Socket & Vai Trò (Góc trên phải) */}
        <View 
          className="absolute right-4 z-20 flex-row items-center space-x-2"
          style={{ top: insets.top + 10 }}
        >
          {/* Socket status badge */}
          <View className="flex-row items-center bg-surface/90 px-3 py-1.5 rounded-full border border-border/20 shadow-sm mr-2">
            <View className={`w-2 h-2 rounded-full mr-1.5 ${socketConnected ? 'bg-confirmed' : 'bg-rejected animate-pulse'}`} />
            <AppText variant="caption" weight="bold" className="text-text-primary">
              {socketConnected ? 'Kết nối' : 'Mất kết nối'}
            </AppText>
          </View>

          {/* Role badge */}
          <View className={`${userRole === 'DRIVER' ? 'bg-driver' : 'bg-passenger'} px-3 py-1.5 rounded-full shadow-sm`}>
            <AppText variant="caption" weight="bold" className="text-white">
              {userRole === 'DRIVER' ? 'Tài xế' : 'Hành khách'}
            </AppText>
          </View>
        </View>
      </View>

      {/* Thông tin chuyến đi trượt chân trang */}
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

      {/* Nút thao tác nhanh của Tài xế */}
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
