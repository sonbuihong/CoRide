"use client";
import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';

export const useSocket = () => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    const socket = getSocket();
    
    if (!socket.connected) {
      setStatus('connecting');
      socket.connect();
    } else {
      setStatus('connected');
    }

    const onConnect = () => setStatus('connected');
    const onDisconnect = () => setStatus('disconnected');
    const onReconnectAttempt = () => setStatus('connecting');

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
    };
  }, []);

  return { status, socket: getSocket() };
};
