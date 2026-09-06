import { apiClient as api } from '../api/client';

export interface SimulatorQrData {
  qrUrl: string;
  amount: number;
  description: string;
}

export const paymentService = {
  async getWallet() {
    const response = await api.get('/payments/wallet');
    return response.data.data;
  },
  async getSimulatorQr(id: string): Promise<{ success: boolean; data: SimulatorQrData }> {
    const response = await api.get(`/payments/simulator/qr/${id}`);
    return response.data;
  },

  async confirmSimulatorPayment(id: string) {
    const response = await api.post('/payments/simulator/confirm', { id });
    return response.data;
  },

  async deposit(amount: number, method: string = 'SIMULATOR') {
    const response = await api.post('/payments/wallet/deposit', { amount, method });
    return response.data;
  },

  async withdraw(data: {
    amount: number;
    source: 'driverEarnings' | 'rideBalance';
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }) {
    const response = await api.post('/payments/wallet/withdraw', data);
    return response.data;
  },
};
