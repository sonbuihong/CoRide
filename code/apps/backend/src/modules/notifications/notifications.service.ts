import { extendedPrisma as prisma } from '@repo/database';
import { notificationEmitter } from '../../shared/lib/notification-emitter';
import { getIO } from '../../shared/socket/socket';
import { AppError } from '../../shared/errors/AppError';

export class NotificationsService {
  static async createNotification(
    userId: string,
    title: string,
    content: string,
    type: string
  ) {
    const notification = await prisma.notification.create({
      data: { userId, title, content, type },
    });

    // Kênh 1 (chính): Push qua Socket.IO — gửi tới room = userId
    // try/catch vì Socket có thể chưa init (test environment)
    try {
      getIO().to(userId).emit('notification:new', notification);
    } catch {
      // Socket.IO chưa khởi tạo — bỏ qua (fallback SSE bên dưới vẫn hoạt động)
    }

    // Kênh 2 (backup): EventEmitter → SSE controller push về client
    notificationEmitter.emit('notification', { userId, notification });
    return notification;
  }


  static async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Giới hạn 50 thông báo gần nhất để tránh load dữ liệu quá lớn
    });
  }

  static async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new AppError('Thông báo không tồn tại hoặc bạn không có quyền truy cập', 404);
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
