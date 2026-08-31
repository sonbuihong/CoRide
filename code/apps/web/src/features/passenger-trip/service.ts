import apiClient from '@/lib/api-client';
import type { BookingDraft, PassengerTrip, TripEstimate } from './domain';

const unwrap = <T>(response: { data: { data?: T } | T }): T => {
  const body = response.data as { data?: T };
  return (body && typeof body === 'object' && 'data' in body ? body.data : response.data) as T;
};

export const passengerTripKeys = { all: ['passenger-trip'] as const, active: ['passenger-trip', 'active'] as const, detail: (id: string) => ['passenger-trip', id] as const };

export const passengerTripService = {
  active: async () => unwrap<PassengerTrip | null>(await apiClient.get('/trips/active')),
  byId: async (id: string) => unwrap<PassengerTrip>(await apiClient.get(`/trips/${id}`)),
  estimateAll: async (draft: BookingDraft) => unwrap<TripEstimate[]>(await apiClient.get('/pricing/estimate-all', { params: {
    originLat: draft.pickup?.lat, originLng: draft.pickup?.lng,
    destLat: draft.destination?.lat, destLng: draft.destination?.lng,
  } })),
  create: async (draft: BookingDraft) => unwrap<PassengerTrip>(await apiClient.post('/trips', {
    originAddress: draft.pickup?.address, originLat: draft.pickup?.lat, originLng: draft.pickup?.lng,
    destAddress: draft.destination?.address, destLat: draft.destination?.lat, destLng: draft.destination?.lng,
    vehicleType: draft.vehicleType,
  })),
  cancel: async (id: string, reason?: string) => unwrap<PassengerTrip>(await apiClient.patch(`/trips/${id}/cancel`, { cancelReason: reason })),
  paymentQr: async (id: string) => unwrap<{ qrUrl: string; amount: number; description: string }>(await apiClient.get(`/payments/simulator/qr/${id}`)),
  confirmPayment: async (id: string) => unwrap<{ transactionId: string }>(await apiClient.post('/payments/simulator/confirm', { id })),
};
