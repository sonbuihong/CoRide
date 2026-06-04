import request from 'supertest';
import app from '../server';
import prisma from '@repo/database';
import * as jose from 'jose';

// Manual definition of statuses to avoid import issues in mock
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
      update: jest.fn(),
    },
    booking: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  // Mock implementation for $transaction that passes itself to the callback
  mockPrisma.$transaction.mockImplementation((callback) => callback(mockPrisma));

  return {
    __esModule: true,
    default: mockPrisma,
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

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

describe('Booking API', () => {
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
  });

  describe('POST /api/bookings', () => {
    const bookingData = { rideId, seats: 2 };

    it('1. nên tạo yêu cầu đặt chỗ thành công (PENDING)', async () => {
      (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
        id: rideId,
        driverId: driverId,
        status: 'SCHEDULED',
        availableSeats: 4,
        pricePerSeat: 100000,
      });
      (prisma.booking.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.booking.create as jest.Mock).mockResolvedValue({
        id: bookingId,
        status: BookingStatus.PENDING,
        ...bookingData,
      });

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send(bookingData);

      if (response.status !== 201) console.log(response.body);
      expect(response.status).toBe(201);
      expect(response.body.booking.status).toBe(BookingStatus.PENDING);
      expect(prisma.booking.create).toHaveBeenCalled();
    });

    it('2. nên thất bại nếu chuyến đi không tồn tại', async () => {
      (prisma.ride.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send(bookingData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Không tìm thấy');
    });

    it('3. nên thất bại nếu tài xế tự đặt xe của chính mình', async () => {
      (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
        id: rideId,
        driverId: passengerId, // User đang gọi là driver
        status: 'SCHEDULED',
        availableSeats: 4,
      });

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send(bookingData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Tài xế không thể đặt chỗ');
    });

    it('4. nên thất bại nếu không đủ số ghế trống', async () => {
      (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
        id: rideId,
        driverId: driverId,
        status: 'SCHEDULED',
        availableSeats: 1, // Chỉ còn 1 ghế
      });

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({ rideId, seats: 2 }); // Đặt 2 ghế

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Không đủ số ghế trống');
    });
  });

  describe('PATCH /api/bookings/:id/status', () => {
    it('5. nên cho phép tài xế xác nhận đặt chỗ và giảm ghế', async () => {
      const mockBooking = {
        id: bookingId,
        rideId,
        passengerId,
        seats: 2,
        status: BookingStatus.PENDING,
        ride: { driverId: driverId, availableSeats: 4 }
      };
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
      (prisma.ride.findUnique as jest.Mock).mockResolvedValue(mockBooking.ride);
      (prisma.ride.update as jest.Mock).mockResolvedValue({});
      (prisma.booking.update as jest.Mock).mockResolvedValue({ ...mockBooking, status: BookingStatus.CONFIRMED });

      const response = await request(app)
        .patch(`/api/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ status: BookingStatus.CONFIRMED });

      if (response.status !== 200) console.log(response.body);
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('xác nhận');
      expect(prisma.ride.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { availableSeats: { decrement: 2 } }
      }));
    });

    it('6. nên trả về 403 nếu không phải tài xế của chuyến đi', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
        id: bookingId,
        ride: { driverId: 'other-driver' }
      });

      const response = await request(app)
        .patch(`/api/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ status: BookingStatus.CONFIRMED });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('không có quyền');
    });

    it('7. nên xử lý Race condition: thất bại nếu hết ghế ngay lúc confirm', async () => {
      const mockBooking = {
        id: bookingId,
        rideId,
        seats: 3,
        status: BookingStatus.PENDING,
        ride: { driverId: driverId }
      };
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue(mockBooking);
      
      // Giả lập lúc này ride chỉ còn 2 ghế (ai đó đã nhanh tay hơn)
      (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
        id: rideId,
        availableSeats: 2 
      });

      const response = await request(app)
        .patch(`/api/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ status: BookingStatus.CONFIRMED });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Không đủ số ghế trống');
      expect(prisma.ride.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/bookings/:id', () => {
    it('8. nên cho phép hành khách hủy yêu cầu PENDING', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
        id: bookingId,
        passengerId,
        status: BookingStatus.PENDING,
        ride: { id: rideId }
      });
      (prisma.booking.update as jest.Mock).mockResolvedValue({ status: BookingStatus.CANCELLED });

      const response = await request(app)
        .delete(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${passengerToken}`);

      if (response.status !== 200) console.log(response.body);
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Đã hủy');
      expect(prisma.ride.update).not.toHaveBeenCalled(); // Không cần hoàn ghế vì đang PENDING
    });

    it('9. nên hoàn lại ghế khi hành khách hủy yêu cầu đã CONFIRMED', async () => {
      (prisma.booking.findUnique as jest.Mock).mockResolvedValue({
        id: bookingId,
        passengerId,
        seats: 2,
        status: BookingStatus.CONFIRMED,
        ride: { id: rideId }
      });
      (prisma.ride.update as jest.Mock).mockResolvedValue({});
      (prisma.booking.update as jest.Mock).mockResolvedValue({ status: BookingStatus.CANCELLED });

      const response = await request(app)
        .delete(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${passengerToken}`);

      if (response.status !== 200) console.log(response.body);
      expect(response.status).toBe(200);
      expect(prisma.ride.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { availableSeats: { increment: 2 } }
      }));
    });
  });
});
