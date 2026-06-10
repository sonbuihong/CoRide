// Singleton Socket.IO client cho mobile app
// Quản lý kết nối WebSocket đến backend cho realtime features

import { io, Socket } from 'socket.io-client';
import { authStorage } from './auth-storage';

// Socket.IO server URL — cắt '/api' suffix để lấy base host
// Dùng regex anchor $ để chỉ cắt /api ở cuối, tránh cắt nhầm /api trong domain
const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5001/api')
  .replace(/\/api\/?$/, '');

let socket: Socket | null = null;

/**
 * Kết nối Socket.IO với JWT authentication.
 * Chỉ tạo 1 connection duy nhất (singleton pattern).
 * Nếu đã connected → trả về socket hiện tại.
 */
export const connectSocket = async (): Promise<Socket | null> => {
  // Không tạo lại nếu đã connected
  if (socket?.connected) return socket;

  const token = await authStorage.getToken();
  if (!token) {
    console.warn('[Socket] Không có token, bỏ qua kết nối');
    return null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    // Tự reconnect khi mất kết nối
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('connect_error', (error) => {
    console.error('[Socket] Connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  return socket;
};

/**
 * Ngắt kết nối Socket.IO và cleanup
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Reconnect Socket.IO với token mới.
 * Gọi sau khi JWT token được refresh để socket dùng token hợp lệ.
 */
export const reconnectSocket = async (): Promise<Socket | null> => {
  disconnectSocket();
  return connectSocket();
};

/**
 * Lấy socket instance hiện tại.
 * Trả null nếu chưa kết nối.
 */
export const getSocket = (): Socket | null => socket;

/**
 * Join vào ride room để nhận/gửi vị trí realtime
 */
export const joinRideRoom = (rideId: string) => {
  if (socket?.connected) {
    socket.emit('ride:join', rideId);
  }
};

/**
 * Leave ride room khi rời màn hình
 */
export const leaveRideRoom = (rideId: string) => {
  if (socket?.connected) {
    socket.emit('ride:leave', rideId);
  }
};

/**
 * Driver gửi vị trí GPS đến passengers trong cùng ride room
 */
export const emitDriverLocation = (rideId: string, latitude: number, longitude: number) => {
  if (socket?.connected) {
    socket.emit('driver:location', { rideId, latitude, longitude });
  }
};
