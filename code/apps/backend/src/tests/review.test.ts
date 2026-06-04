import request from 'supertest';
import app from '../server';
import prisma from '@repo/database';
import * as jose from 'jose';

// Mocking prisma
jest.mock('@repo/database', () => ({
  __esModule: true,
  default: {
    review: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    ride: {
      findUnique: jest.fn(),
    },
    booking: {
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}));

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

describe('Review API', () => {
  let userToken: string;
  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const rideId = '123e4567-e89b-12d3-a456-426614174001';
  const revieweeId = '123e4567-e89b-12d3-a456-426614174002';

  beforeAll(async () => {
    userToken = await new jose.SignJWT({ userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(secret);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId, email: 'test@example.com' });
  });

  describe('POST /api/reviews', () => {
    const reviewData = { rideId, revieweeId, rating: 5, comment: 'Good' };

    it('nên gửi đánh giá thành công', async () => {
      (prisma.ride.findUnique as jest.Mock).mockResolvedValue({ id: rideId, status: 'COMPLETED', driverId: revieweeId });
      (prisma.booking.findFirst as jest.Mock).mockResolvedValue({ status: 'CONFIRMED' });
      (prisma.review.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.review.create as jest.Mock).mockResolvedValue({
        id: 'rev-1',
        ...reviewData,
        reviewer: { firstName: 'Test', lastName: 'User' }
      });

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send(reviewData);

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('thành công');
    });

    it('nên lỗi nếu tự đánh giá chính mình', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ ...reviewData, revieweeId: userId });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('không thể tự đánh giá');
    });

    it('nên lỗi nếu chuyến đi chưa hoàn thành', async () => {
      (prisma.ride.findUnique as jest.Mock).mockResolvedValue({ id: rideId, status: 'SCHEDULED' });

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send(reviewData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('sau khi chuyến đi kết thúc');
    });
  });
});
