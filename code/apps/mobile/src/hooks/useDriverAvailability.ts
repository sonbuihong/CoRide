import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { socketService } from '../services/socket.service';
import { subscribeDriverLocation } from '../services/driver-location-session.service';

export const useDriverAvailability = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const sessionGeneration = useRef(0);
  const onlineRef = useRef(false);

  const goOffline = useCallback(() => {
    sessionGeneration.current += 1;
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    onlineRef.current = false;
    socketService.emit('driver:go_offline');
    setIsOnline(false);
  }, []);

  const goOnline = useCallback(async () => {
    const generation = ++sessionGeneration.current;
    setIsChanging(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (generation !== sessionGeneration.current) return false;
      if (permission.status !== 'granted') return false;
      await socketService.connect();
      if (generation !== sessionGeneration.current) return false;
      socketService.emit('driver:go_online');
      const firstLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      if (generation !== sessionGeneration.current) return false;
      socketService.emit('driver:update_location', {
        latitude: firstLocation.coords.latitude,
        longitude: firstLocation.coords.longitude,
      });
      const subscription = await subscribeDriverLocation(
        ({ coords }) => {
          if (generation !== sessionGeneration.current) return;
          socketService.emit('driver:update_location', {
            latitude: coords.latitude,
            longitude: coords.longitude,
          });
        },
      );
      if (generation !== sessionGeneration.current) {
        subscription.remove();
        return false;
      }
      locationSubscription.current?.remove();
      locationSubscription.current = subscription;
      onlineRef.current = true;
      setIsOnline(true);
      return true;
    } catch (error) {
      onlineRef.current = false;
      socketService.emit('driver:go_offline');
      throw error;
    } finally {
      setIsChanging(false);
    }
  }, []);

  useEffect(() => socketService.subscribeConnection(() => {
    if (onlineRef.current && socketService.connected) {
      socketService.emit('driver:go_online');
    }
  }), []);

  useEffect(() => () => {
    sessionGeneration.current += 1;
    locationSubscription.current?.remove();
    onlineRef.current = false;
    socketService.emit('driver:go_offline');
  }, []);

  return { isOnline, isChanging, goOnline, goOffline };
};
