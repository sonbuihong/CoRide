import type { DriverBookingSummary } from '../../services/booking.service';

export type DriverTripPhase =
  | 'READY_TO_START'
  | 'ARRIVING_PICKUP'
  | 'WAITING_PASSENGER'
  | 'EN_ROUTE_DROPOFF'
  | 'READY_TO_COMPLETE'
  | 'COMPLETED';

export type TripStopKind = 'ORIGIN' | 'PICKUP' | 'DROPOFF' | 'DESTINATION';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface TripStopViewModel {
  id: string;
  kind: TripStopKind;
  title: string;
  address: string;
  coordinate?: Coordinates;
  booking?: DriverBookingSummary;
  state: 'DONE' | 'CURRENT' | 'UPCOMING';
}

export interface ActiveRideViewModel {
  id: string;
  status: string;
  origin: string;
  destination: string;
  originLat?: number | null;
  originLng?: number | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  distance?: number;
  duration?: number;
  allowRoutePickup?: boolean;
  routePickupSharingEnabled?: boolean;
  pricePerSeat?: number;
  bookings?: DriverBookingSummary[];
}

type OrderedPassengerStop = {
  booking: DriverBookingSummary;
  kind: 'PICKUP' | 'DROPOFF';
  order: number;
};

const optimizedOrder = (booking: DriverBookingSummary) => {
  if (!booking.priceBreakdown || typeof booking.priceBreakdown !== 'object' || Array.isArray(booking.priceBreakdown)) {
    return null;
  }
  const candidate = (booking.priceBreakdown as Record<string, unknown>).optimizedWaypointOrder;
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;
  const value = candidate as Record<string, unknown>;
  return {
    pickup: typeof value.pickup === 'number' ? value.pickup : undefined,
    dropoff: typeof value.dropoff === 'number' ? value.dropoff : undefined,
  };
};

const sortPassengers = (passengers: DriverBookingSummary[]) => [...passengers].sort((left, right) => {
  const created = String(left.createdAt ?? '').localeCompare(String(right.createdAt ?? ''));
  return created || left.id.localeCompare(right.id);
});

function getOrderedPassengerStops(ride: ActiveRideViewModel): OrderedPassengerStop[] {
  const passengers = sortPassengers(getConfirmedPassengers(ride));
  const fallbackDropoffOffset = passengers.length;
  const optimizedOrders = passengers.map(optimizedOrder);
  const hasCompleteOptimization = optimizedOrders.every((order) =>
    order?.pickup != null && order.dropoff != null,
  );
  return passengers
    .flatMap((booking, index) => {
      const optimized = hasCompleteOptimization ? optimizedOrders[index] : null;
      const pickupOrder = optimized?.pickup ?? index;
      const dropoffOrder = Math.max(optimized?.dropoff ?? fallbackDropoffOffset + index, pickupOrder + 0.5);
      return [
        { booking, kind: 'PICKUP' as const, order: pickupOrder },
        { booking, kind: 'DROPOFF' as const, order: dropoffOrder },
      ];
    })
    .sort((left, right) => left.order - right.order || left.booking.id.localeCompare(right.booking.id));
}

const fullName = (booking?: DriverBookingSummary) => {
  const name = [booking?.passenger?.firstName, booking?.passenger?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return name || 'Hành khách';
};

export const getConfirmedPassengers = (ride?: ActiveRideViewModel | null) =>
  (ride?.bookings ?? []).filter((booking) =>
    ['CONFIRMED', 'COMPLETED'].includes(booking.status),
  );

export function getDriverTripPhase(ride?: ActiveRideViewModel | null): DriverTripPhase {
  if (!ride || ride.status === 'COMPLETED') return 'COMPLETED';
  if (ride.status === 'SCHEDULED' || ride.status === 'FULL') return 'READY_TO_START';

  const next = getOrderedPassengerStops(ride).find(({ booking, kind }) =>
    kind === 'PICKUP' ? !booking.isPickedUp : booking.isPickedUp && !booking.isDroppedOff,
  );
  if (next?.kind === 'PICKUP') return next.booking.driverArrivedAt ? 'WAITING_PASSENGER' : 'ARRIVING_PICKUP';
  if (next?.kind === 'DROPOFF') return 'EN_ROUTE_DROPOFF';

  return 'READY_TO_COMPLETE';
}

export function getCurrentBooking(ride?: ActiveRideViewModel | null) {
  if (!ride) return null;
  return getOrderedPassengerStops(ride).find(({ booking, kind }) =>
    kind === 'PICKUP' ? !booking.isPickedUp : booking.isPickedUp && !booking.isDroppedOff,
  )?.booking ?? null;
}

export function getTripStops(ride: ActiveRideViewModel): TripStopViewModel[] {
  const phase = getDriverTripPhase(ride);
  const passengerStops = getOrderedPassengerStops(ride);
  const stops: TripStopViewModel[] = [];

  stops.push({
    id: 'origin',
    kind: 'ORIGIN',
    title: 'Xuất phát',
    address: ride.origin,
    coordinate:
      ride.originLat != null && ride.originLng != null
        ? { latitude: ride.originLat, longitude: ride.originLng }
        : undefined,
    state: phase === 'READY_TO_START' ? 'CURRENT' : 'DONE',
  });

  const currentBooking = getCurrentBooking(ride);
  passengerStops.forEach(({ booking, kind }) => {
    const pickup = kind === 'PICKUP';
    const isDone = pickup ? booking.isPickedUp : booking.isDroppedOff;
    const isCurrent = currentBooking?.id === booking.id && (
      (pickup && (phase === 'ARRIVING_PICKUP' || phase === 'WAITING_PASSENGER')) ||
      (!pickup && phase === 'EN_ROUTE_DROPOFF')
    );
    stops.push({
      id: `${pickup ? 'pickup' : 'dropoff'}-${booking.id}`,
      kind,
      title: `${pickup ? 'Đón' : 'Trả'} ${fullName(booking)}`,
      address: pickup ? booking.pickupAddress || ride.origin : booking.dropoffAddress || ride.destination,
      coordinate: pickup
        ? booking.passengerLat != null && booking.passengerLng != null
          ? { latitude: booking.passengerLat, longitude: booking.passengerLng }
          : undefined
        : booking.dropoffLat != null && booking.dropoffLng != null
          ? { latitude: booking.dropoffLat, longitude: booking.dropoffLng }
          : undefined,
      booking,
      state: isDone ? 'DONE' : isCurrent ? 'CURRENT' : 'UPCOMING',
    });
  });

  stops.push({
    id: 'destination',
    kind: 'DESTINATION',
    title: 'Điểm đến cuối',
    address: ride.destination,
    coordinate:
      ride.destinationLat != null && ride.destinationLng != null
        ? { latitude: ride.destinationLat, longitude: ride.destinationLng }
        : undefined,
    state: phase === 'READY_TO_COMPLETE' ? 'CURRENT' : 'UPCOMING',
  });

  return stops;
}

export const getNextStop = (ride: ActiveRideViewModel) =>
  getTripStops(ride).find((stop) => stop.state === 'CURRENT') ??
  getTripStops(ride).find((stop) => stop.state === 'UPCOMING') ??
  null;

export const getPassengerStatusLabel = (booking: DriverBookingSummary) => {
  if (booking.isDroppedOff || booking.status === 'COMPLETED') return 'Đã trả khách';
  if (booking.isPickedUp) return 'Đã lên xe';
  if (booking.driverArrivedAt) return 'Tài xế đang chờ';
  if (booking.status === 'CONFIRMED') return 'Chưa đón';
  if (booking.status === 'CANCELLED') return 'Đã hủy';
  return 'Chờ xác nhận';
};

export const formatTripDistance = (meters?: number) => {
  if (!meters || meters <= 0) return '—';
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
};

export const formatRideDistance = (kilometers?: number) => {
  if (!kilometers || kilometers <= 0) return '—';
  return `${kilometers >= 10 ? Math.round(kilometers) : kilometers.toFixed(1)} km`;
};

export const formatTripDuration = (seconds?: number) => {
  if (!seconds || seconds <= 0) return '—';
  return `${Math.max(1, Math.round(seconds / 60))} phút`;
};

export const formatRideDuration = (minutes?: number) => {
  if (!minutes || minutes <= 0) return '—';
  return `${Math.max(1, Math.round(minutes))} phút`;
};

export const formatCurrency = (value?: number) =>
  `${Math.max(0, value ?? 0).toLocaleString('vi-VN')}đ`;
