import { extendedPrisma as prisma } from '@repo/database';
import { VehicleType } from '@repo/database';
import { AppError } from '../../shared/errors/AppError';
import { PricingService } from '../pricing/pricing.service';
import type { CreateTripRequestInput, DriverTripStatus } from '@repo/shared';

/**
 * TripsService — Business logic cho luồng Ride-Hailing (TripRequest).
 *
 * Phân biệt với RidesService (Carpooling):
 * - RidesService: Tài xế chủ động tạo lịch trình → Hành khách đặt chỗ
 * - TripsService: Hành khách chủ động gọi xe → Hệ thống tìm tài xế tự động
 */
export class TripsService {
  /**
   * Tạo yêu cầu đặt xe mới.
   *
   * Luồng:
   * 1. Kiểm tra hành khách không có trip nào đang active
   * 2. Gọi PricingService để tính giá ước tính
   * 3. Tạo TripRequest với status PENDING
   * 4. Trả về trip — caller (controller/socket) sẽ trigger MatchingService
   */
  static async createTrip(passengerId: string, data: CreateTripRequestInput) {
    // 1. Guard: hành khách chỉ được có 1 trip active tại mỗi thời điểm
    const activeTrip = await prisma.tripRequest.findFirst({
      where: {
        passengerId,
        status: { in: ['PENDING', 'MATCHING', 'ACCEPTED', 'ARRIVING', 'IN_PROGRESS', 'WAITING_PAYMENT'] },
      },
    });

    if (activeTrip) {
      throw new AppError(
        'Bạn đang có một chuyến xe chưa hoàn thành. Vui lòng hủy hoặc chờ hoàn thành trước.',
        400
      );
    }

    // 2. Tính giá ước tính qua Goong API + PricingConfig
    const estimate = await PricingService.estimate(
      data.originLat,
      data.originLng,
      data.destLat,
      data.destLng,
      data.vehicleType as VehicleType
    );

    // 3. Tạo TripRequest
    const trip = await prisma.tripRequest.create({
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

    return trip;
  }

  /**
   * Hủy yêu cầu đặt xe — chỉ hành khách mới được hủy, và chỉ trước khi IN_PROGRESS.
   */
  static async cancelTrip(tripId: string, userId: string, reason?: string) {
    const trip = await prisma.tripRequest.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new AppError('Không tìm thấy chuyến xe', 404);
    }

    // Chỉ hành khách hoặc tài xế của trip mới được hủy
    if (trip.passengerId !== userId && trip.driverId !== userId) {
      throw new AppError('Bạn không có quyền hủy chuyến xe này', 403);
    }

    // Chỉ hủy được ở trạng thái trước IN_PROGRESS
    const cancellableStatuses = ['PENDING', 'MATCHING', 'ACCEPTED', 'ARRIVING'];
    if (!cancellableStatuses.includes(trip.status)) {
      throw new AppError(
        `Không thể hủy chuyến xe ở trạng thái ${trip.status}`,
        400
      );
    }

    return prisma.tripRequest.update({
      where: { id: tripId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason ?? null,
      },
    });
  }

  /**
   * Tài xế nhận cuốc — cập nhật driverId và status.
   */
  static async acceptTrip(tripId: string, driverId: string) {
    const trip = await prisma.tripRequest.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new AppError('Không tìm thấy chuyến xe', 404);
    }

    if (trip.status !== 'MATCHING') {
      throw new AppError(
        'Chuyến xe này không còn ở trạng thái đang tìm tài xế',
        400
      );
    }

    return prisma.tripRequest.update({
      where: { id: tripId },
      data: {
        driverId,
        status: 'ACCEPTED',
        matchedAt: new Date(),
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
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
            driverRating: true,
            driverRatingCount: true,
          },
        },
      },
    });
  }

  /**
   * Cập nhật trạng thái trip — dùng cho các chuyển đổi lifecycle.
   */
  static async updateTripStatus(
    tripId: string,
    driverId: string,
    status: DriverTripStatus
  ) {
    const trip = await prisma.tripRequest.findUnique({
      where: { id: tripId },
    });

    if (!trip) throw new AppError('Không tìm thấy chuyến xe', 404);
    if (trip.driverId !== driverId) {
      throw new AppError('Bạn không phải tài xế của chuyến xe này', 403);
    }

    // Validate state transitions — đảm bảo chuyển trạng thái hợp lệ
    const validTransitions: Record<string, string[]> = {
      ACCEPTED: ['ARRIVING'],
      ARRIVING: ['IN_PROGRESS'],
      IN_PROGRESS: ['WAITING_PAYMENT'],
    };

    const allowed = validTransitions[trip.status];
    if (!allowed || !allowed.includes(status)) {
      throw new AppError(
        `Không thể chuyển từ ${trip.status} sang ${status}`,
        400
      );
    }

    // Thêm timestamp tương ứng
    const timestamps: Record<string, object> = {
      IN_PROGRESS: { startedAt: new Date() },
      COMPLETED: { completedAt: new Date(), finalPrice: trip.estimatedPrice },
    };

    return prisma.tripRequest.update({
      where: { id: tripId },
      data: {
        status,
        ...(timestamps[status] ?? {}),
      },
      include: {
        passenger: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        driver: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
    });
  }

  /**
   * Lấy trip đang active của hành khách.
   */
  static async getActiveTrip(passengerId: string) {
    return prisma.tripRequest.findFirst({
      where: {
        passengerId,
        status: { in: ['PENDING', 'MATCHING', 'ACCEPTED', 'ARRIVING', 'IN_PROGRESS', 'WAITING_PAYMENT'] },
      },
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
          },
        },
      },
    });
  }

  /**
   * Lấy trip đang active của tài xế.
   */
  static async getActiveDriverTrip(driverId: string) {
    return prisma.tripRequest.findFirst({
      where: {
        driverId,
        status: { in: ['ACCEPTED', 'ARRIVING', 'IN_PROGRESS', 'WAITING_PAYMENT'] },
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
  }

  /**
   * Lấy lịch sử chuyến đi (phân trang).
   */
  static async getTripHistory(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [trips, total] = await Promise.all([
      prisma.tripRequest.findMany({
        where: {
          OR: [
            { passengerId: userId },
            { driverId: userId },
          ],
          status: { in: ['COMPLETED', 'CANCELLED', 'NO_DRIVER'] },
        },
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
      prisma.tripRequest.count({
        where: {
          OR: [
            { passengerId: userId },
            { driverId: userId },
          ],
          status: { in: ['COMPLETED', 'CANCELLED', 'NO_DRIVER'] },
        },
      }),
    ]);

    return {
      trips,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
