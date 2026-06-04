import { extendedPrisma as prisma } from '@repo/database';
import { Prisma } from '@repo/database';
import { CreateRideInput, SearchRideInput } from '@repo/shared';
import { AppError } from '../../shared/errors/AppError';

const DRIVER_SELECT = {
  driver: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      driverRating: true,
      driverRatingCount: true,
      isDriverVerified: true,
    },
  },
} satisfies Prisma.RideInclude;

export class RidesService {
  static async createRide(driverId: string, data: CreateRideInput) {
    // 1. KYC Guard — chỉ tài xế đã xác thực mới được tạo chuyến
    const driver = await prisma.user.findUnique({
      where: { id: driverId },
      select: { isDriverVerified: true },
    });

    if (!driver) throw new AppError('Không tìm thấy người dùng', 404);

    if (!driver.isDriverVerified) {
      throw new AppError(
        'Bạn cần xác thực tài xế trước khi đăng chuyến đi. Vui lòng upload giấy tờ và chờ admin duyệt.',
        403
      );
    }

    // Kiểm tra xem tài xế có chuyến đi nào chưa kết thúc mà đã có khách đặt thành công (CONFIRMED) hay chưa
    const activeRideWithConfirmedBooking = await prisma.ride.findFirst({
      where: {
        driverId,
        status: { in: ['SCHEDULED', 'ONGOING'] },
        bookings: {
          some: {
            status: 'CONFIRMED',
          },
        },
      },
    });

    if (activeRideWithConfirmedBooking) {
      throw new AppError(
        'Bạn đang có một chuyến đi đã được đặt thành công và chưa hoàn thành. Không thể đăng thêm chuyến đi mới.',
        400
      );
    }

    // 2. Time Conflict — kiểm tra tài xế không trùng lịch với chuyến đã có
    const departureTime = new Date(data.departureTime);
    // Ước tính thời gian kết thúc: duration (phút) hoặc mặc định 60 phút
    const durationMs = (data.duration ?? 60) * 60 * 1000;
    const estimatedEndTime = new Date(departureTime.getTime() + durationMs);

    // Check trùng lịch khi đang là tài xế ở chuyến khác
    // Dùng findMany thay vì findFirst — findFirst có thể trả về chuyến không trùng
    // trong khi chuyến khác trong kết quả lại trùng (do Prisma không tính được estimatedEndTime trong WHERE)
    const candidateDriverConflicts = await prisma.ride.findMany({
      where: {
        driverId,
        status: { in: ['SCHEDULED', 'ONGOING'] },
        departureTime: { lt: estimatedEndTime },
      },
    });

    // Overlap logic đầy đủ: existingStart < newEnd AND existingEnd > newStart
    const driverConflict = candidateDriverConflicts.find((ride) => {
      const rideEnd = new Date(
        ride.departureTime.getTime() + (ride.duration ?? 60) * 60 * 1000
      );
      return rideEnd > departureTime;
    });

    if (driverConflict) {
      throw new AppError(
        'Bạn đã có chuyến đi khác trong khung giờ này (vai trò tài xế). Vui lòng chọn thời gian khác.',
        400
      );
    }

    // Check trùng lịch khi đang là hành khách ở chuyến khác
    const candidatePassengerConflicts = await prisma.booking.findMany({
      where: {
        passengerId: driverId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        ride: {
          status: { in: ['SCHEDULED', 'ONGOING'] },
          departureTime: { lt: estimatedEndTime },
        },
      },
      include: { ride: true },
    });

    const passengerConflict = candidatePassengerConflicts.find((booking) => {
      const rideEnd = new Date(
        booking.ride.departureTime.getTime() +
        (booking.ride.duration ?? 60) * 60 * 1000
      );
      return rideEnd > departureTime;
    });

    if (passengerConflict) {
      throw new AppError(
        'Bạn đã đặt chỗ trên chuyến khác trong khung giờ này (vai trò hành khách). Vui lòng chọn thời gian khác.',
        400
      );
    }

    // 3. Tạo chuyến đi
    return prisma.ride.create({
      data: {
        driverId,
        origin: data.origin || '',
        originLat: data.originLat ?? null,
        originLng: data.originLng ?? null,
        destination: data.destination || '',
        destinationLat: data.destinationLat ?? null,
        destinationLng: data.destinationLng ?? null,
        distance: data.distance ?? null,
        duration: data.duration ?? null,
        departureTime,
        availableSeats: data.availableSeats,
        pricePerSeat: data.pricePerSeat,
        description: data.description ?? null,
      },
      include: DRIVER_SELECT,
    });
  }

  static async searchRides(filters: SearchRideInput) {
    const { origin, destination, date, driverId } = filters;

    // Dùng Prisma.RideWhereInput thay vì any để đảm bảo type safety
    const where: Prisma.RideWhereInput = {};

    if (driverId) {
      // Tài xế xem chuyến đi của mình — không lọc theo status
      where.driverId = driverId;
    } else {
      // Hành khách tìm chuyến — chỉ lấy chuyến SCHEDULED trong tương lai
      where.status = 'SCHEDULED';
      where.departureTime = { gte: new Date() };
    }

    if (origin) {
      where.origin = { contains: origin, mode: 'insensitive' };
    }

    if (destination) {
      where.destination = { contains: destination, mode: 'insensitive' };
    }

    if (date) {
      const searchDate = new Date(date);
      const startOfDay = new Date(searchDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(searchDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Nếu ngày tìm là hôm nay hoặc quá khứ, lấy từ thời điểm hiện tại
      const fromTime = startOfDay > new Date() ? startOfDay : new Date();
      where.departureTime = { gte: fromTime, lte: endOfDay };
    }

    return prisma.ride.findMany({
      where,
      include: DRIVER_SELECT,
      orderBy: { departureTime: 'asc' },
    });
  }

  static async getRideById(id: string) {
    const ride = await prisma.ride.findUnique({
      where: { id },
      include: DRIVER_SELECT,
    });

    if (!ride) throw new AppError('Không tìm thấy chuyến đi', 404);
    return ride;
  }

  static async updateRide(
    id: string,
    driverId: string,
    data: Partial<CreateRideInput>
  ) {
    const ride = await prisma.ride.findUnique({ where: { id } });
    if (!ride) throw new AppError('Không tìm thấy chuyến đi', 404);
    if (ride.driverId !== driverId) {
      throw new AppError('Bạn không có quyền chỉnh sửa chuyến đi này', 403);
    }
    if (ride.status !== 'SCHEDULED') {
      throw new AppError('Chỉ có thể sửa chuyến đang chờ khởi hành', 400);
    }

    // Time Conflict — kiểm tra khi cập nhật departureTime hoặc duration
    // Tránh tài xế dời chuyến sang khung giờ đã có chuyến khác
    const hasTimeChange = data.departureTime !== undefined || data.duration !== undefined;
    if (hasTimeChange) {
      const newDepartureTime = data.departureTime
        ? new Date(data.departureTime)
        : ride.departureTime;
      const newDurationMs = (data.duration ?? ride.duration ?? 60) * 60 * 1000;
      const newEstimatedEndTime = new Date(newDepartureTime.getTime() + newDurationMs);

      // Check trùng lịch vai trò tài xế (loại trừ chuyến đang sửa)
      const candidateDriverConflicts = await prisma.ride.findMany({
        where: {
          driverId,
          id: { not: id },
          status: { in: ['SCHEDULED', 'ONGOING'] },
          departureTime: { lt: newEstimatedEndTime },
        },
      });

      const driverConflict = candidateDriverConflicts.find((r) => {
        const rideEnd = new Date(
          r.departureTime.getTime() + (r.duration ?? 60) * 60 * 1000
        );
        return rideEnd > newDepartureTime;
      });

      if (driverConflict) {
        throw new AppError(
          'Thời gian mới bị trùng với chuyến đi khác của bạn (vai trò tài xế). Vui lòng chọn thời gian khác.',
          400
        );
      }

      // Check trùng lịch vai trò hành khách
      const candidatePassengerConflicts = await prisma.booking.findMany({
        where: {
          passengerId: driverId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          ride: {
            status: { in: ['SCHEDULED', 'ONGOING'] },
            departureTime: { lt: newEstimatedEndTime },
          },
        },
        include: { ride: true },
      });

      const passengerConflict = candidatePassengerConflicts.find((booking) => {
        const rideEnd = new Date(
          booking.ride.departureTime.getTime() +
          (booking.ride.duration ?? 60) * 60 * 1000
        );
        return rideEnd > newDepartureTime;
      });

      if (passengerConflict) {
        throw new AppError(
          'Thời gian mới bị trùng với chuyến bạn đã đặt chỗ (vai trò hành khách). Vui lòng chọn thời gian khác.',
          400
        );
      }
    }

    return prisma.ride.update({
      where: { id },
      data: {
        ...data,
        // Chuyển string thành Date nếu departureTime được cập nhật
        ...(data.departureTime && {
          departureTime: new Date(data.departureTime),
        }),
      },
      include: DRIVER_SELECT,
    });
  }

  static async deleteRide(id: string, driverId: string) {
    const ride = await prisma.ride.findUnique({ where: { id } });
    if (!ride) throw new AppError('Không tìm thấy chuyến đi', 404);
    if (ride.driverId !== driverId) {
      throw new AppError('Bạn không có quyền xóa chuyến đi này', 403);
    }
    if (ride.status === 'ONGOING') {
      throw new AppError('Không thể xóa chuyến đang diễn ra', 400);
    }

    return prisma.ride.delete({ where: { id } });
  }

  static async updateRideStatus(id: string, driverId: string, status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED') {
    const ride = await prisma.ride.findUnique({ where: { id } });
    if (!ride) throw new AppError('Không tìm thấy chuyến đi', 404);
    if (ride.driverId !== driverId) {
      throw new AppError('Bạn không có quyền cập nhật trạng thái chuyến đi này', 403);
    }

    // Logic kiểm tra chuyển đổi trạng thái hợp lệ
    if (status === 'ONGOING') {
      if (ride.status !== 'SCHEDULED') {
        throw new AppError('Chỉ có thể bắt đầu chuyến đi đang ở trạng thái Đã lên lịch (SCHEDULED)', 400);
      }
    } else if (status === 'COMPLETED') {
      if (ride.status !== 'ONGOING') {
        throw new AppError('Chỉ có thể hoàn thành chuyến đi đang ở trạng thái Đang diễn ra (ONGOING)', 400);
      }
    } else if (status === 'CANCELLED') {
      if (ride.status !== 'SCHEDULED') {
        throw new AppError('Chỉ có thể hủy chuyến đi chưa khởi hành', 400);
      }
    }

    return prisma.ride.update({
      where: { id },
      data: { status },
      include: DRIVER_SELECT,
    });
  }
}

