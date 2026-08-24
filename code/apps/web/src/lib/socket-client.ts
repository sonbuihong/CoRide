import { io, Socket } from 'socket.io-client';

/**
 * Singleton Socket Client — đảm bảo toàn bộ app chỉ dùng 1 instance duy nhất.
 *
 * Thiết kế quan trọng:
 * - autoConnect = false: chỉ connect khi SocketProvider gọi connectIfNeeded()
 * - auth là function callback: mỗi lần connect/reconnect đều lấy token mới nhất
 *   từ sessionStorage tại thời điểm đó (không cache token cũ)
 * - reconnection = true: socket.io-client tự retry khi mất mạng
 * - KHÔNG disconnect khi connect_error: để socket.io-client tự retry
 *
 * Chống Strict Mode / HMR:
 * - Dùng module-level flags (_isConnecting, _connectedToken) thay vì React refs
 * - Các flag này tồn tại ngoài React lifecycle, không bị reset khi component re-mount
 */

let _instance: Socket | null = null;
// Token mà socket đang connected hoặc đang connecting
let _connectedToken: string | null = null;
// Tránh gọi connect() trùng lặp khi nhiều effect chạy gần nhau
let _isConnecting = false;

function getToken(): string {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('accessToken') || localStorage.getItem('token') || '';
  }
  return '';
}

function createSocket(): Socket {
  // REST API và Socket.IO cùng kết nối qua cổng public của API Gateway.
  const SOCKET_URL =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ||
    'http://localhost:5001';

  const socket = io(SOCKET_URL, {
    auth: (cb) => {
      // Callback chạy tại thời điểm connect/reconnect — luôn lấy token mới nhất
      cb({ token: getToken() });
    },
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    // Bắt buộc dùng websocket transport trực tiếp — bỏ qua polling
    // Polling yêu cầu proxy hỗ trợ sticky session, không phù hợp với setup hiện tại
    transports: ['websocket'],
  });

  // Log nhưng KHÔNG disconnect — để socket.io-client tự retry
  // Trừ khi lỗi là do Auth (Token không hợp lệ) thì disconnect để tránh vòng lặp
  socket.on('connect_error', (err) => {
    _isConnecting = false;
    console.warn('[Socket] Connection error:', err.message);
    if (err.message.includes('Token không hợp lệ') || err.message.includes('hết hạn')) {
      console.warn('[Socket] Dừng auto-retry vì lỗi xác thực.');
      socket.disconnect();
    }
  });

  socket.on('connect', () => {
    _isConnecting = false;
    _connectedToken = getToken();
  });

  socket.on('disconnect', () => {
    _isConnecting = false;
  });

  return socket;
}

/**
 * Lấy singleton socket instance. Không connect — chỉ tạo instance.
 */
export function getSocket(): Socket {
  if (!_instance) {
    _instance = createSocket();
  }
  return _instance;
}

/**
 * Connect socket nếu chưa connected, hoặc reconnect nếu token đã thay đổi.
 * An toàn khi gọi nhiều lần (idempotent) — module-level flags chặn duplicate.
 *
 * Return: true nếu đã/đang connected, false nếu cần chờ.
 */
export function connectIfNeeded(): boolean {
  const socket = getSocket();
  const currentToken = getToken();

  // Đã connected với đúng token → không cần làm gì
  if (socket.connected && _connectedToken === currentToken) {
    return true;
  }

  // Đang trong quá trình connect → không gọi lại
  if (_isConnecting) {
    return false;
  }

  if (socket.connected && _connectedToken !== currentToken) {
    // Token thay đổi (login/logout) → reconnect để auth callback lấy token mới
    _isConnecting = true;
    _connectedToken = currentToken;
    socket.disconnect();
    socket.connect();
    return false;
  }

  // Chưa connected → connect
  _isConnecting = true;
  _connectedToken = currentToken;
  socket.connect();
  return false;
}

/**
 * Disconnect hoàn toàn và phá singleton.
 * Chỉ dùng khi user logout hoàn toàn.
 */
export function disconnectSocket(): void {
  if (_instance) {
    _instance.removeAllListeners();
    _instance.disconnect();
    _instance = null;
    _connectedToken = null;
    _isConnecting = false;
  }
}
