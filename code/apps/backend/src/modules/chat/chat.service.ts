import { extendedPrisma as prisma } from '@repo/database';
import { AppError } from '../../shared/errors/AppError';

export class ChatService {
  /**
   * Lấy lịch sử tin nhắn giữa 2 người dùng trong một chuyến đi.
   * Đảm bảo tính bảo mật: chỉ cho phép người trong cuộc xem.
   */
  static async getChatHistory(rideId: string, userId: string, otherUserId: string) {
    // 1. Kiểm tra xem ride có tồn tại không
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { driver: true }
    });

    if (!ride) throw new AppError('Không tìm thấy chuyến đi', 404);

    // 2. Kiểm tra tính hợp lệ: Người dùng yêu cầu phải là Driver hoặc là Passenger có booking CONFIRMED/PENDING
    const isDriver = ride.driverId === userId;
    const booking = await prisma.booking.findFirst({
      where: {
        rideId,
        passengerId: userId,
      }
    });

    if (!isDriver && !booking) {
      throw new AppError('Bạn không có quyền truy cập cuộc trò chuyện này', 403);
    }

    // 3. Lấy tin nhắn giữa userId và otherUserId
    const messages = await prisma.message.findMany({
      where: {
        rideId,
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true }
        }
      }
    });

    return messages;
  }

  /**
   * Lưu tin nhắn mới vào database.
   */
  static async saveMessage(rideId: string, senderId: string, receiverId: string, content: string) {
    return prisma.message.create({
      data: {
        rideId,
        senderId,
        receiverId,
        content,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true }
        }
      }
    });
  }

  /**
   * Đánh dấu các tin nhắn là đã đọc.
   */
  static async markAsRead(rideId: string, userId: string, senderId: string) {
    return prisma.message.updateMany({
      where: {
        rideId,
        receiverId: userId,
        senderId: senderId,
        isRead: false
      },
      data: { isRead: true }
    });
  }
}
