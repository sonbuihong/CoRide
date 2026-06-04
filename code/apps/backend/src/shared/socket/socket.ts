import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import * as jose from 'jose';
import { ChatService } from '../../modules/chat/chat.service';

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
