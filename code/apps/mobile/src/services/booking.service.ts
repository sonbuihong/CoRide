import { api } from './auth.service';

export const bookingService = {
  async createBooking(rideId: string, seats: number) {
    const response = await api.post('/bookings', { rideId, seats });
    return response.data;
  },

  async getMyBookings() {
    const response = await api.get('/bookings/my');
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
    const response = await api.post(`/bookings/${id}/cancel`);
    return response.data;
  },
};
