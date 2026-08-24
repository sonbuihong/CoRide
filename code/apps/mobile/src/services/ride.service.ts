import { apiClient as api } from '../api/client';

export interface Ride {
  id: string;
  driverId: string;
  driver: {
    firstName: string;
    lastName: string;
    avatar?: string;
    rating?: number;
    vehicle?: {
      brand?: string;
      model?: string;
      licensePlate?: string;
      color?: string;
    };
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
  matchType?: 'DIRECT' | 'NEARBY' | 'ON_ROUTE';
  matchScore?: number;
  originDistanceKm?: number;
  pickupDistanceKm?: number;
  dropoffDistanceKm?: number;
  detourKm?: number;
  detourRatio?: number;
  routeOverlap?: number;
  expectedPickupTime?: string;
  timeDifferenceMinutes?: number;
}

export interface RideSearchParams {
  origin?: string;
  destination?: string;
  seats?: number;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  date?: string;
}

const normalizeRide = (ride: any): Ride => ({
  ...ride,
  departure: ride.departure ?? ride.origin,
  price: ride.price ?? ride.pricePerSeat,
  totalSeats: ride.totalSeats ?? ride.offeredSeats ?? ride.availableSeats,
  departureCoords: ride.departureCoords ?? (ride.originLat != null && ride.originLng != null
    ? { latitude: ride.originLat, longitude: ride.originLng }
    : undefined),
  destinationCoords: ride.destinationCoords ?? (ride.destinationLat != null && ride.destinationLng != null
    ? { latitude: ride.destinationLat, longitude: ride.destinationLng }
    : undefined),
  driver: {
    ...ride.driver,
    avatar: ride.driver?.avatar ?? ride.driver?.avatarUrl,
    rating: ride.driver?.rating ?? ride.driver?.driverRating,
  },
});

export const rideService = {
  async getRides(params?: RideSearchParams): Promise<Ride[]> {
    const response = await api.get('/rides', { params });
    return (response.data.rides ?? []).map(normalizeRide);
  },

  async getRideById(id: string) {
    const response = await api.get(`/rides/${id}`);
    return normalizeRide(response.data);
  },

  async searchRides(query: string) {
    const response = await api.get('/rides', { params: { destination: query } });
    return (response.data.rides ?? []).map(normalizeRide);
  },

  async createRide(data: any) {
    const response = await api.post('/rides', data);
    return normalizeRide(response.data.ride ?? response.data);
  },

  async getMyRides(): Promise<Ride[]> {
    const response = await api.get('/rides/mine');
    return (response.data.rides ?? []).map(normalizeRide);
  },

  async updateRideStatus(id: string, status: 'ONGOING' | 'COMPLETED' | 'CANCELLED') {
    const response = await api.patch(`/rides/${id}/status`, { status });
    return response.data;
  },
};
