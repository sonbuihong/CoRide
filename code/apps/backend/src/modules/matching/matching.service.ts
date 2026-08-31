import { extendedPrisma as prisma } from '@repo/database';
import { SocketEvents, type TripOfferPayload } from '@repo/shared';

import { SocketEventService } from '../../socket/socket.events';
import { AppError } from '../../shared/errors/AppError';
import {
  clearDriverBusy,
  clearTripOffer,
  clearTripOffers,
  findNearbyDrivers,
  getDriverLocation,
  hasTripOffer,
  isDriverBusy,
  isDriverOnline,
  offerTripToDrivers,
  setDriverBusy,
} from '../../shared/lib/redis';
import { NotificationsService } from '../notifications/notifications.service';
import { emitTripUpdated } from '../trips/trip-realtime.service';
import { ACTIVE_DRIVER_TRIP_STATUSES } from '../trips/trip-state-machine';
import { RIDE_HAILING_CONFIG } from './matching.config';
import {
  buildDispatchWaves,
  dispatchWavesSequentially,
  rankRideHailingCandidates,
  type DriverRouteCandidate,
  type ScoredDriverCandidate,
} from './ride-hailing-matcher';

interface MatchingTrip {
  id: string;
  passengerId: string;
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
  maxAttempts: number;
  matchRadius: number;
  passenger: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    passengerRating: number;
  };
}

const isPrismaUniqueError = (error: unknown): boolean => (
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
);

export class MatchingService {
  static async startMatching(tripId: string): Promise<void> {
    const initialTrip = await this.getMatchingTrip(tripId);
    if (!initialTrip) return;

    if (initialTrip.status === 'PENDING') {
      const started = await prisma.tripRequest.updateMany({
        where: { id: tripId, status: 'PENDING' },
        data: { status: 'MATCHING' },
      });
      if (started.count === 0) return;
    } else if (initialTrip.status !== 'MATCHING') {
      return;
    }

    const trip = await this.getMatchingTrip(tripId);
    if (!trip || trip.status !== 'MATCHING') return;

    emitTripUpdated(trip, {
      previousStatus: initialTrip.status,
      message: 'Đang tìm tài xế phù hợp với tuyến đường của bạn.',
    });

    const searchStartedAt = Date.now();
    const attemptedDriverIds = new Set<string>();
    let attempts = trip.matchAttempts;
    const radii = [...new Set([
      trip.matchRadius,
      ...RIDE_HAILING_CONFIG.SEARCH_RADII_KM,
    ])].sort((a, b) => a - b);

    for (const radiusKm of radii) {
      if (
        attempts >= trip.maxAttempts ||
        Date.now() - searchStartedAt >= RIDE_HAILING_CONFIG.SEARCH_TIMEOUT_MS
      ) break;

      const nearbyDrivers = await findNearbyDrivers(trip.originLat, trip.originLng, radiusKm);
      const candidates = await this.loadAndRankCandidates(
        trip,
        nearbyDrivers.filter(({ driverId }) => !attemptedDriverIds.has(driverId)),
      );
      const remaining = Math.max(0, trip.maxAttempts - attempts);
      const waves = buildDispatchWaves(
        candidates.slice(0, remaining),
        RIDE_HAILING_CONFIG.DISPATCH_BATCH_SIZE,
      );

      const accepted = await dispatchWavesSequentially(
        waves,
        async (wave) => {
          wave.forEach(({ driverId }) => attemptedDriverIds.add(driverId));
          attempts += wave.length;
          return this.dispatchWave(trip, wave, attempts, searchStartedAt);
        },
        () => Date.now() - searchStartedAt < RIDE_HAILING_CONFIG.SEARCH_TIMEOUT_MS,
      );
      if (accepted) return;
    }

    await this.noDriverFound(tripId);
  }

  static async handleDriverAccept(tripId: string, driverId: string) {
    const offered = await hasTripOffer(tripId, driverId);
    if (!offered) {
      throw new AppError(
        'Yêu cầu chuyến không còn hiệu lực hoặc chưa được gửi tới bạn',
        403,
        true,
        'TRIP_NOT_OFFERED',
      );
    }

    const [driver, activeTrip] = await Promise.all([
      prisma.user.findUnique({
        where: { id: driverId },
        select: {
          isDriverVerified: true,
          vehicles: {
            where: { status: 'ACTIVE' },
            select: { id: true, type: true },
          },
        },
      }),
      prisma.tripRequest.findFirst({
        where: { driverId, status: { in: ACTIVE_DRIVER_TRIP_STATUSES } },
        select: { id: true },
      }),
    ]);

    if (!driver?.isDriverVerified) {
      throw new AppError('Bạn cần xác thực tài xế trước khi nhận chuyến', 403);
    }
    if (activeTrip) {
      throw new AppError(
        'Bạn đang có một chuyến chưa hoàn thành',
        409,
        true,
        'DRIVER_HAS_ACTIVE_TRIP',
      );
    }

    const tripSnapshot = await prisma.tripRequest.findUnique({
      where: { id: tripId },
      select: { passengerId: true, status: true, vehicleType: true },
    });
    if (!tripSnapshot) throw new AppError('Không tìm thấy chuyến xe', 404);
    if (!driver.vehicles.some(({ type }) => type === tripSnapshot.vehicleType)) {
      throw new AppError('Bạn không có phương tiện phù hợp với chuyến này', 403);
    }

    let claimed: { count: number };
    try {
      claimed = await prisma.tripRequest.updateMany({
        where: { id: tripId, status: 'MATCHING', driverId: null },
        data: { driverId, status: 'ACCEPTED', matchedAt: new Date() },
      });
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        throw new AppError(
          'Bạn hoặc chuyến xe này đã được gán cho một hành trình khác',
          409,
          true,
          'TRIP_ALREADY_ACCEPTED',
        );
      }
      throw error;
    }

    if (claimed.count !== 1) {
      throw new AppError(
        'Chuyến đi đã được tài xế khác nhận',
        409,
        true,
        'TRIP_ALREADY_ACCEPTED',
      );
    }

    const updatedTrip = await prisma.tripRequest.findUnique({
      where: { id: tripId },
      include: {
        passenger: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
            passengerRating: true,
          },
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
            driverRating: true,
            driverRatingCount: true,
            vehicles: {
              where: { status: 'ACTIVE' },
              take: 1,
              select: { id: true, type: true, licensePlate: true, color: true, imageUrl: true },
            },
          },
        },
      },
    });
    if (!updatedTrip) throw new AppError('Không tìm thấy chuyến xe sau khi nhận', 404);

    await setDriverBusy(driverId, tripId);
    const assignment = await prisma.tripRequest.findUnique({
      where: { id: tripId },
      select: { driverId: true, status: true },
    });
    if (assignment?.driverId !== driverId || assignment.status !== 'ACCEPTED') {
      await clearDriverBusy(driverId);
      throw new AppError(
        'Trạng thái chuyến đã thay đổi trong khi nhận chuyến',
        409,
        true,
        'TRIP_STATE_CONFLICT',
      );
    }
    const offeredDriverIds = await clearTripOffers(tripId);
    offeredDriverIds
      .filter((offeredDriverId) => offeredDriverId !== driverId)
      .forEach((offeredDriverId) => this.emitToDriver(
        offeredDriverId,
        SocketEvents.TRIP_REQUEST_EXPIRED,
        { tripId, reason: 'accepted_by_another_driver' },
      ));

    emitTripUpdated(updatedTrip, {
      previousStatus: 'MATCHING',
      message: 'Đã tìm được tài xế phù hợp.',
    });
    void NotificationsService.createNotification(
      tripSnapshot.passengerId,
      'Đã tìm được tài xế',
      'Tài xế đang chuẩn bị đến điểm đón của bạn.',
      'TRIP_MATCHED',
      { type: 'TRIP', id: tripId },
    ).catch((error) => console.error('[Matching] Notification error:', error));

    return updatedTrip;
  }

  static async handleDriverReject(tripId: string, driverId: string): Promise<void> {
    if (!(await hasTripOffer(tripId, driverId))) {
      throw new AppError('Yêu cầu chuyến không còn hiệu lực', 403, true, 'TRIP_NOT_OFFERED');
    }
    await clearTripOffer(tripId, driverId);
  }

  private static async getMatchingTrip(tripId: string) {
    return prisma.tripRequest.findUnique({
      where: { id: tripId },
      include: {
        passenger: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            passengerRating: true,
          },
        },
      },
    });
  }

  private static async loadAndRankCandidates(
    trip: MatchingTrip,
    nearbyDrivers: Array<{ driverId: string; distance: number }>,
  ): Promise<ScoredDriverCandidate[]> {
    const presence = await Promise.all(nearbyDrivers.map(async (driver) => ({
      ...driver,
      online: await isDriverOnline(driver.driverId),
      busy: await isDriverBusy(driver.driverId),
    })));
    const present = presence.filter(({ driverId, online, busy }) => (
      driverId !== trip.passengerId && online && !busy
    ));
    if (present.length === 0) return [];

    const driverIds = present.map(({ driverId }) => driverId);
    const now = Date.now();
    const [drivers, activeTrips, rides] = await Promise.all([
      prisma.user.findMany({
        where: {
          id: { in: driverIds },
          isDriverVerified: true,
          vehicles: { some: { status: 'ACTIVE', type: trip.vehicleType } },
        },
        select: { id: true, driverRating: true },
      }),
      prisma.tripRequest.findMany({
        where: { driverId: { in: driverIds }, status: { in: ACTIVE_DRIVER_TRIP_STATUSES } },
        select: { driverId: true },
      }),
      prisma.ride.findMany({
        where: {
          driverId: { in: driverIds },
          availableSeats: { gt: 0 },
          OR: [
            { status: 'ONGOING' },
            {
              status: 'SCHEDULED',
              departureTime: {
                gte: new Date(now - 30 * 60_000),
                lte: new Date(now + 2 * 60 * 60_000),
              },
            },
          ],
        },
        select: {
          id: true,
          driverId: true,
          originLat: true,
          originLng: true,
          destinationLat: true,
          destinationLng: true,
          routePolyline: true,
          distance: true,
          duration: true,
          departureTime: true,
          allowRoutePickup: true,
          availableSeats: true,
          status: true,
        },
        orderBy: { departureTime: 'asc' },
      }),
    ]);

    const verified = new Map(drivers.map((driver) => [driver.id, driver]));
    const busyDriverIds = new Set(activeTrips.map(({ driverId }) => driverId).filter(Boolean));
    const routeByDriver = new Map<string, typeof rides[number]>();
    rides.forEach((ride) => {
      const current = routeByDriver.get(ride.driverId);
      if (!current || ride.status === 'ONGOING') routeByDriver.set(ride.driverId, ride);
    });

    const candidates = await Promise.all(present.map(async ({ driverId, distance }) => {
      const driver = verified.get(driverId);
      if (!driver || busyDriverIds.has(driverId)) return null;
      const location = await getDriverLocation(driverId);
      const ride = routeByDriver.get(driverId);
      const candidate: DriverRouteCandidate = {
        driverId,
        distanceKm: distance,
        driverRating: driver.driverRating,
        availableSeats: ride?.availableSeats ?? (trip.vehicleType === 'CAR' ? 3 : 1),
        currentLocation: location
          ? { lat: location.latitude, lng: location.longitude }
          : undefined,
        route: ride ? {
          id: ride.id,
          originLat: ride.originLat,
          originLng: ride.originLng,
          destinationLat: ride.destinationLat,
          destinationLng: ride.destinationLng,
          routePolyline: ride.routePolyline,
          distance: ride.distance,
          duration: ride.duration,
          departureTime: ride.departureTime,
          allowRoutePickup: ride.allowRoutePickup,
        } : undefined,
      };
      return candidate;
    }));

    return rankRideHailingCandidates(
      candidates.filter((candidate): candidate is DriverRouteCandidate => candidate !== null),
      {
        origin: { lat: trip.originLat, lng: trip.originLng },
        destination: { lat: trip.destLat, lng: trip.destLng },
        vehicleType: trip.vehicleType,
      },
    );
  }

  private static async dispatchWave(
    trip: MatchingTrip,
    wave: ScoredDriverCandidate[],
    attempts: number,
    searchStartedAt: number,
  ): Promise<boolean> {
    const currentTrip = await prisma.tripRequest.findUnique({
      where: { id: trip.id },
      select: { status: true },
    });
    if (!currentTrip || currentTrip.status !== 'MATCHING') return currentTrip?.status === 'ACCEPTED';

    await prisma.tripRequest.updateMany({
      where: { id: trip.id, status: 'MATCHING' },
      data: { matchAttempts: attempts },
    });

    const remainingSearchMs = Math.max(
      0,
      RIDE_HAILING_CONFIG.SEARCH_TIMEOUT_MS - (Date.now() - searchStartedAt),
    );
    const offerDurationMs = Math.min(
      RIDE_HAILING_CONFIG.DRIVER_ACCEPT_TIMEOUT_MS,
      remainingSearchMs,
    );
    if (offerDurationMs <= 0) return false;

    const expiresAt = new Date(Date.now() + offerDurationMs).toISOString();
    const driverIds = wave.map(({ driverId }) => driverId);
    await offerTripToDrivers(trip.id, driverIds, Math.ceil(offerDurationMs / 1000) + 2);

    wave.forEach((candidate) => {
      const payload: TripOfferPayload = {
        tripId: trip.id,
        passenger: trip.passenger,
        originAddress: trip.originAddress,
        originLat: trip.originLat,
        originLng: trip.originLng,
        destAddress: trip.destAddress,
        destLat: trip.destLat,
        destLng: trip.destLng,
        vehicleType: trip.vehicleType,
        estimatedDistance: trip.estimatedDistance,
        estimatedDuration: trip.estimatedDuration,
        estimatedPrice: trip.estimatedPrice,
        driverDistance: candidate.distanceKm,
        pickupEtaMinutes: candidate.pickupEtaMinutes,
        matchScore: candidate.matchScore,
        matchType: candidate.matchType,
        expiresAt,
      };
      this.emitToDriver(candidate.driverId, SocketEvents.TRIP_NEW_REQUEST, payload);
    });

    const accepted = await this.waitForWaveResponse(trip.id, driverIds, offerDurationMs);
    if (!accepted) {
      await Promise.all(driverIds.map((driverId) => clearTripOffer(trip.id, driverId)));
      driverIds.forEach((driverId) => this.emitToDriver(
        driverId,
        SocketEvents.TRIP_REQUEST_EXPIRED,
        { tripId: trip.id, reason: 'timeout_or_rejected' },
      ));
    }
    return accepted;
  }

  private static async waitForWaveResponse(
    tripId: string,
    driverIds: string[],
    timeoutMs: number,
  ): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await this.sleep(Math.min(
        RIDE_HAILING_CONFIG.DISPATCH_POLL_INTERVAL_MS,
        Math.max(1, deadline - Date.now()),
      ));
      const trip = await prisma.tripRequest.findUnique({
        where: { id: tripId },
        select: { status: true },
      });
      if (!trip) return false;
      if (trip.status === 'ACCEPTED') return true;
      if (trip.status !== 'MATCHING') return false;

      const activeOffers = await Promise.all(
        driverIds.map((driverId) => hasTripOffer(tripId, driverId)),
      );
      if (activeOffers.every((active) => !active)) return false;
    }
    return false;
  }

  private static async noDriverFound(tripId: string): Promise<void> {
    await clearTripOffers(tripId);
    const changed = await prisma.tripRequest.updateMany({
      where: { id: tripId, status: 'MATCHING' },
      data: { status: 'NO_DRIVER' },
    });
    if (changed.count === 0) return;

    const trip = await prisma.tripRequest.findUnique({ where: { id: tripId } });
    if (trip) {
      emitTripUpdated(trip, {
        previousStatus: 'MATCHING',
        message: 'Không tìm thấy tài xế phù hợp. Bạn có thể thử lại hoặc đổi điểm đón.',
      });
    }
  }

  private static emitToDriver(driverId: string, event: SocketEvents, data: unknown): void {
    SocketEventService.emitToUser(driverId, event, data);
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
