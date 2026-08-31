import type { CreateTripRequestInput, TripStatus } from '@repo/shared';
import { apiClient } from '../api/client';

export interface RideHailingVehicle {
  id: string;
  type: 'BIKE' | 'CAR';
  licensePlate: string;
  color?: string | null;
  imageUrl?: string | null;
}

export interface RideHailingPerson {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  driverRating?: number;
  driverRatingCount?: number;
  passengerRating?: number;
  vehicles?: RideHailingVehicle[];
}

export interface RideHailingTrip {
  id: string;
  passengerId: string;
  driverId?: string | null;
  status: TripStatus;
  originAddress: string;
  originLat: number;
  originLng: number;
  destAddress: string;
  destLat: number;
  destLng: number;
  vehicleType: 'BIKE' | 'CAR';
  estimatedDistance: number;
  estimatedDuration: number;
  estimatedPrice: number;
  finalPrice?: number | null;
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  paymentMethod?: 'CASH' | 'QR' | 'ZALOPAY' | 'WALLET' | null;
  matchedAt?: string | null;
  arrivedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
  passenger?: RideHailingPerson;
  driver?: RideHailingPerson | null;
  reviews?: { id: string; revieweeId: string; rating: number }[];
}

export type ActiveDriverTrip = RideHailingTrip;
export type TripHistoryItem = RideHailingTrip;

export interface TripHistoryPage {
  trips: TripHistoryItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ActiveDriverTripResponse {
  success: boolean;
  data: ActiveDriverTrip | null;
}

export interface ActivePassengerTripResponse {
  success: boolean;
  data: RideHailingTrip | null;
}

export const tripService = {
  async createTrip(data: CreateTripRequestInput): Promise<{ success: boolean; data: RideHailingTrip }> {
    const response = await apiClient.post('/trips', data);
    return response.data;
  },

  async getActiveTrip(): Promise<ActivePassengerTripResponse> {
    const response = await apiClient.get('/trips/active');
    return response.data;
  },

  async getActiveDriverTrip(): Promise<ActiveDriverTripResponse> {
    const response = await apiClient.get('/trips/active-driver');
    return response.data;
  },

  async getTripHistory(page = 1, limit = 10): Promise<TripHistoryPage> {
    const response = await apiClient.get('/trips/history', { params: { page, limit } });
    return response.data.data;
  },

  async getTripById(id: string): Promise<RideHailingTrip> {
    const response = await apiClient.get(`/trips/${id}`);
    return response.data.data;
  },

  async cancelTrip(id: string, reason?: string): Promise<{ success: boolean; data: RideHailingTrip }> {
    const response = await apiClient.patch(`/trips/${id}/cancel`, { cancelReason: reason });
    return response.data;
  },

  async updateTripStatus(id: string, status: TripStatus) {
    const response = await apiClient.patch(`/trips/${id}/status`, { status });
    return response.data;
  },

  async acceptTrip(id: string): Promise<{ success: boolean; data: RideHailingTrip }> {
    const response = await apiClient.post(`/trips/${id}/accept`);
    return response.data;
  },

  async rejectTrip(id: string): Promise<void> {
    await apiClient.post(`/trips/${id}/reject`);
  },

  async setEnRoute(id: string): Promise<{ success: boolean; data: RideHailingTrip }> {
    const response = await apiClient.post(`/trips/${id}/en-route`);
    return response.data;
  },

  async markArrived(id: string): Promise<{ success: boolean; data: RideHailingTrip }> {
    const response = await apiClient.post(`/trips/${id}/arrive`);
    return response.data;
  },

  async startTrip(id: string): Promise<{ success: boolean; data: RideHailingTrip }> {
    const response = await apiClient.post(`/trips/${id}/start`);
    return response.data;
  },

  async completeTrip(
    id: string,
    confirmFarFromDestination = false,
  ): Promise<{ success: boolean; data: RideHailingTrip }> {
    const response = await apiClient.post(`/trips/${id}/complete`, {
      confirmFarFromDestination,
    });
    return response.data;
  },
};
