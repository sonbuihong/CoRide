const mockScheduleFindUnique = jest.fn();
const mockBookingFindMany = jest.fn();
const mockRideUpdateMany = jest.fn();
const mockBookingUpdateMany = jest.fn();
const mockTransaction = jest.fn();
const mockEmitGlobal = jest.fn();
const mockEmitToUser = jest.fn();
const mockCreateNotification = jest.fn();

jest.mock('@repo/database', () => ({
  extendedPrisma: {
    rideSchedule: { findUnique: mockScheduleFindUnique },
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

describe('RidesService schedule cancellation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRideUpdateMany.mockResolvedValue({ count: 2 });
    mockBookingUpdateMany.mockResolvedValue({ count: 1 });
    mockBookingFindMany.mockResolvedValue([{ passengerId: 'passenger-1', rideId: 'ride-1' }]);
    mockCreateNotification.mockResolvedValue(undefined);
    mockTransaction.mockImplementation(async (operation: (tx: unknown) => unknown) => operation({
      ride: { updateMany: mockRideUpdateMany },
      booking: { findMany: mockBookingFindMany, updateMany: mockBookingUpdateMany },
    }));
  });

  it('cancels every open ride and its active bookings in one transaction', async () => {
    mockScheduleFindUnique.mockResolvedValue({
      id: 'schedule-1',
      driverId: 'driver-1',
      rides: [
        { id: 'ride-1', driverId: 'driver-1', origin: 'A', destination: 'B', departureTime: new Date(), status: 'SCHEDULED' },
        { id: 'ride-2', driverId: 'driver-1', origin: 'A', destination: 'B', departureTime: new Date(), status: 'FULL' },
        { id: 'ride-3', driverId: 'driver-1', origin: 'A', destination: 'B', departureTime: new Date(), status: 'COMPLETED' },
      ],
    });

    await expect(RidesService.cancelRideSchedule('schedule-1', 'driver-1', 'Thay đổi kế hoạch'))
      .resolves.toEqual({ cancelledCount: 2, affectedBookingCount: 1 });

    expect(mockRideUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: { in: ['ride-1', 'ride-2'] },
        driverId: 'driver-1',
        status: { in: ['SCHEDULED', 'FULL'] },
      }),
      data: { status: 'CANCELLED', cancelReason: 'Thay đổi kế hoạch' },
    }));
    expect(mockBookingUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ rideId: { in: ['ride-1', 'ride-2'] } }),
      data: expect.objectContaining({ status: 'CANCELLED', seatHeld: false }),
    }));
    expect(mockEmitGlobal).toHaveBeenCalledTimes(2);
    expect(mockEmitToUser).toHaveBeenCalledWith('passenger-1', 'booking:cancelled', expect.objectContaining({ rideId: 'ride-1' }));
  });

  it('rejects cancellation by a driver who does not own the schedule', async () => {
    mockScheduleFindUnique.mockResolvedValue({ id: 'schedule-1', driverId: 'driver-2', rides: [] });

    await expect(RidesService.cancelRideSchedule('schedule-1', 'driver-1', 'Thay đổi kế hoạch'))
      .rejects.toMatchObject({ statusCode: 403 });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('is idempotent when no open rides remain', async () => {
    mockScheduleFindUnique.mockResolvedValue({
      id: 'schedule-1',
      driverId: 'driver-1',
      rides: [{ id: 'ride-1', driverId: 'driver-1', status: 'CANCELLED' }],
    });

    await expect(RidesService.cancelRideSchedule('schedule-1', 'driver-1', 'Thay đổi kế hoạch'))
      .resolves.toEqual({ cancelledCount: 0, affectedBookingCount: 0 });
    expect(mockTransaction).not.toHaveBeenCalled();
  });
});
