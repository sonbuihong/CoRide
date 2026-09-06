import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../../services/booking.service';
import { paymentService } from '../../services/payment.service';
import type { CompletedBookingData } from '../booking/completed-booking';
import { BookingPaymentMachine } from './booking-payment-machine';

export function useBookingPayment(booking: CompletedBookingData) {
  const client = useQueryClient();
  const id = booking.id;
  const machine = useMemo(() => new BookingPaymentMachine({
    readBooking: async () => {
      // Cancel an older detail refetch so it cannot overwrite this authoritative read.
      await client.cancelQueries({ queryKey: ['booking', id], exact: true });
      const fresh: CompletedBookingData = await bookingService.getBookingById(id);
      client.setQueryData(['booking', id], fresh);
      return fresh;
    },
    getQr: async () => (await paymentService.getSimulatorQr(id)).data,
    confirm: () => paymentService.confirmSimulatorPayment(id),
    onPaid: () => {
      for (const key of ['activities', 'my-bookings', 'active-booking', 'driver-bookings', 'wallet']) {
        void client.invalidateQueries({ queryKey: [key] });
      }
    },
  }), [client, id]);
  const state = useSyncExternalStore(machine.subscribe, machine.snapshot, machine.snapshot);
  useEffect(() => { machine.sync(booking); }, [machine, booking]);
  useEffect(() => {
    if (state.phase !== 'SUCCESS') return;
    const timer = setTimeout(machine.close, 1100);
    return () => clearTimeout(timer);
  }, [machine, state.phase]);
  return { state, open: machine.open, close: machine.close, confirm: machine.confirm, retry: machine.retry };
}
