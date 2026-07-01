import { getIO } from './socket.server';
import { SocketEvents, BaseEventPayload } from '@repo/shared';

/**
 * Service trung tâm để phát các sự kiện Socket.io.
 * Các Controller/Service của REST API sẽ gọi service này sau khi hoàn thành transaction database.
 */
export class SocketEventService {
  /**
   * Phát sự kiện tới 1 phòng cụ thể (e.g., room của chuyến đi hoặc user)
   */
  static emitToRoom<T = any>(
    room: string,
    event: SocketEvents | string,
    payload: T
  ) {
    try {
      getIO().to(room).emit(event, payload);
    } catch (error) {
      console.error(`[Socket Event Error] Failed to emit ${event} to room ${room}:`, error);
    }
  }

  /**
   * Phát sự kiện tới 1 user cụ thể
   */
  static emitToUser<T = any>(
    userId: string,
    event: SocketEvents | string,
    payload: T
  ) {
    this.emitToRoom(`user:${userId}`, event, payload);
  }

  /**
   * Phát sự kiện tới toàn bộ hệ thống (Global Broadcast)
   */
  static emitGlobal<T = any>(
    event: SocketEvents | string,
    payload: T
  ) {
    try {
      getIO().emit(event, payload);
    } catch (error) {
      console.error(`[Socket Event Error] Failed to emit global ${event}:`, error);
    }
  }
}
