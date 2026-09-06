import type { TripStatus } from '@repo/shared';
import type { RideHailingTrip } from '../../services/trip.service';

export const TRIP_STATUSES: TripStatus[] = [
  'PENDING',
  'MATCHING',
  'ACCEPTED',
  'ARRIVING',
  'ARRIVED',
  'IN_PROGRESS',
  'WAITING_PAYMENT',
  'COMPLETED',
  'NO_DRIVER',
  'CANCELLED',
];

export const TERMINAL_STATUSES: readonly TripStatus[] = ['COMPLETED', 'CANCELLED', 'NO_DRIVER'] as const;

export const isTerminalTripStatus = (status: TripStatus): boolean =>
  status === 'COMPLETED' || status === 'NO_DRIVER' || status === 'CANCELLED';

export const canCancelTrip = (status: TripStatus): boolean =>
  ['PENDING', 'MATCHING', 'ACCEPTED', 'ARRIVING', 'ARRIVED'].includes(status);

export const TRIP_STATUS_ORDER: Record<TripStatus, number> = {
  PENDING: 10,
  MATCHING: 20,
  ACCEPTED: 30,
  ARRIVING: 40,
  ARRIVED: 50,
  IN_PROGRESS: 60,
  WAITING_PAYMENT: 70,
  COMPLETED: 80,
  NO_DRIVER: 90,
  CANCELLED: 100,
};

export const isMonotonicStatusTransition = (
  currentStatus: TripStatus,
  incomingStatus: TripStatus,
): boolean => {
  if (isTerminalTripStatus(currentStatus)) {
    return false;
  }
  return TRIP_STATUS_ORDER[incomingStatus] >= TRIP_STATUS_ORDER[currentStatus];
};

export const mergeRideHailingTrip = (
  current: RideHailingTrip | null | undefined,
  incoming: RideHailingTrip,
): RideHailingTrip => {
  if (!current || current.id !== incoming.id) {
    return incoming;
  }

  if (!isMonotonicStatusTransition(current.status, incoming.status)) {
    return {
      ...incoming,
      status: current.status,
      driverId: incoming.driverId ?? current.driverId,
      driver: incoming.driver ?? current.driver,
    };
  }

  return {
    ...current,
    ...incoming,
    driver: incoming.driver ?? current.driver,
    driverId: incoming.driverId ?? current.driverId,
  };
};
