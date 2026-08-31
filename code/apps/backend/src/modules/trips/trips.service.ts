import { extendedPrisma as prisma, type VehicleType } from '@repo/database';
import type {
  CompleteTripInput,
  CreateTripRequestInput,
  DriverTripStatus,
  TripStatus,
} from '@repo/shared';

import { AppError } from '../../shared/errors/AppError';
import {
  clearDriverBusy,
  clearTripOffers,
  getDriverLocation,
} from '../../shared/lib/redis';
import { PricingService } from '../pricing/pricing.service';
import { RideMatchingService } from '../rides/ride-matching.service';
import { RIDE_HAILING_CONFIG } from '../matching/matching.config';
import {
  ACTIVE_DRIVER_TRIP_STATUSES,
  ACTIVE_PASSENGER_TRIP_STATUSES,
  isTripTransitionAllowed,
  type TripTransitionActor,
} from './trip-state-machine';

const isPrismaUniqueError = (error: unknown): boolean => (
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
);

export class TripsService {
  static async createTrip(passengerId: string, data: CreateTripRequestInput) {
    const activeTrip = await prisma.tripRequest.findFirst({
      where: { passengerId, status: { in: ACTIVE_PASSENGER_TRIP_STATUSES } },
      select: { id: true },
    });
    if (activeTrip) {
      throw new AppError(
        'Bạn đang có một chuyến xe chưa hoàn thành',
        409,
        true,
        'PASSENGER_HAS_ACTIVE_TRIP',
        { tripId: activeTrip.id },
      );
    }

    const estimate = await PricingService.estimate(
      data.originLat,
      data.originLng,
      data.destLat,
      data.destLng,
      data.vehicleType as VehicleType,
    );

    try {
      return await prisma.tripRequest.create({
        data: {
          passengerId,
          originAddress: data.originAddress,
          originLat: data.originLat,
          originLng: data.originLng,
          destAddress: data.destAddress,
          destLat: data.destLat,
          destLng: data.destLng,
          vehicleType: data.vehicleType as VehicleType,
          estimatedDistance: estimate.estimatedDistance,
          estimatedDuration: estimate.estimatedDuration,
          estimatedPrice: estimate.estimatedPrice,
          status: 'PENDING',
        },
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
        },
      });
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        throw new AppError(
          'Bạn đang có một chuyến xe chưa hoàn thành',
          409,
          true,
          'PASSENGER_HAS_ACTIVE_TRIP',
        );
      }
      throw error;
    }
  }

  static async cancelTrip(tripId: string, userId: string, reason?: string) {
    const trip = await prisma.tripRequest.findUnique({ where: { id: tripId } });
    if (!trip) throw new AppError('Không tìm thấy chuyến xe', 404);

    const actor: TripTransitionActor = trip.passengerId === userId
      ? 'PASSENGER'
      : trip.driverId === userId
        ? 'DRIVER'
        : (() => { throw new AppError('Bạn không có quyền hủy chuyến xe này', 403); })();

    if (!isTripTransitionAllowed(trip.status as TripStatus, 'CANCELLED', actor)) {
      throw new AppError(
        `Không thể hủy chuyến xe ở trạng thái ${trip.status}`,
        409,
        true,
        'INVALID_TRIP_TRANSITION',
      );
    }

    const changed = await prisma.tripRequest.updateMany({
      where: { id: tripId, status: trip.status },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason?.trim() || (actor === 'PASSENGER'
          ? 'Hành khách hủy chuyến'
          : 'Tài xế hủy chuyến'),
      },
    });
    if (changed.count !== 1) {
      throw new AppError(
        'Trạng thái chuyến đã thay đổi. Vui lòng tải lại.',
        409,
        true,
        'TRIP_STATE_CONFLICT',
      );
    }

    await clearTripOffers(tripId);
    if (trip.driverId) await clearDriverBusy(trip.driverId);
    const updated = await prisma.tripRequest.findUnique({ where: { id: tripId } });
    if (!updated) throw new AppError('Không tìm thấy chuyến xe', 404);
    return { trip: updated, previousStatus: trip.status, cancelledBy: actor };
  }

  static async updateTripStatus(
    tripId: string,
    driverId: string,
    status: DriverTripStatus,
    options?: CompleteTripInput,
  ) {
    const trip = await prisma.tripRequest.findUnique({ where: { id: tripId } });
    if (!trip) throw new AppError('Không tìm thấy chuyến xe', 404);
    if (trip.driverId !== driverId) {
      throw new AppError('Bạn không phải tài xế của chuyến xe này', 403);
    }
    if (!isTripTransitionAllowed(trip.status as TripStatus, status, 'DRIVER')) {
      throw new AppError(
        `Không thể chuyển từ ${trip.status} sang ${status}`,
        409,
        true,
        'INVALID_TRIP_TRANSITION',
        { currentStatus: trip.status, requestedStatus: status },
      );
    }

    if (status === 'WAITING_PAYMENT') {
      await this.validateCompletionDistance(trip, driverId, options?.confirmFarFromDestination);
    }

    const now = new Date();
    const timestampData = status === 'ARRIVED'
      ? { arrivedAt: now }
      : status === 'IN_PROGRESS'
        ? { startedAt: now }
        : status === 'WAITING_PAYMENT'
          ? { finalPrice: trip.estimatedPrice }
          : {};

    const changed = await prisma.tripRequest.updateMany({
      where: { id: tripId, driverId, status: trip.status },
      data: { status, ...timestampData },
    });
    if (changed.count !== 1) {
      throw new AppError(
        'Trạng thái chuyến đã thay đổi. Vui lòng tải lại.',
        409,
        true,
        'TRIP_STATE_CONFLICT',
      );
    }

    return {
      trip: await this.getTripWithParticipants(tripId),
      previousStatus: trip.status,
    };
  }

  static async getActiveTrip(passengerId: string) {
    return prisma.tripRequest.findFirst({
      where: { passengerId, status: { in: ACTIVE_PASSENGER_TRIP_STATUSES } },
      include: {
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
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getActiveDriverTrip(driverId: string) {
    return prisma.tripRequest.findFirst({
      where: { driverId, status: { in: ACTIVE_DRIVER_TRIP_STATUSES } },
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getTripHistory(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = {
      OR: [{ passengerId: userId }, { driverId: userId }],
      status: { in: ['COMPLETED', 'CANCELLED', 'NO_DRIVER'] as TripStatus[] },
    };
    const [trips, total] = await Promise.all([
      prisma.tripRequest.findMany({
        where,
        include: {
          passenger: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
          driver: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.tripRequest.count({ where }),
    ]);
    return { trips, total, page, totalPages: Math.ceil(total / limit) };
  }

  static async getTripById(tripId: string, userId: string) {
    const trip = await prisma.tripRequest.findUnique({
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
        transactions: {
          select: { id: true, amount: true, status: true, type: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          where: { reviewerId: userId },
          select: { id: true, revieweeId: true, rating: true },
        },
      },
    });
    if (!trip) throw new AppError('Không tìm thấy chuyến xe', 404);
    if (trip.passengerId !== userId && trip.driverId !== userId) {
      throw new AppError('Bạn không có quyền xem chuyến xe này', 403);
    }
    return trip;
  }

  private static async getTripWithParticipants(tripId: string) {
    const trip = await prisma.tripRequest.findUnique({
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
    if (!trip) throw new AppError('Không tìm thấy chuyến xe', 404);
    return trip;
  }

  private static async validateCompletionDistance(
    trip: { destLat: number; destLng: number },
    driverId: string,
    confirmed = false,
  ): Promise<void> {
    const location = await getDriverLocation(driverId);
    const distanceMeters = location
      ? Math.round(RideMatchingService.haversine(
        { lat: location.latitude, lng: location.longitude },
        { lat: trip.destLat, lng: trip.destLng },
      ) * 1000)
      : null;
    const tooFar = distanceMeters === null ||
      distanceMeters > RIDE_HAILING_CONFIG.TRIP_COMPLETION_RADIUS_METERS;

    if (tooFar && !confirmed) {
      throw new AppError(
        distanceMeters === null
          ? 'Không xác định được vị trí hiện tại. Hãy kiểm tra GPS trước khi hoàn thành chuyến.'
          : `Bạn vẫn còn cách điểm đến ${(distanceMeters / 1000).toFixed(1)} km.`,
        409,
        true,
        'TRIP_TOO_FAR_FROM_DESTINATION',
        {
          distanceMeters,
          thresholdMeters: RIDE_HAILING_CONFIG.TRIP_COMPLETION_RADIUS_METERS,
          canConfirm: true,
        },
      );
    }
  }
}
