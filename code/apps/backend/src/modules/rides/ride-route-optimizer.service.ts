import { Prisma, extendedPrisma as prisma } from '@repo/database';
import { GoongTripWaypoint, SocketEvents } from '@repo/shared';
import goongService from '../goong/goong.service';
import { SocketEventService } from '../../socket/socket.events';

type PendingPoint = { bookingId: string; kind: 'pickup' | 'dropoff' };

export class RideRouteOptimizerService {
  static async refresh(rideId: string): Promise<boolean> {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        vehicle: { select: { type: true } },
        bookings: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED'] },
            isPickedUp: false,
            isDroppedOff: false,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!ride || ride.originLat == null || ride.originLng == null || ride.destinationLat == null || ride.destinationLng == null) return false;

    const points: string[] = [];
    const mapping: PendingPoint[] = [];
    for (const booking of ride.bookings) {
      if (booking.passengerLat != null && booking.passengerLng != null) {
        points.push(`${booking.passengerLat},${booking.passengerLng}`);
        mapping.push({ bookingId: booking.id, kind: 'pickup' });
      }
      if (booking.dropoffLat != null && booking.dropoffLng != null) {
        points.push(`${booking.dropoffLat},${booking.dropoffLng}`);
        mapping.push({ bookingId: booking.id, kind: 'dropoff' });
      }
    }

    // Goong Trip V2 only accepts optimization jobs with at least ten total coordinates.
    if (points.length + 2 < 10) return false;
    const result = await goongService.optimizeTrip(
      `${ride.originLat},${ride.originLng}`,
      points.join(';'),
      `${ride.destinationLat},${ride.destinationLng}`,
      ride.vehicle?.type === 'BIKE' ? 'bike' : 'car',
      false,
    );
    const trip = result?.trips?.[0];
    if (!trip) return false;

    const orderByBooking = new Map<string, { pickup?: number; dropoff?: number }>();
    const optimizedWaypoints = result.waypoints.length === mapping.length
      ? result.waypoints
      : result.waypoints.slice(1, 1 + mapping.length);
    optimizedWaypoints.forEach((waypoint: GoongTripWaypoint, index: number) => {
      const source = mapping[index];
      if (!source) return;
      const current = orderByBooking.get(source.bookingId) || {};
      current[source.kind] = waypoint.waypoint_index;
      orderByBooking.set(source.bookingId, current);
    });

    await prisma.$transaction([
      prisma.ride.update({
        where: { id: rideId },
        data: { routePolyline: trip.geometry, distance: trip.distance / 1000, duration: Math.ceil(trip.duration / 60) },
      }),
      ...ride.bookings.map((booking) => {
        const existing = booking.priceBreakdown && typeof booking.priceBreakdown === 'object' && !Array.isArray(booking.priceBreakdown)
          ? booking.priceBreakdown as Prisma.JsonObject : {};
        return prisma.booking.update({
          where: { id: booking.id },
          data: { priceBreakdown: { ...existing, optimizedWaypointOrder: orderByBooking.get(booking.id) || null } as Prisma.InputJsonValue },
        });
      }),
    ]);

    SocketEventService.emitToRoom(`ride:${rideId}`, SocketEvents.RIDE_UPDATED, {
      rideId, routePolyline: trip.geometry, distance: trip.distance / 1000,
      duration: Math.ceil(trip.duration / 60), optimizedWaypointOrder: Object.fromEntries(orderByBooking),
    });
    return true;
  }

  static refreshInBackground(rideId: string) {
    void this.refresh(rideId).catch((error) => console.warn('[RideRouteOptimizer] refresh failed:', error));
  }
}
