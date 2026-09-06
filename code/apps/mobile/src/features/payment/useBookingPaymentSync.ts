import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { SocketEvents } from '@repo/shared';
import { socketService } from '../../services/socket.service';

/** One owner on the booking route, shared by passenger and driver. No payment polling. */
export function useBookingPaymentSync(bookingId?: string) {
  const client = useQueryClient();
  useEffect(() => {
    if (!bookingId) return;
    const refresh = () => {
      void client.invalidateQueries({ queryKey: ['booking', bookingId], exact: true });
    };
    const onPayment = (payload?: { bookingId?: string }) => {
      if (payload?.bookingId !== bookingId) return;
      refresh();
      for (const key of ['activities', 'my-bookings', 'active-booking', 'driver-bookings', 'wallet']) {
        void client.invalidateQueries({ queryKey: [key] });
      }
    };
    socketService.on(SocketEvents.PAYMENT_STATUS_CHANGED, onPayment);
    const unsubscribe = socketService.subscribeConnection(() => {
      if (socketService.connected) refresh();
    });
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => {
      socketService.off(SocketEvents.PAYMENT_STATUS_CHANGED, onPayment);
      unsubscribe();
      appState.remove();
    };
  }, [bookingId, client]);
}
