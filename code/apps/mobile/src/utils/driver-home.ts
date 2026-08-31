import type { ActiveDriverBooking, DriverBookingSummary } from '../services/booking.service';
import type { Ride } from '../services/ride.service';
import type { ActiveDriverTrip, ActiveDriverTripResponse } from '../services/trip.service';

export type DriverHomeActiveSource = 'trip' | 'ride';

export interface DriverHomeActiveItem {
  id: string;
  source: DriverHomeActiveSource;
  status: string;
  statusLabel: string;
  ctaLabel: string;
  origin: string;
  destination: string;
  passengerLabel?: string;
  departureTime?: string;
  updatedAt?: string;
  route: '/driver/active-trip' | '/ride/active-ride';
  rideId?: string;
  priority: number;
}

const tripPriority: Record<string, number> = {
  ACCEPTED: 2,
  ARRIVING: 3,
  ARRIVED: 4,
  IN_PROGRESS: 5,
  WAITING_PAYMENT: 6,
};

const ridePriority: Record<string, number> = {
  SCHEDULED: 1,
  FULL: 1,
  ONGOING: 5,
};

const joinName = (person?: { firstName?: string | null; lastName?: string | null }) =>
  [person?.firstName, person?.lastName].filter(Boolean).join(' ').trim();

function normalizeTrip(trip: ActiveDriverTrip | null | undefined): DriverHomeActiveItem | null {
  if (!trip || !tripPriority[trip.status]) return null;

  const labels: Record<string, { status: string; cta: string }> = {
    ACCEPTED: { status: 'Đã nhận chuyến', cta: 'Đi đến điểm đón' },
    ARRIVING: { status: 'Đang đến điểm đón', cta: 'Đã đến điểm đón' },
    ARRIVED: { status: 'Đang chờ hành khách', cta: 'Bắt đầu chuyến' },
    IN_PROGRESS: { status: 'Đang thực hiện', cta: 'Hoàn thành chuyến' },
    WAITING_PAYMENT: { status: 'Chờ thanh toán', cta: 'Xem thanh toán' },
  };
  const copy = labels[trip.status];

  return {
    id: trip.id,
    source: 'trip',
    status: trip.status,
    statusLabel: copy.status,
    ctaLabel: copy.cta,
    origin: trip.originAddress,
    destination: trip.destAddress,
    passengerLabel: joinName(trip.passenger) || undefined,
    updatedAt: trip.updatedAt ?? trip.createdAt,
    route: '/driver/active-trip',
    priority: tripPriority[trip.status],
  };
}

function normalizeRide(active: ActiveDriverBooking | null | undefined): DriverHomeActiveItem | null {
  const ride = active?.ride;
  if (!ride || active?.userRole !== 'DRIVER' || !ridePriority[ride.status]) return null;

  const passengers = (ride.bookings ?? []).filter((booking) =>
    booking.status === 'CONFIRMED' || booking.status === 'PENDING',
  );
  const pendingPickup = passengers.find((booking) => !booking.isPickedUp);
  const isOngoing = ride.status === 'ONGOING';
  const passengerLabel = passengers.length > 1
    ? `${passengers.length} hành khách`
    : joinName(passengers[0]?.passenger) || undefined;

  return {
    id: ride.id,
    rideId: ride.id,
    source: 'ride',
    status: ride.status,
    statusLabel: isOngoing ? 'Chuyến đang diễn ra' : 'Sắp khởi hành',
    ctaLabel: !isOngoing
      ? 'Bắt đầu chuyến'
      : pendingPickup
        ? 'Đã đến điểm đón'
        : 'Hoàn thành chuyến',
    origin: ride.origin,
    destination: ride.destination,
    passengerLabel,
    departureTime: ride.departureTime,
    updatedAt: ride.updatedAt ?? ride.departureTime,
    route: '/ride/active-ride',
    priority: ridePriority[ride.status],
  };
}

const timeValue = (value?: string) => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

export function selectDriverHomeActiveItem(
  tripResponse: ActiveDriverTripResponse | undefined,
  activeBooking: ActiveDriverBooking | null | undefined,
): DriverHomeActiveItem | null {
  const candidates = [normalizeTrip(tripResponse?.data), normalizeRide(activeBooking)]
    .filter((item): item is DriverHomeActiveItem => item !== null);

  return candidates.sort((left, right) =>
    right.priority - left.priority || timeValue(right.updatedAt) - timeValue(left.updatedAt),
  )[0] ?? null;
}

export function selectNextScheduledRide(rides: Ride[], excludedRideId?: string): Ride | null {
  const now = Date.now();
  return rides
    .filter((ride) =>
      ride.id !== excludedRideId &&
      ride.status === 'SCHEDULED' &&
      timeValue(ride.departureTime) >= now,
    )
    .sort((left, right) => timeValue(left.departureTime) - timeValue(right.departureTime))[0] ?? null;
}

export function selectMatchingRequests(bookings: DriverBookingSummary[], limit = 3) {
  return bookings
    .filter((booking) => booking.status === 'PENDING')
    .sort((left, right) =>
      (right.matching?.matchScore ?? 0) - (left.matching?.matchScore ?? 0) ||
      timeValue(right.createdAt) - timeValue(left.createdAt),
    )
    .slice(0, limit);
}
