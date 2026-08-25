import { apiClient as api } from '../api/client';

export interface DriverBookingPassenger {
  id: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  phone?: string;
  passengerRating?: number;
  passengerRatingCount?: number;
}

export interface DriverBookingRide {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  status: string;
  distance?: number;
  duration?: number;
  originLat?: number | null;
  originLng?: number | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  routePolyline?: string | null;
}

export interface DriverBookingMatching {
  matchScore?: number;
  detourKm?: number;
  pickupDistanceKm?: number;
  dropoffDistanceKm?: number;
  expectedPickupTime?: string;
}

export interface DriverBookingSummary {
  id: string;
  seats: number;
  totalPrice: number;
  status: string;
  detourKm?: number;
  additionalTimeMinutes?: number;
  passengerLat?: number | null;
  passengerLng?: number | null;
  pickupAddress?: string | null;
  dropoffAddress?: string | null;
  isPickedUp: boolean;
  isDroppedOff: boolean;
  createdAt?: string;
  matching?: DriverBookingMatching | null;
  passenger: DriverBookingPassenger;
  ride: DriverBookingRide;
}

export interface ActiveDriverBooking {
  id?: string;
  status?: string;
  userRole?: 'DRIVER' | 'PASSENGER';
  passenger?: DriverBookingPassenger;
  ride?: DriverBookingRide & {
    availableSeats?: number;
    updatedAt?: string;
    bookings?: DriverBookingSummary[];
  };
}

export interface DriverBookingsResponse {
  bookings: DriverBookingSummary[];
}

export const bookingService = {
  async createBooking(rideId: string, seats: number, pickupStopId?: string) {
    const response = await api.post('/bookings', { rideId, seats, pickupStopId });
    return response.data;
  },

  async getMyBookings() {
    const response = await api.get('/bookings/my');
    return response.data;
  },

  async getDriverBookings(): Promise<DriverBookingsResponse> {
    const response = await api.get('/bookings/driver');
    return { bookings: response.data.bookings ?? response.data ?? [] };
  },

  async getBookingById(id: string) {
    const response = await api.get(`/bookings/${id}`);
    return response.data.booking;
  },

  async updateBookingStatus(id: string, status: 'CONFIRMED' | 'REJECTED') {
    const response = await api.patch(`/bookings/${id}/status`, { status });
    return response.data;
  },

  async cancelBooking(id: string) {
    const response = await api.patch(`/bookings/${id}/cancel`);
    return response.data;
  },

  async getActiveBooking(): Promise<ActiveDriverBooking | null> {
    const response = await api.get('/bookings/active');
    return response.data.activeBooking;
  },

  async confirmPickup(bookingId: string) {
    const response = await api.patch(`/bookings/${bookingId}/pickup`);
    return response.data;
  },

  async dropoffPassenger(bookingId: string) {
    const response = await api.patch(`/bookings/${bookingId}/dropoff`);
    return response.data;
  },
};
