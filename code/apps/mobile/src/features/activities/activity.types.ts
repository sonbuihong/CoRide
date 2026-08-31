export const ACTIVITY_SEGMENTS = ['ACTIVE', 'UPCOMING', 'COMPLETED', 'CANCELLED'] as const;

export type ActivityRole = 'PASSENGER' | 'DRIVER';
export type ActivitySegment = (typeof ACTIVITY_SEGMENTS)[number];
export type ActivitySource = 'CARPOOL_BOOKING' | 'CARPOOL_RIDE' | 'RIDE_HAILING';

export interface ActivityPerson {
  id: string;
  name: string;
  avatarUrl: string | null;
  phone: string | null;
  rating: number | null;
}

export interface ActivityVehicle {
  id: string;
  type: string;
  licensePlate: string;
  color: string | null;
  imageUrl: string | null;
}

export interface ActivityItem {
  id: string;
  source: ActivitySource;
  role: ActivityRole;
  status: string;
  segment: ActivitySegment;
  origin: string;
  destination: string;
  departureTime: string | null;
  sortAt: string;
  price: number | null;
  seats: number | null;
  availableSeats: number | null;
  distanceKm: number | null;
  durationMinutes: number | null;
  relatedUser: ActivityPerson | null;
  nextPassenger: ActivityPerson | null;
  vehicle: ActivityVehicle | null;
  cancellationReason: string | null;
  rideId: string | null;
  bookingId: string | null;
  tripId: string | null;
  chatRideId: string | null;
}

export type ActivityCounts = Record<ActivitySegment, number>;

export interface ActivitiesPage {
  items: ActivityItem[];
  counts: ActivityCounts;
  nextCursor: string | null;
}

export interface ActivityAction {
  label: string;
  route: string;
  kind: 'primary' | 'secondary';
  params?: Record<string, string>;
}
