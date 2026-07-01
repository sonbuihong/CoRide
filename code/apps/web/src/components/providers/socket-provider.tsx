'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from './auth-provider';
import { getSocket, connectIfNeeded } from '@/lib/socket-client';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

/**
 * SocketProvider — quản lý vòng đời socket duy nhất cho toàn bộ app.
 *
 * Chống React Strict Mode (dev chạy effect 2 lần):
 * - Logic connect/reconnect nằm trong socket-client.ts (module-level, ngoài React)
 * - connectIfNeeded() là idempotent — gọi 100 lần cũng chỉ connect 1 lần
 * - SocketProvider chỉ làm 2 việc:
 *   1. Gắn event listeners để đồng bộ isConnected state
 *   2. Gọi connectIfNeeded() khi auth state thay đổi
 */
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const { user, loading: authLoading } = useAuth();

  // Socket instance lấy 1 lần, không bao giờ thay đổi (singleton)
  const socketRef = useRef<Socket>(getSocket());

  // Effect: Gắn core event listeners (connect/disconnect/error)
  // Chỉ gắn 1 lần duy nhất nhờ dependency [] và guard listenersAttached
  useEffect(() => {
    const socket = socketRef.current;

    const onConnect = () => {
      console.log('[SocketProvider] Connected:', socket.id);
      setIsConnected(true);
    };

    const onDisconnect = (reason: string) => {
      console.log('[SocketProvider] Disconnected:', reason);
      setIsConnected(false);
    };

    const onConnectError = (error: Error) => {
      console.error('[SocketProvider] Connection error:', error.message);
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    // Đồng bộ state nếu socket đã connected (HMR / Fast Refresh)
    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      // Cleanup listeners khi unmount (Strict Mode unmount hoặc app close)
      // Socket KHÔNG bị disconnect — singleton vẫn sống
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, []);

  // Effect: Connect/reconnect khi auth state thay đổi
  // connectIfNeeded() tự kiểm tra trùng lặp ở module-level
  // → An toàn khi Strict Mode gọi effect này 2 lần
  useEffect(() => {
    if (authLoading) return;
    // connectIfNeeded() kiểm tra:
    // 1. Đã connected với đúng token → bỏ qua (return true)
    // 2. Đang connecting → bỏ qua (return false)
    // 3. Token khác → disconnect + connect (1 lần duy nhất)
    // 4. Chưa connected → connect (1 lần duy nhất)
    connectIfNeeded();
  }, [user, authLoading]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
