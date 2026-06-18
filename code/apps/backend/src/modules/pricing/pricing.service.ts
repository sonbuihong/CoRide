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
}

export class PricingService {
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
    const price = this.calculatePrice(distanceKm, config);

    return {
      vehicleType,
      estimatedDistance: Math.round(distanceKm * 10) / 10,   // Làm tròn 1 chữ số
      estimatedDuration: Math.round(durationMin),
      estimatedPrice: price,
      baseFare: config.baseFare,
      pricePerKm: config.pricePerKm,
    };
  }

  /**
   * Tính giá thuần tuý từ khoảng cách và config — không gọi API.
   * Tách ra để unit test dễ dàng.
   */
  static calculatePrice(
    distanceKm: number,
    config: { baseFare: number; pricePerKm: number; baseDistance: number; minFare: number }
  ): number {
    // Khoảng cách vượt quá base distance mới tính thêm
    const extraDistance = Math.max(0, distanceKm - config.baseDistance);
    const rawPrice = config.baseFare + extraDistance * config.pricePerKm;

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
    baseDistance?: number;
    minFare?: number;
    isActive?: boolean;
  }) {
    return prisma.pricingConfig.upsert({
      where: { vehicleType: data.vehicleType },
      create: {
        vehicleType: data.vehicleType,
        baseFare: data.baseFare,
        pricePerKm: data.pricePerKm,
        baseDistance: data.baseDistance ?? 2,
        minFare: data.minFare ?? 0,
        isActive: data.isActive ?? true,
      },
      update: {
        baseFare: data.baseFare,
        pricePerKm: data.pricePerKm,
        ...(data.baseDistance !== undefined && { baseDistance: data.baseDistance }),
        ...(data.minFare !== undefined && { minFare: data.minFare }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }
}
