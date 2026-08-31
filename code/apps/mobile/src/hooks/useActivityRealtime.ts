import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SocketEvents } from '@repo/shared';

import { socketService } from '../services/socket.service';
import { useSocketConnection } from './useSocketConnection';

const ACTIVITY_EVENTS = [
  'booking:new_request', 'booking:confirmed', 'booking:rejected',
  'booking:driver_arrived', 'booking:picked_up', 'booking:completed', 'booking:cancelled',
  'ride:status', 'ride:updated', 'ride:deleted', 'ride:seats_updated',
  SocketEvents.TRIP_UPDATED,
  'payment:status_changed',
];

export function useActivityRealtime(): boolean {
  const queryClient = useQueryClient();
  const isConnected = useSocketConnection();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    const invalidate = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (!mounted) return;
        ['activities', 'my-bookings', 'active-booking', 'active-trip', 'trip-history'].forEach((key) => {
          void queryClient.invalidateQueries({ queryKey: [key] });
        });
      }, 350);
    };

    void socketService.connect();
    ACTIVITY_EVENTS.forEach((event) => socketService.on(event, invalidate));
    return () => {
      mounted = false;
      if (timer.current) clearTimeout(timer.current);
      ACTIVITY_EVENTS.forEach((event) => socketService.off(event, invalidate));
    };
  }, [queryClient]);

  return isConnected;
}
