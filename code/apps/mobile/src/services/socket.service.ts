import { io, Socket } from 'socket.io-client';
import * as SecureStoreService from './secure-store';
import { SOCKET_URL } from '../config/network';

class SocketService {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;
  private pendingListeners: { event: string; listener: (...args: any[]) => void }[] = [];

  public get connected(): boolean {
    return this.socket?.connected || false;
  }

  public async connect(): Promise<void> {
    if (this.socket?.connected || this.isConnecting) return;

    this.isConnecting = true;
    const token = await SecureStoreService.getAccessToken();

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
      console.log('SocketService: Đã kết nối, socket ID:', this.socket?.id);
      this.isConnecting = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('SocketService: Đã ngắt kết nối, lý do:', reason);
      this.isConnecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('SocketService: Lỗi kết nối:', error.message);
      this.isConnecting = false;
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('SocketService: Đã chủ động ngắt kết nối.');
    }
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
    if (!this.socket) {
      console.warn(`SocketService: Không thể emit sự kiện '${event}' vì socket chưa khởi tạo.`);
      return;
    }
    // Socket.IO tự xếp hàng event trong lúc đang reconnect.
    this.socket.emit(event, ...args);
  }
}

// Export dạng Singleton
export const socketService = new SocketService();
