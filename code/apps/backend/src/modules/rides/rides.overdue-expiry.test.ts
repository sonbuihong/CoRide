const mockRideFindMany = jest.fn();
const mockRideFindUnique = jest.fn();
const mockRideFindFirst = jest.fn();
const mockRideUpdate = jest.fn();
const mockBookingFindMany = jest.fn();
const mockBookingUpdateMany = jest.fn();
const mockTransaction = jest.fn();
const mockEmitGlobal = jest.fn();
const mockEmitToUser = jest.fn();
const mockCreateNotification = jest.fn();

jest.mock('@repo/database', () => ({
  extendedPrisma: {
    ride: {
      findMany: mockRideFindMany,
      findUnique: mockRideFindUnique,
      findFirst: mockRideFindFirst,
      update: mockRideUpdate,
    },
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

describe('RidesService overdue expiry and ongoing ride handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.mockImplementation(async (operation: (tx: any) => any) => operation({
      ride: {
        findUnique: mockRideFindUnique,
        update: mockRideUpdate,
      },
      booking: {
        findMany: mockBookingFindMany,
        updateMany: mockBookingUpdateMany,
      },
    }));
    mockCreateNotification.mockResolvedValue(undefined);
  });

  describe('calculateRideExpiryTime', () => {
    it('applies minimum 1h (60m) buffer for short trips', () => {
      const departure = new Date('2026-09-06T06:00:00.000Z');
      // 30 min trip -> buffer = max(60, 15) = 60m -> total 90m
      const expiry = RidesService.calculateRideExpiryTime(departure, 30);
      const expected = new Date('2026-09-06T07:30:00.000Z');
      expect(expiry.getTime()).toBe(expected.getTime());
    });

    it('applies proportional 50% buffer for longer trips', () => {
      const departure = new Date('2026-09-06T06:00:00.000Z');
      // 180 min (3h) trip -> buffer = max(60, 90) = 90m (1.5h) -> total 270m (4.5h)
      const expiry = RidesService.calculateRideExpiryTime(departure, 180);
      const expected = new Date('2026-09-06T10:30:00.000Z');
      expect(expiry.getTime()).toBe(expected.getTime());
    });

    it('falls back to 60m duration when duration is missing or 0', () => {
      const departure = new Date('2026-09-06T06:00:00.000Z');
      // fallback 60m -> buffer = max(60, 30) = 60m -> total 120m (2h)
      const expiry = RidesService.calculateRideExpiryTime(departure, null);
      const expected = new Date('2026-09-06T08:00:00.000Z');
      expect(expiry.getTime()).toBe(expected.getTime());
    });
  });

  describe('expireOverdueRides', () => {
    it('automatically cancels overdue rides and their bookings', async () => {
      const overdueDeparture = new Date(Date.now() - 3 * 3600 * 1000); // 3 hours ago
      const notOverdueDeparture = new Date(Date.now() - 30 * 60 * 1000); // 30 mins ago (cutoff is 90 mins, so still active)

      mockRideFindMany.mockResolvedValue([
        {
          id: 'overdue-ride-1',
          driverId: 'driver-1',
          origin: 'Hà Nội',
          destination: 'Hải Phòng',
          departureTime: overdueDeparture,
          duration: 45, // cutoff: 45m + 60m = 105m (< 3 hours ago -> OVERDUE)
        },
        {
          id: 'active-ride-2',
          driverId: 'driver-2',
          origin: 'Hà Nội',
          destination: 'Ninh Bình',
          departureTime: notOverdueDeparture,
          duration: 60, // cutoff: 60m + 60m = 120m (> 30 mins ago -> NOT overdue)
        },
      ]);

      mockRideFindUnique.mockResolvedValue({ id: 'overdue-ride-1', status: 'SCHEDULED' });
      mockRideUpdate.mockResolvedValue({ id: 'overdue-ride-1', status: 'CANCELLED' });
      mockBookingFindMany.mockResolvedValue([
        { id: 'booking-1', passengerId: 'passenger-1', seats: 1 },
      ]);
      mockBookingUpdateMany.mockResolvedValue({ count: 1 });

      const results = await RidesService.expireOverdueRides();

      expect(results).toHaveLength(1);
      expect(mockRideUpdate).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'overdue-ride-1' },
        data: expect.objectContaining({
          status: 'CANCELLED',
          cancelReason: expect.stringContaining('hệ thống tự động hủy'),
        }),
      }));
      expect(mockBookingUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ rideId: 'overdue-ride-1' }),
        data: expect.objectContaining({
          status: 'CANCELLED',
          seatHeld: false,
        }),
      }));
      expect(mockEmitGlobal).toHaveBeenCalledWith('ride:status', expect.objectContaining({
        rideId: 'overdue-ride-1',
        status: 'CANCELLED',
      }));
      expect(mockEmitToUser).toHaveBeenCalledWith('passenger-1', 'booking:cancelled', expect.objectContaining({
        rideId: 'overdue-ride-1',
      }));
      expect(mockCreateNotification).toHaveBeenCalledWith(
        'driver-1',
        'Chuyến đi đã bị hủy tự động',
        expect.any(String),
        'RIDE_CANCELLED',
        expect.any(Object),
      );
    });

    it('returns empty array when no rides are overdue', async () => {
      mockRideFindMany.mockResolvedValue([]);
      const results = await RidesService.expireOverdueRides();
      expect(results).toEqual([]);
      expect(mockTransaction).not.toHaveBeenCalled();
    });
  });
});
