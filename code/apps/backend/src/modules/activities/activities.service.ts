import { extendedPrisma as prisma } from '@repo/database';
import { AppError } from '../../shared/errors/AppError';

export const ACTIVITY_ROLES = ['PASSENGER', 'DRIVER'] as const;
export const ACTIVITY_SEGMENTS = ['ACTIVE', 'UPCOMING', 'COMPLETED', 'CANCELLED'] as const;
export const ACTIVITY_SOURCES = ['CARPOOL_BOOKING', 'CARPOOL_RIDE', 'RIDE_HAILING'] as const;

export type ActivityRole = (typeof ACTIVITY_ROLES)[number];
export type ActivitySegment = (typeof ACTIVITY_SEGMENTS)[number];
export type ActivitySource = (typeof ACTIVITY_SOURCES)[number];

export interface ActivityPerson {
  id: string;
  name: string;
  avatarUrl: string | null;
  phone: string | null;
  rating: number | null;
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
  vehicle: {
    id: string;
    type: string;
    licensePlate: string;
    color: string | null;
    imageUrl: string | null;
  } | null;
  cancellationReason: string | null;
  rideId: string | null;
  bookingId: string | null;
  tripId: string | null;
  chatRideId: string | null;
}

export type ActivityCounts = Record<ActivitySegment, number>;

interface SourceCursor {
  sortAt: string;
  id: string;
}

interface ActivityCursor {
  version: 1;
  role: ActivityRole;
  segment: ActivitySegment;
  sources: Partial<Record<ActivitySource, SourceCursor>>;
}

const ACTIVE_TRIP_STATUSES = ['PENDING', 'MATCHING', 'ACCEPTED', 'ARRIVING', 'ARRIVED', 'IN_PROGRESS', 'WAITING_PAYMENT'];
const CANCELLED_TRIP_STATUSES = ['CANCELLED', 'NO_DRIVER'];
const CANCELLED_BOOKING_STATUSES = ['CANCELLED', 'REJECTED', 'EXPIRED'];
const UPCOMING_RIDE_STATUSES = ['SCHEDULED', 'FULL'];

const emptyCounts = (): ActivityCounts => ({ ACTIVE: 0, UPCOMING: 0, COMPLETED: 0, CANCELLED: 0 });

const toIso = (value: Date | string): string => new Date(value).toISOString();
const safeNumber = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null;

const person = (value: any, role: ActivityRole): ActivityPerson | null => {
  if (!value?.id) return null;
  const name = [value.firstName, value.lastName].filter(Boolean).join(' ').trim();
  const rating = role === 'DRIVER' ? value.driverRating : value.passengerRating;
  return {
    id: value.id,
    name: name || 'Người dùng CoRide',
    avatarUrl: value.avatarUrl ?? null,
    phone: value.phone ?? null,
    rating: safeNumber(rating),
  };
};

const vehicle = (value: any) => value?.id ? {
  id: value.id,
  type: value.type,
  licensePlate: value.licensePlate,
  color: value.color ?? null,
  imageUrl: value.imageUrl ?? null,
} : null;

export function mapBookingSegment(booking: any): ActivitySegment {
  if (booking.status === 'COMPLETED' || booking.isDroppedOff || booking.ride?.status === 'COMPLETED') return 'COMPLETED';
  if (CANCELLED_BOOKING_STATUSES.includes(booking.status) || booking.ride?.status === 'CANCELLED') return 'CANCELLED';
  if (booking.status === 'CONFIRMED' && !booking.isPickedUp && UPCOMING_RIDE_STATUSES.includes(booking.ride?.status)) return 'UPCOMING';
  return 'ACTIVE';
}

export function mapTripSegment(status: string): ActivitySegment {
  if (status === 'COMPLETED') return 'COMPLETED';
  if (CANCELLED_TRIP_STATUSES.includes(status)) return 'CANCELLED';
  return 'ACTIVE';
}

export function mapRideSegment(status: string): ActivitySegment {
  if (status === 'COMPLETED') return 'COMPLETED';
  if (status === 'CANCELLED') return 'CANCELLED';
  if (UPCOMING_RIDE_STATUSES.includes(status)) return 'UPCOMING';
  return 'ACTIVE';
}

function mapBooking(booking: any): ActivityItem {
  const segment = mapBookingSegment(booking);
  const sortAt = segment === 'UPCOMING' ? booking.ride.departureTime : booking.updatedAt;
  return {
    id: booking.id,
    source: 'CARPOOL_BOOKING',
    role: 'PASSENGER',
    status: booking.status,
    segment,
    origin: booking.pickupAddress || booking.ride.origin,
    destination: booking.dropoffAddress || booking.ride.destination,
    departureTime: booking.ride.departureTime ? toIso(booking.ride.departureTime) : null,
    sortAt: toIso(sortAt),
    price: safeNumber(booking.totalPrice),
    seats: safeNumber(booking.seats),
    availableSeats: safeNumber(booking.ride.availableSeats),
    distanceKm: safeNumber(booking.sharedDistanceKm ?? booking.ride.distance),
    durationMinutes: safeNumber(booking.ride.duration),
    relatedUser: person(booking.ride.driver, 'DRIVER'),
    nextPassenger: null,
    vehicle: vehicle(booking.ride.vehicle),
    cancellationReason: booking.cancelReason ?? booking.ride.cancelReason ?? null,
    rideId: booking.rideId,
    bookingId: booking.id,
    tripId: null,
    chatRideId: booking.rideId,
  };
}

function mapTrip(trip: any, role: ActivityRole): ActivityItem {
  const counterpart = role === 'PASSENGER' ? person(trip.driver, 'DRIVER') : person(trip.passenger, 'PASSENGER');
  const driverVehicle = trip.driver?.vehicles?.find((entry: any) => entry.type === trip.vehicleType)
    ?? trip.driver?.vehicles?.[0];
  return {
    id: trip.id,
    source: 'RIDE_HAILING',
    role,
    status: trip.status,
    segment: mapTripSegment(trip.status),
    origin: trip.originAddress,
    destination: trip.destAddress,
    departureTime: trip.createdAt ? toIso(trip.createdAt) : null,
    sortAt: toIso(trip.updatedAt),
    price: safeNumber(trip.finalPrice ?? trip.estimatedPrice),
    seats: 1,
    availableSeats: null,
    distanceKm: safeNumber(trip.estimatedDistance),
    durationMinutes: safeNumber(trip.estimatedDuration),
    relatedUser: counterpart,
    nextPassenger: role === 'DRIVER' ? counterpart : null,
    vehicle: vehicle(driverVehicle),
    cancellationReason: trip.cancelReason ?? null,
    rideId: null,
    bookingId: null,
    tripId: trip.id,
    chatRideId: null,
  };
}

function mapRide(ride: any): ActivityItem {
  const nextBooking = ride.bookings?.find((booking: any) => booking.status === 'CONFIRMED' && !booking.isDroppedOff)
    ?? ride.bookings?.find((booking: any) => booking.status === 'PENDING');
  const bookedSeats = (ride.bookings ?? [])
    .filter((booking: any) => ['PENDING', 'CONFIRMED'].includes(booking.status))
    .reduce((total: number, booking: any) => total + (booking.seats || 0), 0);
  const segment = mapRideSegment(ride.status);
  const sortAt = segment === 'UPCOMING' ? ride.departureTime : ride.updatedAt;
  return {
    id: ride.id,
    source: 'CARPOOL_RIDE',
    role: 'DRIVER',
    status: ride.status,
    segment,
    origin: ride.origin,
    destination: ride.destination,
    departureTime: ride.departureTime ? toIso(ride.departureTime) : null,
    sortAt: toIso(sortAt),
    price: safeNumber(ride.pricePerSeat),
    seats: bookedSeats,
    availableSeats: safeNumber(ride.availableSeats),
    distanceKm: safeNumber(ride.distance),
    durationMinutes: safeNumber(ride.duration),
    relatedUser: nextBooking ? person(nextBooking.passenger, 'PASSENGER') : null,
    nextPassenger: nextBooking ? person(nextBooking.passenger, 'PASSENGER') : null,
    vehicle: vehicle(ride.vehicle),
    cancellationReason: ride.cancelReason ?? null,
    rideId: ride.id,
    bookingId: nextBooking?.id ?? null,
    tripId: null,
    chatRideId: nextBooking ? ride.id : null,
  };
}

function encodeCursor(cursor: ActivityCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodeActivityCursor(value: string | undefined, role: ActivityRole, segment: ActivitySegment): ActivityCursor {
  if (!value) return { version: 1, role, segment, sources: {} };
  try {
    const decoded = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as ActivityCursor;
    if (decoded.version !== 1 || decoded.role !== role || decoded.segment !== segment || !decoded.sources) throw new Error('cursor mismatch');
    for (const entry of Object.values(decoded.sources)) {
      if (!entry || !entry.id || Number.isNaN(new Date(entry.sortAt).getTime())) throw new Error('invalid source cursor');
    }
    return decoded;
  } catch {
    throw new AppError('Cursor hoạt động không hợp lệ', 400);
  }
}

function sourcesForRole(role: ActivityRole): ActivitySource[] {
  return role === 'PASSENGER' ? ['CARPOOL_BOOKING', 'RIDE_HAILING'] : ['CARPOOL_RIDE', 'RIDE_HAILING'];
}

export function getActivityOwnerFilter(userId: string, role: ActivityRole, source: ActivitySource) {
  if (source === 'CARPOOL_BOOKING' && role === 'PASSENGER') return { passengerId: userId };
  if (source === 'CARPOOL_RIDE' && role === 'DRIVER') return { driverId: userId };
  if (source === 'RIDE_HAILING') return role === 'PASSENGER' ? { passengerId: userId } : { driverId: userId };
  throw new AppError('Nguồn hoạt động không phù hợp với vai trò', 400);
}

function tripStatusWhere(segment: ActivitySegment) {
  if (segment === 'ACTIVE') return { in: ACTIVE_TRIP_STATUSES };
  if (segment === 'COMPLETED') return 'COMPLETED';
  if (segment === 'CANCELLED') return { in: CANCELLED_TRIP_STATUSES };
  return { in: [] as string[] };
}

function bookingWhere(userId: string, segment: ActivitySegment): any {
  const owner = getActivityOwnerFilter(userId, 'PASSENGER', 'CARPOOL_BOOKING');
  if (segment === 'ACTIVE') return {
    ...owner,
    OR: [
      { status: 'PENDING', ride: { status: { in: ['SCHEDULED', 'FULL', 'ONGOING'] } } },
      { status: 'CONFIRMED', OR: [{ isPickedUp: true }, { ride: { status: 'ONGOING' } }] },
    ],
  };
  if (segment === 'UPCOMING') return { ...owner, status: 'CONFIRMED', isPickedUp: false, ride: { status: { in: UPCOMING_RIDE_STATUSES } } };
  if (segment === 'COMPLETED') return { ...owner, OR: [{ status: 'COMPLETED' }, { isDroppedOff: true }, { ride: { status: 'COMPLETED' } }] };
  return {
    ...owner,
    status: { not: 'COMPLETED' },
    isDroppedOff: false,
    ride: { status: { not: 'COMPLETED' } },
    OR: [{ status: { in: CANCELLED_BOOKING_STATUSES } }, { ride: { status: 'CANCELLED' } }],
  };
}

function rideWhere(userId: string, segment: ActivitySegment): any {
  const status = segment === 'ACTIVE' ? 'ONGOING'
    : segment === 'UPCOMING' ? { in: UPCOMING_RIDE_STATUSES }
      : segment === 'COMPLETED' ? 'COMPLETED' : 'CANCELLED';
  return { ...getActivityOwnerFilter(userId, 'DRIVER', 'CARPOOL_RIDE'), status };
}

function addKeyset(where: any, cursor: SourceCursor | undefined, segment: ActivitySegment, nestedRideTime = false): any {
  if (!cursor) return where;
  const date = new Date(cursor.sortAt);
  const comparator = segment === 'UPCOMING' ? 'gt' : 'lt';
  const idComparator = segment === 'UPCOMING' ? 'gt' : 'lt';
  const timeClause = nestedRideTime
    ? { ride: { departureTime: { [comparator]: date } } }
    : { [segment === 'UPCOMING' ? 'departureTime' : 'updatedAt']: { [comparator]: date } };
  const tieClause = nestedRideTime
    ? { ride: { departureTime: date }, id: { [idComparator]: cursor.id } }
    : { [segment === 'UPCOMING' ? 'departureTime' : 'updatedAt']: date, id: { [idComparator]: cursor.id } };
  return { AND: [where, { OR: [timeClause, tieClause] }] };
}

const commonUserSelect = {
  id: true, firstName: true, lastName: true, phone: true, avatarUrl: true,
  driverRating: true, passengerRating: true,
};

async function fetchSource(source: ActivitySource, userId: string, role: ActivityRole, segment: ActivitySegment, limit: number, cursor?: SourceCursor): Promise<ActivityItem[]> {
  const order = segment === 'UPCOMING' ? 'asc' : 'desc';
  if (source === 'CARPOOL_BOOKING') {
    return (await prisma.booking.findMany({
      where: addKeyset(bookingWhere(userId, segment), cursor, segment, segment === 'UPCOMING'),
      include: { ride: { include: { driver: { select: commonUserSelect }, vehicle: true } } },
      orderBy: segment === 'UPCOMING' ? [{ ride: { departureTime: order } }, { id: order }] : [{ updatedAt: order }, { id: order }],
      take: limit + 1,
    })).map(mapBooking);
  }
  if (source === 'CARPOOL_RIDE') {
    return (await prisma.ride.findMany({
      where: addKeyset(rideWhere(userId, segment), cursor, segment),
      include: {
        vehicle: true,
        bookings: { select: { id: true, seats: true, status: true, isDroppedOff: true, passenger: { select: commonUserSelect } }, orderBy: { createdAt: 'asc' } },
      },
      orderBy: segment === 'UPCOMING' ? [{ departureTime: order }, { id: order }] : [{ updatedAt: order }, { id: order }],
      take: limit + 1,
    })).map(mapRide);
  }
  if (segment === 'UPCOMING') return [];
  const tripOwner = getActivityOwnerFilter(userId, role, 'RIDE_HAILING');
  return (await prisma.tripRequest.findMany({
    where: addKeyset({ ...tripOwner, status: tripStatusWhere(segment) }, cursor, segment),
    include: {
      passenger: { select: commonUserSelect },
      driver: { select: { ...commonUserSelect, vehicles: { where: { status: 'ACTIVE' }, take: 2 } } },
    },
    orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
  })).map((trip) => mapTrip(trip, role));
}

async function countSource(source: ActivitySource, userId: string, role: ActivityRole, segment: ActivitySegment): Promise<number> {
  if (source === 'CARPOOL_BOOKING') return prisma.booking.count({ where: bookingWhere(userId, segment) });
  if (source === 'CARPOOL_RIDE') return prisma.ride.count({ where: rideWhere(userId, segment) });
  if (segment === 'UPCOMING') return 0;
  const owner = getActivityOwnerFilter(userId, role, 'RIDE_HAILING');
  return prisma.tripRequest.count({ where: { ...owner, status: tripStatusWhere(segment) as any } });
}

export class ActivitiesService {
  static async list(userId: string, role: ActivityRole, segment: ActivitySegment, cursorValue?: string, limit = 20) {
    const cursor = decodeActivityCursor(cursorValue, role, segment);
    const sources = sourcesForRole(role);
    const [sourcePages, countRows] = await Promise.all([
      Promise.all(sources.map((source) => fetchSource(source, userId, role, segment, limit, cursor.sources[source]))),
      Promise.all(ACTIVITY_SEGMENTS.flatMap((countSegment) => sources.map(async (source) => ({
        segment: countSegment,
        count: await countSource(source, userId, role, countSegment),
      })))),
    ]);

    const direction = segment === 'UPCOMING' ? 1 : -1;
    const candidates = sourcePages.flat().sort((left, right) => {
      const time = new Date(left.sortAt).getTime() - new Date(right.sortAt).getTime();
      if (time !== 0) return time * direction;
      const source = left.source.localeCompare(right.source);
      if (source !== 0) return source * direction;
      return left.id.localeCompare(right.id) * direction;
    });
    const items = candidates.slice(0, limit);
    const counts = countRows.reduce((result, row) => {
      result[row.segment] += row.count;
      return result;
    }, emptyCounts());

    let nextCursor: string | null = null;
    if (candidates.length > limit) {
      const next: ActivityCursor = { ...cursor, sources: { ...cursor.sources } };
      for (const source of sources) {
        const consumed = items.filter((item) => item.source === source);
        const last = consumed[consumed.length - 1];
        if (last) next.sources[source] = { sortAt: last.sortAt, id: last.id };
      }
      nextCursor = encodeCursor(next);
    }

    return { items, counts, nextCursor };
  }
}
