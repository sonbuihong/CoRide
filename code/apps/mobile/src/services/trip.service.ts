import { apiClient } from '../api/client';

export interface TripRequestPayload {
  originAddress: string;
  originLat: number;
  originLng: number;
  destAddress: string;
  destLat: number;
  destLng: number;
  vehicleType: 'BIKE' | 'CAR';
}

export const tripService = {
  createTrip: async (data: TripRequestPayload) => {
    const response = await apiClient.post('/trips', data);
    return response.data;
  },

  getActiveTrip: async () => {
    const response = await apiClient.get('/trips/active');
    return response.data;
  },

  getActiveDriverTrip: async () => {
    const response = await apiClient.get('/trips/active-driver');
    return response.data;
  },

  getTripHistory: async (page = 1, limit = 10) => {
    const response = await apiClient.get('/trips/history', { params: { page, limit } });
    return response.data;
  },

  cancelTrip: async (id: string, reason?: string) => {
    const response = await apiClient.patch(`/trips/${id}/cancel`, { cancelReason: reason });
    return response.data;
  },

  updateTripStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/trips/${id}/status`, { status });
    return response.data;
  },
  
  acceptTrip: async (id: string) => {
    const response = await apiClient.post(`/trips/${id}/accept`);
    return response.data;
  },

  rejectTrip: async (id: string) => {
    const response = await apiClient.post(`/trips/${id}/reject`);
    return response.data;
  }
};
