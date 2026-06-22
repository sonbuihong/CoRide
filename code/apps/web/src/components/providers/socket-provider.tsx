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
  const { user } = useAuth();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? (sessionStorage.getItem('accessToken') || localStorage.getItem('token')) : null;
    
    const s = getSocket();
    setSocketInstance(s);

    if (s.connected) {
      if (s.auth && typeof s.auth === 'object' && 'token' in s.auth && s.auth.token !== token) {
         // Nếu token thay đổi (ví dụ login/logout) thì reconnect
         s.disconnect();
         if (token) {
           s.auth = { token };
         } else {
           delete s.auth.token;
         }
         s.connect();
      } else {
         setIsConnected(true);
      }
    } else {
      if (token) {
        s.auth = { token };
      } else if (s.auth && typeof s.auth === 'object' && 'token' in s.auth) {
        delete s.auth.token;
      }
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

    // Cleanup listeners
    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onConnectError);
      
      // Không disconnect singleton ở đây vì có thể component khác vẫn cần. 
      // Disconnect chỉ được gọi khi user logout (user == null ở useEffect).
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketInstance, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

