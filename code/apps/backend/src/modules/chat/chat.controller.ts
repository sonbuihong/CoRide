import { Request, Response } from 'express';
import { ChatService } from './chat.service';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export class ChatController {
  static getHistory = asyncHandler(async (req: Request, res: Response) => {
    const rideId = req.params.rideId as string;
    const otherUserId = req.params.otherUserId as string;
    const userId = req.user!.id;

    const messages = await ChatService.getChatHistory(rideId, userId, otherUserId);

    res.status(200).json({
      status: 'success',
      messages,
    });
  });

  static markRead = asyncHandler(async (req: Request, res: Response) => {
    const rideId = req.params.rideId as string;
    const senderId = req.params.senderId as string;
    const userId = req.user!.id;

    await ChatService.markAsRead(rideId, userId, senderId);

    res.status(200).json({
      status: 'success',
      message: 'Đã đánh dấu đã đọc',
    });
  });
}
