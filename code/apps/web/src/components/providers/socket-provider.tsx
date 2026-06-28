'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from './auth-provider';
import { getSocket, disconnectSocket } from '@/lib/socket-client';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Chờ auth loading xong mới xử lý socket
    // Tránh race condition: connect với token rỗng khi app vừa mount
    if (authLoading) return;

    const token = typeof window !== 'undefined'
      ? (sessionStorage.getItem('accessToken') || localStorage.getItem('token'))
      : null;

    // Không có user và không có token → ngắt socket nếu đang kết nối
    if (!user && !token) {
      disconnectSocket();
      setSocketInstance(null);
      setIsConnected(false);
      return;
    }

    const s = getSocket();
    setSocketInstance(s);

    if (s.connected) {
      const currentToken = (s.auth && typeof s.auth === 'object' && 'token' in s.auth)
        ? (s.auth as { token: string }).token
        : null;

      if (currentToken !== token) {
        // Token thay đổi (login/logout/refresh) → reconnect với token mới
        s.disconnect();
        if (token) {
          // Cập nhật auth object trong socket để reconnect dùng token mới
          Object.assign(s.auth as object, { token });
        }
        s.connect();
      } else {
        setIsConnected(true);
      }
    } else {
      // Chưa connect → connect với token hiện tại
      // socket-client dùng auth callback nên token được lấy tại thời điểm connect
      s.connect();
    }

    const onConnect = () => {
      console.log('[Socket] Connected:', s.id);
      setIsConnected(true);
    };

    const onDisconnect = (reason: string) => {
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
    };

    const onConnectError = (error: Error) => {
      console.error('[Socket] Connection error:', error.message);
      setIsConnected(false);
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onConnectError);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onConnectError);
      // Singleton không disconnect ở đây — chỉ bỏ listeners
    };
  }, [user, authLoading]);

  return (
    <SocketContext.Provider value={{ socket: socketInstance, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
