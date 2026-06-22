export enum SocketEvents {
  // Server gửi cho client
  TRIP_CREATED = 'trip:created',
  TRIP_UPDATED = 'trip:updated',
  TRIP_CANCELLED = 'trip:cancelled',
  TRIP_STATUS_CHANGED = 'trip:status_changed',
  TRIP_SEAT_UPDATED = 'trip:seat_updated',
  TRIP_LOCATION_UPDATED = 'trip:location_updated',
  TRIP_PARTICIPANT_JOINED = 'trip:participant_joined',
  TRIP_PARTICIPANT_LEFT = 'trip:participant_left',
  TRIP_JOIN_REQUEST_CREATED = 'trip:join_request_created',
  TRIP_JOIN_REQUEST_ACCEPTED = 'trip:join_request_accepted',
  TRIP_JOIN_REQUEST_REJECTED = 'trip:join_request_rejected',
  MESSAGE_CREATED = 'message:created',
  NOTIFICATION_CREATED = 'notification:created',
  PAYMENT_STATUS_CHANGED = 'payment:status_changed',

  // Client gửi cho server
  TRIP_JOIN_ROOM = 'trip:join_room',
  TRIP_LEAVE_ROOM = 'trip:leave_room',
  DRIVER_UPDATE_LOCATION = 'driver:update_location',
  MESSAGE_SEND = 'message:send',

  // System/Auth
  ERROR = 'error',
}

// Payloads

export interface BaseEventPayload {
  eventId: string;
  updatedAt: string;
}

export interface TripSeatUpdatedPayload extends BaseEventPayload {
  tripId: string;
  availableSeats: number;
  totalSeats: number;
}

export interface TripStatusChangedPayload extends BaseEventPayload {
  tripId: string;
  previousStatus: string;
  currentStatus: string;
}

export interface TripLocationUpdatedPayload extends BaseEventPayload {
  tripId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

// Thêm các interfaces payload khác tùy nhu cầu...
