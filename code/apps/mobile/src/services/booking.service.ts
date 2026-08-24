import { apiClient as api } from '../api/client';

export const bookingService = {
  async createBooking(rideId: string, seats: number) {
    const response = await api.post('/bookings', { rideId, seats });
    return response.data;
  },

  async getMyBookings() {
    const response = await api.get('/bookings/my');
    return response.data;
  },

  async getDriverBookings() {
    const response = await api.get('/bookings/driver');
    return response.data;
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

  async getActiveBooking() {
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
