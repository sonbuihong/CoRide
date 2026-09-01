import request from 'supertest';
import app from '../server';
import prisma from '@repo/database';
import * as jose from 'jose';

// Mocking prisma
jest.mock('@repo/database', () => {
  const mockPrisma: any = {
    ride: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    rideStop: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    vehicle: {
      findFirst: jest.fn(),
    },
    booking: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      groupBy: jest.fn(),
    },
    wallet: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  mockPrisma.$transaction.mockImplementation((callback: any) => callback(mockPrisma));

  return {
    __esModule: true,
    default: mockPrisma,
    extendedPrisma: mockPrisma,
  };
});

jest.mock('../modules/pricing/pricing.service', () => ({
  PricingService: {
    estimateCarpoolRoute: jest.fn().mockResolvedValue({
      estimatedDistance: 100,
      estimatedDuration: 60,
      routePolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`',
      recommendedPricePerSeat: 100000,
      minimumPricePerSeat: 50000,
      maximumPricePerSeat: 150000,
      tollCost: 0,
      fuelPrice: 23000,
      fuelConsumption: 7,
      breakdown: { fuelCost: 100000, vehicleOverhead: 20000, totalCost: 120000, tollCost: 0, driverShare: 20000, passengerShare: 100000 },
    }),
  },
}));

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-fallback-key';
const secret = new TextEncoder().encode(JWT_SECRET);

describe('Ride API', () => {
  let validToken: string;
  const userId = 'user-123';
  const vehicleId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

  beforeAll(async () => {
    validToken = await new jose.SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(secret);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: userId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isDriverVerified: true,
    });
    (prisma.vehicle.findFirst as jest.Mock).mockResolvedValue({
      id: vehicleId,
      userId,
      type: 'CAR',
    });
  });

  describe('POST /api/rides', () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 24);
    
    const rideData = {
      originProvince: 'Hà Nội',
      destProvince: 'Hải Phòng',
      origin: 'Hà Nội',
      originLat: 21.0285,
      originLng: 105.8542,
      destination: 'Hải Phòng',
      destinationLat: 20.8449,
      destinationLng: 106.6881,
      distance: 100,
      duration: 60,
      routePolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`',
      vehicleId,
      departureTime: futureDate.toISOString(),
      availableSeats: 4,
      pricePerSeat: 100000,
      description: 'Chuyến đi an toàn'
    };

    it('nên tạo chuyến đi thành công (201)', async () => {
      (prisma.ride.create as jest.Mock).mockResolvedValue({
        id: 'ride-1',
        driverId: userId,
        ...rideData,
        departureTime: new Date(rideData.departureTime),
      });
      (prisma.ride.findUniqueOrThrow as jest.Mock).mockResolvedValue({
        id: 'ride-1',
        driverId: userId,
        ...rideData,
        departureTime: new Date(rideData.departureTime),
      });

      const response = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${validToken}`)
        .send(rideData);

      expect(response.status).toBe(201);
      expect(response.body.ride).toBeDefined();
      expect(response.body.message).toContain('thành công');
      expect(prisma.ride.create).toHaveBeenCalled();
    });

    it('nên trả về 400 nếu thời gian khởi hành ở quá khứ', async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 24);
      
      const invalidData = { ...rideData, departureTime: pastDate.toISOString() };

      const response = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${validToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.errors?.[0]?.message || response.body.message).toContain('tương lai');
    });

    it('nên trả về 401 nếu chưa đăng nhập', async () => {
      const response = await request(app)
        .post('/api/rides')
        .send(rideData);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/rides', () => {
    it('nên tìm kiếm chuyến đi thành công', async () => {
      const mockRides = [
        { id: 'ride-1', origin: 'Hà Nội', destination: 'Hải Phòng', driver: { firstName: 'Tài xế' }, departureTime: new Date() }
      ];
      (prisma.ride.findMany as jest.Mock).mockResolvedValue(mockRides);

      const response = await request(app)
        .get('/api/rides')
        .query({ origin: 'Hà Nội', destination: 'Hải Phòng' });

      expect(response.status).toBe(200);
      expect(response.body.rides).toBeDefined();
      expect(response.body.rides).toHaveLength(1);
      expect(prisma.ride.findMany).toHaveBeenCalled();
    });
  });

  describe('PATCH /api/rides/:id', () => {
    const updateData = { availableSeats: 2 };
    const rideId = 'ride-1';

    it('nên cập nhật thành công nếu là chủ sở hữu', async () => {
      (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
        id: rideId,
        driverId: userId,
        status: 'SCHEDULED',
      });
      (prisma.ride.update as jest.Mock).mockResolvedValue({
        id: rideId,
        driverId: userId,
        availableSeats: 2,
        status: 'SCHEDULED',
      });
      (prisma.ride.findUniqueOrThrow as jest.Mock).mockResolvedValue({
        id: rideId,
        driverId: userId,
        availableSeats: 2,
        status: 'SCHEDULED',
      });

      const response = await request(app)
        .patch(`/api/rides/${rideId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('thành công');
      expect(prisma.ride.update).toHaveBeenCalled();
    });

    it('nên trả về 403 nếu không phải chủ sở hữu', async () => {
      (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
        id: rideId,
        driverId: 'other-user',
        status: 'SCHEDULED',
      });

      const response = await request(app)
        .patch(`/api/rides/${rideId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('quyền');
    });

    it('nên trả về 404 nếu không tìm thấy chuyến đi', async () => {
      (prisma.ride.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .patch(`/api/rides/${rideId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/rides/:id', () => {
    const rideId = 'ride-1';

    it('nên xóa thành công nếu là chủ sở hữu', async () => {
      (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
        id: rideId,
        driverId: userId,
        status: 'SCHEDULED',
      });
      (prisma.ride.update as jest.Mock).mockResolvedValue({
        id: rideId,
        driverId: userId,
        status: 'CANCELLED',
      });
      (prisma.booking.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .delete(`/api/rides/${rideId}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('thành công');
    });

    it('nên trả về 403 nếu không phải chủ sở hữu', async () => {
      (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
        id: rideId,
        driverId: 'other-user',
        status: 'SCHEDULED',
      });

      const response = await request(app)
        .delete(`/api/rides/${rideId}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(403);
    });
  });
});
