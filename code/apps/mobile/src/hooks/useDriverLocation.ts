// Hook quản lý GPS tracking cho driver và listen vị trí driver cho passenger
// Driver: dùng expo-location watchPositionAsync → emit GPS qua socket mỗi 5s
// Passenger: listen event 'driver:location' từ socket → cập nhật state

import { useEffect, useState, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { socketService } from '../services/socket.service';
import { SocketEvents, TripLocationUpdatedPayload } from '@repo/shared';

interface DriverLocationState {
  latitude: number;
  longitude: number;
  timestamp: number;
}

/**
 * Hook cho DRIVER — Lấy GPS và gửi lên server mỗi 5 giây.
 * Yêu cầu foreground location permission.
 * Tự cleanup khi unmount hoặc khi rideId thay đổi.
 */
export const useDriverTracking = (rideId: string | null) => {
  const [currentLocation, setCurrentLocation] = useState<DriverLocationState | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);

  const startTracking = useCallback(async () => {
    if (!rideId) return;

    // Yêu cầu quyền truy cập vị trí
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('[DriverTracking] Location permission denied');
      setPermissionGranted(false);
      return;
    }
    setPermissionGranted(true);

    // Kết nối socket và join ride room
    await socketService.connect();
    // Assuming socketService.socket is not exposed, if we connected without throwing, it's fine
    
    socketService.emit(SocketEvents.TRIP_JOIN_ROOM, rideId);

    // Bắt đầu watch vị trí GPS
    // distanceInterval: cập nhật mỗi 10m di chuyển
    // timeInterval: cập nhật mỗi 5 giây
    watchSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location) => {
        const { latitude, longitude } = location.coords;
        const locationData: DriverLocationState = {
          latitude,
          longitude,
          timestamp: Date.now(),
        };

        setCurrentLocation(locationData);
        // Gửi vị trí tới passengers qua socket
        socketService.emit(SocketEvents.DRIVER_UPDATE_LOCATION, { tripId: rideId, latitude, longitude });
      }
    );
  }, [rideId]);

  const stopTracking = useCallback(() => {
    if (watchSubscription.current) {
      watchSubscription.current.remove();
      watchSubscription.current = null;
    }
    if (rideId) {
      socketService.emit(SocketEvents.TRIP_LEAVE_ROOM, rideId);
    }
  }, [rideId]);

  useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, [startTracking, stopTracking]);

  return { currentLocation, permissionGranted, startTracking, stopTracking };
};

/**
 * Hook cho PASSENGER — Lắng nghe vị trí driver realtime qua Socket.
 * Nhận event 'driver:location' từ socket → cập nhật marker trên bản đồ.
 */
export const usePassengerTrackDriver = (rideId: string | null) => {
  const [driverLocation, setDriverLocation] = useState<DriverLocationState | null>(null);

  useEffect(() => {
    if (!rideId) return;

    let mounted = true;
    const handleLocationUpdate = (data: TripLocationUpdatedPayload) => {
      if (mounted) {
        setDriverLocation({ latitude: data.latitude, longitude: data.longitude, timestamp: Date.parse(data.updatedAt) });
      }
    };

    const setupListener = async () => {
      await socketService.connect();
      socketService.emit(SocketEvents.TRIP_JOIN_ROOM, rideId);
      socketService.on(SocketEvents.TRIP_LOCATION_UPDATED, handleLocationUpdate);
    };

    setupListener();

    return () => {
      mounted = false;
      socketService.emit(SocketEvents.TRIP_LEAVE_ROOM, rideId);
      socketService.off(SocketEvents.TRIP_LOCATION_UPDATED, handleLocationUpdate);
    };
  }, [rideId]);

  return driverLocation;
};
