import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SocketEvents } from '@repo/shared';
import { socketService } from '../services/socket.service';

export const useNotificationRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const refreshNotifications = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socketService.connect();
    socketService.on(SocketEvents.NOTIFICATION_NEW, refreshNotifications);
    socketService.on(SocketEvents.NOTIFICATION_CREATED, refreshNotifications);
    return () => {
      socketService.off(SocketEvents.NOTIFICATION_NEW, refreshNotifications);
      socketService.off(SocketEvents.NOTIFICATION_CREATED, refreshNotifications);
    };
  }, [queryClient]);
};
