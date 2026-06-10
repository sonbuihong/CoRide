// Hook quản lý GPS tracking cho driver và listen vị trí driver cho passenger
// Driver: dùng expo-location watchPositionAsync → emit GPS qua socket mỗi 5s
// Passenger: listen event 'driver:location' từ socket → cập nhật state

import { useEffect, useState, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import {
  connectSocket,
  joinRideRoom,
  leaveRideRoom,
  emitDriverLocation,
  getSocket,
} from '../services/socket.service';

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
    const connectedSocket = await connectSocket();
    if (!connectedSocket) {
      console.error('[DriverTracking] Socket connection failed — vị trí sẽ không được gửi cho passengers');
      return;
    }
    joinRideRoom(rideId);

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
        emitDriverLocation(rideId, latitude, longitude);
      }
    );
  }, [rideId]);

  const stopTracking = useCallback(() => {
    if (watchSubscription.current) {
      watchSubscription.current.remove();
      watchSubscription.current = null;
    }
    if (rideId) {
      leaveRideRoom(rideId);
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

    const setupListener = async () => {
      await connectSocket();
      joinRideRoom(rideId);

      const socket = getSocket();
      if (!socket) return;

      socket.on('driver:location', (data: DriverLocationState) => {
        if (mounted) {
          setDriverLocation(data);
        }
      });
    };

    setupListener();

    return () => {
      mounted = false;
      leaveRideRoom(rideId);
      const socket = getSocket();
      if (socket) {
        socket.off('driver:location');
      }
    };
  }, [rideId]);

  return driverLocation;
};
