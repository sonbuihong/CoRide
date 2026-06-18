import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import * as jose from 'jose';
import { ChatService } from '../../modules/chat/chat.service';
import { extendedPrisma as prisma } from '@repo/database';
import {
  setDriverOnline,
  setDriverOffline,
  updateDriverLocation,
  removeDriverLocation,
  refreshDriverOnline,
} from '../lib/redis';

/**
 * Module Socket.IO Singleton — Quản lý kết nối WebSocket toàn cục.
 *
 * Kiến trúc:
 * - initSocket(httpServer) được gọi 1 lần duy nhất trong server.ts
 * - getIO() được gọi từ bất kỳ Service/Controller nào cần push realtime
 * - Mỗi user khi connect sẽ tự động join vào room có tên = userId
 *   → Để push cho user A: getIO().to(userIdA).emit('event', data)
 *
 * Xác thực:
 * - Client gửi JWT accessToken qua handshake.auth.token
 * - Server dùng jose (cùng thư viện với auth.middleware) để verify
 * - Không hợp lệ → connection bị reject ngay lập tức
 */

let io: SocketIOServer;

const getJwtSecret = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'super-secret-fallback-key'
  );

export const initSocket = (server: http.Server): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
      credentials: true,
    },
    // Ưu tiên websocket, fallback polling nếu cần (proxy chặn WS)
    transports: ['websocket', 'polling'],
  });

  // Middleware xác thực JWT trước khi cho phép kết nối
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error('Không tìm thấy token xác thực'));
    }

    try {
      const { payload } = await jose.jwtVerify(token, getJwtSecret());
      const userId = payload.userId as string;

      if (!userId) {
        return next(new Error('Token không chứa userId'));
      }

      // Gắn userId vào socket.data để dùng ở mọi nơi
      socket.data.userId = userId;
      next();
    } catch (error) {
      const joseErr = error as { code?: string };
      if (joseErr.code === 'ERR_JWT_EXPIRED') {
        return next(new Error('Token đã hết hạn'));
      }
      return next(new Error('Token không hợp lệ'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    console.log(`[Socket] Connected: user ${userId} (socket ${socket.id})`);

    // Join vào room mang tên userId
    // Lợi ích: 1 user đăng nhập trên nhiều tab/thiết bị → tất cả đều nhận notification
    socket.join(userId);

    // Xử lý Chat realtime
    socket.on('chat:send', async (data: { rideId: string; receiverId: string; content: string }) => {
      try {
        const { rideId, receiverId, content } = data;
        
        // 1. Lưu vào DB
        const savedMessage = await ChatService.saveMessage(rideId, userId, receiverId, content);

        // 2. Gửi tới người nhận
        io.to(receiverId).emit('chat:receive', savedMessage);
        
        // 3. Gửi xác nhận về cho người gửi để cập nhật UI mượt mà hơn
        socket.emit('chat:sent', savedMessage);
      } catch (error) {
        console.error('[Socket Chat Error]:', error);
        socket.emit('chat:error', { message: 'Không thể gửi tin nhắn' });
      }
    });

    // ─── Ride Tracking Realtime (Carpooling) ───────────────────────────
    // Cache vai trò user trong mỗi ride room — tránh query DB trên mỗi location event (5s)
    socket.data.rideRoles = {} as Record<string, string>;

    // Client join vào room ride:{rideId}
    // Kiểm tra quyền: chỉ driver hoặc passenger CONFIRMED mới được join
    socket.on('ride:join', async (rideId: string) => {
      if (typeof rideId !== 'string' || !rideId) return;

      try {
        const ride = await prisma.ride.findFirst({
          where: {
            id: rideId,
            OR: [
              { driverId: userId },
              { bookings: { some: { passengerId: userId, status: 'CONFIRMED' } } },
            ],
          },
          select: { driverId: true },
        });

        if (!ride) {
          socket.emit('error', { message: 'Bạn không thuộc chuyến đi này' });
          return;
        }

        const roomName = `ride:${rideId}`;
        socket.join(roomName);
        // Cache vai trò để verify driver:location nhanh (không cần query DB mỗi 5s)
        socket.data.rideRoles[rideId] = ride.driverId === userId ? 'DRIVER' : 'PASSENGER';
        console.log(`[Socket] User ${userId} joined ${roomName} as ${socket.data.rideRoles[rideId]}`);
      } catch (error) {
        console.error('[Socket] ride:join error:', error);
        socket.emit('error', { message: 'Lỗi khi join ride room' });
      }
    });

    // Client leave room khi rời màn hình
    socket.on('ride:leave', (rideId: string) => {
      if (typeof rideId !== 'string') return;
      const roomName = `ride:${rideId}`;
      socket.leave(roomName);
      delete socket.data.rideRoles[rideId];
      console.log(`[Socket] User ${userId} left ride room ${roomName}`);
    });

    // Driver gửi vị trí GPS mỗi 5 giây (Carpooling tracking)
    // Chỉ user có vai trò DRIVER (đã verify khi join) mới được emit
    socket.on('driver:location', (data: { rideId: string; latitude: number; longitude: number }) => {
      // Input validation
      if (!data || typeof data.rideId !== 'string' || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return;
      // Kiểm tra quyền: chỉ driver thật mới được gửi vị trí
      if (socket.data.rideRoles?.[data.rideId] !== 'DRIVER') return;

      const roomName = `ride:${data.rideId}`;
      // Dùng socket.to() thay vì io.to() — không gửi lại cho chính driver
      socket.to(roomName).emit('driver:location', {
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: Date.now(),
      });
    });

    // ─── Ride-Hailing: Driver Online/Offline & Location ─────────────────

    // Tài xế bật trạng thái online — sẵn sàng nhận cuốc
    socket.on('driver:go_online', async () => {
      try {
        // Kiểm tra KYC: chỉ tài xế đã xác thực mới được bật online
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
        console.log(`[Socket] Driver ${userId} went ONLINE`);
      } catch (error) {
        console.error('[Socket] driver:go_online error:', error);
        socket.emit('error', { message: 'Lỗi khi bật trạng thái online' });
      }
    });

    // Tài xế tắt trạng thái online
    socket.on('driver:go_offline', async () => {
      try {
        await setDriverOffline(userId);
        await removeDriverLocation(userId);
        socket.emit('driver:status', { online: false });
        console.log(`[Socket] Driver ${userId} went OFFLINE`);
      } catch (error) {
        console.error('[Socket] driver:go_offline error:', error);
      }
    });

    // Tài xế gửi vị trí GPS liên tục (Ride-Hailing mode)
    // Cập nhật Redis Geo index + gia hạn TTL online
    socket.on('driver:update_location', async (data: { latitude: number; longitude: number }) => {
      if (!data || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return;

      try {
        await updateDriverLocation(userId, data.latitude, data.longitude);
        await refreshDriverOnline(userId);
      } catch (error) {
        // Log nhưng không emit error — location update thất bại không critical
        console.error('[Socket] driver:update_location error:', error);
      }
    });

    // ─── Ride-Hailing: Trip Accept/Reject ───────────────────────────────

    // Tài xế chấp nhận cuốc xe
    socket.on('trip:accept', async (data: { tripId: string }) => {
      if (!data?.tripId) return;

      try {
        const { MatchingService } = await import('../../modules/matching/matching.service');
        await MatchingService.handleDriverAccept(data.tripId, userId);
        socket.emit('trip:accept_confirmed', { tripId: data.tripId });
        console.log(`[Socket] Driver ${userId} accepted trip ${data.tripId}`);
      } catch (error) {
        const appErr = error as { message?: string };
        socket.emit('trip:accept_error', {
          tripId: data.tripId,
          message: appErr.message ?? 'Lỗi khi nhận cuốc xe',
        });
        console.error('[Socket] trip:accept error:', error);
      }
    });

    // Tài xế từ chối cuốc xe
    socket.on('trip:reject', async (data: { tripId: string }) => {
      if (!data?.tripId) return;

      try {
        const { MatchingService } = await import('../../modules/matching/matching.service');
        MatchingService.handleDriverReject(data.tripId, userId);
        console.log(`[Socket] Driver ${userId} rejected trip ${data.tripId}`);
      } catch (error) {
        console.error('[Socket] trip:reject error:', error);
      }
    });

    // ─── Carpooling ONGOING: Booking Accept/Reject ───────────────────────────────

    // Tài xế xác nhận ghép chuyến
    socket.on('booking:accept', async (data: { bookingId: string }) => {
      if (!data?.bookingId) return;

      try {
        const { BookingsService } = await import('../../modules/bookings/bookings.service');
        await BookingsService.handleDriverBookingConfirm(userId, data.bookingId);
        console.log(`[Socket] Driver ${userId} accepted booking ${data.bookingId}`);
      } catch (error) {
        const appErr = error as { message?: string };
        socket.emit('booking:error', {
          bookingId: data.bookingId,
          message: appErr.message ?? 'Lỗi khi xác nhận ghép chuyến',
        });
        console.error('[Socket] booking:accept error:', error);
      }
    });

    // Tài xế từ chối ghép chuyến
    socket.on('booking:reject', async (data: { bookingId: string }) => {
      if (!data?.bookingId) return;

      try {
        const { BookingsService } = await import('../../modules/bookings/bookings.service');
        await BookingsService.handleDriverBookingReject(userId, data.bookingId);
        console.log(`[Socket] Driver ${userId} rejected booking ${data.bookingId}`);
      } catch (error) {
        console.error('[Socket] booking:reject error:', error);
      }
    });

    // Khi client disconnect
    socket.on('disconnect', async (reason) => {
      console.log(`[Socket] Disconnected: user ${userId} (${reason})`);

      // Tự động cleanup: xoá driver khỏi Redis khi disconnect
      // TTL online (5 phút) sẽ tự expire, nhưng cleanup ngay cho sạch
      try {
        await setDriverOffline(userId);
        await removeDriverLocation(userId);
      } catch (error) {
        // Không critical — TTL sẽ tự cleanup
        console.warn('[Socket] Cleanup on disconnect failed:', error);
      }
    });
  });

  console.log('[Socket] Socket.IO server initialized');
  return io;
};

/**
 * Lấy instance Socket.IO đã khởi tạo.
 * Gọi hàm này từ Service/Controller để push event.
 * Ví dụ: getIO().to(userId).emit('notification:new', notificationData)
 */
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error(
      'Socket.IO chưa được khởi tạo! Gọi initSocket(server) trước trong server.ts'
    );
  }
  return io;
};
