import { extendedPrisma as prisma } from '@repo/database';
import { CreateBookingInput, UpdateBookingStatusInput, SocketEvents } from '@repo/shared';
import { BookingStatus } from '@repo/database';
import { AppError } from '../../shared/errors/AppError';
import { NotificationsService } from '../notifications/notifications.service';
import { getDriverLocation } from '../../shared/lib/redis';
import { SocketEventService } from '../../socket/socket.events';
import { RouteMatchingService } from './route-matching.service';

/** Ngưỡng lệch đường tối đa (km) — hành khách cách tuyến đường tài xế */
const MAX_DETOUR_KM = 2;
/** Ngưỡng lệch điểm đến tối đa (km) — điểm đến khách cách điểm đến tài xế */
const MAX_DEST_DEVIATION_KM = 5;
/** Thời gian chờ tài xế phản hồi popup (ms) */
const DRIVER_CONFIRM_TIMEOUT_MS = 30_000;

export class BookingsService {
  static async createBooking(passengerId: string, data: CreateBookingInput) {
    const { rideId, seats } = data;

    // 1. Lấy chuyến đi kèm thông tin tài xế và điểm đến
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        bookings: {
          where: {
            status: { in: ['CONFIRMED', 'PENDING'] },
            isPickedUp: false,
            passengerLat: { not: null },
            passengerLng: { not: null },
          }
        }
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

    // 3. Chuyến đi phải SCHEDULED hoặc ONGOING còn ghế trống
    if (ride.status !== 'SCHEDULED' && ride.status !== 'ONGOING') {
      throw new AppError('Chuyến đi này không còn nhận đặt chỗ nữa', 400);
    }

    // 4. Kiểm tra còn đủ ghế trống không
    if (ride.availableSeats < seats) {
      throw new AppError(
        `Chuyến đi chỉ còn ${ride.availableSeats} ghế, không đủ ${seats} ghế bạn yêu cầu`,
        400
      );
    }

    // 5. Kiểm tra user không có chuyến đi nào đang hoạt động với vai trò tài xế
    const activeDriverRide = await prisma.ride.findFirst({
      where: {
        driverId: passengerId,
        status: { in: ['SCHEDULED', 'ONGOING'] },
      },
    });

    if (activeDriverRide) {
      throw new AppError(
        'Bạn đang có một chuyến đi chưa hoàn thành (vai trò tài xế). Vui lòng hoàn thành hoặc hủy chuyến đi hiện tại để đặt chỗ mới.',
        400
      );
    }

    // 6. Kiểm tra user không có chuyến đi nào đang hoạt động với vai trò hành khách
    const activePassengerBooking = await prisma.booking.findFirst({
      where: {
        passengerId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        ride: {
          status: { in: ['SCHEDULED', 'ONGOING'] },
        },
      },
    });

    if (activePassengerBooking) {
      throw new AppError(
        'Bạn đang có một chuyến đi chưa hoàn thành hoặc đang chờ xác nhận (vai trò hành khách). Vui lòng hoàn thành hoặc hủy chuyến đi hiện tại để đặt chỗ mới.',
        400
      );
    }

    // ─── Nhánh ONGOING: kiểm tra "thuận đường" ──────────────────────────────
    if (ride.status === 'ONGOING') {
      return BookingsService.createOngoingBooking(passengerId, data, ride, seats);
    }

    // ─── Nhánh SCHEDULED: logic cũ với kiểm tra trùng lịch ─────────────────
    return BookingsService.createScheduledBooking(passengerId, data, ride, seats);
  }

  /**
   * Tạo booking cho chuyến đang SCHEDULED — giữ nguyên logic cũ (có kiểm tra trùng lịch).
   */
  private static async createScheduledBooking(
    passengerId: string,
    data: CreateBookingInput,
    ride: any,
    seats: number
  ) {
    const { rideId } = data;

    try {
      const booking = await prisma.booking.create({
        data: {
          rideId,
          passengerId,
          seats,
          totalPrice: ride.pricePerSeat * seats,
          status: BookingStatus.PENDING,
          passengerLat: (data as any).passengerLat,
          passengerLng: (data as any).passengerLng,
          pickupAddress: (data as any).pickupAddress ?? null,
        },
        include: {
          ride: { select: { origin: true, destination: true } },
          passenger: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      try {
        const newRequestPayload = {
          bookingId: booking.id,
          passenger: booking.passenger,
          seats: booking.seats,
          totalPrice: booking.totalPrice,
          rideId: booking.rideId,
          origin: booking.ride.origin,
          destination: booking.ride.destination,
          pickupLat: booking.passengerLat,
          pickupLng: booking.passengerLng,
          pickupAddress: booking.pickupAddress,
          isScheduled: true,
        };
        SocketEventService.emitToUser(ride.driverId, SocketEvents.BOOKING_NEW_REQUEST, newRequestPayload);
      } catch (socketErr) {
        console.warn('[BookingsService] Socket emit booking:new_request failed:', socketErr);
      }

      NotificationsService.createNotification(
        ride.driverId,
        'Yêu cầu đặt chỗ mới',
        `${booking.passenger.firstName} ${booking.passenger.lastName} muốn đặt ${seats} ghế — ${ride.origin} → ${ride.destination}`,
        'BOOKING_REQUEST'
      ).catch((err) => console.error('[Notification Error]:', err));

      return booking;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new AppError('BOOKING_ALREADY_EXISTS', 409);
      }
      throw error;
    }
  }

  /**
   * Tạo booking cho chuyến đang ONGOING — có kiểm tra "thuận đường" + popup realtime.
   *
   * Luồng:
   * 1. Kiểm tra hành khách cung cấp toạ độ đón
   * 2. Lấy vị trí hiện tại tài xế từ Redis
   * 3. Kiểm tra "thuận đường" bằng RouteMatchingService
   * 4. Tạo Booking PENDING
   * 5. Emit Socket popup cho tài xế (timeout 30 giây)
   */
  private static async createOngoingBooking(
    passengerId: string,
    data: CreateBookingInput,
    ride: any,
    seats: number
  ) {
    const { rideId } = data;

    // Hành khách PHẢI cung cấp toạ độ khi đặt vào chuyến ONGOING
    if ((data as any).passengerLat === undefined || (data as any).passengerLng === undefined) {
      throw new AppError(
        'Vui lòng chia sẻ vị trí hiện tại của bạn để ghép vào chuyến đang diễn ra',
        400
      );
    }

    // Ride ONGOING phải có điểm đến có toạ độ
    if (ride.destinationLat === null || ride.destinationLng === null) {
      throw new AppError(
        'Chuyến đi này chưa có thông tin toạ độ điểm đến, không thể ghép',
        400
      );
    }

    // Lấy vị trí hiện tại của tài xế từ Redis Geo Index
    const driverLocation = await getDriverLocation(ride.driverId);

    if (!driverLocation) {
      throw new AppError(
        'Tài xế chưa bật chia sẻ vị trí GPS. Không thể ghép chuyến lúc này.',
        400
      );
    }

    // Kiểm tra "thuận đường" bằng Haversine + Point-to-Segment
    // Lấy các điểm đón hiện tại của chuyến đi để tính toán detour sát thực tế hơn
    const currentWaypoints = ride.bookings?.map((b: any) => ({ lat: b.passengerLat, lng: b.passengerLng })) || [];

    const routeCheck = await RouteMatchingService.checkRouteWithGoong({
      driverCurrentLat: driverLocation.latitude,
      driverCurrentLng: driverLocation.longitude,
      driverDestLat: ride.destinationLat,
      driverDestLng: ride.destinationLng,
      passengerPickupLat: (data as any).passengerLat,
      passengerPickupLng: (data as any).passengerLng,
      // Hành khách không cung cấp điểm đến riêng → dùng điểm đến của ride làm fallback
      // Frontend có thể gửi thêm trường này trong tương lai
      passengerDestLat: ride.destinationLat,
      passengerDestLng: ride.destinationLng,
      maxDetourKm: MAX_DETOUR_KM,
      maxDestDeviationKm: MAX_DEST_DEVIATION_KM,
      currentWaypoints,
    });

    if (!routeCheck.isOnRoute) {
      const reason =
        routeCheck.detourKm > MAX_DETOUR_KM
          ? `Vị trí của bạn lệch khỏi tuyến đường tài xế ${routeCheck.detourKm.toFixed(1)}km (giới hạn ${MAX_DETOUR_KM}km)`
          : `Điểm đến của bạn cách điểm đến tài xế ${routeCheck.destDeviationKm.toFixed(1)}km (giới hạn ${MAX_DEST_DEVIATION_KM}km)`;

      throw new AppError(`Không thể ghép chuyến: ${reason}`, 400);
    }

    // Tạo Booking PENDING với thông tin toạ độ đón
    const booking = await prisma.booking.create({
      data: {
        rideId,
        passengerId,
        seats,
        totalPrice: ride.pricePerSeat * seats,
        status: BookingStatus.PENDING,
        passengerLat: (data as any).passengerLat,
        passengerLng: (data as any).passengerLng,
        pickupAddress: (data as any).pickupAddress ?? null,
      },
      include: {
        ride: { select: { origin: true, destination: true } },
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

    // Emit popup realtime tới tài xế — không await (không chặn response trả khách)
    // Tài xế có DRIVER_CONFIRM_TIMEOUT_MS giây để phản hồi
    BookingsService.notifyDriverForOngoingBooking(
      ride.driverId,
      booking,
      routeCheck.detourKm,
      DRIVER_CONFIRM_TIMEOUT_MS
    ).catch((err) =>
      console.error('[BookingsService] notifyDriverForOngoingBooking error:', err)
    );

    return booking;
  }

  /**
   * Gửi popup realtime cho tài xế khi có khách muốn ghép vào chuyến ONGOING.
   * Nếu tài xế không phản hồi trong timeout → tự động reject.
   *
   * Chạy hoàn toàn bất đồng bộ — không block response trả về hành khách.
   */
  private static async notifyDriverForOngoingBooking(
    driverId: string,
    booking: any,
    detourKm: number,
    timeoutMs: number
  ): Promise<void> {
    try {
      // Phát popup cho tài xế
      SocketEventService.emitToUser(driverId, SocketEvents.BOOKING_NEW_REQUEST, {
        bookingId: booking.id,
        passenger: booking.passenger,
        pickupLat: booking.passengerLat,
        pickupLng: booking.passengerLng,
        pickupAddress: booking.pickupAddress,
        seats: booking.seats,
        totalPrice: booking.totalPrice,
        detourKm: Math.round(detourKm * 10) / 10,
        timeoutSeconds: Math.round(timeoutMs / 1000),
        destination: booking.ride.destination,
      });

      // Đợi phản hồi bằng cách poll DB mỗi giây
      const pollIntervalMs = 1000;
      const maxPolls = timeoutMs / pollIntervalMs;

      for (let i = 0; i < maxPolls; i++) {
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

        const currentBooking = await prisma.booking.findUnique({
          where: { id: booking.id },
          select: { status: true },
        });

        if (!currentBooking) return; // Booking bị xoá

        // Tài xế đã xử lý (accept hoặc reject) → dừng chờ
        if (
          currentBooking.status === BookingStatus.CONFIRMED ||
          currentBooking.status === BookingStatus.REJECTED
        ) {
          return;
        }

        // Hành khách tự hủy
        if (currentBooking.status === BookingStatus.CANCELLED) {
          return;
        }
      }

      // Timeout: tài xế không phản hồi → tự động reject để bảo vệ hành khách
      console.log(
        `[BookingsService] Booking ${booking.id}: Driver timeout → auto reject`
      );
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.REJECTED },
      });

      // Thông báo hành khách tài xế không phản hồi
      try {
        SocketEventService.emitToUser(booking.passenger.id, SocketEvents.BOOKING_REJECTED, {
          bookingId: booking.id,
          reason: 'Tài xế không phản hồi trong thời gian quy định',
        });
      } catch (socketErr) {
        console.warn('[BookingsService] Socket emit to passenger failed:', socketErr);
      }
    } catch (err) {
      console.error('[BookingsService] notifyDriverForOngoingBooking failed:', err);
    }
  }

  /**
   * Tài xế xác nhận ghép khách khi đang ONGOING — gọi từ Socket handler.
   * Atomic: giảm ghế + CONFIRMED trong cùng 1 transaction.
   */
  static async handleDriverBookingConfirm(driverId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ride: true,
        passenger: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!booking) throw new AppError('Không tìm thấy yêu cầu đặt chỗ', 404);
    if (booking.ride.driverId !== driverId) {
      throw new AppError('Bạn không có quyền xác nhận yêu cầu này', 403);
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new AppError('Yêu cầu này không còn ở trạng thái chờ duyệt', 400);
    }

    // Atomic: kiểm tra ghế lần cuối + giảm ghế + cập nhật status
    const [updatedBooking, updatedRideAfterConfirm] = await prisma.$transaction(async (tx) => {
      const currentRide = await tx.ride.findUnique({
        where: { id: booking.rideId },
      });

      if (!currentRide || currentRide.availableSeats < booking.seats) {
        throw new AppError('Không đủ số ghế trống để xác nhận', 400);
      }

      const rideAfterUpdate = await tx.ride.update({
        where: { id: booking.rideId },
        data: { availableSeats: { decrement: booking.seats } },
        select: { id: true, availableSeats: true },
      });

      const confirmedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED },
        include: {
          passenger: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
        },
      });

      return [confirmedBooking, rideAfterUpdate];
    });

    // Thông báo hành khách: đã được xác nhận + gửi vị trí tài xế để navigate
    const driverLocation = await getDriverLocation(driverId);

    try {
      // Thông báo cho hành khách (ONGOING booking confirmed)
      SocketEventService.emitToUser(updatedBooking.passenger.id, SocketEvents.BOOKING_CONFIRMED, {
        bookingId,
        driverLat: driverLocation?.latitude ?? null,
        driverLng: driverLocation?.longitude ?? null,
        message: 'Tài xế đã xác nhận! Tài xế đang trên đường đến đón bạn.',
      });

      // Broadcast số ghế mới đến TOÀN BỘ client đang online
      SocketEventService.emitGlobal(SocketEvents.RIDE_SEATS_UPDATED, {
        rideId: booking.rideId,
        availableSeats: updatedRideAfterConfirm.availableSeats,
      });

      if (updatedRideAfterConfirm.availableSeats === 0) {
        SocketEventService.emitGlobal(SocketEvents.RIDE_FULL, { rideId: booking.rideId });
      }
    } catch (socketErr) {
      console.warn('[BookingsService] Socket emit booking:confirmed failed:', socketErr);
    }

    // Thông báo push (background)
    NotificationsService.createNotification(
      updatedBooking.passenger.id,
      'Yêu cầu đặt chỗ được xác nhận',
      `Tài xế đã xác nhận ${booking.seats} ghế — ${booking.ride.origin} → ${booking.ride.destination}`,
      'BOOKING_STATUS'
    ).catch((err) => console.error('[Notification Error]:', err));

    return updatedBooking;
  }

  /**
   * Tài xế từ chối ghép khách khi đang ONGOING — gọi từ Socket handler.
   */
  static async handleDriverBookingReject(driverId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ride: { select: { driverId: true, origin: true, destination: true } },
        passenger: { select: { id: true } },
      },
    });

    if (!booking) throw new AppError('Không tìm thấy yêu cầu đặt chỗ', 404);
    if (booking.ride.driverId !== driverId) {
      throw new AppError('Bạn không có quyền từ chối yêu cầu này', 403);
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new AppError('Yêu cầu này không còn ở trạng thái chờ duyệt', 400);
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.REJECTED },
    });

    // Thông báo hành khách
    try {
      SocketEventService.emitToUser(booking.passenger.id, SocketEvents.BOOKING_REJECTED, {
        bookingId,
        reason: 'Tài xế đã từ chối yêu cầu ghép chuyến',
      });
    } catch (socketErr) {
      console.warn('[BookingsService] Socket emit booking:rejected failed:', socketErr);
    }

    NotificationsService.createNotification(
      booking.passenger.id,
      'Yêu cầu đặt chỗ bị từ chối',
      `Rất tiếc, tài xế đã từ chối yêu cầu — ${booking.ride.origin} → ${booking.ride.destination}`,
      'BOOKING_STATUS'
    ).catch((err) => console.error('[Notification Error]:', err));

    return updatedBooking;
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

    if (booking.ride.driverId !== userId) {
      throw new AppError('FORBIDDEN_BOOKING_ACCESS', 403);
    }

    if (status === BookingStatus.CONFIRMED) {
      let isFull = false;
      const [updatedBooking, updatedRideAfterConfirm] = await prisma.$transaction(async (tx) => {
        const updatedBookings = await tx.booking.updateMany({
          where: { id: bookingId, status: BookingStatus.PENDING },
          data: { status: BookingStatus.CONFIRMED }
        });
        if (updatedBookings.count === 0) {
          throw new AppError('BOOKING_NOT_PENDING', 409);
        }

        const updatedRides = await tx.ride.updateMany({
          where: { id: booking.rideId, status: 'SCHEDULED', availableSeats: { gte: booking.seats } },
          data: { availableSeats: { decrement: booking.seats } }
        });

        if (updatedRides.count === 0) {
          const currentRide = await tx.ride.findUnique({ where: { id: booking.rideId } });
          if (!currentRide) {
            throw new AppError('RIDE_NOT_FOUND', 404);
          }
          if (currentRide.status !== 'SCHEDULED') {
            throw new AppError('RIDE_NOT_SCHEDULED', 409);
          }
          throw new AppError('RIDE_NO_AVAILABLE_SEATS', 409);
        }

        const currentRide = await tx.ride.findUnique({ where: { id: booking.rideId } });
        if (currentRide && currentRide.availableSeats === 0) {
          await tx.ride.update({ where: { id: currentRide.id }, data: { status: 'FULL' } });
          isFull = true;
        }

        const b = await tx.booking.findUnique({ where: { id: bookingId } });
        return [b, currentRide];
      });

      try {
        const payload = { bookingId, rideId: booking.rideId, message: 'Tài xế đã xác nhận chuyến đi của bạn.' };
        SocketEventService.emitToUser(booking.passengerId, SocketEvents.BOOKING_CONFIRMED, payload);
        SocketEventService.emitToRoom(`ride:${booking.rideId}`, SocketEvents.RIDE_SEATS_UPDATED, { rideId: booking.rideId, availableSeats: updatedRideAfterConfirm?.availableSeats });
        if (isFull) {
          SocketEventService.emitToRoom(`ride:${booking.rideId}`, SocketEvents.RIDE_FULL, { rideId: booking.rideId });
        }
      } catch (e) {}

      return updatedBooking;
    }

    if (status === BookingStatus.REJECTED) {
      const updatedBookings = await prisma.booking.updateMany({
        where: { id: bookingId, status: BookingStatus.PENDING },
        data: { status: BookingStatus.REJECTED }
      });
      if (updatedBookings.count === 0) {
        throw new AppError('BOOKING_NOT_PENDING', 409);
      }

      try {
        SocketEventService.emitToUser(booking.passengerId, SocketEvents.BOOKING_REJECTED, { bookingId, reason: 'Tài xế đã từ chối yêu cầu của bạn' });
      } catch(e) {}
      
      return await prisma.booking.findUnique({ where: { id: bookingId } });
    }

    throw new AppError('Trạng thái không hợp lệ cho hành động này', 400);
  }

  static async confirmPassengerPickup(userId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { ride: true, passenger: true },
    });

    if (!booking) throw new AppError('Không tìm thấy yêu cầu đặt chỗ', 404);

    if (booking.ride.driverId !== userId) {
      throw new AppError('Bạn không có quyền thực hiện hành động này', 403);
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new AppError('Hành khách này chưa được xác nhận ghép chuyến', 400);
    }
    
    if (booking.isPickedUp) {
      throw new AppError('Hành khách này đã được đón', 400);
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { isPickedUp: true },
      include: { passenger: { select: { id: true } } }
    });

    // Notify passenger realtime — dùng user: prefix chuẩn
    try {
      const pickedUpPayload = {
        bookingId,
        rideId: booking.rideId,
        message: 'Tài xế đã xác nhận đón bạn thành công',
      };

      SocketEventService.emitToUser(booking.passengerId, SocketEvents.BOOKING_PICKED_UP, pickedUpPayload);
      // Emit tới ride room để cả 2 bên cùng cập nhật
      SocketEventService.emitToRoom(`ride:${booking.rideId}`, SocketEvents.BOOKING_PICKED_UP, pickedUpPayload);
    } catch (socketErr) {
      console.warn('[BookingsService] Socket emit booking:picked_up failed:', socketErr);
    }

    return updatedBooking;
  }

  static async dropoffPassenger(userId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { ride: true, passenger: true },
    });

    if (!booking) throw new AppError('Không tìm thấy yêu cầu đặt chỗ', 404);

    if (booking.ride.driverId !== userId) {
      throw new AppError('Bạn không có quyền thực hiện hành động này', 403);
    }

    if (booking.status !== BookingStatus.CONFIRMED || !booking.isPickedUp) {
      throw new AppError('Hành khách này chưa lên xe hoặc đã hoàn thành', 400);
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.COMPLETED },
      include: { passenger: { select: { id: true } } }
    });

    // Notify passenger realtime — dùng user: prefix chuẩn
    try {
      const completedPayload = {
        bookingId,
        rideId: booking.rideId,
        message: 'Tài xế đã kết thúc hành trình của bạn. Cảm ơn bạn đã sử dụng dịch vụ!',
      };

      SocketEventService.emitToUser(booking.passengerId, SocketEvents.BOOKING_COMPLETED, completedPayload);
      // Emit tới ride room để Driver cũng biết đã hoàn thành
      SocketEventService.emitToRoom(`ride:${booking.rideId}`, SocketEvents.BOOKING_COMPLETED, completedPayload);
    } catch (socketErr) {
      console.warn('[BookingsService] Socket emit booking:completed failed:', socketErr);
    }

    return updatedBooking;
  }

  static async cancelBooking(userId: string, bookingId: string, cancelReason?: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { ride: true },
    });

    if (!booking) throw new AppError('Không tìm thấy yêu cầu đặt chỗ', 404);

    if (booking.passengerId !== userId) {
      throw new AppError('FORBIDDEN_BOOKING_ACCESS', 403);
    }

    if (!cancelReason) {
      throw new AppError('Vui lòng cung cấp lý do hủy vé', 400);
    }

    let isFullToScheduled = false;
    let availableSeatsAfter = booking.ride.availableSeats;
    let updatedBookingRes;

    if (booking.status === BookingStatus.PENDING) {
      const updated = await prisma.booking.updateMany({
        where: { id: bookingId, passengerId: userId, status: BookingStatus.PENDING },
        data: { status: BookingStatus.CANCELLED, cancelReason }
      });
      if (updated.count === 0) throw new AppError('BOOKING_NOT_CANCELLABLE', 409);
      updatedBookingRes = await prisma.booking.findUnique({ where: { id: bookingId }});
    } else if (booking.status === BookingStatus.CONFIRMED) {
      if (!['SCHEDULED', 'FULL'].includes(booking.ride.status)) {
        throw new AppError('BOOKING_NOT_CANCELLABLE', 409);
      }

      updatedBookingRes = await prisma.$transaction(async (tx) => {
        const updated = await tx.booking.updateMany({
          where: { id: bookingId, passengerId: userId, status: BookingStatus.CONFIRMED },
          data: { status: BookingStatus.CANCELLED, cancelReason }
        });
        if (updated.count === 0) throw new AppError('BOOKING_NOT_CANCELLABLE', 409);

        const updatedRide = await tx.ride.updateMany({
          where: { id: booking.rideId, status: { in: ['SCHEDULED', 'FULL'] } },
          data: { availableSeats: { increment: booking.seats } }
        });
        if (updatedRide.count === 0) throw new AppError('BOOKING_NOT_CANCELLABLE', 409);

        const currentRide = await tx.ride.findUnique({ where: { id: booking.rideId } });
        if (currentRide) availableSeatsAfter = currentRide.availableSeats;
        if (booking.ride.status === 'FULL' && currentRide && currentRide.availableSeats > 0) {
           await tx.ride.update({ where: { id: currentRide.id }, data: { status: 'SCHEDULED' } });
           isFullToScheduled = true;
        }

        return tx.booking.findUnique({ where: { id: bookingId }});
      });

      try {
        SocketEventService.emitToRoom(`ride:${booking.rideId}`, SocketEvents.RIDE_SEATS_UPDATED, {
          rideId: booking.rideId,
          availableSeats: availableSeatsAfter
        });
        if (isFullToScheduled) {
          SocketEventService.emitToRoom(`ride:${booking.rideId}`, SocketEvents.RIDE_STATUS_UPDATED, {
             rideId: booking.rideId,
             status: 'SCHEDULED',
             updatedAt: new Date().toISOString()
          });
        }
      } catch (err) {}
    } else {
      throw new AppError('BOOKING_NOT_CANCELLABLE', 409);
    }
    
    return updatedBookingRes;
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
      select: {
        id: true,
        seats: true,
        totalPrice: true,
        status: true,
        isPickedUp: true,
        createdAt: true,
        passengerLat: true,
        passengerLng: true,
        pickupAddress: true,
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
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
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

    // 2. Kiểm tra user có phải driver có ride đang active hay không
    const driverRide = await prisma.ride.findFirst({
      where: {
        driverId: userId,
        status: { in: ['ONGOING', 'SCHEDULED'] },
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
          where: { status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED] } },
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
