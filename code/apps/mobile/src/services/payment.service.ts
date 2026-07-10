import { apiClient as api } from '../api/client';

export const paymentService = {
  async createPayment(bookingId: string) {
    const response = await api.post('/payments/create', { bookingId });
    return response.data;
  },
};
