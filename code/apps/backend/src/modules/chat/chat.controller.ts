import { Request, Response, NextFunction } from 'express';
import { ChatService } from './chat.service';

export class ChatController {
  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const rideId = req.params.rideId as string;
      const otherUserId = req.params.otherUserId as string;
      const userId = req.user!.id;

      const messages = await ChatService.getChatHistory(rideId, userId, otherUserId);

      res.status(200).json({
        status: 'success',
        messages,
      });
    } catch (error) {
      next(error);
    }
  }

  static async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const rideId = req.params.rideId as string;
      const senderId = req.params.senderId as string;
      const userId = req.user!.id;

      await ChatService.markAsRead(rideId, userId, senderId);

      res.status(200).json({
        status: 'success',
        message: 'Đã đánh dấu đã đọc',
      });
    } catch (error) {
      next(error);
    }
  }
}
