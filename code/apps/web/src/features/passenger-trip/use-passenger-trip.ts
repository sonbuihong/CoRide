'use client';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  SocketEvents,
  type TripLocationUpdatedPayload,
  type TripUpdatedPayload,
} from '@repo/shared';
import { useSocket } from '@/components/providers/socket-provider';
import { passengerTripKeys, passengerTripService } from './service';
import type { PassengerTrip } from './domain';

export function usePassengerTrip(tripId?: string | null, enabled = true) {
  const { socket, isConnected } = useSocket();
  const client = useQueryClient();
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const query = useQuery({
    queryKey: tripId ? passengerTripKeys.detail(tripId) : passengerTripKeys.active,
    queryFn: () => tripId ? passengerTripService.byId(tripId) : passengerTripService.active(),
    enabled,
    refetchInterval: isConnected ? false : 10_000,
  });
  const refetch = query.refetch;
  useEffect(() => {
    if (!socket) return;
    const refresh = (payload: TripUpdatedPayload) => {
      if (tripId && payload.tripId !== tripId) return;
      client.setQueryData(
        passengerTripKeys.detail(payload.tripId),
        (old: PassengerTrip | undefined) => old
          ? { ...old, status: payload.status, driverId: payload.driverId, updatedAt: payload.updatedAt }
          : old,
      );
      void refetch();
    };
    const location = (payload: TripLocationUpdatedPayload) => {
      if (!tripId || payload.tripId === tripId) {
        setDriverLocation({ lat: payload.latitude, lng: payload.longitude });
      }
    };
    const reconnect = () => {
      if (tripId) socket.emit(SocketEvents.TRIP_JOIN_ROOM, tripId);
      void refetch();
    };
    if (tripId) socket.emit(SocketEvents.TRIP_JOIN_ROOM, tripId);
    socket.on(SocketEvents.TRIP_UPDATED, refresh);
    socket.on(SocketEvents.TRIP_LOCATION_UPDATED, location);
    socket.io.on('reconnect', reconnect);
    return () => {
      if (tripId) socket.emit(SocketEvents.TRIP_LEAVE_ROOM, tripId);
      socket.off(SocketEvents.TRIP_UPDATED, refresh);
      socket.off(SocketEvents.TRIP_LOCATION_UPDATED, location);
      socket.io.off('reconnect', reconnect);
    };
  }, [socket, tripId, client, refetch]);
  return { ...query, driverLocation };
}
