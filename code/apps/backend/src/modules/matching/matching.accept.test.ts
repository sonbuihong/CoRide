const mockUserFindUnique = jest.fn();
const mockTripFindFirst = jest.fn();
const mockTripFindUnique = jest.fn();
const mockTripUpdateMany = jest.fn();
const mockHasTripOffer = jest.fn();
const mockSetDriverBusy = jest.fn();
const mockClearTripOffers = jest.fn();
const mockClearDriverBusy = jest.fn();
const mockEmitTripUpdated = jest.fn();

jest.mock('@repo/database', () => ({
  extendedPrisma: {
    user: { findUnique: mockUserFindUnique, findMany: jest.fn() },
    tripRequest: {
      findFirst: mockTripFindFirst,
      findUnique: mockTripFindUnique,
      findMany: jest.fn(),
      updateMany: mockTripUpdateMany,
    },
    ride: { findMany: jest.fn() },
  },
}));

jest.mock('../../shared/lib/redis', () => ({
  hasTripOffer: mockHasTripOffer,
  setDriverBusy: mockSetDriverBusy,
  clearDriverBusy: mockClearDriverBusy,
  clearTripOffers: mockClearTripOffers,
  clearTripOffer: jest.fn(),
  findNearbyDrivers: jest.fn(),
  getDriverLocation: jest.fn(),
  isDriverBusy: jest.fn(),
  isDriverOnline: jest.fn(),
  offerTripToDrivers: jest.fn(),
}));

jest.mock('../trips/trip-realtime.service', () => ({
  emitTripUpdated: mockEmitTripUpdated,
}));

jest.mock('../../socket/socket.events', () => ({
  SocketEventService: { emitToUser: jest.fn() },
}));

jest.mock('../notifications/notifications.service', () => ({
  NotificationsService: { createNotification: jest.fn().mockResolvedValue({}) },
}));

import { MatchingService } from './matching.service';

describe('MatchingService atomic accept', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasTripOffer.mockResolvedValue(true);
    mockUserFindUnique.mockResolvedValue({
      isDriverVerified: true,
      vehicles: [{ id: 'vehicle', type: 'BIKE' }],
    });
    mockTripFindFirst.mockResolvedValue(null);
    mockClearTripOffers.mockResolvedValue(['driver-a', 'driver-b']);
    mockSetDriverBusy.mockResolvedValue(undefined);
  });

  it('allows exactly one winner when two offered drivers accept concurrently', async () => {
    let winner: string | null = null;
    mockTripUpdateMany.mockImplementation(async ({ data }: { data: { driverId: string } }) => {
      await Promise.resolve();
      if (winner) return { count: 0 };
      winner = data.driverId;
      return { count: 1 };
    });
    mockTripFindUnique.mockImplementation(async ({ include, select }: { include?: unknown; select?: { driverId?: boolean } }) => (
      include
        ? {
          id: 'trip-1',
          passengerId: 'passenger-1',
          driverId: winner,
          status: 'ACCEPTED',
          updatedAt: new Date(),
          passenger: {},
          driver: {},
        }
        : select?.driverId
          ? { driverId: winner, status: 'ACCEPTED' }
          : { passengerId: 'passenger-1', status: 'MATCHING', vehicleType: 'BIKE' }
    ));

    const results = await Promise.allSettled([
      MatchingService.handleDriverAccept('trip-1', 'driver-a'),
      MatchingService.handleDriverAccept('trip-1', 'driver-b'),
    ]);
    const successes = results.filter(({ status }) => status === 'fulfilled');
    const failures = results.filter(({ status }) => status === 'rejected') as PromiseRejectedResult[];

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(failures[0].reason).toMatchObject({ statusCode: 409, code: 'TRIP_ALREADY_ACCEPTED' });
    expect(mockEmitTripUpdated).toHaveBeenCalledTimes(1);
    expect(mockTripUpdateMany.mock.invocationCallOrder[0])
      .toBeLessThan(mockEmitTripUpdated.mock.invocationCallOrder[0]);
  });

  it('rejects a driver that was not offered the trip', async () => {
    mockHasTripOffer.mockResolvedValue(false);
    await expect(MatchingService.handleDriverAccept('trip-1', 'driver-x')).rejects.toMatchObject({
      statusCode: 403,
      code: 'TRIP_NOT_OFFERED',
    });
    expect(mockTripUpdateMany).not.toHaveBeenCalled();
  });
});
