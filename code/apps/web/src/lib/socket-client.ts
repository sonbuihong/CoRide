import { io, Socket } from 'socket.io-client';

class SocketClient {
  private static instance: Socket | null = null;

  public static getInstance(): Socket {
    if (!SocketClient.instance) {
      // Hàm lấy token, ưu tiên sessionStorage do api-client đang dùng
      const getToken = () => {
        if (typeof window !== 'undefined') {
          return sessionStorage.getItem('accessToken') || localStorage.getItem('token') || '';
        }
        return '';
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001';

      SocketClient.instance = io(API_URL, {
        auth: (cb) => {
          // Lấy token ngay tại thời điểm socket chuẩn bị connect hoặc reconnect
          cb({ token: getToken() });
        },
        autoConnect: false, // Connect thủ công qua SocketProvider
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 5000,
      });

      // Lắng nghe lỗi xác thực (thường là token hết hạn)
      SocketClient.instance.on('connect_error', (err) => {
        if (err.message.includes('hết hạn') || err.message.includes('không hợp lệ')) {
          console.error('[Socket] Lỗi xác thực:', err.message);
          // TODO: Nếu dùng Axios Interceptor để tự refresh token thì nó đã xử lý bên HTTP.
          // Đối với socket, ta ngắt kết nối tạm thời. Khi request HTTP nào đó thành công (refresh token được cập nhật)
          // ta có thể gọi socket.connect() lại.
          SocketClient.instance?.disconnect();
        }
      });
    }

    return SocketClient.instance;
  }

  public static disconnect() {
    if (SocketClient.instance) {
      SocketClient.instance.disconnect();
      SocketClient.instance = null; // Reset để lần sau tạo socket mới (có token mới nếu user khác)
    }
  }
}

export const getSocket = () => SocketClient.getInstance();
export const disconnectSocket = () => SocketClient.disconnect();
