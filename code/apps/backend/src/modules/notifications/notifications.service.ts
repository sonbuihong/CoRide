import { extendedPrisma as prisma } from '@repo/database';
import { notificationEmitter } from '../../shared/lib/notification-emitter';
import { getIO } from '../../socket/socket.server';
import { AppError } from '../../shared/errors/AppError';
import { publishEvent } from '../../shared/lib/rabbitmq';

export class NotificationsService {
  static async createNotification(
    userId: string,
    title: string,
    content: string,
    type: string
  ) {
    // [STRANGLER FIG] Thay vì ghi trực tiếp vào DB, chúng ta đẩy event lên RabbitMQ
    // Microservice Notification sẽ consume event này và tự xử lý lưu DB + push Socket
    await publishEvent('notification_events', {
      userId,
      title,
      content,
      type,
    });
    
    // (Legacy fallback) Để tạm thời không crash SSE nếu còn client cũ đang lắng nghe
    // Tuy nhiên, Socket.io sẽ do Notification Service đảm nhiệm
    const fakeNotification = { id: 'pending', userId, title, content, type, createdAt: new Date() };
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
