export enum SocketEvents {
  // Server gửi cho client — Ride-Hailing (TripRequest)
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
  TRIP_DELETED = 'trip:deleted',
  TRIP_NEW_REQUEST = 'trip:new_request',
  TRIP_REQUEST_EXPIRED = 'trip:request_expired',
  TRIP_MATCHED = 'trip:matched',
  TRIP_NO_DRIVER = 'trip:no_driver',
  TRIP_STATUS_UPDATE = 'trip:status_update',
  MESSAGE_CREATED = 'message:created',
  NOTIFICATION_CREATED = 'notification:created',
  NOTIFICATION_NEW = 'notification:new',
  PAYMENT_STATUS_CHANGED = 'payment:status_changed',
  CHAT_RECEIVE = 'chat:receive',
  CHAT_SENT = 'chat:sent',
  DRIVER_LOCATION = 'driver:location',

  // Server gửi cho client — Carpooling (Ride/Booking)
  BOOKING_NEW_REQUEST = 'booking:new_request',      // Driver nhận yêu cầu đặt chỗ mới
  BOOKING_CONFIRMED = 'booking:confirmed',           // Passenger nhận xác nhận
  BOOKING_REJECTED = 'booking:rejected',             // Passenger nhận từ chối
  BOOKING_DRIVER_ARRIVED = 'booking:driver_arrived', // Passenger được báo tài xế đã tới điểm đón
  BOOKING_PICKED_UP = 'booking:picked_up',           // Passenger được thông báo đã đón
  BOOKING_COMPLETED = 'booking:completed',           // Passenger nhận thông báo trả khách
  RIDE_STATUS_UPDATED = 'ride:status',               // Cả 2 nhận khi ride status thay đổi
  RIDE_SEATS_UPDATED = 'ride:seats_updated',         // Broadcast số ghế thay đổi
  RIDE_FULL = 'ride:full',                           // Broadcast khi ride hết chỗ
  RIDE_CREATED = 'ride:created',                     // Broadcast ride mới
  RIDE_UPDATED = 'ride:updated',                     // Broadcast ride được cập nhật
  RIDE_DELETED = 'ride:deleted',                     // Broadcast ride bị xóa

  // Client gửi cho server
  TRIP_JOIN_ROOM = 'trip:join_room',
  TRIP_LEAVE_ROOM = 'trip:leave_room',
  RIDE_JOIN_ROOM = 'ride:join',                      // Client join ride room để nhận realtime
  RIDE_LEAVE_ROOM = 'ride:leave',                    // Client rời ride room
  DRIVER_UPDATE_LOCATION = 'driver:update_location',
  MESSAGE_SEND = 'message:send',

  // System/Auth
  ERROR = 'error',
}

// ─── Base Payload ──────────────────────────────────────────────────────────

export interface BaseEventPayload {
  eventId: string;
  updatedAt: string;
}

// ─── Ride-Hailing Payloads ─────────────────────────────────────────────────

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
  accuracy?: number;
}

// ─── Carpooling Payloads ───────────────────────────────────────────────────

/**
 * Payload khi Driver nhận yêu cầu đặt chỗ mới từ Passenger.
 * Emit tới: user:${driverId}
 */
export interface BookingNewRequestPayload {
  bookingId: string;
  rideId: string;
  passenger: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    avatarUrl?: string | null;
    passengerRating?: number;
  };
  seats: number;
  totalPrice: number;
  origin?: string;
  destination?: string;
  pickupAddress?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  detourKm?: number;
  timeoutSeconds?: number;
  isScheduled?: boolean;
}

/**
 * Payload khi Ride status thay đổi.
 * Emit tới: room ride:${rideId} + user:${passengerId} của từng booking
 */
export interface RideStatusUpdatedPayload {
  rideId: string;
  status: string;
  updatedAt: string;
}

/**
 * Payload khi Booking status thay đổi.
 * Emit tới: user:${passengerId}
 */
export interface BookingStatusChangedPayload {
  bookingId: string;
  rideId?: string;
  status?: string;
  message?: string;
  reason?: string;
  driverLat?: number | null;
  driverLng?: number | null;
}
