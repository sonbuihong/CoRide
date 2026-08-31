import { Request, Response } from 'express';
import { PrismaClient } from '@repo/database';
import { AuthRequest } from './middlewares/auth.middleware';

const prisma = new PrismaClient();

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy thông báo' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await prisma.notification.updateMany({
      where: { userId, isRead: false, deletedAt: null },
      data: { isRead: true },
    });

    res.json({ success: true, message: 'Đã đánh dấu tất cả là đã đọc' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const id = req.params.id as string;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'ID thông báo không hợp lệ' });
    }

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== userId || notification.deletedAt) {
      return res.status(404).json({ message: 'Thông báo không tồn tại' });
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const id = req.params.id as string;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const result = await prisma.notification.updateMany({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) return res.status(404).json({ message: 'Thông báo không tồn tại' });

    return res.json({ success: true, message: 'Đã xóa thông báo' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ message: 'Lỗi server khi xóa thông báo' });
  }
};

export const restoreNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const id = req.params.id as string;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const result = await prisma.notification.updateMany({
      where: { id, userId, deletedAt: { not: null } },
      data: { deletedAt: null },
    });
    if (result.count === 0) return res.status(404).json({ message: 'Thông báo không tồn tại' });

    return res.json({ success: true, message: 'Đã khôi phục thông báo' });
  } catch (error) {
    console.error('Error restoring notification:', error);
    return res.status(500).json({ message: 'Lỗi server khi khôi phục thông báo' });
  }
};
