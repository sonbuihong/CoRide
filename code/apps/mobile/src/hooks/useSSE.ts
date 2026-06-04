import { useEffect, useState } from 'react';
import EventSource from 'react-native-eventsource';
import { useAuth } from './useAuth';
import { authStorage } from '../services/auth-storage';

const SSE_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '/notifications/stream') || 'http://localhost:3000/notifications/stream';

export const useSSE = () => {
  const { isAuthenticated } = useAuth();
  const [lastEvent, setLastEvent] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let eventSource: EventSource;

    const connect = async () => {
      const token = await authStorage.getToken();
      if (!token) return;

      eventSource = new EventSource(`${SSE_URL}?token=${token}`);

      eventSource.addEventListener('message', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          setLastEvent(data);
        } catch (e) {
          console.error('Failed to parse SSE event:', e);
        }
      });

      eventSource.addEventListener('error', (error: any) => {
        console.error('SSE Error:', error);
        eventSource.close();
        // Tự động kết nối lại sau 5 giây
        setTimeout(connect, 5000);
      });
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isAuthenticated]);

  return lastEvent;
};
