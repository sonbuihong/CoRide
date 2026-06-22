"use client";
import { useEffect, useState } from 'react';
import { useSocket } from '@/components/providers/socket-provider';
import { SocketEvents, TripLocationUpdatedPayload } from '@repo/shared';

interface DriverLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  updatedAt: string;
}

export const useDriverLocation = (tripId: string | null | undefined) => {
  const { socket, isConnected } = useSocket();
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);

  useEffect(() => {
    if (!socket || !isConnected || !tripId) return;

    // Lắng nghe vị trí tài xế từ socket server phát ra cho room chuyến đi
    const handleLocationUpdated = (payload: TripLocationUpdatedPayload) => {
      if (payload.tripId !== tripId) return;
      
      setDriverLocation({
        latitude: payload.latitude,
        longitude: payload.longitude,
        heading: payload.heading,
        speed: payload.speed,
        updatedAt: payload.updatedAt,
      });
    };

    socket.on(SocketEvents.TRIP_LOCATION_UPDATED, handleLocationUpdated);

    return () => {
      socket.off(SocketEvents.TRIP_LOCATION_UPDATED, handleLocationUpdated);
    };
  }, [socket, isConnected, tripId]);

  return driverLocation;
};
