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
import {
  isTerminalTripStatus,
  mergePassengerTrip,
  type PassengerTrip,
} from './domain';

export function usePassengerTrip(tripId?: string | null, enabled = true) {
  const { socket, isConnected } = useSocket();
  const client = useQueryClient();
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  const query = useQuery({
    queryKey: tripId ? passengerTripKeys.detail(tripId) : passengerTripKeys.active,
    queryFn: async () => {
      const fresh = tripId ? await passengerTripService.byId(tripId) : await passengerTripService.active();
      if (!fresh) return null;

      // Prime cache chéo: nếu fetch active có id thì prime detail(fresh.id)
      if (!tripId && fresh.id) {
        client.setQueryData(
          passengerTripKeys.detail(fresh.id),
          (old: PassengerTrip | undefined) => mergePassengerTrip(old, fresh),
        );
      }

      // Ngăn chặn race condition rollback khi API trả response cũ hơn socket event
      const currentCache = client.getQueryData<PassengerTrip | undefined>(
        tripId ? passengerTripKeys.detail(tripId) : passengerTripKeys.active,
      );

      return (mergePassengerTrip(currentCache, fresh) as PassengerTrip) ?? fresh;
    },
    enabled,
    refetchInterval: isConnected ? false : 10_000,
  });

  const activeTripId = tripId || query.data?.id;
  const refetch = query.refetch;

  // Quản lý join/leave Socket room của chuyến xe
  useEffect(() => {
    if (!socket || !activeTripId) return;

    socket.emit(SocketEvents.TRIP_JOIN_ROOM, activeTripId);

    return () => {
      socket.emit(SocketEvents.TRIP_LEAVE_ROOM, activeTripId);
    };
  }, [socket, activeTripId]);

  // Quản lý các event socket realtime
  useEffect(() => {
    if (!socket) return;

    const onTripUpdated = (payload: TripUpdatedPayload) => {
      if (activeTripId && payload.tripId !== activeTripId) return;

      const patcher = (old: PassengerTrip | undefined) => {
        if (!old || old.id !== payload.tripId) return old;
        const incoming: PassengerTrip = {
          ...old,
          status: payload.status,
          driverId: payload.driverId ?? old.driverId,
        };
        return mergePassengerTrip(old, incoming) as PassengerTrip;
      };

      // Cập nhật nhất quán cả hai query key
      client.setQueryData(passengerTripKeys.detail(payload.tripId), patcher);
      client.setQueryData(
        passengerTripKeys.active,
        (old: PassengerTrip | null | undefined) => (old ? patcher(old) ?? null : old),
      );

      if (isTerminalTripStatus(payload.status)) {
        setDriverLocation(null);
      }

      void refetch();
    };

    const onLocationUpdated = (payload: TripLocationUpdatedPayload) => {
      if (!activeTripId || payload.tripId === activeTripId) {
        setDriverLocation({ lat: payload.latitude, lng: payload.longitude });
      }
    };

    const onReconnect = () => {
      if (activeTripId) {
        socket.emit(SocketEvents.TRIP_JOIN_ROOM, activeTripId);
      }
      void refetch();
    };

    socket.on(SocketEvents.TRIP_UPDATED, onTripUpdated);
    socket.on(SocketEvents.TRIP_LOCATION_UPDATED, onLocationUpdated);
    socket.on('connect', onReconnect);
    socket.io?.on?.('reconnect', onReconnect);

    return () => {
      socket.off(SocketEvents.TRIP_UPDATED, onTripUpdated);
      socket.off(SocketEvents.TRIP_LOCATION_UPDATED, onLocationUpdated);
      socket.off('connect', onReconnect);
      socket.io?.off?.('reconnect', onReconnect);
    };
  }, [socket, activeTripId, client, refetch]);

  // Tự dọn dẹp vị trí tài xế khi trip chuyển sang terminal
  useEffect(() => {
    if (query.data && isTerminalTripStatus(query.data.status)) {
      setDriverLocation(null);
    }
  }, [query.data]);

  return { ...query, driverLocation };
}

