const mockRideFindMany = jest.fn();

jest.mock('@repo/database', () => ({
  extendedPrisma: {
    ride: { findMany: mockRideFindMany },
  },
  Prisma: {},
}));
jest.mock('../../socket/socket.events', () => ({ SocketEventService: { emitGlobal: jest.fn() } }));
jest.mock('../../shared/lib/redis', () => ({ getDriverLocation: jest.fn().mockResolvedValue(null) }));
jest.mock('../notifications/notifications.service', () => ({ NotificationsService: { createNotification: jest.fn() } }));
jest.mock('../pricing/pricing.service', () => ({ PricingService: {} }));

import { RidesService } from './rides.service';

describe('RidesService passenger search guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRideFindMany.mockResolvedValue([]);
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
});
