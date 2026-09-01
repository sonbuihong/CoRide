const mockRideFindUnique = jest.fn();
const mockRideFindFirst = jest.fn();
const mockBookingFindFirst = jest.fn();
const mockBookingAggregate = jest.fn();
const mockTransaction = jest.fn();
const mockEmitGlobal = jest.fn();

jest.mock('@repo/database', () => ({
  extendedPrisma: {
    ride: { findUnique: mockRideFindUnique, findFirst: mockRideFindFirst },
    booking: { findFirst: mockBookingFindFirst, aggregate: mockBookingAggregate },
    $transaction: mockTransaction,
  },
  BookingStatus: {
    PENDING: 'PENDING', CONFIRMED: 'CONFIRMED', CANCELLED: 'CANCELLED',
    REJECTED: 'REJECTED', EXPIRED: 'EXPIRED', COMPLETED: 'COMPLETED',
  },
  Prisma: {},
}));

jest.mock('../../socket/socket.events', () => ({
  SocketEventService: { emitGlobal: mockEmitGlobal, emitToUser: jest.fn(), emitToRoom: jest.fn() },
}));
jest.mock('../notifications/notifications.service', () => ({
  NotificationsService: { createNotification: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../pricing/pricing.service', () => ({
  PricingService: {
    getActiveConfig: jest.fn().mockResolvedValue({}),
    calculateCarpoolContribution: jest.fn().mockReturnValue({
      totalPrice: 32_000,
      sharedDistanceKm: 8.4,
      detourKm: 0,
      recommendedPricePerSeat: 32_000,
    }),
  },
}));
jest.mock('../rides/ride-matching.service', () => ({
  RideMatchingService: {
    match: jest.fn().mockReturnValue({ detourKm: 0 }),
    sharedRouteDistance: jest.fn().mockReturnValue(8.4),
  },
}));
jest.mock('../rides/ride-route-optimizer.service', () => ({
  RideRouteOptimizerService: { refreshInBackground: jest.fn() },
}));

import { BookingsService } from './bookings.service';

const rideSnapshot = {
  id: '10000000-0000-4000-8000-000000000001',
  driverId: 'driver-1',
  origin: 'A',
  destination: 'D',
  originLat: 21,
  originLng: 105.8,
  destinationLat: 21,
  destinationLng: 105.9,
  routePolyline: JSON.stringify({ coordinates: [[105.8, 21], [105.9, 21]] }),
  distance: 10,
  duration: 30,
  departureTime: new Date(Date.now() + 60 * 60_000),
  availableSeats: 1,
  status: 'SCHEDULED',
  bookingPolicy: 'DRIVER_APPROVAL',
  offeredSeats: 1,
  tollCost: 0,
  pricePerSeat: 32_000,
  allowRoutePickup: true,
  driver: { id: 'driver-1', firstName: 'An', lastName: 'Nguyễn' },
  vehicle: { type: 'CAR' },
  stops: [],
  bookings: [],
};

describe('BookingsService concurrent reservation', () => {
  let availableSeats: number;
  let rideStatus: string;
  let bookings: Array<{ id: string; passengerId: string; status: string }>;
  let transactionQueue: Promise<void>;

  beforeEach(() => {
    jest.clearAllMocks();
    availableSeats = 1;
    rideStatus = 'SCHEDULED';
    bookings = [];
    transactionQueue = Promise.resolve();

    mockRideFindUnique.mockImplementation(async (args: { select?: unknown }) => args.select
      ? { id: rideSnapshot.id, status: rideStatus, availableSeats, updatedAt: new Date() }
      : { ...rideSnapshot, status: 'SCHEDULED', availableSeats: 1 });
    mockRideFindFirst.mockResolvedValue(null);
    mockBookingFindFirst.mockResolvedValue(null);
    mockBookingAggregate.mockResolvedValue({ _sum: { totalPrice: 0 } });

    mockTransaction.mockImplementation(async (operation: (tx: any) => Promise<unknown>) => {
      const previous = transactionQueue;
      let release!: () => void;
      transactionQueue = new Promise<void>((resolve) => { release = resolve; });
      await previous;
      const tx = {
        $queryRaw: jest.fn().mockResolvedValue([{ pg_advisory_xact_lock: null }]),
        ride: {
          findFirst: jest.fn().mockResolvedValue(null),
          updateMany: jest.fn().mockImplementation(async (args: any) => {
            if (args.data.status === 'FULL' && rideStatus === 'SCHEDULED' && availableSeats === 0) {
              rideStatus = 'FULL';
              return { count: 1 };
            }
            if (args.data.status === 'SCHEDULED' && rideStatus === 'FULL' && availableSeats > 0) {
              rideStatus = 'SCHEDULED';
              return { count: 1 };
            }
            if (args.data.availableSeats?.decrement) {
              if (rideStatus !== 'SCHEDULED' || availableSeats < args.data.availableSeats.decrement) return { count: 0 };
              availableSeats -= args.data.availableSeats.decrement;
              return { count: 1 };
            }
            return { count: 0 };
          }),
        },
        booking: {
          findFirst: jest.fn().mockImplementation(async (args: any) =>
            bookings.find((booking) => booking.passengerId === args.where.passengerId && ['PENDING', 'CONFIRMED'].includes(booking.status)) ?? null),
          create: jest.fn().mockImplementation(async (args: any) => {
            const booking = {
              id: 'booking-' + (bookings.length + 1),
              ...args.data,
              ride: { origin: rideSnapshot.origin, destination: rideSnapshot.destination },
              passenger: { id: args.data.passengerId, firstName: 'Khách', lastName: 'CoRide' },
            };
            bookings.push(booking);
            return booking;
          }),
        },
      };
      try {
        return await operation(tx);
      } finally {
        release();
      }
    });
  });

  it('chỉ cho một trong hai hành khách giữ ghế cuối', async () => {
    const data = { rideId: rideSnapshot.id, seats: 1 };
    const results = await Promise.allSettled([
      BookingsService.createBooking('passenger-a', data),
      BookingsService.createBooking('passenger-b', data),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(availableSeats).toBe(0);
    expect(bookings).toHaveLength(1);
  });

  it('khóa theo passenger để chặn hai booking active đồng thời', async () => {
    availableSeats = 2;
    const data = { rideId: rideSnapshot.id, seats: 1 };
    const results = await Promise.allSettled([
      BookingsService.createBooking('passenger-a', data),
      BookingsService.createBooking('passenger-a', data),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(bookings).toHaveLength(1);
    expect(availableSeats).toBe(1);
  });
});
