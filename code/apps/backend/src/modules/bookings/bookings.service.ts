import { extendedPrisma as prisma } from '@repo/database';
import { CreateBookingInput, UpdateBookingStatusInput, SocketEvents } from '@repo/shared';
import { BookingStatus, Prisma } from '@repo/database';
import { AppError } from '../../shared/errors/AppError';
import { NotificationsService } from '../notifications/notifications.service';
import { getDriverLocation } from '../../shared/lib/redis';
import { SocketEventService } from '../../socket/socket.events';
import { RouteMatchingService } from './route-matching.service';
import { PricingService } from '../pricing/pricing.service';
import { RideMatchingService } from '../rides/ride-matching.service';

/** Ngưỡng lệch đường tối đa (km) — hành khách cách tuyến đường tài xế */
const MAX_DETOUR_KM = 5;
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
        vehicle: { select: { type: true } },
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
        status: { in: ['SCHEDULED', 'FULL', 'ONGOING'] },
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
          status: { in: ['SCHEDULED', 'FULL', 'ONGOING'] },
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
    const pickup = {
      lat: data.passengerLat ?? ride.originLat,
      lng: data.passengerLng ?? ride.originLng,
    };
    const dropoff = {
      lat: data.dropoffLat ?? ride.destinationLat,
      lng: data.dropoffLng ?? ride.destinationLng,
    };
    if (pickup.lat == null || pickup.lng == null || dropoff.lat == null || dropoff.lng == null) {
      throw new AppError('Chuyến đi thiếu tọa độ để tính mức đóng góp carpool', 400);
    }
    const routeMatch = RideMatchingService.match(ride, { origin: pickup, destination: dropoff });
    if (!routeMatch) throw new AppError('Điểm đón/trả không thỏa giới hạn lệch tuyến carpool', 400);
    const pricing = await this.calculateBookingContribution(data, ride, seats, routeMatch.detourKm);

    // Tạo booking với trạng thái PENDING (chờ tài xế duyệt)
    const booking = await prisma.booking.create({
      data: {
        rideId,
        passengerId,
        seats,
        totalPrice: pricing.totalPrice,
        sharedDistanceKm: pricing.sharedDistanceKm,
        detourKm: pricing.detourKm,
        priceBreakdown: pricing as unknown as Prisma.InputJsonValue,
        status: BookingStatus.PENDING,
        passengerLat: (data as any).passengerLat,
        passengerLng: (data as any).passengerLng,
        pickupAddress: (data as any).pickupAddress ?? null,
        // Multi-Passenger: điểm trả khách riêng (null = xuống cùng điểm đến tài xế)
        dropoffLat: (data as any).dropoffLat ?? null,
        dropoffLng: (data as any).dropoffLng ?? null,
        dropoffAddress: (data as any).dropoffAddress ?? null,
      },
      include: {
        ride: { select: { origin: true, destination: true } },
        passenger: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Emit socket popup realtime cho tài xế — không await (không block response)
    // isScheduled = true để frontend phân biệt với booking ONGOING (không cần timeout)
    // Emit cả tới room ride:${rideId} (nếu Driver đang xem /ongoing) VÀ user:${driverId}
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

      // Emit tới user room của driver (luôn nhận dù không join ride room)
      SocketEventService.emitToUser(ride.driverId, SocketEvents.BOOKING_NEW_REQUEST, newRequestPayload);
    } catch (socketErr) {
      // Socket chưa init hoặc tài xế offline — không critical, notification vẫn gửi
      console.warn('[BookingsService] Socket emit booking:new_request (scheduled) failed:', socketErr);
    }

    // Thông báo push cho tài xế (background — không chặn response)
    NotificationsService.createNotification(
      ride.driverId,
      'Yêu cầu đặt chỗ mới',
      `${booking.passenger.firstName} ${booking.passenger.lastName} muốn đặt ${seats} ghế — ${ride.origin} → ${ride.destination}`,
      'BOOKING_REQUEST'
    ).catch((err) => console.error('[Notification Error]:', err));

    return booking;
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
      // Multi-Passenger: dùng điểm đến riêng của khách nếu có, fallback về điểm đến ride
      passengerDestLat: (data as any).dropoffLat ?? ride.destinationLat,
      passengerDestLng: (data as any).dropoffLng ?? ride.destinationLng,
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

    const pricing = await this.calculateBookingContribution(data, ride, seats, routeCheck.detourKm);

    // Tạo Booking PENDING với thông tin toạ độ đón + điểm trả riêng (Multi-Passenger)
    const booking = await prisma.booking.create({
      data: {
        rideId,
        passengerId,
        seats,
        totalPrice: pricing.totalPrice,
        sharedDistanceKm: pricing.sharedDistanceKm,
        detourKm: pricing.detourKm,
        priceBreakdown: pricing as unknown as Prisma.InputJsonValue,
        status: BookingStatus.PENDING,
        passengerLat: (data as any).passengerLat,
        passengerLng: (data as any).passengerLng,
        pickupAddress: (data as any).pickupAddress ?? null,
        // Multi-Passenger: điểm trả khách riêng
        dropoffLat: (data as any).dropoffLat ?? null,
        dropoffLng: (data as any).dropoffLng ?? null,
        dropoffAddress: (data as any).dropoffAddress ?? null,
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

  private static async calculateBookingContribution(
    data: CreateBookingInput,
    ride: any,
    seats: number,
    detourKm: number
  ) {
    const pickup = {
      lat: data.passengerLat ?? ride.originLat,
      lng: data.passengerLng ?? ride.originLng,
    };
    const dropoff = {
      lat: data.dropoffLat ?? ride.destinationLat,
      lng: data.dropoffLng ?? ride.destinationLng,
    };
    if (pickup.lat == null || pickup.lng == null || dropoff.lat == null || dropoff.lng == null) {
      throw new AppError('Không đủ tọa độ để tính mức đóng góp', 400);
    }

    const sharedDistanceKm = RideMatchingService.sharedRouteDistance(ride, pickup, dropoff);
    if (sharedDistanceKm <= 0) throw new AppError('Điểm trả phải nằm sau điểm đón trên tuyến tài xế', 400);
    const originalDistanceKm = Math.max(ride.distance ?? sharedDistanceKm, 0.001);
    const vehicleType = ride.vehicle?.type ?? 'CAR';
    const config = await PricingService.getActiveConfig(vehicleType);
    const existing = await prisma.booking.aggregate({
      where: { rideId: ride.id, status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] } },
      _sum: { totalPrice: true },
    });
    const fullRoute = PricingService.calculateCarpoolContribution({
      sharedDistanceKm: originalDistanceKm,
      originalDistanceKm,
      detourKm: 0,
      offeredSeats: ride.offeredSeats,
      tollCost: ride.tollCost,
    }, config);
    const priceFactor = fullRoute.recommendedPricePerSeat > 0
      ? ride.pricePerSeat / fullRoute.recommendedPricePerSeat
      : 1;

    return PricingService.calculateCarpoolContribution({
      sharedDistanceKm,
      originalDistanceKm,
      detourKm,
      offeredSeats: ride.offeredSeats,
      bookedSeats: seats,
      // Chưa có mô hình toll segment; phân bổ theo phần tuyến thực tế được dùng.
      tollCost: ride.tollCost * Math.min(1, sharedDistanceKm / originalDistanceKm),
      tripTollCost: ride.tollCost,
      existingContributions: existing._sum.totalPrice ?? 0,
      priceFactor,
    }, config);
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
        });

        return [confirmedBooking, rideAfterUpdate];
      });

      // Emit socket realtime sau khi transaction đã commit thành công
      // Dùng user:${passengerId} prefix để nhất quán với cách socket server join room
      try {
        const confirmedPayload = {
          bookingId,
          rideId: booking.rideId,
          message: 'Tài xế đã xác nhận chuyến đi của bạn.',
        };

        // Thông báo cho hành khách (qua user room)
        SocketEventService.emitToUser(booking.passengerId, SocketEvents.BOOKING_CONFIRMED, confirmedPayload);

        // Emit tới ride room để cả driver lẫn các passengers khác biết
        SocketEventService.emitToRoom(`ride:${booking.rideId}`, SocketEvents.BOOKING_CONFIRMED, confirmedPayload);

        // Broadcast số ghế mới đến TOÀN BỘ client đang online
        SocketEventService.emitGlobal(SocketEvents.RIDE_SEATS_UPDATED, {
          rideId: booking.rideId,
          availableSeats: updatedRideAfterConfirm.availableSeats,
        });

        // Nếu hết ghế → broadcast thêm event ẩn chuyến để UX rõ ràng hơn
        if (updatedRideAfterConfirm.availableSeats === 0) {
          SocketEventService.emitGlobal(SocketEvents.RIDE_FULL, { rideId: booking.rideId });
        }
      } catch (socketErr) {
        console.warn('[BookingsService] Socket emit after confirm failed:', socketErr);
      }

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

      // Emit socket realtime để hành khách cập nhật ngay mà không cần refresh
      try {
        SocketEventService.emitToUser(booking.passengerId, SocketEvents.BOOKING_REJECTED, {
          bookingId,
          reason: 'Tài xế đã từ chối yêu cầu của bạn',
        });
      } catch (socketErr) {
        console.warn('[BookingsService] Socket emit booking:rejected failed:', socketErr);
      }

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

    if (!booking.driverArrivedAt) {
      throw new AppError('Vui lòng xác nhận đã tới điểm đón trước khi đón khách', 400);
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { isPickedUp: true, pickedUpAt: new Date() },
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

  static async markDriverArrived(userId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { ride: true, passenger: true },
    });

    if (!booking) throw new AppError('Không tìm thấy yêu cầu đặt chỗ', 404);
    if (booking.ride.driverId !== userId) {
      throw new AppError('Bạn không có quyền thực hiện hành động này', 403);
    }
    if (booking.status !== BookingStatus.CONFIRMED || booking.isPickedUp) {
      throw new AppError('Điểm đón này không còn chờ tài xế', 400);
    }
    if (booking.driverArrivedAt) {
      throw new AppError('Bạn đã thông báo tới điểm đón trước đó', 400);
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { driverArrivedAt: new Date() },
    });

    const payload = {
      bookingId,
      rideId: booking.rideId,
      message: 'Tài xế đã đến điểm đón. Vui lòng chuẩn bị lên xe.',
    };

    try {
      SocketEventService.emitToUser(
        booking.passengerId,
        SocketEvents.BOOKING_DRIVER_ARRIVED,
        payload
      );
      SocketEventService.emitToRoom(
        `ride:${booking.rideId}`,
        SocketEvents.BOOKING_DRIVER_ARRIVED,
        payload
      );
    } catch (socketErr) {
      console.warn('[BookingsService] Socket emit booking:driver_arrived failed:', socketErr);
    }

    NotificationsService.createNotification(
      booking.passengerId,
      'Tài xế đã tới điểm đón',
      `Tài xế đang chờ bạn tại ${booking.pickupAddress ?? booking.ride.origin}`,
      'BOOKING_STATUS'
    ).catch((error) => console.error('[Notification Error]:', error));

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

    if (booking.isDroppedOff) {
      throw new AppError('Hành khách này đã được trả trước đó', 400);
    }

    // Multi-Passenger: đánh dấu trả khách + hoàn thành booking trong cùng transaction
    // Hoàn lại 1 ghế trống sau khi trả khách (khách đã xuống xe = chỗ ngồi được giải phóng)
    const [updatedBooking] = await prisma.$transaction(async (tx) => {
      const dropped = await tx.booking.update({
        where: { id: bookingId },
        data: {
          isDroppedOff: true,
          droppedOffAt: new Date(),
          status: BookingStatus.COMPLETED,
        },
        include: { passenger: { select: { id: true } } },
      });

      // Hoàn lại ghế trống cho chuyến đi — khách đã xuống, ghế có thể nhận khách mới
      await tx.ride.update({
        where: { id: booking.rideId },
        data: { availableSeats: { increment: booking.seats } },
      });

      return [dropped];
    });

    // Notify passenger realtime — dùng user: prefix chuẩn
    try {
      const completedPayload = {
        bookingId,
        rideId: booking.rideId,
        dropoffAddress: booking.dropoffAddress ?? booking.ride.destination,
        message: 'Tài xế đã kết thúc hành trình của bạn. Cảm ơn bạn đã sử dụng dịch vụ!',
      };

      SocketEventService.emitToUser(booking.passengerId, SocketEvents.BOOKING_COMPLETED, completedPayload);
      // Emit tới ride room để Driver cũng biết đã hoàn thành
      SocketEventService.emitToRoom(`ride:${booking.rideId}`, SocketEvents.BOOKING_COMPLETED, completedPayload);

      // Broadcast ghế được hoàn lại — các client xem danh sách có thể thấy chuyến lại
      SocketEventService.emitGlobal(SocketEvents.RIDE_SEATS_UPDATED, {
        rideId: booking.rideId,
        availableSeats: booking.ride.availableSeats + booking.seats,
      });
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

    if (booking.ride.status === 'ONGOING' || booking.ride.status === 'COMPLETED') {
      throw new AppError('Không thể hủy chuyến xe đã khởi hành hoặc đã hoàn thành', 400);
    }

    if (!cancelReason) {
      throw new AppError('Vui lòng cung cấp lý do hủy vé', 400);
    }

    // Nếu đã CONFIRMED → phải hoàn lại ghế cho chuyến đi (atomic)
    if (booking.status === BookingStatus.CONFIRMED) {
      const [cancelledBooking, restoredRide] = await prisma.$transaction(async (tx) => {
        const rideAfterRestore = await tx.ride.update({
          where: { id: booking.rideId },
          data: { availableSeats: { increment: booking.seats } },
          select: { id: true, availableSeats: true },
        });
        const cancelled = await tx.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.CANCELLED, cancelReason },
        });
        return [cancelled, rideAfterRestore];
      });

      // Broadcast ghế được hoàn lại → các client có thể thấy chuyến này lại
      try {
        SocketEventService.emitGlobal(SocketEvents.RIDE_SEATS_UPDATED, {
          rideId: booking.rideId,
          availableSeats: restoredRide.availableSeats,
        });
      } catch (socketErr) {
        console.warn('[BookingsService] Socket emit ride:seats_updated (cancel) failed:', socketErr);
      }

      return cancelledBooking;
    }

    // Nếu còn PENDING → chỉ cần cập nhật status (ghế chưa bị trừ, không cần hoàn)
    return prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED, cancelReason },
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
            vehicle: {
              select: {
                id: true,
                type: true,
                color: true,
                licensePlate: true,
                imageUrl: true,
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

    const pickup = booking.passengerLat != null && booking.passengerLng != null
      ? { lat: booking.passengerLat, lng: booking.passengerLng }
      : booking.ride.originLat != null && booking.ride.originLng != null
        ? { lat: booking.ride.originLat, lng: booking.ride.originLng }
        : null;
    const dropoff = booking.dropoffLat != null && booking.dropoffLng != null
      ? { lat: booking.dropoffLat, lng: booking.dropoffLng }
      : booking.ride.destinationLat != null && booking.ride.destinationLng != null
        ? { lat: booking.ride.destinationLat, lng: booking.ride.destinationLng }
        : null;
    const matching = pickup && dropoff
      ? RideMatchingService.match(booking.ride, { origin: pickup, destination: dropoff })
      : null;
    const detourKm = booking.detourKm ?? matching?.detourKm ?? 0;
    const additionalTimeMinutes = booking.ride.distance && booking.ride.duration
      ? Math.max(0, Math.round(detourKm * booking.ride.duration / booking.ride.distance))
      : Math.max(0, Math.round(detourKm * 2));

    return { ...booking, matching, additionalTimeMinutes };
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

  static async getRideBookings(userId: string, rideId: string) {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      select: { driverId: true },
    });

    if (!ride) throw new AppError('Không tìm thấy chuyến đi', 404);
    if (ride.driverId !== userId) {
      throw new AppError('Bạn không có quyền xem hành khách của chuyến này', 403);
    }

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
            passengerRating: true,
            passengerRatingCount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getDriverBookings(userId: string) {
    const bookings = await prisma.booking.findMany({
      where: { ride: { driverId: userId } },
      select: {
        id: true,
        seats: true,
        totalPrice: true,
        status: true,
        isPickedUp: true,
        isDroppedOff: true,
        driverArrivedAt: true,
        pickedUpAt: true,
        droppedOffAt: true,
        createdAt: true,
        sharedDistanceKm: true,
        detourKm: true,
        priceBreakdown: true,
        passengerLat: true,
        passengerLng: true,
        pickupAddress: true,
        // Multi-Passenger: điểm trả khách riêng
        dropoffLat: true,
        dropoffLng: true,
        dropoffAddress: true,
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
            distance: true,
            duration: true,
            routePolyline: true,
            allowRoutePickup: true,
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
      orderBy: { createdAt: 'desc' },
    });

    return bookings
      .map((booking) => {
        const pickup = booking.passengerLat != null && booking.passengerLng != null
          ? { lat: booking.passengerLat, lng: booking.passengerLng }
          : booking.ride.originLat != null && booking.ride.originLng != null
            ? { lat: booking.ride.originLat, lng: booking.ride.originLng }
            : null;
        const dropoff = booking.dropoffLat != null && booking.dropoffLng != null
          ? { lat: booking.dropoffLat, lng: booking.dropoffLng }
          : booking.ride.destinationLat != null && booking.ride.destinationLng != null
            ? { lat: booking.ride.destinationLat, lng: booking.ride.destinationLng }
            : null;
        const matching = pickup && dropoff
          ? RideMatchingService.match(booking.ride, { origin: pickup, destination: dropoff })
          : null;
        const detourKm = booking.detourKm ?? matching?.detourKm ?? 0;
        const additionalTimeMinutes = booking.ride.distance && booking.ride.duration
          ? Math.max(0, Math.round(detourKm * booking.ride.duration / booking.ride.distance))
          : Math.max(0, Math.round(detourKm * 2));
        return { ...booking, matching, additionalTimeMinutes };
      })
      .sort((left, right) => {
        if (left.status === BookingStatus.PENDING && right.status !== BookingStatus.PENDING) return -1;
        if (right.status === BookingStatus.PENDING && left.status !== BookingStatus.PENDING) return 1;
        return (right.matching?.matchScore ?? 0) - (left.matching?.matchScore ?? 0);
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
          status: { in: ['ONGOING', 'SCHEDULED', 'FULL'] },
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
        status: { in: ['ONGOING', 'SCHEDULED', 'FULL'] },
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
