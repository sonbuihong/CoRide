import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { SOCKET_CONFIG } from '../config/socket';
import { socketAuthMiddleware } from './socket.auth';
import { registerTripsSocket } from '../modules/trips/trips.socket';
import { registerLegacySocket } from './socket.legacy';
import { setDriverOffline, removeDriverLocation } from '../shared/lib/redis';

let io: SocketIOServer;

export const initSocket = (server: http.Server): SocketIOServer => {
  const pubClient = createClient({ url: SOCKET_CONFIG.REDIS_URL });
  pubClient.on('error', (err) => {
    // Tránh unhandled error spam khi Redis chưa sẵn sàng
  });
  const subClient = pubClient.duplicate();
  subClient.on('error', (err) => {
    // Tránh unhandled error spam khi Redis chưa sẵn sàng
  });

  // Connect clients asynchronously for Redis Pub/Sub
  pubClient.connect().catch((err) => console.error('[Socket Redis Pub] Error:', err.message));
  subClient.connect().catch((err) => console.error('[Socket Redis Sub] Error:', err.message));

  io = new SocketIOServer(server, {
    cors: {
      origin: SOCKET_CONFIG.CORS_ORIGIN,
      credentials: true,
    },
    adapter: createAdapter(pubClient, subClient),
    transports: ['websocket', 'polling'],
  });

  // Middleware xác thực JWT trước khi cho phép kết nối
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string | undefined;
    console.log(`[Socket] Connected: user ${userId || 'guest'} (socket ${socket.id})`);

    if (userId) {
      // Tự động join vào room mang tên userId
      socket.join(`user:${userId}`);
      // Dành cho các event emit trực tiếp đến `to(userId)` không qua tiền tố `user:`
      socket.join(userId);

      // Đăng ký các handler cụ thể của từng module
      registerTripsSocket(io, socket, userId);
      registerLegacySocket(io, socket, userId);
    }

    // Khi client disconnect
    socket.on('disconnect', async (reason) => {
      console.log(`[Socket] Disconnected: user ${userId || 'guest'} (${reason})`);
      if (userId) {
        try {
          await setDriverOffline(userId);
          await removeDriverLocation(userId);
        } catch (error) {
          console.warn('[Socket] Cleanup on disconnect failed:', error);
        }
      }
    });
  });

  console.log('[Socket] Socket.IO server initialized');
  return io;
};

/**
 * Lấy instance Socket.IO đã khởi tạo.
 */
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO chưa được khởi tạo!');
  }
  return io;
};
