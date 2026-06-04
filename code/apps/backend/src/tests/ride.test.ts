import request from 'supertest';
import app from '../server';
import prisma from '@repo/database';
import * as jose from 'jose';

// Mocking prisma
jest.mock('@repo/database', () => ({
  __esModule: true,
  default: {
    ride: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

describe('Ride API', () => {
  let validToken: string;
  const userId = 'user-123';

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
    });
  });

  describe('POST /api/rides', () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 24);
    
    const rideData = {
      origin: 'Hà Nội',
      destination: 'Hải Phòng',
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
        { id: 'ride-1', origin: 'Hà Nội', destination: 'Hải Phòng', driver: { firstName: 'Tài xế' } }
      ];
      (prisma.ride.findMany as jest.Mock).mockResolvedValue(mockRides);

      const response = await request(app)
        .get('/api/rides')
        .query({ origin: 'Hà Nội', destination: 'Hải Phòng' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
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
      });
      (prisma.ride.update as jest.Mock).mockResolvedValue({
        id: rideId,
        driverId: userId,
        availableSeats: 2,
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
      });
      (prisma.ride.delete as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .delete(`/api/rides/${rideId}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('thành công');
      expect(prisma.ride.delete).toHaveBeenCalled();
    });

    it('nên trả về 403 nếu không phải chủ sở hữu', async () => {
      (prisma.ride.findUnique as jest.Mock).mockResolvedValue({
        id: rideId,
        driverId: 'other-user',
      });

      const response = await request(app)
        .delete(`/api/rides/${rideId}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(403);
    });
  });
});
