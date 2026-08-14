import { Server, Socket } from 'socket.io';
import { SocketEvents, TripLocationUpdatedPayload } from '@repo/shared';
import { extendedPrisma as prisma } from '@repo/database';
import { updateDriverLocation, refreshDriverOnline } from '../../shared/lib/redis';
import { SocketEventService } from '../../socket/socket.events';

export const registerTripsSocket = (io: Server, socket: Socket, userId: string) => {
  // Cache vai trò user trong mỗi trip room
  if (!socket.data.tripRoles) {
    socket.data.tripRoles = {} as Record<string, string>;
  }

  // Lắng nghe yêu cầu join room chuyến đi
  socket.on(SocketEvents.TRIP_JOIN_ROOM, async (tripId: string) => {
    if (typeof tripId !== 'string' || !tripId) return;

    try {
      // Kiểm tra xem chuyến đi này là Ride (Carpooling) hay TripRequest (Ride-Hailing)
      // Giả sử user muốn join vào Ride (Carpooling) trước tiên
      const ride = await prisma.ride.findFirst({
        where: {
          id: tripId,
          OR: [
            { driverId: userId },
            { bookings: { some: { passengerId: userId, status: 'CONFIRMED' } } },
          ],
        },
        select: { driverId: true },
      });

      if (!ride) {
        socket.emit(SocketEvents.ERROR, { message: 'Bạn không có quyền truy cập chuyến đi này' });
        return;
      }

      const roomName = `trip:${tripId}`;
      socket.join(roomName);
      
      // Cache role để kiểm tra quyền phát vị trí tài xế
      socket.data.tripRoles[tripId] = ride.driverId === userId ? 'DRIVER' : 'PASSENGER';
      console.log(`[Socket] User ${userId} joined ${roomName} as ${socket.data.tripRoles[tripId]}`);
    } catch (error) {
      console.error('[Socket] TRIP_JOIN_ROOM error:', error);
      socket.emit(SocketEvents.ERROR, { message: 'Lỗi khi join trip room' });
    }
  });

  // Client leave room
  socket.on(SocketEvents.TRIP_LEAVE_ROOM, (tripId: string) => {
    if (typeof tripId !== 'string') return;
    const roomName = `trip:${tripId}`;
    socket.leave(roomName);
    delete socket.data.tripRoles[tripId];
    console.log(`[Socket] User ${userId} left trip room ${roomName}`);
  });

  // Tài xế gửi vị trí
  socket.on(SocketEvents.DRIVER_UPDATE_LOCATION, async (data: { tripId: string; latitude: number; longitude: number; heading?: number; speed?: number; accuracy?: number }) => {
    if (
      !data || typeof data.tripId !== 'string' ||
      !Number.isFinite(data.latitude) || !Number.isFinite(data.longitude) ||
      data.latitude < -90 || data.latitude > 90 ||
      data.longitude < -180 || data.longitude > 180 ||
      (data.accuracy != null && (!Number.isFinite(data.accuracy) || data.accuracy > 100))
    ) return;
    
    // Kiểm tra quyền: chỉ driver thật mới được gửi vị trí
    if (socket.data.tripRoles?.[data.tripId] !== 'DRIVER') return;

    try {
      // Cập nhật lên Redis (dùng cho backend)
      const updatedAt = Date.now();
      await Promise.all([
        updateDriverLocation(userId, data.latitude, data.longitude, {
          rideId: data.tripId,
          accuracy: data.accuracy,
          updatedAt,
        }),
        refreshDriverOnline(userId),
      ]);

      // Broadcast tới tất cả user trong room ngoại trừ người gửi
      const roomName = `trip:${data.tripId}`;
      const payload: TripLocationUpdatedPayload = {
        eventId: `loc_${Date.now()}_${userId}`,
        updatedAt: new Date(updatedAt).toISOString(),
        tripId: data.tripId,
        driverId: userId,
        latitude: data.latitude,
        longitude: data.longitude,
        heading: data.heading,
        speed: data.speed,
        accuracy: data.accuracy,
      };

      socket.to(roomName).emit(SocketEvents.TRIP_LOCATION_UPDATED, payload);
      socket.to(`ride:${data.tripId}`).emit(SocketEvents.DRIVER_LOCATION, payload);
    } catch (error) {
      console.error('[Socket] DRIVER_UPDATE_LOCATION error:', error);
    }
  });
};
