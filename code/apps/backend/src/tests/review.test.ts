import request from 'supertest';
import app from '../server';
import prisma from '@repo/database';
import * as jose from 'jose';

// Mocking prisma
jest.mock('@repo/database', () => {
  const client = {
    review: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    ride: {
      findUnique: jest.fn(),
    },
    tripRequest: {
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
  };
  return {
    __esModule: true,
    default: client,
    extendedPrisma: client,
    ReviewType: { DRIVER: 'DRIVER', PASSENGER: 'PASSENGER' },
  };
});

const JWT_SECRET = 'coride-test-secret';
process.env.JWT_SECRET = JWT_SECRET;
const secret = new TextEncoder().encode(JWT_SECRET);

describe('Review API', () => {
  let userToken: string;
  const userId = '123e4567-e89b-12d3-a456-426614174000';
  const rideId = '123e4567-e89b-12d3-a456-426614174001';
  const tripRequestId = '123e4567-e89b-12d3-a456-426614174003';
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

    it('cho phép hành khách đánh giá tài xế của TripRequest đã hoàn thành', async () => {
      (prisma.tripRequest.findUnique as jest.Mock).mockResolvedValue({
        id: tripRequestId,
        status: 'COMPLETED',
        passengerId: userId,
        driverId: revieweeId,
      });
      (prisma.review.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.review.create as jest.Mock).mockResolvedValue({
        id: 'rev-trip-1',
        tripRequestId,
        reviewerId: userId,
        revieweeId,
        rating: 5,
        type: 'DRIVER',
        reviewer: { firstName: 'Test', lastName: 'User' },
      });

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ tripRequestId, revieweeId, rating: 5, comment: 'An toàn' });

      expect(response.status).toBe(201);
      expect(prisma.review.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ rideId: null, tripRequestId }),
      }));
    });
  });
});
