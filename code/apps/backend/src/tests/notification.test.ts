import request from 'supertest';
import app from '../server';
import prisma from '@repo/database';
import * as jose from 'jose';
import { notificationEmitter } from '../shared/lib/notification-emitter';

// Mocking prisma
jest.mock('@repo/database', () => ({
  __esModule: true,
  default: {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock emitter
jest.spyOn(notificationEmitter, 'emit');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

describe('Notification API', () => {
  let userToken: string;
  const userId = 'user-123';

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

  describe('GET /api/notifications', () => {
    it('nên lấy danh sách thông báo thành công', async () => {
      const mockNotifications = [
        { id: '1', userId, title: 'Test', content: 'Content', isRead: false },
      ];
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications);

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.notifications).toHaveLength(1);
      expect(prisma.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId },
      }));
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('nên đánh dấu thông báo là đã đọc', async () => {
      const notifId = 'notif-1';
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue({ id: notifId, userId });
      (prisma.notification.update as jest.Mock).mockResolvedValue({ id: notifId, isRead: true });

      const response = await request(app)
        .patch(`/api/notifications/${notifId}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: notifId },
        data: { isRead: true },
      });
    });

    it('nên lỗi nếu thông báo không thuộc về user', async () => {
      (prisma.notification.findUnique as jest.Mock).mockResolvedValue({ id: '1', userId: 'other-user' });

      const response = await request(app)
        .patch('/api/notifications/1/read')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('không có quyền');
    });
  });
});
