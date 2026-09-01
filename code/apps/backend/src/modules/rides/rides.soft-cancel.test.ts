const mockRideFindUnique = jest.fn();
const mockRideUpdate = jest.fn();
const mockRideDelete = jest.fn();
const mockBookingFindMany = jest.fn();
const mockBookingUpdateMany = jest.fn();
const mockTransaction = jest.fn();
const mockEmitGlobal = jest.fn();
const mockEmitToUser = jest.fn();
const mockCreateNotification = jest.fn();

jest.mock('@repo/database', () => ({
  extendedPrisma: {
    ride: { findUnique: mockRideFindUnique, update: mockRideUpdate, delete: mockRideDelete },
    booking: { findMany: mockBookingFindMany },
    $transaction: mockTransaction,
  },
  Prisma: {},
}));

jest.mock('../../socket/socket.events', () => ({
  SocketEventService: { emitGlobal: mockEmitGlobal, emitToUser: mockEmitToUser },
}));

jest.mock('../notifications/notifications.service', () => ({
  NotificationsService: { createNotification: mockCreateNotification },
}));

import { RidesService } from './rides.service';

describe('RidesService soft cancellation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBookingFindMany.mockResolvedValue([{ passengerId: 'passenger-1' }]);
    mockBookingUpdateMany.mockResolvedValue({ count: 1 });
    mockRideUpdate.mockResolvedValue({
      id: 'ride-1',
      driverId: 'driver-1',
      origin: 'A',
      destination: 'B',
      status: 'CANCELLED',
      cancelReason: 'Tài xế đã hủy chuyến',
    });
    mockTransaction.mockImplementation(async (operation: (tx: unknown) => unknown) => operation({
      booking: { updateMany: mockBookingUpdateMany },
      ride: { update: mockRideUpdate },
    }));
    mockCreateNotification.mockResolvedValue(undefined);
  });

  it('cancels active bookings atomically before publishing cancellation events', async () => {
    mockRideFindUnique.mockResolvedValue({
      id: 'ride-1', driverId: 'driver-1', origin: 'A', destination: 'B', status: 'SCHEDULED', cancelReason: null,
    });

    await expect(RidesService.deleteRide('ride-1', 'driver-1')).resolves.toMatchObject({ status: 'CANCELLED' });
    expect(mockBookingUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ rideId: 'ride-1', status: { in: ['PENDING', 'CONFIRMED'] } }),
      data: expect.objectContaining({ status: 'CANCELLED', seatHeld: false }),
    }));
    expect(mockRideUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'ride-1' },
      data: expect.objectContaining({ status: 'CANCELLED', cancelReason: 'Tài xế đã hủy chuyến' }),
    }));
    expect(mockRideDelete).not.toHaveBeenCalled();
    expect(mockEmitToUser).toHaveBeenCalledWith('passenger-1', 'booking:cancelled', expect.objectContaining({ rideId: 'ride-1' }));
    expect(mockCreateNotification).toHaveBeenCalledWith('passenger-1', expect.any(String), expect.any(String), 'RIDE_CANCELLED', { type: 'RIDE', id: 'ride-1' });
  });

  it('rejects cancellation by another driver', async () => {
    mockRideFindUnique.mockResolvedValue({ id: 'ride-1', driverId: 'driver-2', status: 'SCHEDULED' });
    await expect(RidesService.deleteRide('ride-1', 'driver-1')).rejects.toMatchObject({ statusCode: 403 });
    expect(mockRideUpdate).not.toHaveBeenCalled();
  });

  it('allows a full scheduled ride to be cancelled, but not an ongoing ride', async () => {
    mockRideFindUnique.mockResolvedValue({ id: 'ride-1', driverId: 'driver-1', origin: 'A', destination: 'B', status: 'FULL' });
    await expect(RidesService.deleteRide('ride-1', 'driver-1')).resolves.toMatchObject({ status: 'CANCELLED' });

    mockRideFindUnique.mockResolvedValue({ id: 'ride-1', driverId: 'driver-1', status: 'ONGOING' });
    await expect(RidesService.deleteRide('ride-1', 'driver-1')).rejects.toMatchObject({ statusCode: 400 });
  });
});
