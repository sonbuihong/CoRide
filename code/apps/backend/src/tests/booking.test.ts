import request from 'supertest';
import app from '../server';
import { extendedPrisma as prisma } from '@repo/database';
import * as jose from 'jose';

// Manual definition of statuses
const BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED'
};

// Mocking prisma
jest.mock('@repo/database', () => {
  const mockPrisma = {
    ride: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    booking: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
      updateMany: jest.fn(),
    },
    pricingConfig: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  };

  // Mock implementation for $transaction that passes itself to the callback
  mockPrisma.$transaction.mockImplementation((callback) => callback(mockPrisma));

  return {
    __esModule: true,
    default: mockPrisma,
    extendedPrisma: mockPrisma,
    BookingStatus: {
      PENDING: 'PENDING',
      CONFIRMED: 'CONFIRMED',
      CANCELLED: 'CANCELLED',
      REJECTED: 'REJECTED'
    },
  };
});

// Mocking prisma client enums
jest.mock('@prisma/client', () => ({
  BookingStatus: {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
    REJECTED: 'REJECTED'
  }
}));

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-fallback-key';
const secret = new TextEncoder().encode(JWT_SECRET);

describe('Booking API (Giai đoạn 1 Test Cases)', () => {
  let passengerToken: string;
  let driverToken: string;
  const passengerId = '123e4567-e89b-12d3-a456-426614174000';
  const driverId = '123e4567-e89b-12d3-a456-426614174001';
  const rideId = '123e4567-e89b-12d3-a456-426614174002';
  const bookingId = '123e4567-e89b-12d3-a456-426614174003';

  const signToken = async (userId: string) => {
    return await new jose.SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(secret);
  };

  beforeAll(async () => {
    passengerToken = await signToken(passengerId);
    driverToken = await signToken(driverId);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as jest.Mock).mockImplementation((args) => {
      if (args.where.id === passengerId) return Promise.resolve({ id: passengerId, role: 'USER' });
      if (args.where.id === driverId) return Promise.resolve({ id: driverId, role: 'USER' });
      return Promise.resolve(null);
    });
    (prisma.ride.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ pg_advisory_xact_lock: null }]);
    (prisma.booking.aggregate as jest.Mock).mockResolvedValue({ _sum: { totalPrice: 0 } });
    (prisma.booking.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.pricingConfig.findUnique as jest.Mock).mockResolvedValue({
      vehicleType: 'CAR', isActive: true, fuelPrice: 20_000, fuelConsumption: 10,
      vehicleOverheadRatio: 0.5, minimumDriverShare: 0.2, driverPriceAdjustment: 0.2,
      roundingUnit: 1000, maxDetourKm: 5, maxDetourRatio: 0.25,
    });
  });

  describe('5.1 Test API Đặt xe (POST /api/bookings)', () => {
    const bookingData = { rideId, seats: 2 };

    it('API_BKG_001 & 002: Happy Case - Hành khách đặt ghế thành công (PENDING)', async () => {
      (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
        id: rideId,
        driverId: driverId,
        status: 'SCHEDULED',
        availableSeats: 4,
        pricePerSeat: 100000,
        offeredSeats: 4,
        tollCost: 0,
        distance: 16,
        duration: 30,
        departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        origin: 'A',
        destination: 'B',
        originLat: 21,
        originLng: 105,
        destinationLat: 21.1,
        destinationLng: 105.1,
        bookingPolicy: 'DRIVER_APPROVAL',
        vehicle: { type: 'CAR' },
        stops: [],
        driver: { id: driverId, firstName: 'Driver', lastName: 'A' },
        bookings: []
      });
      (prisma.ride.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.booking.findFirst as jest.Mock).mockResolvedValue(null); // Chưa đặt
      (prisma.booking.create as jest.Mock).mockResolvedValue({
        id: bookingId,
        status: BookingStatus.PENDING,
        passenger: { id: passengerId, firstName: 'Pass', lastName: 'A' },
        ride: { origin: 'A', destination: 'B' },
        ...bookingData,
      });

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send(bookingData);

      if (response.status !== 201) console.log(response.body);
      expect(response.status).toBe(201);
      expect(response.body.booking?.status).toBe(BookingStatus.PENDING);
      expect(response.body.booking?.pricing).toMatchObject({
        pricingPolicy: 'FIXED_PER_SEAT',
        offeredSeats: 4,
        totalCostShares: 5,
        bookedSeats: 2,
      });
      expect(prisma.booking.create).toHaveBeenCalled();
      expect((prisma.booking.create as jest.Mock).mock.calls[0][0].data.priceBreakdown)
        .toMatchObject({ totalCostShares: 5, bookedSeats: 2 });
    });

    it('API_BKG_003: Validation - Lỗi do thiếu rideId', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ seats: 1 });

      expect(response.status).toBe(400);
      expect(JSON.stringify(response.body)).toMatch(/Mã chuyến đi/i);
    });

    it('API_BKG_004: Validation - Lỗi do số ghế <= 0', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ rideId, seats: 0 });

      expect(response.status).toBe(400);
      expect(JSON.stringify(response.body)).toMatch(/ghế/i);
    });

    it('API_BKG_006: Business Rule - Thất bại do chuyến xe đã hết chỗ trống', async () => {
      (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
        id: rideId,
        driverId: driverId,
        status: 'SCHEDULED',
        availableSeats: 0, // Không còn ghế
        driver: { id: driverId, firstName: 'Driver', lastName: 'A' },
        bookings: []
      });
      (prisma.ride.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ rideId, seats: 1 });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('không đủ');
    });

    it('API_BKG_007: Business Rule - Thất bại do đặt số ghế lớn hơn số ghế trống', async () => {
      (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
        id: rideId,
        driverId: driverId,
        status: 'SCHEDULED',
        availableSeats: 1, // Chỉ còn 1 ghế
        driver: { id: driverId, firstName: 'Driver', lastName: 'A' },
        bookings: []
      });
      (prisma.ride.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ rideId, seats: 2 }); // Đặt 2 ghế

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('không đủ');
    });

    it('API_BKG_008: Business Rule - Thất bại nếu tài xế tự đặt xe của chính mình', async () => {
      (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
        id: rideId,
        driverId: passengerId, // User đang gọi là driver
        status: 'SCHEDULED',
        availableSeats: 4,
        driver: { id: passengerId, firstName: 'Pass', lastName: 'A' },
        bookings: []
      });

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send(bookingData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Tài xế không thể đặt chỗ trên chuyến đi của chính mình');
    });

    it('API_BKG_010: Business Rule - Không thể đặt chuyến xe đã khởi hành hoặc hủy', async () => {
      (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
        id: rideId,
        driverId: driverId,
        status: 'COMPLETED', // Đã xong
        availableSeats: 4,
        driver: { id: driverId, firstName: 'Driver', lastName: 'A' },
        bookings: []
      });

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send(bookingData);

      expect(response.status).toBe(400);
    });

    it('API_BKG_011: Business Rule - Khách hàng không thể đặt trùng 1 chuyến nhiều lần', async () => {
      (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
        id: rideId,
        driverId: driverId,
        status: 'SCHEDULED',
        availableSeats: 4,
        driver: { id: driverId, firstName: 'Driver', lastName: 'A' },
        bookings: []
      });
      (prisma.ride.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.booking.findFirst as jest.Mock).mockResolvedValue({ id: 'old-bkg', status: 'PENDING', ride: { status: 'SCHEDULED' } }); // Đã tồn tại booking

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send(bookingData);

      expect(response.status).toBe(400);
    });
  });

  describe('5.2 Test API Nhận chuyến / Xác nhận (PATCH /api/bookings/:id/status)', () => {
    it('API_CFM_001: Happy Case - Tài xế xác nhận booking đã giữ ghế thành công', async () => {
      const mockBooking = {
        id: bookingId,
        rideId,
        passengerId,
        seats: 2,
        status: BookingStatus.PENDING,
        seatHeld: true,
        expiresAt: new Date(Date.now() + 10 * 60_000),
        passenger: { id: passengerId, firstName: 'Pass', lastName: 'A' },
        ride: { driverId: driverId, availableSeats: 2, status: 'SCHEDULED', origin: 'A', destination: 'B' }
      };
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
      (prisma.ride.findUnique as jest.Mock).mockResolvedValue(mockBooking.ride); // Thêm findUnique cho update status
      (prisma.ride.update as jest.Mock).mockResolvedValue({ availableSeats: 2 });
      (prisma.booking.update as jest.Mock).mockResolvedValue({ ...mockBooking, status: BookingStatus.CONFIRMED });

      const response = await request(app)
        .patch(`/api/bookings/${bookingId}/status`)
        .send({ status: BookingStatus.CONFIRMED })
        .set('Authorization', `Bearer ${driverToken}`);

      expect(response.status).toBe(200);
      expect(prisma.ride.update).not.toHaveBeenCalledWith(expect.objectContaining({
        data: { availableSeats: { decrement: 2 } },
      }));
    });

    it('API_CFM_002: Business Rule - Trả về 403 nếu không phải tài xế của chuyến xe', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
        id: bookingId,
        passenger: { id: passengerId, firstName: 'Pass', lastName: 'A' },
        ride: { driverId: 'other-driver', origin: 'A', destination: 'B' }
      });

      const response = await request(app)
        .patch(`/api/bookings/${bookingId}/status`)
        .send({ status: BookingStatus.CONFIRMED })
        .set('Authorization', `Bearer ${driverToken}`);

      expect(response.status).toBe(403);
    });

    it('API_CFM_004: Race Condition - Thất bại nếu hết ghế ngay lúc tài xế confirm', async () => {
      const mockBooking = {
        id: bookingId,
        rideId,
        seats: 3,
        status: BookingStatus.PENDING,
        passenger: { id: passengerId, firstName: 'Pass', lastName: 'A' },
        ride: { driverId: driverId, availableSeats: 2, origin: 'A', destination: 'B' } // Hết ghế
      };
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
      (prisma.ride.findUnique as jest.Mock).mockResolvedValue(mockBooking.ride);

      const response = await request(app)
        .patch(`/api/bookings/${bookingId}/status`)
        .send({ status: BookingStatus.CONFIRMED })
        .set('Authorization', `Bearer ${driverToken}`);

      expect(response.status).toBe(400);
      expect(prisma.ride.update).not.toHaveBeenCalled();
    });
  });

  describe('5.3 Test API Hủy chuyến (PATCH /api/bookings/:id/cancel)', () => {
    it('API_CCL_001: Happy Case - Hành khách hủy chuyến thành công trước khi đi', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
        id: bookingId,
        passengerId,
        seats: 2,
        status: BookingStatus.CONFIRMED,
        seatHeld: true,
        rideId,
        ride: { id: rideId, status: 'SCHEDULED', driverId: driverId }
      });
      (prisma.booking.update as jest.Mock).mockResolvedValue({ status: BookingStatus.CANCELLED });
      (prisma.ride.update as jest.Mock).mockResolvedValue({ availableSeats: 4 });

      const response = await request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .send({ cancelReason: 'Bận việc đột xuất' })
        .set('Authorization', `Bearer ${passengerToken}`);

      expect(response.status).toBe(200);
      // Hủy CONFIRMED -> Phải hoàn ghế
      expect(prisma.ride.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { availableSeats: { increment: 2 } }
      }));
    });

    it('API_CCL_001_B: Hủy yêu cầu PENDING trả lại ghế đang giữ', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
        id: bookingId,
        passengerId,
        seats: 2,
        status: BookingStatus.PENDING,
        seatHeld: true,
        rideId,
        ride: { id: rideId, status: 'SCHEDULED', driverId: driverId }
      });
      (prisma.booking.update as jest.Mock).mockResolvedValue({ status: BookingStatus.CANCELLED });

      const response = await request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .send({ cancelReason: 'Thay đổi kế hoạch' })
        .set('Authorization', `Bearer ${passengerToken}`);

      expect(response.status).toBe(200);
      expect(prisma.ride.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { availableSeats: { increment: 2 } }
      }));
    });

    it('API_CCL_003: Business Rule - Không thể hủy khi xe đã chạy (ONGOING)', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
        id: bookingId,
        passengerId,
        status: BookingStatus.CONFIRMED,
        ride: { id: rideId, status: 'ONGOING', driverId: driverId } // Xe đã chạy
      });

      const response = await request(app)
        .patch(`/api/bookings/${bookingId}/cancel`)
        .send({ cancelReason: 'Xe chạy rồi' })
        .set('Authorization', `Bearer ${passengerToken}`);

      expect(response.status).toBe(400);
    });
  });
});
