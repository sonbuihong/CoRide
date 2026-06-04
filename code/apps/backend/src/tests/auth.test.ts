import request from 'supertest';
import app from '../server';
import prisma from '@repo/database';
import bcrypt from 'bcrypt';
import * as jose from 'jose';

// Mocking prisma
jest.mock('@repo/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const JWT_SECRET = 'super-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '0912345678'
    };

    it('should register a new user successfully (201)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-id',
        ...registerData,
        password: 'hashed-password',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData);

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('thành công');
      expect(response.body.user).not.toHaveProperty('password');
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should return 400 if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ email: registerData.email });

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('đã tồn tại');
    });
  });

  describe('POST /api/auth/login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with correct credentials (200)', async () => {
      const hashedPassword = await bcrypt.hash(loginData.password, 10);
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: loginData.email,
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
      expect(response.header['set-cookie']).toBeDefined();
    });

    it('should return 401 for incorrect password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: loginData.email,
        password: 'another-hashed-password',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('không đúng');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return new access token with valid refresh token', async () => {
      const userId = 'user-id';
      const refreshToken = await new jose.SignJWT({ userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);
      
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'token-id',
        token: refreshToken,
        userId: userId,
        revoked: false,
        expiresAt: new Date(Date.now() + 1000000),
      });

      (prisma.refreshToken.update as jest.Mock).mockResolvedValue({});
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear cookie and return 200', async () => {
      const refreshToken = 'valid-refresh-token';
      
      (prisma.refreshToken.update as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [`refreshToken=${refreshToken}`]);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('thành công');
      expect(response.header['set-cookie'][0]).toContain('refreshToken=;');
    });
  });

  describe('Auth Middleware & /api/users/me', () => {
    it('should return 401 if no token provided', async () => {
      const response = await request(app).get('/api/users/me');
      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Không tìm thấy token');
    });

    it('should return 401 if invalid token provided', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token');
      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Token không hợp lệ');
    });

    it('should return 200 and user data with valid token', async () => {
      const userId = 'user-id';
      const token = await new jose.SignJWT({ userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('15m')
        .sign(secret);

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(userId);
      expect(response.body.email).toBe(mockUser.email);
    });
  });
});
