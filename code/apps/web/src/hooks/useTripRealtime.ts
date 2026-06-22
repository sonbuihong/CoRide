import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/components/providers/socket-provider';
import { SocketEvents, TripSeatUpdatedPayload, TripStatusChangedPayload } from '@repo/shared';

export const useTripRealtime = (tripId: string) => {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected || !tripId) return;

    // Join room khi hook được mount
    socket.emit(SocketEvents.TRIP_JOIN_ROOM, tripId);

    // Lắng nghe các event realtime
    
    // 1. Cập nhật trực tiếp vào cache khi số ghế thay đổi
    const handleSeatUpdated = (payload: TripSeatUpdatedPayload) => {
      if (payload.tripId !== tripId) return;
      
      // Update cache thay vì fetch lại
      queryClient.setQueryData(['trip', tripId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          availableSeats: payload.availableSeats,
          totalSeats: payload.totalSeats,
        };
      });

      // Cũng có thể update list `trips` nếu cần
      // queryClient.invalidateQueries({ queryKey: ['trips'] });
    };

    // 2. Trạng thái chuyến đi thay đổi (cần fetch lại vì có thể ảnh hưởng nhiều field khác)
    const handleStatusChanged = (payload: TripStatusChangedPayload) => {
      if (payload.tripId !== tripId) return;
      // Invalidate để React Query gọi lại REST API lấy data chuẩn
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trip-participants', tripId] });
    };

    const handleParticipantJoined = (payload: any) => {
      if (payload.tripId !== tripId) return;
      queryClient.invalidateQueries({ queryKey: ['trip-participants', tripId] });
    };

    // Khi socket reconnect (e.g., rớt mạng xong có lại), ta cần invalidate query 
    // vì trong lúc mất mạng có thể đã miss event nào đó
    const handleReconnect = () => {
      socket.emit(SocketEvents.TRIP_JOIN_ROOM, tripId); // Join lại room
      queryClient.invalidateQueries({ queryKey: ['trip', tripId] });
      queryClient.invalidateQueries({ queryKey: ['trip-participants', tripId] });
    };

    // Đăng ký event
    socket.on(SocketEvents.TRIP_SEAT_UPDATED, handleSeatUpdated);
    socket.on(SocketEvents.TRIP_STATUS_CHANGED, handleStatusChanged);
    socket.on(SocketEvents.TRIP_PARTICIPANT_JOINED, handleParticipantJoined);
    socket.io.on('reconnect', handleReconnect); // Lắng nghe manager reconnect event

    // Cleanup khi component unmount
    return () => {
      socket.emit(SocketEvents.TRIP_LEAVE_ROOM, tripId);
      socket.off(SocketEvents.TRIP_SEAT_UPDATED, handleSeatUpdated);
      socket.off(SocketEvents.TRIP_STATUS_CHANGED, handleStatusChanged);
      socket.off(SocketEvents.TRIP_PARTICIPANT_JOINED, handleParticipantJoined);
      socket.io.off('reconnect', handleReconnect);
    };
  }, [socket, isConnected, tripId, queryClient]);
};
