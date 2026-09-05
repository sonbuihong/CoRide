const mockRideFindMany = jest.fn();
const mockGetDriverLocation = jest.fn();
const mockIsDriverOnline = jest.fn();

jest.mock('@repo/database', () => ({
  extendedPrisma: {
    ride: { findMany: mockRideFindMany },
  },
  Prisma: {},
}));
jest.mock('../../socket/socket.events', () => ({ SocketEventService: { emitGlobal: jest.fn() } }));
jest.mock('../../shared/lib/redis', () => ({
  getDriverLocation: mockGetDriverLocation,
  isDriverOnline: mockIsDriverOnline,
}));
jest.mock('../notifications/notifications.service', () => ({ NotificationsService: { createNotification: jest.fn() } }));
jest.mock('../pricing/pricing.service', () => ({ PricingService: {} }));

import { RidesService } from './rides.service';

describe('RidesService passenger search guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRideFindMany.mockResolvedValue([]);
    mockGetDriverLocation.mockResolvedValue(null);
    mockIsDriverOnline.mockResolvedValue(false);
  });

  it('lọc số ghế yêu cầu ngay trong truy vấn nguồn', async () => {
    await expect(RidesService.searchRides({ seats: 2 })).resolves.toEqual([]);

    expect(mockRideFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        availableSeats: { gte: 2 },
        OR: expect.arrayContaining([
          expect.objectContaining({ status: 'SCHEDULED' }),
          expect.objectContaining({ status: 'ONGOING' }),
        ]),
      }),
    }));
  });

  it('only returns an ongoing ride while its exact GPS session is online and fresh', async () => {
    const ongoingRide = {
      id: 'ride-1', driverId: 'driver-1', status: 'ONGOING', allowRoutePickup: true,
      routePickupSharingEnabled: true, departureTime: new Date(), availableSeats: 2,
    };
    mockRideFindMany.mockResolvedValue([ongoingRide]);

    await expect(RidesService.searchRides({})).resolves.toEqual([]);

    mockIsDriverOnline.mockResolvedValue(true);
    mockGetDriverLocation.mockResolvedValue({
      latitude: 21, longitude: 105, rideId: 'another-ride', updatedAt: Date.now(),
    });
    await expect(RidesService.searchRides({})).resolves.toEqual([]);

    mockGetDriverLocation.mockResolvedValue({
      latitude: 21, longitude: 105, rideId: 'ride-1', updatedAt: Date.now() - 61_000,
    });
    await expect(RidesService.searchRides({})).resolves.toEqual([]);

    mockGetDriverLocation.mockResolvedValue({
      latitude: 21, longitude: 105, rideId: 'ride-1', updatedAt: Date.now(),
    });
    await expect(RidesService.searchRides({})).resolves.toEqual([ongoingRide]);
  });
});
