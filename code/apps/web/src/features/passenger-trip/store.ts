'use client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { BookingDraft } from './domain';

const initialDraft: BookingDraft = { pickup: null, destination: null, vehicleType: 'BIKE', step: 'places' };
type DraftStore = BookingDraft & { patch: (value: Partial<BookingDraft>) => void; reset: () => void };
export const useBookingDraft = create<DraftStore>()(persist(
  (set) => ({ ...initialDraft, patch: (value) => set(value), reset: () => set(initialDraft) }),
  { name: 'coride-passenger-booking', storage: createJSONStorage(() => sessionStorage), partialize: ({ pickup, destination, vehicleType, step }) => ({ pickup, destination, vehicleType, step }) },
));
