import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SocketEvents, type TripUpdatedPayload } from '@repo/shared';

import { useSocketConnection, getRealtimeRefetchInterval } from '../../hooks/useSocketConnection';
import { socketService } from '../../services/socket.service';
import { tripService, type RideHailingTrip } from '../../services/trip.service';
import { isTerminalTripStatus, mergeRideHailingTrip } from './domain';

export type RideHailingRole = 'passenger' | 'driver';

export const rideHailingKeys = {
  active: (role: RideHailingRole) => ['ride-hailing', 'active', role] as const,
  detail: (tripId: string) => ['ride-hailing', 'detail', tripId] as const,
};

export function useRideHailingTrip(role: RideHailingRole) {
  const queryClient = useQueryClient();
  const connected = useSocketConnection();
  const key = useMemo(() => rideHailingKeys.active(role), [role]);
  const [terminalTrip, setTerminalTrip] = useState<RideHailingTrip | null>(null);
  const mounted = useRef(true);

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const fresh = role === 'driver'
        ? (await tripService.getActiveDriverTrip()).data
        : (await tripService.getActiveTrip()).data;
      if (!fresh) return null;

      // Prime cache chi tiết tripId
      queryClient.setQueryData(
        rideHailingKeys.detail(fresh.id),
        (old: RideHailingTrip | undefined) => mergeRideHailingTrip(old, fresh),
      );

      // Chống rollback trạng thái nếu response API cũ hơn socket event
      const current = queryClient.getQueryData<RideHailingTrip | null>(key);
      return mergeRideHailingTrip(current, fresh);
    },
    refetchInterval: getRealtimeRefetchInterval(connected),
    staleTime: 3_000,
  });
  const refetch = query.refetch;

  const activeTrip = query.data ?? terminalTrip;
  const activeTripId = activeTrip?.id;
  const isTerminal = activeTrip ? isTerminalTripStatus(activeTrip.status) : false;

  const syncLatest = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Quản lý Socket Room cho chuyến đi đang diễn ra
  useEffect(() => {
    if (!activeTripId || isTerminal) return;

    socketService.emit(SocketEvents.TRIP_JOIN_ROOM, activeTripId);

    return () => {
      socketService.emit(SocketEvents.TRIP_LEAVE_ROOM, activeTripId);
    };
  }, [activeTripId, isTerminal]);

  // Lắng nghe sự kiện socket TRIP_UPDATED
  useEffect(() => {
    mounted.current = true;
    void socketService.connect();

    const handleTripUpdated = (payload: TripUpdatedPayload) => {
      const current = queryClient.getQueryData<RideHailingTrip | null>(key);
      if (current && current.id !== payload.tripId) return;

      const patcher = (old: RideHailingTrip | null | undefined): RideHailingTrip | null => {
        if (!old || old.id !== payload.tripId) return old ?? null;
        const incoming: RideHailingTrip = {
          ...old,
          status: payload.status,
          driverId: payload.driverId ?? old.driverId,
        };
        return mergeRideHailingTrip(old, incoming);
      };

      // Cập nhật ngay lập tức vào React Query cache
      queryClient.setQueryData(key, patcher);
      queryClient.setQueryData(
        rideHailingKeys.detail(payload.tripId),
        (old: RideHailingTrip | undefined) => (old ? patcher(old) ?? old : old),
      );

      if (isTerminalTripStatus(payload.status)) {
        if (current) {
          setTerminalTrip(mergeRideHailingTrip(current, { ...current, status: payload.status }));
        }
        void tripService.getTripById(payload.tripId)
          .then((trip) => mounted.current && setTerminalTrip((prev) => mergeRideHailingTrip(prev, trip)))
          .catch(() => undefined);
      }
      void queryClient.invalidateQueries({ queryKey: key, refetchType: 'active' });
    };

    socketService.on(SocketEvents.TRIP_UPDATED, handleTripUpdated);
    return () => {
      mounted.current = false;
      socketService.off(SocketEvents.TRIP_UPDATED, handleTripUpdated);
    };
  }, [key, queryClient]);

  // Khi socket kết nối lại: tự động re-join room và sync dữ liệu mới nhất
  useEffect(() => {
    if (connected) {
      if (activeTripId && !isTerminal) {
        socketService.emit(SocketEvents.TRIP_JOIN_ROOM, activeTripId);
      }
      void syncLatest();
    }
  }, [connected, activeTripId, isTerminal, syncLatest]);

  // Khi app từ background quay lại foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void socketService.connect();
        if (activeTripId && !isTerminal) {
          socketService.emit(SocketEvents.TRIP_JOIN_ROOM, activeTripId);
        }
        void syncLatest();
      }
    });
    return () => subscription.remove();
  }, [activeTripId, isTerminal, syncLatest]);

  useFocusEffect(useCallback(() => {
    void syncLatest();
  }, [syncLatest]));

  const effectiveTerminalTrip = (query.data && terminalTrip && query.data.id !== terminalTrip.id)
    ? null
    : terminalTrip;

  return {
    ...query,
    trip: query.data ?? effectiveTerminalTrip,
    connected,
    rememberTerminalTrip: setTerminalTrip,
    clearTerminalTrip: () => setTerminalTrip(null),
    syncLatest,
  };
}
