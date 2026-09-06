const mockRideFindUnique = jest.fn();
const mockRideFindFirst = jest.fn();
const mockBookingFindFirst = jest.fn();

jest.mock('@repo/database', () => ({
  extendedPrisma: {
    ride: { findUnique: mockRideFindUnique, findFirst: mockRideFindFirst },
    booking: { findFirst: mockBookingFindFirst },
  },
  BookingStatus: { PENDING: 'PENDING', CONFIRMED: 'CONFIRMED' },
  Prisma: {},
}));
jest.mock('../../shared/lib/redis', () => ({
  getDriverLocation: jest.fn(),
  isDriverOnline: jest.fn(),
}));
jest.mock('../../socket/socket.events', () => ({ SocketEventService: { emitGlobal: jest.fn(), emitToUser: jest.fn() } }));
jest.mock('../notifications/notifications.service', () => ({ NotificationsService: { createNotification: jest.fn() } }));
jest.mock('../pricing/pricing.service', () => ({ PricingService: {} }));

import { BookingsService } from './bookings.service';

describe('BookingsService ongoing route pickup sharing guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRideFindFirst.mockResolvedValue(null);
    mockBookingFindFirst.mockResolvedValue(null);
  });

  it('rejects a direct booking after the driver turns sharing off', async () => {
    mockRideFindUnique.mockResolvedValue({
      id: 'ride-1', driverId: 'driver-1', status: 'ONGOING', availableSeats: 2,
      allowRoutePickup: true, routePickupSharingEnabled: false,
      destinationLat: 21, destinationLng: 105, stops: [], bookings: [],
    });

    await expect(BookingsService.createBooking('passenger-1', {
      rideId: 'ride-1', seats: 1, passengerLat: 21.01, passengerLng: 105.01, paymentMethod: 'CASH',
    })).rejects.toMatchObject({
      statusCode: 409,
      message: 'Tài xế đã tắt nhận thêm khách dọc đường',
    });
  });
});
