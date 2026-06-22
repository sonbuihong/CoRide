import { Server, Socket } from 'socket.io';
import { ChatService } from '../modules/chat/chat.service';
import { setDriverOnline, setDriverOffline, updateDriverLocation, removeDriverLocation, refreshDriverOnline } from '../shared/lib/redis';
import { extendedPrisma as prisma } from '@repo/database';

export const registerLegacySocket = (io: Server, socket: Socket, userId: string) => {
  // Xử lý Chat realtime
  socket.on('chat:send', async (data: { rideId: string; receiverId: string; content: string }) => {
    try {
      const { rideId, receiverId, content } = data;
      const savedMessage = await ChatService.saveMessage(rideId, userId, receiverId, content);
      io.to(`user:${receiverId}`).emit('chat:receive', savedMessage);
      socket.emit('chat:sent', savedMessage);
    } catch (error) {
      console.error('[Socket Chat Error]:', error);
      socket.emit('chat:error', { message: 'Không thể gửi tin nhắn' });
    }
  });

  // ─── Ride-Hailing: Driver Online/Offline & Location ─────────────────
  socket.on('driver:go_online', async () => {
    try {
      const driver = await prisma.user.findUnique({
        where: { id: userId },
        select: { isDriverVerified: true },
      });

      if (!driver?.isDriverVerified) {
        socket.emit('error', { message: 'Bạn cần xác thực tài xế trước khi bật chế độ nhận cuốc' });
        return;
      }

      await setDriverOnline(userId);
      socket.emit('driver:status', { online: true });
    } catch (error) {
      console.error('[Socket] driver:go_online error:', error);
      socket.emit('error', { message: 'Lỗi khi bật trạng thái online' });
    }
  });

  socket.on('driver:go_offline', async () => {
    try {
      await setDriverOffline(userId);
      await removeDriverLocation(userId);
      socket.emit('driver:status', { online: false });
    } catch (error) {
      console.error('[Socket] driver:go_offline error:', error);
    }
  });

  socket.on('driver:update_location', async (data: { latitude: number; longitude: number }) => {
    if (!data || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return;
    try {
      await updateDriverLocation(userId, data.latitude, data.longitude);
      await refreshDriverOnline(userId);
    } catch (error) {
      console.error('[Socket] driver:update_location error:', error);
    }
  });

  // ─── Ride-Hailing: Trip Accept/Reject ───────────────────────────────
  socket.on('trip:accept', async (data: { tripId: string }) => {
    if (!data?.tripId) return;
    try {
      const { MatchingService } = await import('../modules/matching/matching.service');
      await MatchingService.handleDriverAccept(data.tripId, userId);
      socket.emit('trip:accept_confirmed', { tripId: data.tripId });
    } catch (error) {
      const appErr = error as { message?: string };
      socket.emit('trip:accept_error', { tripId: data.tripId, message: appErr.message ?? 'Lỗi khi nhận cuốc xe' });
    }
  });

  socket.on('trip:reject', async (data: { tripId: string }) => {
    if (!data?.tripId) return;
    try {
      const { MatchingService } = await import('../modules/matching/matching.service');
      MatchingService.handleDriverReject(data.tripId, userId);
    } catch (error) {
      console.error('[Socket] trip:reject error:', error);
    }
  });

  // ─── Carpooling ONGOING: Booking Accept/Reject ───────────────────────────────
  socket.on('booking:accept', async (data: { bookingId: string }) => {
    if (!data?.bookingId) return;
    try {
      const { BookingsService } = await import('../modules/bookings/bookings.service');
      await BookingsService.handleDriverBookingConfirm(userId, data.bookingId);
    } catch (error) {
      const appErr = error as { message?: string };
      socket.emit('booking:error', { bookingId: data.bookingId, message: appErr.message ?? 'Lỗi khi xác nhận ghép chuyến' });
    }
  });

  socket.on('booking:reject', async (data: { bookingId: string }) => {
    if (!data?.bookingId) return;
    try {
      const { BookingsService } = await import('../modules/bookings/bookings.service');
      await BookingsService.handleDriverBookingReject(userId, data.bookingId);
    } catch (error) {
      console.error('[Socket] booking:reject error:', error);
    }
  });
};
