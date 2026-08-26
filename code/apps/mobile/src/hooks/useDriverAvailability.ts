import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { socketService } from '../services/socket.service';

export const useDriverAvailability = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const goOffline = useCallback(() => {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    socketService.emit('driver:go_offline');
    setIsOnline(false);
  }, []);

  const goOnline = useCallback(async () => {
    setIsChanging(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') return false;
      await socketService.connect();
      socketService.emit('driver:go_online');
      const firstLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      socketService.emit('driver:update_location', {
        latitude: firstLocation.coords.latitude,
        longitude: firstLocation.coords.longitude,
      });
      locationSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        ({ coords }) => socketService.emit('driver:update_location', {
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      );
      setIsOnline(true);
      return true;
    } finally {
      setIsChanging(false);
    }
  }, []);

  useEffect(() => () => {
    locationSubscription.current?.remove();
    socketService.emit('driver:go_offline');
  }, []);

  return { isOnline, isChanging, goOnline, goOffline };
};
