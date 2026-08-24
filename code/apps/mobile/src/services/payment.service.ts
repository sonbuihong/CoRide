import { apiClient as api } from '../api/client';

export const paymentService = {
  async getWallet() {
    const response = await api.get('/payments/wallet');
    return response.data.data;
  },
  async getSimulatorQr(id: string) {
    const response = await api.get(`/payments/simulator/qr/${id}`);
    return response.data;
  },

  async confirmSimulatorPayment(id: string) {
    const response = await api.post('/payments/simulator/confirm', { id });
    return response.data;
  },
};
