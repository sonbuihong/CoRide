const mockRideFindUnique = jest.fn();
const mockRideFindUniqueOrThrow = jest.fn();
const mockRideUpdateMany = jest.fn();
const mockRideUpdate = jest.fn();
const mockBookingFindMany = jest.fn();
const mockBookingCount = jest.fn();
const mockTransaction = jest.fn();
const mockSetDriverOnline = jest.fn();
const mockSetDriverOffline = jest.fn();

jest.mock('@repo/database', () => ({
  extendedPrisma: {
    ride: {
      findUnique: mockRideFindUnique,
      findUniqueOrThrow: mockRideFindUniqueOrThrow,
      updateMany: mockRideUpdateMany,
    },
    booking: { findMany: mockBookingFindMany, count: mockBookingCount },
    $transaction: mockTransaction,
  },
  Prisma: {},
}));
jest.mock('../../shared/lib/redis', () => ({
  getDriverLocation: jest.fn(),
  isDriverOnline: jest.fn(),
  setDriverOnline: mockSetDriverOnline,
  setDriverOffline: mockSetDriverOffline,
}));
jest.mock('../../socket/socket.events', () => ({ SocketEventService: { emitGlobal: jest.fn(), emitToUser: jest.fn() } }));
jest.mock('../notifications/notifications.service', () => ({ NotificationsService: { createNotification: jest.fn() } }));
jest.mock('../pricing/pricing.service', () => ({ PricingService: {} }));

import { RidesService } from './rides.service';

const ongoingRide = {
  id: 'ride-1', driverId: 'driver-1', status: 'ONGOING', allowRoutePickup: true,
  routePickupSharingEnabled: false, origin: 'A', destination: 'B',
};

describe('RidesService route pickup sharing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRideFindUnique.mockResolvedValue(ongoingRide);
    mockRideUpdateMany.mockResolvedValue({ count: 1 });
    mockRideFindUniqueOrThrow.mockResolvedValue({ ...ongoingRide, routePickupSharingEnabled: true });
    mockSetDriverOnline.mockResolvedValue(undefined);
    mockSetDriverOffline.mockResolvedValue(undefined);
  });

  it('rejects a driver who does not own the ride', async () => {
    await expect(RidesService.updateRoutePickupSharing('ride-1', 'driver-2', true))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('rejects non-ongoing rides and rides that disabled route pickup', async () => {
    mockRideFindUnique.mockResolvedValueOnce({ ...ongoingRide, status: 'SCHEDULED' });
    await expect(RidesService.updateRoutePickupSharing('ride-1', 'driver-1', true))
      .rejects.toMatchObject({ statusCode: 409 });

    mockRideFindUnique.mockResolvedValueOnce({ ...ongoingRide, allowRoutePickup: false });
    await expect(RidesService.updateRoutePickupSharing('ride-1', 'driver-1', true))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  it('persists valid toggles and updates Redis online state', async () => {
    await RidesService.updateRoutePickupSharing('ride-1', 'driver-1', true);
    expect(mockRideUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: 'ONGOING', allowRoutePickup: true }),
      data: { routePickupSharingEnabled: true },
    }));
    expect(mockSetDriverOnline).toHaveBeenCalledWith('driver-1');

    mockRideFindUniqueOrThrow.mockResolvedValueOnce({ ...ongoingRide, routePickupSharingEnabled: false });
    await RidesService.updateRoutePickupSharing('ride-1', 'driver-1', false);
    expect(mockSetDriverOffline).toHaveBeenCalledWith('driver-1');
  });

  it('turns sharing off when the ride completes', async () => {
    mockRideFindUnique.mockResolvedValueOnce({ ...ongoingRide, routePickupSharingEnabled: true });
    mockBookingFindMany.mockResolvedValue([]);
    mockBookingCount.mockResolvedValue(0);
    mockRideUpdate.mockResolvedValue({ ...ongoingRide, status: 'COMPLETED', routePickupSharingEnabled: false });
    mockTransaction.mockImplementation(async (operation: (tx: any) => unknown) => operation({
      ride: { update: mockRideUpdate },
    }));

    await RidesService.updateRideStatus('ride-1', 'driver-1', 'COMPLETED');
    expect(mockRideUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'COMPLETED', routePickupSharingEnabled: false }),
    }));
    expect(mockSetDriverOffline).toHaveBeenCalledWith('driver-1');
  });

  it('keeps an ongoing ride unchanged while a passenger still needs dropoff', async () => {
    mockBookingCount.mockResolvedValue(1);

    await expect(RidesService.updateRideStatus('ride-1', 'driver-1', 'COMPLETED'))
      .rejects.toMatchObject({ statusCode: 400 });

    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockSetDriverOffline).not.toHaveBeenCalled();
  });
});
