import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    // In next.js, we can try to get token from cookie or localStorage
    let token = '';
    if (typeof window !== 'undefined') {
      const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
      const cookieToken = match ? match[2] : '';
      token = localStorage.getItem('token') || cookieToken || '';
    }

    socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001', {
      auth: { token },
      autoConnect: false, // We will connect manually
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });
  }
  return socket;
};
