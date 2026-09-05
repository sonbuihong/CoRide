import { extendedPrisma as prisma } from '@repo/database';
import { Prisma } from '@repo/database';
import { CreateRideInput, CreateRideScheduleInput, SearchRideInput, SocketEvents } from '@repo/shared';
import { AppError } from '../../shared/errors/AppError';
import { SocketEventService } from '../../socket/socket.events';
import { RideMatchingService } from './ride-matching.service';
import { PricingService } from '../pricing/pricing.service';
import { getDriverLocation, isDriverOnline, setDriverOffline, setDriverOnline } from '../../shared/lib/redis';
import { NotificationsService } from '../notifications/notifications.service';

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
  stops: { orderBy: { order: 'asc' as const } },
} satisfies Prisma.RideInclude;

const ONGOING_LOCATION_MAX_AGE_MS = 60_000;

export class RidesService {
  private static validateRidePayload(data: Omit<CreateRideInput, 'departureTime'>) {
    if (!data.origin?.trim() || !data.destination?.trim()) {
      throw new AppError('Điểm đi và điểm đến là bắt buộc', 400);
    }
    if (data.originLat == null || data.originLng == null || data.destinationLat == null || data.destinationLng == null) {
      throw new AppError('Tọa độ điểm đi và điểm đến là bắt buộc', 400);
    }
    if (data.originLat === data.destinationLat && data.originLng === data.destinationLng) {
      throw new AppError('Điểm đi và điểm đến không được trùng nhau', 400);
    }
    if (!data.routePolyline || data.distance == null || data.distance <= 0 || data.duration == null || data.duration <= 0) {
      throw new AppError('Lộ trình chuyến đi chưa hợp lệ', 400);
    }
    if (!data.vehicleId) throw new AppError('Phương tiện là bắt buộc', 400);
  }

  private static async getPublishingVehicle(driverId: string, vehicleId: string, departureTimes: Date[]) {
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

    const activeDriverRide = await prisma.ride.findFirst({
      where: { driverId, status: 'ONGOING' },
    });
    if (activeDriverRide) {
      throw new AppError('Bạn đang có một chuyến đi diễn ra. Hãy hoàn thành chuyến đó trước khi đăng lịch mới.', 400);
    }
    const conflictingRide = await prisma.ride.findFirst({
      where: {
        driverId,
        status: { in: ['SCHEDULED', 'FULL'] },
        departureTime: { in: departureTimes },
      },
    });
    if (conflictingRide) throw new AppError('Bạn đã có chuyến khác khởi hành vào một trong các thời điểm đã chọn.', 400);
    const conflictingPassengerBooking = await prisma.booking.findFirst({
      where: {
        passengerId: driverId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        ride: { departureTime: { in: departureTimes }, status: { in: ['SCHEDULED', 'FULL', 'ONGOING'] } },
      },
    });
    if (conflictingPassengerBooking) {
      throw new AppError('Bạn đang là hành khách của chuyến khác vào một trong các thời điểm đã chọn.', 400);
    }
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId: driverId, status: 'ACTIVE' },
      select: { type: true },
    });
    if (!vehicle) throw new AppError('Phương tiện không hợp lệ hoặc không thuộc tài xế', 400);
    return vehicle;
  }

  private static async verifyRouteAndPrice(data: Omit<CreateRideInput, 'departureTime'>, vehicleType: 'BIKE' | 'CAR') {
    const maximumSeats = vehicleType === 'BIKE' ? 1 : 4;
    if (data.availableSeats > maximumSeats) {
      throw new AppError(`Phương tiện này chỉ được mở tối đa ${maximumSeats} ghế`, 400);
    }
    const estimate = await PricingService.estimateCarpoolRoute({
      originLat: data.originLat!, originLng: data.originLng!, destLat: data.destinationLat!, destLng: data.destinationLng!,
      vehicleType, offeredSeats: data.availableSeats, routePolyline: data.routePolyline,
      waypoints: (data.stops ?? []).map((stop) => ({ latitude: stop.latitude, longitude: stop.longitude })),
    });
    const pricePerSeat = data.pricePerSeat || estimate.recommendedPricePerSeat;
    if (pricePerSeat < estimate.minimumPricePerSeat || pricePerSeat > estimate.maximumPricePerSeat) {
      throw new AppError(`Giá mỗi ghế phải từ ${estimate.minimumPricePerSeat.toLocaleString('vi-VN')}đ đến ${estimate.maximumPricePerSeat.toLocaleString('vi-VN')}đ`, 400);
    }
    return { estimate, pricePerSeat };
  }

  private static buildRideData(
    driverId: string,
    data: Omit<CreateRideInput, 'departureTime'>,
    departureTime: Date,
    route: { estimate: Awaited<ReturnType<typeof PricingService.estimateCarpoolRoute>>; pricePerSeat: number },
    scheduleId?: string,
  ): Prisma.RideUncheckedCreateInput {
    return {
        driverId,
        origin: data.origin || '',
        originLat: data.originLat ?? null,
        originLng: data.originLng ?? null,
        destination: data.destination || '',
        destinationLat: data.destinationLat ?? null,
        destinationLng: data.destinationLng ?? null,
        distance: route.estimate.estimatedDistance,
        duration: route.estimate.estimatedDuration,
        routePolyline: route.estimate.routePolyline,
        departureTime,
        availableSeats: data.availableSeats,
        offeredSeats: data.availableSeats,
        pricePerSeat: route.pricePerSeat,
        bookingPolicy: data.bookingPolicy ?? 'DRIVER_APPROVAL',
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
        scheduleId: scheduleId ?? null,
    };
  }

  static async createRide(driverId: string, data: CreateRideInput) {
    this.validateRidePayload(data);
    const departureTime = new Date(data.departureTime);
    const vehicle = await this.getPublishingVehicle(driverId, data.vehicleId!, [departureTime]);
    const route = await this.verifyRouteAndPrice(data, vehicle.type);
    const newRide = await prisma.$transaction(async (tx) => {
      const ride = await tx.ride.create({ data: this.buildRideData(driverId, data, departureTime, route) });
      if (data.stops?.length) {
        await tx.rideStop.createMany({ data: data.stops.map((stop, order) => ({ ...stop, rideId: ride.id, order })) });
      }
      return tx.ride.findUniqueOrThrow({ where: { id: ride.id }, include: DRIVER_SELECT });
    });

    try {
      SocketEventService.emitGlobal(SocketEvents.RIDE_CREATED, newRide);
    } catch (e) {
      console.warn('[RidesService] Socket emit skipped:', e);
    }

    return newRide;
  }

  static async createRideSchedule(driverId: string, data: CreateRideScheduleInput) {
    this.validateRidePayload(data);
    const departureTimes = data.departureTimes.map((value) => new Date(value)).sort((left, right) => left.getTime() - right.getTime());
    const vehicle = await this.getPublishingVehicle(driverId, data.vehicleId!, departureTimes);
    const route = await this.verifyRouteAndPrice(data, vehicle.type);
    const result = await prisma.$transaction(async (tx) => {
      const schedule = await tx.rideSchedule.create({ data: { driverId, timezone: data.timezone } });
      const rides = [];
      for (const departureTime of departureTimes) {
        const ride = await tx.ride.create({ data: this.buildRideData(driverId, data, departureTime, route, schedule.id) });
        if (data.stops?.length) {
          await tx.rideStop.createMany({ data: data.stops.map((stop, order) => ({ ...stop, rideId: ride.id, order })) });
        }
        rides.push(await tx.ride.findUniqueOrThrow({ where: { id: ride.id }, include: DRIVER_SELECT }));
      }
      return { schedule, rides };
    });
    result.rides.forEach((ride) => {
      try { SocketEventService.emitGlobal(SocketEvents.RIDE_CREATED, ride); } catch { /* socket không bắt buộc */ }
    });
    return result;
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
            { status: 'ONGOING', allowRoutePickup: true, routePickupSharingEnabled: true, departureTime: { gte: startOfDay, lte: endOfDay } },
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
            { status: 'ONGOING', allowRoutePickup: true, routePickupSharingEnabled: true, departureTime: { gte: startOfDay, lte: endOfDay } }
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
        { status: 'ONGOING', allowRoutePickup: true, routePickupSharingEnabled: true },
      ];
    } else if (!driverId) {
      // Không truyền date (mặc định lấy từ now)
      const pastBuffer = new Date(Date.now() - 60 * 60 * 1000);
      where.OR = [
        { status: 'SCHEDULED', departureTime: { gte: pastBuffer } },
        { status: 'ONGOING', allowRoutePickup: true, routePickupSharingEnabled: true } // Lấy hết chuyến ONGOING
      ];
    }

    const rides = await prisma.ride.findMany({
      where,
      include: DRIVER_SELECT,
      orderBy: { departureTime: 'asc' },
    });

    const periodRides = departurePeriod
      ? rides.filter((ride) => {
          // CoRide hiện phục vụ tại Việt Nam (UTC+7). Lọc khung giờ theo giờ địa
          // phương thay vì timezone của máy chủ để kết quả luôn nhất quán.
          const localHour = (ride.departureTime.getUTCHours() + 7) % 24;
          if (departurePeriod === 'MORNING') return localHour >= 5 && localHour < 12;
          if (departurePeriod === 'AFTERNOON') return localHour >= 12 && localHour < 18;
          return localHour >= 18 || localHour < 5;
        })
      : rides;

    const liveLocationByRide = new Map<string, Awaited<ReturnType<typeof getDriverLocation>>>();
    const candidateRides = driverId
      ? periodRides
      : (await Promise.all(periodRides.map(async (ride) => {
          if (ride.status !== 'ONGOING') return ride;
          const [online, liveLocation] = await Promise.all([
            isDriverOnline(ride.driverId),
            getDriverLocation(ride.driverId),
          ]);
          const isFresh = Boolean(
            liveLocation &&
            liveLocation.rideId === ride.id &&
            Date.now() - liveLocation.updatedAt <= ONGOING_LOCATION_MAX_AGE_MS,
          );
          if (!online || !isFresh) return null;
          liveLocationByRide.set(ride.id, liveLocation);
          return ride;
        }))).filter((ride): ride is (typeof periodRides)[number] => ride !== null);

    if (driverId) return candidateRides;

    if (hasPassengerRoute) {
      const desiredTime = date ? new Date(date) : undefined;
      const matchedRides = await Promise.all(candidateRides.map(async (ride) => {
          const liveLocation = ride.status === 'ONGOING'
            ? liveLocationByRide.get(ride.id) ?? null
            : null;
          const driverCurrentLocation = liveLocation &&
            liveLocation.rideId === ride.id
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
      const matches = matchedRides
        .filter((ride): ride is NonNullable<typeof ride> => ride !== null);
      if (!matches.length) return [];

      const existingContributions = await prisma.booking.groupBy({
        by: ['rideId'],
        where: {
          rideId: { in: matches.map((ride) => ride.id) },
          status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
        },
        _sum: { totalPrice: true },
      });
      const contributionByRide = new Map(
        existingContributions.map((item) => [item.rideId, item._sum.totalPrice ?? 0]),
      );
      const vehicleTypes = Array.from(new Set(matches.map((ride) => ride.vehicle?.type ?? 'CAR')));
      const configByVehicle = new Map(await Promise.all(vehicleTypes.map(async (vehicleType) => [
        vehicleType,
        await PricingService.getActiveConfig(vehicleType),
      ] as const)));

      return matches
        .map((ride) => {
          const originalDistanceKm = Math.max(ride.distance ?? ride.sharedDistanceKm, 0.001);
          const config = configByVehicle.get(ride.vehicle?.type ?? 'CAR');
          if (!config) return null;
          try {
            const fullRoutePricing = PricingService.calculateCarpoolContribution({
              sharedDistanceKm: originalDistanceKm,
              originalDistanceKm,
              detourKm: 0,
              offeredSeats: ride.offeredSeats,
              tollCost: ride.tollCost,
            }, config);
            const priceFactor = fullRoutePricing.recommendedPricePerSeat > 0
              ? ride.pricePerSeat / fullRoutePricing.recommendedPricePerSeat
              : 1;
            const pricing = PricingService.calculateCarpoolContribution({
              sharedDistanceKm: ride.sharedDistanceKm,
              originalDistanceKm,
              detourKm: ride.detourKm,
              offeredSeats: ride.offeredSeats,
              bookedSeats: requestedSeats,
              tollCost: ride.tollCost * Math.min(1, ride.sharedDistanceKm / originalDistanceKm),
              tripTollCost: ride.tollCost,
              existingContributions: contributionByRide.get(ride.id) ?? 0,
              priceFactor,
            }, config);
            return {
              ...ride,
              passengerFare: pricing.totalPrice,
              passengerPricePerSeat: pricing.totalPrice / requestedSeats,
            };
          } catch {
            // Search and booking must enforce the same configured detour/pricing limits.
            return null;
          }
        })
        .filter((ride): ride is NonNullable<typeof ride> => ride !== null)
        .sort((first, second) =>
          second.matchScore - first.matchScore ||
          first.timeDifferenceMinutes - second.timeDifferenceMinutes ||
          first.pickupDistanceKm - second.pickupDistanceKm ||
          first.detourKm - second.detourKm ||
          first.passengerFare - second.passengerFare
        );
    }

    if (hasDestinationCoordinates) {
      const matchedRides = await Promise.all(candidateRides.map(async (ride) => {
          const liveLocation = ride.status === 'ONGOING'
            ? liveLocationByRide.get(ride.id) ?? null
            : null;
          const driverCurrentLocation = liveLocation &&
            liveLocation.rideId === ride.id
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

  static async updateRoutePickupSharing(id: string, driverId: string, enabled: boolean) {
    const ride = await prisma.ride.findUnique({ where: { id } });
    if (!ride) throw new AppError('Không tìm thấy chuyến đi', 404);
    if (ride.driverId !== driverId) {
      throw new AppError('Bạn không có quyền thay đổi trạng thái nhận khách của chuyến đi này', 403);
    }
    if (ride.status !== 'ONGOING') {
      throw new AppError('Chỉ có thể nhận thêm khách dọc đường khi chuyến đang diễn ra', 409);
    }
    if (enabled && !ride.allowRoutePickup) {
      throw new AppError('Chuyến đi này đã tắt tùy chọn đón khách dọc đường', 409);
    }

    const changed = await prisma.ride.updateMany({
      where: {
        id,
        driverId,
        status: 'ONGOING',
        ...(enabled ? { allowRoutePickup: true } : {}),
      },
      data: { routePickupSharingEnabled: enabled },
    });
    if (changed.count !== 1) {
      throw new AppError('Chuyến đi đã thay đổi trạng thái. Vui lòng tải lại và thử lại.', 409);
    }
    const updated = await prisma.ride.findUniqueOrThrow({ where: { id }, include: DRIVER_SELECT });
    if (enabled) await setDriverOnline(driverId);
    else await setDriverOffline(driverId);

    try { SocketEventService.emitGlobal(SocketEvents.RIDE_UPDATED, updated); } catch { /* socket optional */ }
    return updated;
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



    const { stops, ...scalarData } = data;
    const updateData: Prisma.RideUncheckedUpdateInput = {
      ...scalarData,
      ...(data.departureTime && { departureTime: new Date(data.departureTime) }),
    };
    const updatedRide = await prisma.$transaction(async (tx) => {
      await tx.ride.update({ where: { id }, data: updateData });
      if (stops) {
        await tx.rideStop.deleteMany({ where: { rideId: id } });
        if (stops.length) {
          await tx.rideStop.createMany({ data: stops.map((stop, order) => ({ ...stop, rideId: id, order })) });
        }
      }
      return tx.ride.findUniqueOrThrow({ where: { id }, include: DRIVER_SELECT });
    });

    try {
      SocketEventService.emitGlobal(SocketEvents.RIDE_UPDATED, updatedRide);
    } catch (e) {
      console.warn('[RidesService] Socket emit skipped:', e);
    }

    return updatedRide;
  }

  static async deleteRide(id: string, driverId: string) {
    // DELETE is retained for older clients. Route it through the command
    // transition so a Ride and its active Bookings cannot diverge.
    return this.updateRideStatus(
      id,
      driverId,
      'CANCELLED',
      'Tài xế đã hủy chuyến',
    );
  }

  static async cancelRideSchedule(scheduleId: string, driverId: string, cancelReason: string) {
    const schedule = await prisma.rideSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        rides: {
          select: {
            id: true,
            driverId: true,
            origin: true,
            destination: true,
            departureTime: true,
            status: true,
          },
        },
      },
    });

    if (!schedule) throw new AppError('Không tìm thấy lịch chuyến', 404);
    if (schedule.driverId !== driverId) {
      throw new AppError('Bạn không có quyền hủy lịch chuyến này', 403);
    }

    const cancellableRides = schedule.rides.filter((ride) =>
      ride.driverId === driverId && ['SCHEDULED', 'FULL'].includes(ride.status),
    );
    if (cancellableRides.length === 0) {
      return { cancelledCount: 0, affectedBookingCount: 0 };
    }

    const rideIds = cancellableRides.map((ride) => ride.id);
    const result = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.ride.updateMany({
        where: {
          id: { in: rideIds },
          driverId,
          status: { in: ['SCHEDULED', 'FULL'] },
        },
        data: { status: 'CANCELLED', cancelReason },
      });
      const affectedBookings = await tx.booking.findMany({
        where: {
          rideId: { in: rideIds },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        select: { passengerId: true, rideId: true },
      });
      const bookings = await tx.booking.updateMany({
        where: {
          rideId: { in: rideIds },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        data: {
          status: 'CANCELLED',
          cancelReason: 'Tài xế đã hủy lịch chuyến',
          expiresAt: null,
          seatHeld: false,
        },
      });
      return { cancelledCount: cancelled.count, affectedBookingCount: bookings.count, affectedBookings };
    });

    const updatedAt = new Date().toISOString();
    try {
      cancellableRides.forEach((ride) => {
        SocketEventService.emitGlobal(SocketEvents.RIDE_STATUS_UPDATED, {
          rideId: ride.id,
          status: 'CANCELLED',
          updatedAt,
        });
      });
      result.affectedBookings.forEach((booking) => {
        SocketEventService.emitToUser(booking.passengerId, SocketEvents.BOOKING_CANCELLED, {
          rideId: booking.rideId,
          reason: cancelReason,
        });
      });
    } catch (socketError) {
      console.warn('[RidesService] Socket emit skipped:', socketError);
    }

    result.affectedBookings.forEach((booking) => {
      const ride = cancellableRides.find((item) => item.id === booking.rideId);
      NotificationsService.createNotification(
        booking.passengerId,
        'Chuyến đi đã bị hủy',
        `${ride?.origin ?? 'Điểm đi'} → ${ride?.destination ?? 'điểm đến'}. ${cancelReason}`,
        'RIDE_CANCELLED',
        { type: 'RIDE', id: booking.rideId },
      ).catch((error) => console.error('[Notification Error]:', error));
    });

    return {
      cancelledCount: result.cancelledCount,
      affectedBookingCount: result.affectedBookingCount,
    };
  }

  static async updateRideStatus(id: string, driverId: string, status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED', cancelReason?: string) {
    const ride = await prisma.ride.findUnique({ where: { id } });
    if (!ride) throw new AppError('Không tìm thấy chuyến đi', 404);
    if (ride.driverId !== driverId) {
      throw new AppError('Bạn không có quyền cập nhật trạng thái chuyến đi này', 403);
    }

    // Retry, double-click hoặc socket chậm có thể gửi lại cùng một command.
    // Trả trạng thái hiện tại để endpoint giữ tính idempotent.
    if (ride.status === status) {
      return prisma.ride.findUniqueOrThrow({
        where: { id },
        include: DRIVER_SELECT,
      });
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
      const pendingDropoffs = await prisma.booking.count({
        where: {
          rideId: id,
          status: 'CONFIRMED',
          isDroppedOff: false,
        },
      });
      if (pendingDropoffs > 0) {
        throw new AppError(
          `Không thể hoàn thành chuyến. Vẫn còn ${pendingDropoffs} hành khách chưa được trả tại điểm đến.`,
          400,
        );
      }
    } else if (status === 'CANCELLED') {
      if (ride.status !== 'SCHEDULED' && ride.status !== 'FULL') {
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
      // Claim the Ride first. This row lock makes concurrent booking reserves
      // re-check their `status` predicate and fail instead of committing a
      // new active Booking after the Ride is cancelled.
      if (status === 'CANCELLED') {
        const cancelledRide = await tx.ride.update({
          where: { id },
          data: { status, cancelReason },
          include: DRIVER_SELECT,
        });
        await tx.booking.updateMany({
          where: {
            rideId: id,
            status: { in: ['PENDING', 'CONFIRMED'] }
          },
          data: {
            status: 'CANCELLED',
            cancelReason: 'Tài xế đã hủy chuyến đi',
            expiresAt: null,
            seatHeld: false,
          }
        });
        return cancelledRide;
      }

      return tx.ride.update({
        where: { id },
        data: {
          status,
          ...(['ONGOING', 'COMPLETED'].includes(status) ? { routePickupSharingEnabled: false } : {}),
        },
        include: DRIVER_SELECT,
      });
    });

    if (status === 'ONGOING' || status === 'COMPLETED') {
      await setDriverOffline(driverId);
    }

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

      if (status === 'CANCELLED') {
        affectedPassengerIds.forEach((passengerId) => {
          SocketEventService.emitToUser(passengerId, SocketEvents.BOOKING_CANCELLED, {
            rideId: id,
            reason: cancelReason || 'Tài xế đã hủy chuyến',
          });
        });
      }
    } catch (socketError) {
      // Socket chưa init (test environment) → skip, không ảnh hưởng logic chính
      console.warn('[RidesService] Socket emit skipped:', socketError);
    }

    if (status === 'CANCELLED') {
      affectedPassengerIds.forEach((passengerId) => {
        NotificationsService.createNotification(
          passengerId,
          'Chuyến đi đã bị hủy',
          `${ride.origin} → ${ride.destination}. ${cancelReason || 'Tài xế đã hủy chuyến.'}`,
          'RIDE_CANCELLED',
          { type: 'RIDE', id },
        ).catch((error) => console.error('[Notification Error]:', error));
      });
    }

    return updatedRide;
  }
}
