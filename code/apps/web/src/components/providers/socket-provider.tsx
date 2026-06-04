'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-provider';

/**
 * SocketProvider — Quản lý kết nối Socket.IO tập trung cho toàn bộ ứng dụng.
 *
 * Kiến trúc:
 * - Tự động connect khi phát hiện user từ AuthProvider
 * - Tự động disconnect khi user logout
 * - Expose socket instance qua Context để mọi component con dùng useSocket()
 */

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
  : 'http://localhost:5001';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Chỉ kết nối khi có user (đã đăng nhập)
    const token = localStorage.getItem('accessToken');
    
    if (!user || !token) {
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    // Cleanup khi user thay đổi hoặc unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

