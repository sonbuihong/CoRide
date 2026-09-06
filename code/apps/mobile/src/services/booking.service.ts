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
  allowRoutePickup?: boolean;
  routePickupSharingEnabled?: boolean;
  updatedAt?: string;
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
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  driverArrivedAt?: string | null;
  pickedUpAt?: string | null;
  droppedOffAt?: string | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  priceBreakdown?: unknown;
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

export interface CreateBookingOptions {
  pickupStopId?: string;
  passengerLat?: number;
  passengerLng?: number;
  pickupAddress?: string;
  dropoffLat?: number;
  dropoffLng?: number;
  dropoffAddress?: string;
  paymentMethod?: 'WALLET' | 'CASH' | 'QR';
}

export const bookingService = {
  async createBooking(rideId: string, seats: number, options: CreateBookingOptions = {}) {
    const response = await api.post('/bookings', { rideId, seats, ...options });
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

  async cancelBooking(id: string, cancelReason: string) {
    const response = await api.patch(`/bookings/${id}/cancel`, { cancelReason });
    return response.data;
  },

  async getActiveBooking(role?: string): Promise<ActiveDriverBooking | null> {
    const response = await api.get('/bookings/active', {
      params: role ? { role } : undefined,
    });
    return response.data.activeBooking;
  },

  async confirmPickup(bookingId: string) {
    const response = await api.patch(`/bookings/${bookingId}/pickup`);
    return response.data;
  },

  async markDriverArrived(bookingId: string) {
    const response = await api.patch(`/bookings/${bookingId}/arrived`);
    return response.data;
  },

  async dropoffPassenger(bookingId: string) {
    const response = await api.patch(`/bookings/${bookingId}/dropoff`);
    return response.data;
  },
};
