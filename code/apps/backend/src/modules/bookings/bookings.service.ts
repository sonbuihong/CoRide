import { extendedPrisma as prisma } from '@repo/database';
import { CreateBookingInput, UpdateBookingStatusInput } from '@repo/shared';
import { BookingStatus } from '@repo/database';
import { AppError } from '../../shared/errors/AppError';
import { NotificationsService } from '../notifications/notifications.service';

export class BookingsService {
  static async createBooking(passengerId: string, data: CreateBookingInput) {
    const { rideId, seats } = data;

    // 1. Lấy chuyến đi kèm thông tin tài xế
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!ride) throw new AppError('Không tìm thấy chuyến đi', 404);

    // 2. Tài xế không thể tự đặt xe của chính mình
    if (ride.driverId === passengerId) {
      throw new AppError(
        'Tài xế không thể đặt chỗ trên chuyến đi của chính mình',
        400
      );
    }

    // 3. Chuyến đi phải đang ở trạng thái SCHEDULED (chưa khởi hành)
    if (ride.status !== 'SCHEDULED') {
      throw new AppError('Chuyến đi này không còn nhận đặt chỗ nữa', 400);
    }

    // 4. Kiểm tra còn đủ ghế trống không
    if (ride.availableSeats < seats) {
      throw new AppError(
        `Chuyến đi chỉ còn ${ride.availableSeats} ghế, không đủ ${seats} ghế bạn yêu cầu`,
        400
      );
    }

    // 5. Kiểm tra user chưa có booking đang active trên chuyến này
    const existingBooking = await prisma.booking.findFirst({
      where: {
        rideId,
        passengerId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      },
    });

    if (existingBooking) {
      throw new AppError(
        'Bạn đã có yêu cầu đặt chỗ đang chờ xử lý hoặc đã được xác nhận cho chuyến đi này',
        400
      );
    }

    // Kiểm tra xem hành khách có bất kỳ chuyến đi nào đã được xác nhận (CONFIRMED) và chưa hoàn thành hay chưa
    const activeBooking = await prisma.booking.findFirst({
      where: {
        passengerId,
        status: BookingStatus.CONFIRMED,
        ride: {
          status: { in: ['SCHEDULED', 'ONGOING'] },
        },
      },
    });

    if (activeBooking) {
      throw new AppError(
        'Bạn đang có một chuyến đi đã được xác nhận và chưa hoàn thành. Không thể đặt thêm chuyến đi mới.',
        400
      );
    }

    // 6. Time Conflict — kiểm tra hành khách không trùng lịch
    // Dùng findMany thay vì findFirst — findFirst có thể trả về chuyến không trùng
    // trong khi chuyến khác trong kết quả lại trùng (Prisma không tính được estimatedEndTime trong WHERE)
    const departureTime = ride.departureTime;
    const durationMs = (ride.duration ?? 60) * 60 * 1000;
    const estimatedEndTime = new Date(departureTime.getTime() + durationMs);

    // Check trùng lịch khi đang là tài xế ở chuyến khác
    const candidateDriverConflicts = await prisma.ride.findMany({
      where: {
        driverId: passengerId,
        status: { in: ['SCHEDULED', 'ONGOING'] },
        departureTime: { lt: estimatedEndTime },
      },
    });

    // Overlap logic đầy đủ: existingStart < newEnd AND existingEnd > newStart
    const driverConflict = candidateDriverConflicts.find((r) => {
      const rideEnd = new Date(
        r.departureTime.getTime() + (r.duration ?? 60) * 60 * 1000
      );
      return rideEnd > departureTime;
    });

    if (driverConflict) {
      throw new AppError(
        'Bạn đã có chuyến đi khác trong khung giờ này (vai trò tài xế). Không thể đặt chỗ.',
        400
      );
    }

    // Check trùng lịch khi đang là hành khách ở chuyến khác
    const candidatePassengerConflicts = await prisma.booking.findMany({
      where: {
        passengerId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        ride: {
          id: { not: rideId },
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
        'Bạn đã đặt chỗ trên chuyến khác trong khung giờ này. Không thể đặt thêm.',
        400
      );
    }

    // 7. Tạo booking với trạng thái PENDING (chờ tài xế duyệt)
    const booking = await prisma.booking.create({
      data: {
        rideId,
        passengerId,
        seats,
        totalPrice: ride.pricePerSeat * seats,
        status: BookingStatus.PENDING,
      },
      include: {
        ride: { select: { origin: true, destination: true } },
        passenger: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // 7. Thông báo cho tài xế (background — không chặn response trả về client)
    NotificationsService.createNotification(
      ride.driverId,
      'Yêu cầu đặt chỗ mới',
      `${booking.passenger.firstName} ${booking.passenger.lastName} muốn đặt ${seats} ghế — ${ride.origin} → ${ride.destination}`,
      'BOOKING_REQUEST'
    ).catch((err) => console.error('[Notification Error]:', err));

    return booking;
  }

  static async updateBookingStatus(
    userId: string,
    bookingId: string,
    data: UpdateBookingStatusInput
  ) {
    const { status } = data;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { ride: true, passenger: true },
    });

    if (!booking) throw new AppError('Không tìm thấy yêu cầu đặt chỗ', 404);

    // Chỉ tài xế của chuyến đi mới được duyệt/từ chối
    if (booking.ride.driverId !== userId) {
      throw new AppError('Bạn không có quyền thực hiện hành động này', 403);
    }

    if (status === BookingStatus.CONFIRMED) {
      if (booking.status !== BookingStatus.PENDING) {
        throw new AppError('Chỉ có thể xác nhận yêu cầu đang chờ (PENDING)', 400);
      }

      // Dùng transaction để đảm bảo giảm ghế và cập nhật booking là atomic
      // Tránh race condition khi nhiều booking được duyệt cùng lúc
      const updatedBooking = await prisma.$transaction(async (tx) => {
        const currentRide = await tx.ride.findUnique({
          where: { id: booking.rideId },
        });

        if (!currentRide || currentRide.availableSeats < booking.seats) {
          throw new AppError('Không đủ số ghế trống để xác nhận', 400);
        }

        await tx.ride.update({
          where: { id: booking.rideId },
          data: { availableSeats: { decrement: booking.seats } },
        });

        return tx.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.CONFIRMED },
        });
      });

      NotificationsService.createNotification(
        booking.passengerId,
        'Yêu cầu đặt chỗ được xác nhận',
        `Tài xế đã xác nhận ${booking.seats} ghế — ${booking.ride.origin} → ${booking.ride.destination}`,
        'BOOKING_STATUS'
      ).catch((err) => console.error('[Notification Error]:', err));

      return updatedBooking;
    }

    if (status === BookingStatus.REJECTED) {
      if (booking.status !== BookingStatus.PENDING) {
        throw new AppError('Chỉ có thể từ chối yêu cầu đang chờ (PENDING)', 400);
      }

      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.REJECTED },
      });

      NotificationsService.createNotification(
        booking.passengerId,
        'Yêu cầu đặt chỗ bị từ chối',
        `Rất tiếc, tài xế đã từ chối yêu cầu — ${booking.ride.origin} → ${booking.ride.destination}`,
        'BOOKING_STATUS'
      ).catch((err) => console.error('[Notification Error]:', err));

      return updatedBooking;
    }

    throw new AppError('Trạng thái không hợp lệ cho hành động này', 400);
  }

  static async cancelBooking(userId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { ride: true },
    });

    if (!booking) throw new AppError('Không tìm thấy yêu cầu đặt chỗ', 404);

    // Chỉ hành khách mới được hủy booking của mình
    if (booking.passengerId !== userId) {
      throw new AppError('Bạn không có quyền hủy yêu cầu này', 403);
    }

    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.REJECTED
    ) {
      throw new AppError('Yêu cầu đã được hủy hoặc từ chối trước đó', 400);
    }

    // Nếu đã CONFIRMED → phải hoàn lại ghế cho chuyến đi (atomic)
    if (booking.status === BookingStatus.CONFIRMED) {
      return prisma.$transaction(async (tx) => {
        await tx.ride.update({
          where: { id: booking.rideId },
          data: { availableSeats: { increment: booking.seats } },
        });
        return tx.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.CANCELLED },
        });
      });
    }

    // Nếu còn PENDING → chỉ cần cập nhật status
    return prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });
  }

  static async getBookingById(userId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ride: {
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
        },
        passenger: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
            passengerRating: true,
            passengerRatingCount: true,
          },
        },
      },
    });

    if (!booking) throw new AppError('Không tìm thấy yêu cầu đặt chỗ', 404);

    // Chỉ hành khách hoặc tài xế của chuyến đi mới được xem chi tiết
    if (booking.passengerId !== userId && booking.ride.driverId !== userId) {
      throw new AppError('Bạn không có quyền xem thông tin này', 403);
    }

    return booking;
  }

  static async getUserBookings(userId: string) {
    return prisma.booking.findMany({
      where: { passengerId: userId },
      include: {
        ride: {
          include: {
            driver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getRideBookings(rideId: string) {
    return prisma.booking.findMany({
      where: { rideId },
      include: {
        passenger: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getDriverBookings(userId: string) {
    return prisma.booking.findMany({
      where: { ride: { driverId: userId } },
      include: {
        ride: {
          select: {
            id: true,
            origin: true,
            originLat: true,
            originLng: true,
            destination: true,
            destinationLat: true,
            destinationLng: true,
            departureTime: true,
            status: true,
          },
        },
        passenger: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
      select: {
        id: true,
        seats: true,
        totalPrice: true,
        status: true,
        createdAt: true,
        ride: true,
        passenger: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Lấy booking đang active cho user hiện tại.
   * Tự detect vai trò: kiểm tra cả role passenger lẫn driver.
   * Ưu tiên: ride ONGOING > ride SCHEDULED
   * Trả về null nếu không có booking active nào.
   */
  static async getActiveBooking(userId: string) {
    // 1. Kiểm tra user có phải passenger đang có booking CONFIRMED
    // Ưu tiên tìm ride ONGOING trước
    let passengerBooking = await prisma.booking.findFirst({
      where: {
        passengerId: userId,
        status: BookingStatus.CONFIRMED,
        ride: {
          status: { in: ['ONGOING', 'SCHEDULED'] },
        },
      },
      include: {
        ride: {
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
        },
        passenger: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
      // Ưu tiên ride ONGOING (đang chạy) trước SCHEDULED (chưa bắt đầu)
      orderBy: { ride: { departureTime: 'asc' } },
    });

    if (passengerBooking) {
      return { ...passengerBooking, userRole: 'PASSENGER' as const };
    }

    // 2. Kiểm tra user có phải driver có ride đang active kèm booking CONFIRMED
    const driverRide = await prisma.ride.findFirst({
      where: {
        driverId: userId,
        status: { in: ['ONGOING', 'SCHEDULED'] },
        bookings: {
          some: { status: BookingStatus.CONFIRMED },
        },
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
        bookings: {
          where: { status: BookingStatus.CONFIRMED },
          include: {
            passenger: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                avatarUrl: true,
                passengerRating: true,
                passengerRatingCount: true,
              },
            },
          },
        },
      },
      orderBy: { departureTime: 'asc' },
    });

    if (driverRide) {
      return { ride: driverRide, userRole: 'DRIVER' as const };
    }

    return null;
  }
}

