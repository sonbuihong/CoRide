import React, { createContext, useCallback, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { SocketEvents } from '@repo/shared';

import { useAuth } from '../hooks/useAuth';
import { useDriverTracking } from '../hooks/useDriverLocation';
import { bookingService } from '../services/booking.service';
import { socketService } from '../services/socket.service';
import { useAppStore } from '../stores/useAppStore';

type CurrentLocation = {
  latitude: number;
  longitude: number;
  timestamp: number;
};

type RideTrackingContextValue = {
  currentLocation: CurrentLocation | null;
  permissionGranted: boolean;
  ensureCurrentLocation: () => Promise<CurrentLocation | null>;
};

const RideTrackingContext = createContext<RideTrackingContextValue | null>(null);

export function RideTrackingProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const appMode = useAppStore((state) => state.appMode);
  const enabled = isAuthenticated && appMode === 'driver';
  const activeQuery = useQuery({
    queryKey: ['active-booking', 'driver'],
    queryFn: () => bookingService.getActiveBooking('driver'),
    enabled,
    refetchInterval: enabled ? 15_000 : false,
  });
  const ride = activeQuery.data?.ride;
  const ongoingRideId = enabled && ride?.status === 'ONGOING' ? ride.id : null;
  const tracking = useDriverTracking(ongoingRideId);
  const startTracking = tracking.startTracking;

  const ensureCurrentLocation = useCallback(async (): Promise<CurrentLocation | null> => {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') return null;
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const { latitude, longitude } = location.coords;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    if (ongoingRideId) {
      await socketService.connect();
      socketService.emit(SocketEvents.TRIP_JOIN_ROOM, ongoingRideId);
      socketService.emit(SocketEvents.DRIVER_UPDATE_LOCATION, {
        tripId: ongoingRideId,
        latitude,
        longitude,
        heading: location.coords.heading ?? undefined,
        speed: location.coords.speed ?? undefined,
        accuracy: location.coords.accuracy,
      });
      await startTracking();
    }
    return { latitude, longitude, timestamp: location.timestamp || Date.now() };
  }, [ongoingRideId, startTracking]);

  return (
    <RideTrackingContext.Provider value={{
      currentLocation: tracking.currentLocation,
      permissionGranted: tracking.permissionGranted,
      ensureCurrentLocation,
    }}>
      {children}
    </RideTrackingContext.Provider>
  );
}

export function useRideTrackingSession() {
  const value = useContext(RideTrackingContext);
  if (!value) throw new Error('useRideTrackingSession must be used within RideTrackingProvider');
  return value;
}
