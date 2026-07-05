import { extendedPrisma as prisma } from '@repo/database';
import { Prisma } from '@repo/database';
import { CreateRideInput, SearchRideInput, SocketEvents } from '@repo/shared';
import { AppError } from '../../shared/errors/AppError';
import { SocketEventService } from '../../socket/socket.events';

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

    // 2. Kiểm tra không có chuyến đi nào đang hoạt động với vai trò tài xế
    const activeDriverRide = await prisma.ride.findFirst({
      where: {
        driverId,
        status: { in: ['SCHEDULED', 'ONGOING'] },
      },
    });

    if (activeDriverRide) {
      throw new AppError(
        'Bạn đang có một chuyến đi chưa hoàn thành (vai trò tài xế). Vui lòng hoàn thành hoặc hủy chuyến đi hiện tại để đăng chuyến mới.',
        400
      );
    }

    // 3. Kiểm tra không có chuyến đi nào đang hoạt động với vai trò hành khách
    const activePassengerBooking = await prisma.booking.findFirst({
      where: {
        passengerId: driverId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        ride: {
          status: { in: ['SCHEDULED', 'ONGOING'] },
        },
      },
    });

    if (activePassengerBooking) {
      throw new AppError(
        'Bạn đang có một chuyến đi chưa hoàn thành (vai trò hành khách). Vui lòng hoàn thành hoặc hủy chuyến đi hiện tại để đăng chuyến mới.',
        400
      );
    }

    // 4. Tạo chuyến đi
    const departureTime = new Date(data.departureTime);
    const newRide = await prisma.ride.create({
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

    try {
      SocketEventService.emitGlobal(SocketEvents.RIDE_CREATED, newRide);
    } catch (e) {
      console.warn('[RidesService] Socket emit skipped:', e);
    }

    return newRide;
  }

  static async searchRides(filters: SearchRideInput) {
    const { origin, destination, date, driverId } = filters;

    // Dùng Prisma.RideWhereInput thay vì any để đảm bảo type safety
    const where: Prisma.RideWhereInput = {};

    if (driverId) {
      // Tài xế xem chuyến đi của mình — không lọc theo status
      where.driverId = driverId;
    } else {
      // Hành khách tìm chuyến — chỉ lấy chuyến còn ghế
      where.availableSeats = { gt: 0 };
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

      const now = new Date();
      // Thêm buffer 1 giờ vào quá khứ để không bị ẩn chuyến đi vừa tạo hoặc tài xế đến trễ một chút
      const pastBuffer = new Date(now.getTime() - 60 * 60 * 1000);

      if (!driverId) {
        // Khách tìm: nếu tìm ngày hôm nay, lấy SCHEDULED từ pastBuffer đến hết ngày
        // VÀ lấy các chuyến ONGOING trong ngày hôm nay (dù khởi hành trước đó)
        if (startOfDay <= now && endOfDay >= now) {
          where.OR = [
            { status: 'SCHEDULED', departureTime: { gte: pastBuffer, lte: endOfDay } },
            { status: 'ONGOING', departureTime: { gte: startOfDay, lte: endOfDay } }
          ];
        } else {
          // Khách tìm ngày tương lai: chỉ lấy SCHEDULED
          where.status = 'SCHEDULED';
          where.departureTime = { gte: startOfDay, lte: endOfDay };
        }
      } else {
        // Tài xế tìm: lấy toàn bộ trong ngày
        where.departureTime = { gte: startOfDay, lte: endOfDay };
      }
    } else if (!driverId) {
      // Không truyền date (mặc định lấy từ now)
      const pastBuffer = new Date(Date.now() - 60 * 60 * 1000);
      where.OR = [
        { status: 'SCHEDULED', departureTime: { gte: pastBuffer } },
        { status: 'ONGOING' } // Lấy hết chuyến ONGOING
      ];
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



    const updatedRide = await prisma.ride.update({
      where: { id },
      data: {
        ...data,
        ...(data.departureTime && {
          departureTime: new Date(data.departureTime),
        }),
      },
      include: DRIVER_SELECT,
    });

    try {
      SocketEventService.emitGlobal(SocketEvents.RIDE_UPDATED, updatedRide);
    } catch (e) {
      console.warn('[RidesService] Socket emit skipped:', e);
    }

    return updatedRide;
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

    const deletedRide = await prisma.ride.delete({ where: { id } });

    try {
      SocketEventService.emitGlobal(SocketEvents.RIDE_DELETED, { id });
    } catch (e) {
      console.warn('[RidesService] Socket emit skipped:', e);
    }

    return deletedRide;
  }

  static async updateRideStatus(id: string, driverId: string, status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED', cancelReason?: string) {
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
      if (!cancelReason) {
        throw new AppError('Vui lòng cung cấp lý do hủy chuyến', 400);
      }
    }

    // Lưu danh sách passengerId TRƯỚC transaction
    // Vì transaction CANCELLED sẽ update booking status → query sau transaction trả rỗng
    // Đây là race condition nghiêm trọng: passenger không nhận được event realtime
    const affectedPassengers = await prisma.booking.findMany({
      where: {
        rideId: id,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: { passengerId: true },
    });
    const affectedPassengerIds = affectedPassengers.map((b) => b.passengerId);

    const updatedRide = await prisma.$transaction(async (tx) => {
      // Nếu hủy chuyến, hủy toàn bộ các booking liên quan
      if (status === 'CANCELLED') {
        await tx.booking.updateMany({
          where: {
            rideId: id,
            status: { in: ['PENDING', 'CONFIRMED'] }
          },
          data: {
            status: 'CANCELLED',
            cancelReason: 'Tài xế đã hủy chuyến đi',
          }
        });
      }

      // Nếu hoàn thành chuyến, hoàn thành toàn bộ booking CONFIRMED đã đón
      if (status === 'COMPLETED') {
        await tx.booking.updateMany({
          where: {
            rideId: id,
            status: 'CONFIRMED',
            isPickedUp: true,
          },
          data: { status: 'COMPLETED' },
        });
      }

      return tx.ride.update({
        where: { id },
        data: { 
          status,
          ...(status === 'CANCELLED' && { cancelReason })
        },
        include: DRIVER_SELECT,
      });
    });

    // Broadcast status change đến tất cả participants
    try {
      const statusPayload = {
        rideId: id,
        status,
        updatedAt: new Date().toISOString(),
      };

      // Global broadcast để trang search và danh sách tự cập nhật ngay lập tức
      // Sự kiện này sẽ đến được tất cả user (bao gồm driver và passenger) mà không cần emit riêng lẻ từng room
      SocketEventService.emitGlobal(SocketEvents.RIDE_STATUS_UPDATED, statusPayload);
      SocketEventService.emitGlobal(SocketEvents.RIDE_UPDATED, updatedRide);
    } catch (socketError) {
      // Socket chưa init (test environment) → skip, không ảnh hưởng logic chính
      console.warn('[RidesService] Socket emit skipped:', socketError);
    }

    return updatedRide;
  }
}

