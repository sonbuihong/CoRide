import { extendedPrisma as prisma } from '@repo/database';
import { notificationEmitter } from '../../shared/lib/notification-emitter';
import { AppError } from '../../shared/errors/AppError';
import { publishEvent } from '../../shared/lib/rabbitmq';

export class NotificationsService {
  static async createNotification(
    userId: string,
    title: string,
    content: string,
    type: string
  ) {
    const fakeNotification = { id: 'pending', userId, title, content, type, createdAt: new Date() };

    try {
      // [STRANGLER FIG] Đẩy event lên RabbitMQ
      // Microservice Notification sẽ consume event này và tự xử lý lưu DB + push Socket
      await publishEvent('notification_events', {
        userId,
        title,
        content,
        type,
      });
    } catch (error) {
      // RabbitMQ không khả dụng — ghi trực tiếp vào DB để không mất notification
      console.warn('[NotificationsService] RabbitMQ unavailable, falling back to direct DB write:', (error as Error).message);
      try {
        const saved = await prisma.notification.create({
          data: { userId, title, content, type },
        });
        notificationEmitter.emit('notification', { userId, notification: saved });
        return saved;
      } catch (dbError) {
        console.error('[NotificationsService] Fallback DB write also failed:', dbError);
        throw new AppError('Không thể gửi thông báo', 500);
      }
    }

    // (Legacy fallback) Emit SSE cho client cũ đang lắng nghe
    notificationEmitter.emit('notification', { userId, notification: fakeNotification });

    return fakeNotification;
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
