import { Socket } from 'socket.io';
import * as jose from 'jose';
import { SOCKET_CONFIG } from '../config/socket';

const getJwtSecret = () => new TextEncoder().encode(SOCKET_CONFIG.JWT_SECRET);

export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth?.token as string | undefined;

  if (!token) {
    // Cho phép khách vô danh kết nối để nhận các event global
    return next();
  }

  try {
    const { payload } = await jose.jwtVerify(token, getJwtSecret());
    const userId = payload.userId as string;

    if (userId) {
      socket.data.userId = userId;
    }
    next();
  } catch (error) {
    const joseErr = error as { code?: string };
    if (joseErr.code === 'ERR_JWT_EXPIRED') {
      return next(new Error('Token đã hết hạn'));
    }
    return next(new Error('Token không hợp lệ'));
  }
};
