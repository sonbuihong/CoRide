import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import * as jose from 'jose';
import { ChatService } from '../../modules/chat/chat.service';
import { extendedPrisma as prisma } from '@repo/database';

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

    // ─── Ride Tracking Realtime ─────────────────────────────────────
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

    // Driver gửi vị trí GPS mỗi 5 giây
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

    // Khi client disconnect
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: user ${userId} (${reason})`);
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
