import { io, Socket } from 'socket.io-client';
import * as SecureStoreService from './secure-store';
import { Platform } from 'react-native';

let SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://10.0.2.2:5001';

if (Platform.OS !== 'android') {
  SOCKET_URL = SOCKET_URL.replace('10.0.2.2', 'localhost');
}

class SocketService {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;
  private pendingListeners: { event: string; listener: (...args: any[]) => void }[] = [];

  public async connect(): Promise<void> {
    if (this.socket?.connected || this.isConnecting) return;

    this.isConnecting = true;
    const token = await SecureStoreService.getAccessToken();

    if (!token) {
      console.warn('SocketService: Không có token để kết nối.');
      this.isConnecting = false;
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
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
    if (!this.socket?.connected) {
      console.warn(`SocketService: Không thể emit sự kiện '${event}' vì socket chưa kết nối.`);
      return;
    }
    this.socket.emit(event, ...args);
  }
}

// Export dạng Singleton
export const socketService = new SocketService();
