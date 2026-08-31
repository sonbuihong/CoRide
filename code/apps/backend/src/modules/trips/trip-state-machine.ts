import type { TripStatus } from '@repo/shared';

export type TripTransitionActor = 'PASSENGER' | 'DRIVER' | 'MATCHING' | 'PAYMENT';

export const ACTIVE_PASSENGER_TRIP_STATUSES: TripStatus[] = [
  'PENDING',
  'MATCHING',
  'ACCEPTED',
  'ARRIVING',
  'ARRIVED',
  'IN_PROGRESS',
  'WAITING_PAYMENT',
];

export const ACTIVE_DRIVER_TRIP_STATUSES: TripStatus[] = [
  'ACCEPTED',
  'ARRIVING',
  'ARRIVED',
  'IN_PROGRESS',
  'WAITING_PAYMENT',
];

const TRANSITIONS: Record<TripStatus, Partial<Record<TripStatus, readonly TripTransitionActor[]>>> = {
  PENDING: { MATCHING: ['MATCHING'], CANCELLED: ['PASSENGER'] },
  MATCHING: {
    ACCEPTED: ['MATCHING'],
    CANCELLED: ['PASSENGER'],
    NO_DRIVER: ['MATCHING'],
  },
  ACCEPTED: { ARRIVING: ['DRIVER'], CANCELLED: ['PASSENGER', 'DRIVER'] },
  ARRIVING: { ARRIVED: ['DRIVER'], CANCELLED: ['PASSENGER', 'DRIVER'] },
  ARRIVED: { IN_PROGRESS: ['DRIVER'], CANCELLED: ['PASSENGER', 'DRIVER'] },
  IN_PROGRESS: { WAITING_PAYMENT: ['DRIVER'] },
  WAITING_PAYMENT: { COMPLETED: ['PAYMENT'] },
  COMPLETED: {},
  CANCELLED: {},
  NO_DRIVER: {},
};

export function isTripTransitionAllowed(
  from: TripStatus,
  to: TripStatus,
  actor: TripTransitionActor,
): boolean {
  return TRANSITIONS[from]?.[to]?.includes(actor) ?? false;
}

export function getAllowedTripTransitions(
  from: TripStatus,
  actor: TripTransitionActor,
): TripStatus[] {
  return Object.entries(TRANSITIONS[from])
    .filter(([, actors]) => actors?.includes(actor))
    .map(([status]) => status as TripStatus);
}
