import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SocketEvents, type TripUpdatedPayload } from '@repo/shared';

import { useSocketConnection, getRealtimeRefetchInterval } from '../../hooks/useSocketConnection';
import { socketService } from '../../services/socket.service';
import { tripService, type RideHailingTrip } from '../../services/trip.service';

export type RideHailingRole = 'passenger' | 'driver';

export const rideHailingKeys = {
  active: (role: RideHailingRole) => ['ride-hailing', 'active', role] as const,
  detail: (tripId: string) => ['ride-hailing', 'detail', tripId] as const,
};

const TERMINAL_STATUSES = new Set(['COMPLETED', 'CANCELLED', 'NO_DRIVER']);

export function useRideHailingTrip(role: RideHailingRole) {
  const queryClient = useQueryClient();
  const connected = useSocketConnection();
  const key = useMemo(() => rideHailingKeys.active(role), [role]);
  const [terminalTrip, setTerminalTrip] = useState<RideHailingTrip | null>(null);
  const mounted = useRef(true);

  const query = useQuery({
    queryKey: key,
    queryFn: async () => (
      role === 'driver'
        ? (await tripService.getActiveDriverTrip()).data
        : (await tripService.getActiveTrip()).data
    ),
    refetchInterval: getRealtimeRefetchInterval(connected),
    staleTime: 3_000,
  });
  const refetch = query.refetch;

  const syncLatest = useCallback(async () => {
    await refetch();
  }, [refetch]);

  useEffect(() => {
    mounted.current = true;
    void socketService.connect();

    const handleTripUpdated = (payload: TripUpdatedPayload) => {
      const current = queryClient.getQueryData<RideHailingTrip | null>(key);
      if (current && current.id !== payload.tripId) return;

      if (TERMINAL_STATUSES.has(payload.status)) {
        if (current) {
          setTerminalTrip({ ...current, status: payload.status as RideHailingTrip['status'] });
        }
        void tripService.getTripById(payload.tripId)
          .then((trip) => mounted.current && setTerminalTrip(trip))
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

  useEffect(() => {
    if (connected) void syncLatest();
  }, [connected, syncLatest]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void socketService.connect();
        void syncLatest();
      }
    });
    return () => subscription.remove();
  }, [syncLatest]);

  useFocusEffect(useCallback(() => {
    void syncLatest();
  }, [syncLatest]));

  useEffect(() => {
    if (query.data && terminalTrip && query.data.id !== terminalTrip.id) {
      setTerminalTrip(null);
    }
  }, [query.data, terminalTrip]);

  return {
    ...query,
    trip: query.data ?? terminalTrip,
    connected,
    rememberTerminalTrip: setTerminalTrip,
    clearTerminalTrip: () => setTerminalTrip(null),
    syncLatest,
  };
}
