import { randomUUID } from 'crypto';
import { SocketEvents, type TripStatus, type TripUpdatedPayload } from '@repo/shared';
import { SocketEventService } from '../../socket/socket.events';

interface RealtimeTrip {
  id: string;
  status: TripStatus;
  passengerId: string;
  driverId: string | null;
  updatedAt: Date | string;
}

export function emitTripUpdated(
  trip: RealtimeTrip,
  options?: { previousStatus?: TripStatus; message?: string },
): TripUpdatedPayload {
  const payload: TripUpdatedPayload = {
    eventId: randomUUID(),
    tripId: trip.id,
    status: trip.status,
    previousStatus: options?.previousStatus,
    passengerId: trip.passengerId,
    driverId: trip.driverId,
    updatedAt: new Date(trip.updatedAt).toISOString(),
    message: options?.message,
  };

  SocketEventService.emitToRooms([
    `user:${trip.passengerId}`,
    ...(trip.driverId ? [`user:${trip.driverId}`] : []),
    `trip:${trip.id}`,
  ], SocketEvents.TRIP_UPDATED, payload);
  return payload;
}
