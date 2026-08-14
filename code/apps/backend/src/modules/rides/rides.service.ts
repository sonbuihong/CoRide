import { extendedPrisma as prisma } from '@repo/database';
import { Prisma } from '@repo/database';
import { CreateRideInput, SearchRideInput, SocketEvents } from '@repo/shared';
import { AppError } from '../../shared/errors/AppError';
import { SocketEventService } from '../../socket/socket.events';
import { RideMatchingService } from './ride-matching.service';
import { PricingService } from '../pricing/pricing.service';
import { getDriverLocation } from '../../shared/lib/redis';

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
  vehicle: {
    select: {
      licensePlate: true,
      type: true,
      color: true,
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
        status: { in: ['SCHEDULED', 'FULL', 'ONGOING'] },
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
          status: { in: ['SCHEDULED', 'FULL', 'ONGOING'] },
        },
      },
    });

    if (activePassengerBooking) {
      throw new AppError(
        'Bạn đang có một chuyến đi chưa hoàn thành (vai trò hành khách). Vui lòng hoàn thành hoặc hủy chuyến đi hiện tại để đăng chuyến mới.',
        400
      );
    }

    // Backend kiểm tra lại các trường cốt lõi; không tin việc frontend đã đi đủ wizard.
    if (!data.origin?.trim() || !data.destination?.trim()) {
      throw new AppError('Điểm đi và điểm đến là bắt buộc', 400);
    }
    if (
      data.originLat == null || data.originLng == null ||
      data.destinationLat == null || data.destinationLng == null
    ) {
      throw new AppError('Tọa độ điểm đi và điểm đến là bắt buộc', 400);
    }
    if (data.originLat === data.destinationLat && data.originLng === data.destinationLng) {
      throw new AppError('Điểm đi và điểm đến không được trùng nhau', 400);
    }
    if (!data.routePolyline || data.distance == null || data.distance <= 0 || data.duration == null || data.duration <= 0) {
      throw new AppError('Lộ trình chuyến đi chưa hợp lệ', 400);
    }
    if (!data.vehicleId) {
      throw new AppError('Phương tiện là bắt buộc', 400);
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, userId: driverId, status: 'ACTIVE' },
      select: { type: true },
    });
    if (!vehicle) throw new AppError('Phương tiện không hợp lệ hoặc không thuộc tài xế', 400);

    const maximumSeats = vehicle.type === 'BIKE' ? 1 : 4;
    if (data.availableSeats > maximumSeats) {
      throw new AppError(`Phương tiện này chỉ được mở tối đa ${maximumSeats} ghế`, 400);
    }

    // Backend là nguồn giá chuẩn; không tin giá client gửi lên.
    const estimate = await PricingService.estimateCarpool(
      data.originLat,
      data.originLng,
      data.destinationLat,
      data.destinationLng,
      vehicle.type,
      data.availableSeats
    );
    const systemPricePerSeat = estimate.recommendedPricePerSeat;

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
        routePolyline: data.routePolyline ?? null,
        departureTime,
        availableSeats: data.availableSeats,
        offeredSeats: data.availableSeats,
        pricePerSeat: systemPricePerSeat,
        description: data.description ?? null,
        originHouseNumber: data.originHouseNumber ?? null,
        originStreet: data.originStreet ?? null,
        originWard: data.originWard ?? null,
        originDistrict: data.originDistrict ?? null,
        originProvince: data.originProvince ?? null,
        originAddressType: data.originAddressType ?? null,
        destHouseNumber: data.destHouseNumber ?? null,
        destStreet: data.destStreet ?? null,
        destWard: data.destWard ?? null,
        destDistrict: data.destDistrict ?? null,
        destProvince: data.destProvince ?? null,
        destAddressType: data.destAddressType ?? null,
        addressDetailLevel: data.addressDetailLevel ?? null,
        // Quy định chuyến đi
        allowRoutePickup: data.allowRoutePickup ?? true,
        allowSmoking: data.allowSmoking ?? false,
        allowPets: data.allowPets ?? false,
        allowLuggage: data.allowLuggage ?? true,
        // Phương tiện (nullable — tài xế có thể không chọn)
        vehicleId: data.vehicleId ?? null,
      },
      include: {
        ...DRIVER_SELECT,
        vehicle: true,
      },
    });

    try {
      SocketEventService.emitGlobal(SocketEvents.RIDE_CREATED, newRide);
    } catch (e) {
      console.warn('[RidesService] Socket emit skipped:', e);
    }

    return newRide;
  }

  static async searchRides(filters: SearchRideInput) {
    const {
      origin, originLat, originLng,
      destination, destinationLat, destinationLng,
      date, seats = 1, maxPrice, departurePeriod, vehicleType, driverId,
    } = filters;
    const requestedSeats = Math.max(1, Number(seats) || 1);
    const hasOriginCoordinates = originLat != null && originLng != null;
    const hasDestinationCoordinates = destinationLat != null && destinationLng != null;
    const hasPassengerRoute =
      hasOriginCoordinates && hasDestinationCoordinates;

    // Dùng Prisma.RideWhereInput thay vì any để đảm bảo type safety
    const where: Prisma.RideWhereInput = {};

    if (driverId) {
      // Tài xế xem chuyến đi của mình — không lọc theo status
      where.driverId = driverId;
    } else {
      // Hành khách tìm chuyến — chỉ lấy chuyến còn ghế
      where.availableSeats = { gte: requestedSeats };
    }

    // Khi có đủ tọa độ, Route-Aware Matching sẽ thay thế so khớp chuỗi địa chỉ.
    // Text search vẫn là fallback cho dữ liệu cũ hoặc khi người dùng chưa chọn gợi ý Goong.
    if (origin && !hasOriginCoordinates) {
      where.origin = { contains: origin, mode: 'insensitive' };
    }

    if (destination && !hasDestinationCoordinates) {
      where.destination = { contains: destination, mode: 'insensitive' };
    }

    if (maxPrice != null) {
      where.pricePerSeat = { lte: maxPrice };
    }

    if (vehicleType) {
      where.vehicle = { is: { type: vehicleType } };
    }

    if (date) {
      const searchDate = new Date(date);
      const hasSelectedTime = date.includes('T');
      const startOfDay = new Date(searchDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(searchDate);
      endOfDay.setHours(23, 59, 59, 999);

      const now = new Date();
      // Thêm buffer 1 giờ vào quá khứ để không bị ẩn chuyến đi vừa tạo hoặc tài xế đến trễ một chút
      const pastBuffer = new Date(now.getTime() - 60 * 60 * 1000);

      if (!driverId && hasPassengerRoute) {
        // Một tài xế có thể xuất phát trước giờ hành khách mong muốn rồi mới tới
        // điểm đón dọc đường. Lấy tập ứng viên rộng, thuật toán ETA sẽ lọc chính xác.
        const candidateStart = new Date(Math.max(now.getTime(), startOfDay.getTime()));
        const candidateEnd = hasSelectedTime
          ? new Date(searchDate.getTime() + 30 * 60_000)
          : endOfDay;
        if (startOfDay <= now && endOfDay >= now) {
          where.OR = [
            { status: 'SCHEDULED', departureTime: { gte: candidateStart, lte: candidateEnd } },
            { status: 'ONGOING', departureTime: { gte: startOfDay, lte: endOfDay } },
          ];
        } else {
          where.status = 'SCHEDULED';
          where.departureTime = { gte: candidateStart, lte: candidateEnd };
        }
      } else if (!driverId) {
        if (hasSelectedTime) {
          // datetime-local biểu thị thời điểm người dùng thực sự muốn khởi hành.
          // Chỉ trả về chuyến đã lên lịch từ thời điểm đó đến hết ngày.
          where.status = 'SCHEDULED';
          where.departureTime = { gte: searchDate, lte: endOfDay };
        }
        // Khách tìm: nếu tìm ngày hôm nay, lấy SCHEDULED từ pastBuffer đến hết ngày
        // VÀ lấy các chuyến ONGOING trong ngày hôm nay (dù khởi hành trước đó)
        else if (startOfDay <= now && endOfDay >= now) {
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
    } else if (!driverId && hasPassengerRoute) {
      where.OR = [
        { status: 'SCHEDULED', departureTime: { gte: new Date() } },
        { status: 'ONGOING' },
      ];
    } else if (!driverId) {
      // Không truyền date (mặc định lấy từ now)
      const pastBuffer = new Date(Date.now() - 60 * 60 * 1000);
      where.OR = [
        { status: 'SCHEDULED', departureTime: { gte: pastBuffer } },
        { status: 'ONGOING' } // Lấy hết chuyến ONGOING
      ];
    }

    const rides = await prisma.ride.findMany({
      where,
      include: DRIVER_SELECT,
      orderBy: { departureTime: 'asc' },
    });

    const candidateRides = departurePeriod
      ? rides.filter((ride) => {
          // CoRide hiện phục vụ tại Việt Nam (UTC+7). Lọc khung giờ theo giờ địa
          // phương thay vì timezone của máy chủ để kết quả luôn nhất quán.
          const localHour = (ride.departureTime.getUTCHours() + 7) % 24;
          if (departurePeriod === 'MORNING') return localHour >= 5 && localHour < 12;
          if (departurePeriod === 'AFTERNOON') return localHour >= 12 && localHour < 18;
          return localHour >= 18 || localHour < 5;
        })
      : rides;

    if (driverId) return candidateRides;

    if (hasPassengerRoute) {
      const desiredTime = date ? new Date(date) : undefined;
      const matchedRides = await Promise.all(candidateRides.map(async (ride) => {
          const liveLocation = ride.status === 'ONGOING'
            ? await getDriverLocation(ride.driverId)
            : null;
          const driverCurrentLocation = liveLocation &&
            (!liveLocation.rideId || liveLocation.rideId === ride.id)
            ? { lat: liveLocation.latitude, lng: liveLocation.longitude }
            : undefined;
          const match = RideMatchingService.match(ride, {
            origin: { lat: originLat, lng: originLng },
            destination: { lat: destinationLat, lng: destinationLng },
            desiredTime,
          }, driverCurrentLocation);
          return match ? {
            ...ride,
            ...match,
            currentDriverLat: driverCurrentLocation?.lat ?? null,
            currentDriverLng: driverCurrentLocation?.lng ?? null,
            driverLocationUpdatedAt: liveLocation?.updatedAt ?? null,
          } : null;
        }));
      return matchedRides
        .filter((ride): ride is NonNullable<typeof ride> => ride !== null)
        .sort((first, second) =>
          second.matchScore - first.matchScore ||
          first.departureTime.getTime() - second.departureTime.getTime()
        );
    }

    if (hasDestinationCoordinates) {
      const matchedRides = await Promise.all(candidateRides.map(async (ride) => {
          const liveLocation = ride.status === 'ONGOING'
            ? await getDriverLocation(ride.driverId)
            : null;
          const driverCurrentLocation = liveLocation &&
            (!liveLocation.rideId || liveLocation.rideId === ride.id)
            ? { lat: liveLocation.latitude, lng: liveLocation.longitude }
            : undefined;
          const match = RideMatchingService.matchDestination(ride, {
            lat: destinationLat,
            lng: destinationLng,
          }, driverCurrentLocation);
          return match ? {
            ...ride,
            ...match,
            currentDriverLat: driverCurrentLocation?.lat ?? null,
            currentDriverLng: driverCurrentLocation?.lng ?? null,
            driverLocationUpdatedAt: liveLocation?.updatedAt ?? null,
          } : null;
        }));
      return matchedRides
        .filter((ride): ride is NonNullable<typeof ride> => ride !== null)
        .sort((first, second) =>
          second.matchScore - first.matchScore ||
          first.departureTime.getTime() - second.departureTime.getTime()
        );
    }

    return candidateRides;
  }

  static async getRideById(id: string) {
    const ride = await prisma.ride.findUnique({
      where: { id },
      include: DRIVER_SELECT,
    });

    if (!ride) throw new AppError('Không tìm thấy chuyến đi', 404);
    if (ride.status !== 'ONGOING') return ride;

    const liveLocation = await getDriverLocation(ride.driverId);
    const belongsToRide = liveLocation && (!liveLocation.rideId || liveLocation.rideId === ride.id);
    return {
      ...ride,
      currentDriverLat: belongsToRide ? liveLocation.latitude : null,
      currentDriverLng: belongsToRide ? liveLocation.longitude : null,
      driverLocationUpdatedAt: belongsToRide ? liveLocation.updatedAt : null,
    };
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
      if (ride.status !== 'SCHEDULED' && ride.status !== 'FULL') {
        throw new AppError('Chỉ có thể bắt đầu chuyến đi đang mở hoặc đã đủ chỗ', 400);
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
