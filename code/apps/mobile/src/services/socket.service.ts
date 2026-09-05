import { io, Socket } from 'socket.io-client';
import * as SecureStoreService from './secure-store';
import { SOCKET_URL } from '../config/network';

class SocketService {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;
  private pendingListeners: { event: string; listener: (...args: any[]) => void }[] = [];
  private connectionListeners = new Set<() => void>();
  private joinedRooms = new Map<string, { event: string; args: any[] }>();

  private readonly roomJoinEvents = new Set(['trip:join_room', 'ride:join']);
  private readonly leaveToJoinEvent = new Map([
    ['trip:leave_room', 'trip:join_room'],
    ['ride:leave', 'ride:join'],
  ]);

  public get connected(): boolean {
    return this.socket?.connected || false;
  }

  public getConnectionSnapshot = (): boolean => this.connected;

  public subscribeConnection = (listener: () => void): (() => void) => {
    this.connectionListeners.add(listener);
    return () => {
      this.connectionListeners.delete(listener);
    };
  };

  private notifyConnectionChange(): void {
    this.connectionListeners.forEach((listener) => listener());
  }

  public async connect(): Promise<void> {
    if (this.socket?.connected || this.isConnecting) return;

    // Reuse the existing Socket.IO instance after a failed reconnect. Creating
    // another instance would keep the old listeners alive and duplicate events.
    if (this.socket) {
      this.isConnecting = true;
      this.socket.connect();
      return;
    }

    this.isConnecting = true;
    let token: string | null;
    try {
      token = await SecureStoreService.getAccessToken();
    } catch (error) {
      this.isConnecting = false;
      console.error('SocketService: Không thể đọc phiên đăng nhập:', error);
      this.notifyConnectionChange();
      return;
    }

    if (!token) {
      // Realtime hooks may mount while auth is hydrating or after logout.
      // Missing credentials is an expected state, not a socket failure.
      this.isConnecting = false;
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    // Đăng ký các listener đã được queue trong khi socket chưa kết nối
    this.pendingListeners.forEach(({ event, listener }) => {
      this.socket?.on(event, listener);
    });
    this.pendingListeners = [];


    this.socket.on('connect', () => {
      this.isConnecting = false;
      this.joinedRooms.forEach(({ event, args }) => this.socket?.emit(event, ...args));
      this.notifyConnectionChange();
    });

    this.socket.on('disconnect', () => {
      this.isConnecting = false;
      this.notifyConnectionChange();
    });

    this.socket.on('connect_error', (error) => {
      console.error('SocketService: Lỗi kết nối:', error.message);
      this.isConnecting = false;
      this.notifyConnectionChange();
    });
  }

  public disconnect(): void {
    this.isConnecting = false;
    this.pendingListeners = [];
    this.joinedRooms.clear();
    if (this.socket) {
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
    }
    this.notifyConnectionChange();
  }

  public on(event: string, listener: (...args: any[]) => void): void {
    if (!this.socket) {
      // Thay vì warn, chúng ta lưu vào queue để đăng ký sau khi kết nối
      this.pendingListeners.push({ event, listener });
      return;
    }
    this.socket.on(event, listener);
  }

  public off(event: string, listener?: (...args: any[]) => void): void {
    if (!this.socket) {
      // Xóa khỏi queue nếu chưa kết nối
      this.pendingListeners = this.pendingListeners.filter(
        (l) => l.event !== event || (listener && l.listener !== listener)
      );
      return;
    }
    this.socket.off(event, listener);
  }

  public emit(event: string, ...args: any[]): void {
    const roomId = args[0];
    if (this.roomJoinEvents.has(event) && typeof roomId === 'string') {
      this.joinedRooms.set(`${event}:${roomId}`, { event, args });
    } else {
      const joinEvent = this.leaveToJoinEvent.get(event);
      if (joinEvent && typeof roomId === 'string') this.joinedRooms.delete(`${joinEvent}:${roomId}`);
    }
    if (!this.socket) {
      if (!this.roomJoinEvents.has(event)) {
        console.warn(`SocketService: Không thể emit sự kiện '${event}' vì socket chưa khởi tạo.`);
      }
      return;
    }
    // Socket.IO tự xếp hàng event trong lúc đang reconnect.
    this.socket.emit(event, ...args);
  }
}

// Export dạng Singleton
export const socketService = new SocketService();
