import { api } from './auth.service';

export interface Ride {
  id: string;
  driverId: string;
  driver: {
    firstName: string;
    lastName: string;
    avatar?: string;
    rating?: number;
  };
  departure: string;
  destination: string;
  departureTime: string;
  availableSeats: number;
  totalSeats: number;
  price: number;
  status: string;
  departureCoords?: { latitude: number; longitude: number };
  destinationCoords?: { latitude: number; longitude: number };
}

export const rideService = {
  async getRides(params?: any) {
    const response = await api.get('/rides', { params });
    return response.data;
  },

  async getRideById(id: string) {
    const response = await api.get(`/rides/${id}`);
    return response.data;
  },

  async searchRides(query: string) {
    const response = await api.get('/rides/search', { params: { query } });
    return response.data;
  },

  async createRide(data: any) {
    const response = await api.post('/rides', data);
    return response.data;
  },

  async getMyRides() {
    const response = await api.get('/rides/my-rides');
    return response.data;
  },

  async updateRideStatus(id: string, status: 'ONGOING' | 'COMPLETED' | 'CANCELLED') {
    const response = await api.patch(`/rides/${id}/status`, { status });
    return response.data;
  },
};
