import { Request, Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service';
import { notificationEmitter } from '../../shared/lib/notification-emitter';

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const notifications = await NotificationsService.getUserNotifications(req.user!.id);
    res.json({ notifications });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const notification = await NotificationsService.markAsRead(
      req.user!.id,
      (req.params.id as string)
    );
    res.json({ message: 'Đã đánh dấu là đã đọc', notification });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await NotificationsService.markAllAsRead(req.user!.id);
    res.json({ message: 'Đã đánh dấu tất cả là đã đọc' });
  } catch (error) {
    next(error);
  }
};

/**
 * SSE (Server-Sent Events) endpoint — giữ kết nối HTTP mở và push notification real-time.
 * Client kết nối bằng: const es = new EventSource('/api/notifications/subscribe')
 * với Authorization header (cần cấu hình EventSource hoặc dùng thư viện hỗ trợ)
 */
export const subscribe = (req: Request, res: Response): void => {
  const userId = req.user!.id;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  // Gửi message khởi đầu để client biết đã kết nối thành công
  res.write('data: {"status":"connected"}\n\n');

  const onNotification = (data: { userId: string; notification: unknown }) => {
    if (data.userId === userId) {
      res.write(`data: ${JSON.stringify(data.notification)}\n\n`);
    }
  };

  // Heartbeat mỗi 30s để giữ kết nối không bị proxy/firewall/CDN cắt
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  notificationEmitter.on('notification', onNotification);

  // Cleanup khi client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    notificationEmitter.off('notification', onNotification);
  });
};
