import apiClient from '@/lib/api-client';

export type ActivityRole = 'PASSENGER' | 'DRIVER';
export type ActivitySegment = 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
export interface ActivityItem {
  id: string; source: 'CARPOOL_BOOKING' | 'CARPOOL_RIDE' | 'RIDE_HAILING'; role: ActivityRole;
  status: string; segment: ActivitySegment; origin: string; destination: string;
  departureTime: string | null; sortAt: string; price: number | null; seats: number | null;
  availableSeats: number | null; distanceKm: number | null; durationMinutes: number | null;
  relatedUser: { id: string; name: string; avatarUrl: string | null; rating: number | null } | null;
  nextPassenger: { id: string; name: string; avatarUrl: string | null } | null;
  vehicle: { id: string; type: string; licensePlate: string; color: string | null } | null;
  cancellationReason: string | null; rideId: string | null; bookingId: string | null;
  tripId: string | null; chatRideId: string | null;
}
export interface ActivitiesPage { items: ActivityItem[]; counts: Record<ActivitySegment, number>; nextCursor: string | null; }
export const activityService = {
  async list(role: ActivityRole, segment: ActivitySegment): Promise<ActivitiesPage> {
    const response = await apiClient.get('/activities', { params: { role, segment, limit: 50 } });
    return response.data;
  },
};
