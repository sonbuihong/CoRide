import request from 'supertest';
import app from '../server';
import prisma from '@repo/database';
import * as jose from 'jose';
import path from 'path';
import fs from 'fs';

// Mocking prisma
jest.mock('@repo/database', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  return {
    __esModule: true,
    default: mockPrisma,
    extendedPrisma: mockPrisma,
    prisma: mockPrisma,
  };
});

// Mocking cloudinary
jest.mock('../config/cloudinary', () => {
  const mockMulter = {
    single: jest.fn((_fieldName) => (req: any, _res: any, next: Function) => {
      if (req.headers['x-test-no-file']) {
        req.file = undefined;
      } else {
        req.file = { path: 'http://cloudinary.com/avatar.jpg', originalname: 'test.jpg' };
      }
      next();
    }),
  };
  return {
    uploader: {
      upload: jest.fn(),
    },
    upload: mockMulter,
    uploadKycImage: mockMulter,
  };
});

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-fallback-key';
const secret = new TextEncoder().encode(JWT_SECRET);

describe('Profile API', () => {
  let accessToken: string;
  const userId = 'user-123';

  beforeAll(async () => {
    accessToken = await new jose.SignJWT({ userId })
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

  describe('PATCH /api/users/me', () => {
    const updateData = {
      firstName: 'New',
      lastName: 'Name',
      phone: '0987654321',
      bio: 'This is my bio'
    };

    it('should update profile successfully (200)', async () => {
      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        ...updateData,
      });

      const response = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.user.firstName).toBe(updateData.firstName);
      expect(response.body.user.phone).toBe(updateData.phone);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
        select: expect.any(Object),
      });
    });

    it('should return 400 for invalid phone number', async () => {
      const invalidData = { ...updateData, phone: '123' };

      const response = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(JSON.stringify(response.body)).toContain('Số điện thoại');
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .patch('/api/users/me')
        .send(updateData);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/users/me/avatar', () => {
    it('should upload avatar successfully (200)', async () => {
      const mockAvatarUrl = 'http://cloudinary.com/avatar.jpg';
      
      (prisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
        avatarUrl: mockAvatarUrl,
      });

      const response = await request(app)
        .post('/api/users/me/avatar')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user.avatarUrl).toBe(mockAvatarUrl);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { avatarUrl: mockAvatarUrl },
        select: expect.any(Object),
      });
    });

    it('should return 400 if no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/users/me/avatar')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-test-no-file', 'true');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('tập tin');
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/users/me/avatar');

      expect(response.status).toBe(401);
    });
  });
});
