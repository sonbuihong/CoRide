import { extendedPrisma as prisma } from '@repo/database';
import { VehicleType } from '@repo/database';
import goongService from '../goong/goong.service';
import { AppError } from '../../shared/errors/AppError';

/**
 * PricingService — Tính giá chuyến đi dựa trên khoảng cách thực tế từ Goong API.
 *
 * Công thức:
 *   totalPrice = baseFare + max(0, distance - baseDistance) * pricePerKm
 *   finalPrice = max(totalPrice, minFare)
 *
 * Luồng:
 * 1. Gọi Goong Directions V2 API để lấy khoảng cách (km) và thời gian (phút)
 * 2. Query PricingConfig từ DB theo vehicleType
 * 3. Áp dụng công thức tính giá
 * 4. Trả về kết quả cho caller (TripService hoặc API estimate)
 */

export interface PriceEstimate {
  vehicleType: VehicleType;
  estimatedDistance: number;  // km
  estimatedDuration: number;  // phút
  estimatedPrice: number;     // VND (đã làm tròn)
  baseFare: number;
  pricePerKm: number;
  pricePerMinute: number;
}

export interface CarpoolPricingConfigLike {
  fuelPrice: number;
  fuelConsumption: number;
  vehicleOverheadRatio: number;
  minimumDriverShare: number;
  driverPriceAdjustment: number;
  roundingUnit: number;
  maxDetourKm: number;
  maxDetourRatio: number;
}

export interface CarpoolContributionInput {
  sharedDistanceKm: number;
  originalDistanceKm: number;
  detourKm: number;
  offeredSeats: number;
  bookedSeats?: number;
  tollCost?: number;
  tripTollCost?: number;
  existingContributions?: number;
  priceFactor?: number;
}

export interface CarpoolContribution {
  fuelCostPerKm: number;
  vehicleCostPerKm: number;
  sharedDistanceKm: number;
  detourKm: number;
  detourRatio: number;
  distanceContribution: number;
  tollContribution: number;
  detourContribution: number;
  recommendedPricePerSeat: number;
  minimumPricePerSeat: number;
  maximumPricePerSeat: number;
  totalPrice: number;
  maximumPassengerContribution: number;
  remainingContributionCap: number;
}

export interface CarpoolRouteEstimateInput {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  vehicleType: VehicleType;
  offeredSeats: number;
  tollCost?: number;
  waypoints?: Array<{ latitude: number; longitude: number }>;
  routePolyline?: string;
}

export class PricingService {
  /**
   * Báo mức đóng góp cho một ghế carpool. Đây không phải giá taxi: không có
   * base fare, phí phút hay surge; tài xế được tính như một người cùng chia phí.
   */
  static async estimateCarpool(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    vehicleType: VehicleType,
    offeredSeats: number,
    tollCost = 0
  ) {
    const directions = await goongService.directions(
      `${originLat},${originLng}`,
      `${destLat},${destLng}`,
      vehicleType === 'CAR' ? 'car' : 'bike'
    );
    const route = directions?.routes?.[0];
    if (!route) throw new AppError('Không thể tính toán lộ trình giữa 2 điểm này', 400);
    const distanceKm = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1000;
    const durationMinutes = route.legs.reduce((sum, leg) => sum + leg.duration.value, 0) / 60;
    return this.estimateCarpoolForRoute(distanceKm, durationMinutes, vehicleType, offeredSeats, tollCost);
  }

  static async estimateCarpoolRoute(input: CarpoolRouteEstimateInput) {
    const directions = await goongService.directions(
      `${input.originLat},${input.originLng}`,
      `${input.destLat},${input.destLng}`,
      input.vehicleType === 'CAR' ? 'car' : 'bike',
      !input.waypoints?.length,
      (input.waypoints ?? []).map((point) => `${point.latitude},${point.longitude}`),
    );
    const routes = directions?.routes?.slice(0, 5) ?? [];
    const route = routes.find((item) => item.overview_polyline.points === input.routePolyline) ?? routes[0];
    if (!route) throw new AppError('Không thể xác thực lộ trình đã chọn', 400);
    const distanceKm = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1000;
    const durationMinutes = route.legs.reduce((sum, leg) => sum + leg.duration.value, 0) / 60;
    return {
      ...(await this.estimateCarpoolForRoute(
        distanceKm,
        durationMinutes,
        input.vehicleType,
        input.offeredSeats,
        input.tollCost ?? 0,
      )),
      routePolyline: route.overview_polyline.points,
    };
  }

  static async estimateCarpoolForRoute(
    distanceKm: number,
    durationMinutes: number,
    vehicleType: VehicleType,
    offeredSeats: number,
    tollCost = 0,
  ) {
    const config = await this.getActiveConfig(vehicleType);
    const contribution = this.calculateCarpoolContribution({
      sharedDistanceKm: distanceKm,
      originalDistanceKm: distanceKm,
      detourKm: 0,
      offeredSeats,
      tollCost,
    }, config);

    return {
      vehicleType,
      estimatedDistance: Math.round(distanceKm * 10) / 10,
      estimatedDuration: Math.round(durationMinutes),
      estimatedPrice: contribution.recommendedPricePerSeat,
      ...contribution,
    };
  }

  static async getActiveConfig(vehicleType: VehicleType) {
    const config = await prisma.pricingConfig.findUnique({ where: { vehicleType } });
    if (!config || !config.isActive) {
      throw new AppError(`Chưa có cấu hình giá cho loại xe ${vehicleType}. Vui lòng liên hệ admin.`, 400);
    }
    return config;
  }

  static calculateCarpoolContribution(
    input: CarpoolContributionInput,
    config: CarpoolPricingConfigLike
  ): CarpoolContribution {
    const offeredSeats = Math.max(1, Math.floor(input.offeredSeats));
    const bookedSeats = Math.max(1, Math.floor(input.bookedSeats ?? 1));
    const sharedDistanceKm = Math.max(0, input.sharedDistanceKm);
    const originalDistanceKm = Math.max(0.001, input.originalDistanceKm);
    const detourKm = Math.max(0, input.detourKm);
    const detourRatio = detourKm / originalDistanceKm;

    if (detourKm > config.maxDetourKm || detourRatio > config.maxDetourRatio) {
      throw new AppError(
        `Độ lệch tuyến ${detourKm.toFixed(1)}km (${Math.round(detourRatio * 100)}%) vượt giới hạn carpool`,
        400
      );
    }

    const fuelCostPerKm = config.fuelPrice * config.fuelConsumption / 100;
    const vehicleCostPerKm = fuelCostPerKm * (1 + config.vehicleOverheadRatio);
    const shares = offeredSeats + 1;
    const distanceContribution = sharedDistanceKm * vehicleCostPerKm / shares;
    const tollContribution = Math.max(0, input.tollCost ?? 0) / shares;
    const detourContribution = detourKm * vehicleCostPerKm * (1 - config.minimumDriverShare);
    const rawPerSeat = distanceContribution + tollContribution + detourContribution;
    const roundingUnit = Math.max(1, config.roundingUnit);
    const roundNearest = (value: number) => Math.round(value / roundingUnit) * roundingUnit;
    const roundDown = (value: number) => Math.floor(Math.max(0, value) / roundingUnit) * roundingUnit;
    const recommendedPricePerSeat = roundNearest(rawPerSeat);
    const minimumPricePerSeat = roundNearest(rawPerSeat * (1 - config.driverPriceAdjustment));
    const configuredMaximum = roundNearest(rawPerSeat * (1 + config.driverPriceAdjustment));

    const tripCost = (originalDistanceKm + detourKm) * vehicleCostPerKm +
      Math.max(0, input.tripTollCost ?? input.tollCost ?? 0);
    const maximumPassengerContribution = tripCost * (1 - config.minimumDriverShare);
    const remainingContributionCap = Math.max(
      0,
      maximumPassengerContribution - Math.max(0, input.existingContributions ?? 0)
    );
    const maximumPricePerSeat = Math.min(configuredMaximum, roundDown(remainingContributionCap / bookedSeats));
    const requestedFactor = input.priceFactor ?? 1;
    const factor = Math.max(
      1 - config.driverPriceAdjustment,
      Math.min(1 + config.driverPriceAdjustment, requestedFactor)
    );
    const adjustedPerSeat = roundNearest(rawPerSeat * factor);
    const totalPrice = Math.min(adjustedPerSeat * bookedSeats, roundDown(remainingContributionCap));

    return {
      fuelCostPerKm,
      vehicleCostPerKm,
      sharedDistanceKm,
      detourKm,
      detourRatio,
      distanceContribution,
      tollContribution,
      detourContribution,
      recommendedPricePerSeat,
      minimumPricePerSeat,
      maximumPricePerSeat,
      totalPrice,
      maximumPassengerContribution,
      remainingContributionCap,
    };
  }
  /**
   * Ước tính giá chuyến đi giữa 2 điểm.
   *
   * @param originLat  - Vĩ độ điểm đón
   * @param originLng  - Kinh độ điểm đón
   * @param destLat    - Vĩ độ điểm đến
   * @param destLng    - Kinh độ điểm đến
   * @param vehicleType - Loại phương tiện (BIKE | CAR)
   */
  static async estimate(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    vehicleType: VehicleType = 'BIKE'
  ): Promise<PriceEstimate> {
    // 1. Lấy PricingConfig từ DB — đảm bảo config tồn tại và đang active
    const config = await prisma.pricingConfig.findUnique({
      where: { vehicleType },
    });

    if (!config || !config.isActive) {
      throw new AppError(
        `Chưa có cấu hình giá cho loại xe ${vehicleType}. Vui lòng liên hệ admin.`,
        400
      );
    }

    // 2. Gọi Goong Directions V2 API để lấy khoảng cách & thời gian thực tế
    // Format toạ độ: "lat,lng" (Goong convention)
    const originCoord = `${originLat},${originLng}`;
    const destCoord = `${destLat},${destLng}`;
    // Map VehicleType sang Goong vehicle param
    const goongVehicle = vehicleType === 'CAR' ? 'car' : 'bike';

    const directions = await goongService.directions(originCoord, destCoord, goongVehicle);

    if (!directions || !directions.routes || directions.routes.length === 0) {
      throw new AppError('Không thể tính toán lộ trình giữa 2 điểm này', 400);
    }

    const leg = directions.routes[0].legs[0];
    // Goong trả distance.value bằng mét → convert sang km
    const distanceKm = leg.distance.value / 1000;
    // Goong trả duration.value bằng giây → convert sang phút
    const durationMin = leg.duration.value / 60;

    // 3. Tính giá theo công thức
    const price = this.calculatePrice(distanceKm, durationMin, config);

    return {
      vehicleType,
      estimatedDistance: Math.round(distanceKm * 10) / 10,   // Làm tròn 1 chữ số
      estimatedDuration: Math.round(durationMin),
      estimatedPrice: price,
      baseFare: config.baseFare,
      pricePerKm: config.pricePerKm,
      pricePerMinute: config.pricePerMinute,
    };
  }

  /**
   * Tính giá thuần tuý từ khoảng cách và config — không gọi API.
   * Tách ra để unit test dễ dàng.
   */
  static calculatePrice(
    distanceKm: number,
    durationMin: number,
    config: { baseFare: number; pricePerKm: number; pricePerMinute: number; baseDistance: number; minFare: number }
  ): number {
    // Tổng chi phí = Giá tối thiểu (baseFare) + (Số km x Đơn giá mỗi km) + (Thời gian x Đơn giá thời gian)
    // Nếu vẫn muốn giữ baseDistance thì có thể dùng Math.max(0, distanceKm - config.baseDistance),
    // nhưng theo công thức yêu cầu, ta nhân trực tiếp số km:
    const rawPrice = config.baseFare + (distanceKm * config.pricePerKm) + (durationMin * config.pricePerMinute);

    // Áp dụng giá tối thiểu
    const finalPrice = Math.max(rawPrice, config.minFare);

    // Làm tròn lên bội 500 VND — trải nghiệm thanh toán tốt hơn
    return Math.ceil(finalPrice / 500) * 500;
  }

  /**
   * Lấy ước tính giá cho cả 2 loại xe — hiển thị trên UI cho hành khách chọn.
   */
  static async estimateAll(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ): Promise<PriceEstimate[]> {
    const [bikeEstimate, carEstimate] = await Promise.allSettled([
      this.estimate(originLat, originLng, destLat, destLng, 'BIKE'),
      this.estimate(originLat, originLng, destLat, destLng, 'CAR'),
    ]);

    const results: PriceEstimate[] = [];

    if (bikeEstimate.status === 'fulfilled') {
      results.push(bikeEstimate.value);
    }
    if (carEstimate.status === 'fulfilled') {
      results.push(carEstimate.value);
    }

    if (results.length === 0) {
      throw new AppError('Không thể ước tính giá cho bất kỳ loại xe nào', 400);
    }

    return results;
  }

  // ─── Admin CRUD cho PricingConfig ──────────────────────────────────

  static async getAllConfigs() {
    return prisma.pricingConfig.findMany({
      orderBy: { vehicleType: 'asc' },
    });
  }

  static async upsertConfig(data: {
    vehicleType: VehicleType;
    baseFare: number;
    pricePerKm: number;
    pricePerMinute?: number;
    baseDistance?: number;
    minFare?: number;
    isActive?: boolean;
    fuelPrice?: number;
    fuelConsumption?: number;
    vehicleOverheadRatio?: number;
    minimumDriverShare?: number;
    driverPriceAdjustment?: number;
    roundingUnit?: number;
    maxDetourKm?: number;
    maxDetourRatio?: number;
  }) {
    return prisma.pricingConfig.upsert({
      where: { vehicleType: data.vehicleType },
      create: {
        vehicleType: data.vehicleType,
        baseFare: data.baseFare,
        pricePerKm: data.pricePerKm,
        pricePerMinute: data.pricePerMinute ?? 0,
        baseDistance: data.baseDistance ?? 0, // Đặt mặc định 0 vì tính trực tiếp theo số km
        minFare: data.minFare ?? 0,
        isActive: data.isActive ?? true,
        fuelPrice: data.fuelPrice ?? 22119,
        fuelConsumption: data.fuelConsumption ?? 6.5,
        vehicleOverheadRatio: data.vehicleOverheadRatio ?? 0.5,
        minimumDriverShare: data.minimumDriverShare ?? 0.2,
        driverPriceAdjustment: data.driverPriceAdjustment ?? 0.2,
        roundingUnit: data.roundingUnit ?? 1000,
        maxDetourKm: data.maxDetourKm ?? 5,
        maxDetourRatio: data.maxDetourRatio ?? 0.1,
      },
      update: {
        baseFare: data.baseFare,
        pricePerKm: data.pricePerKm,
        ...(data.pricePerMinute !== undefined && { pricePerMinute: data.pricePerMinute }),
        ...(data.baseDistance !== undefined && { baseDistance: data.baseDistance }),
        ...(data.minFare !== undefined && { minFare: data.minFare }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.fuelPrice !== undefined && { fuelPrice: data.fuelPrice }),
        ...(data.fuelConsumption !== undefined && { fuelConsumption: data.fuelConsumption }),
        ...(data.vehicleOverheadRatio !== undefined && { vehicleOverheadRatio: data.vehicleOverheadRatio }),
        ...(data.minimumDriverShare !== undefined && { minimumDriverShare: data.minimumDriverShare }),
        ...(data.driverPriceAdjustment !== undefined && { driverPriceAdjustment: data.driverPriceAdjustment }),
        ...(data.roundingUnit !== undefined && { roundingUnit: data.roundingUnit }),
        ...(data.maxDetourKm !== undefined && { maxDetourKm: data.maxDetourKm }),
        ...(data.maxDetourRatio !== undefined && { maxDetourRatio: data.maxDetourRatio }),
      },
    });
  }
}
