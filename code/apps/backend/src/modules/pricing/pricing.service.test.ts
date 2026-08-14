import { PricingService, CarpoolPricingConfigLike } from './pricing.service';

const config: CarpoolPricingConfigLike = {
  fuelPrice: 20_000,
  fuelConsumption: 10,
  vehicleOverheadRatio: 0.5,
  minimumDriverShare: 0.2,
  driverPriceAdjustment: 0.15,
  roundingUnit: 1000,
  maxDetourKm: 5,
  maxDetourRatio: 0.1,
};

describe('CoRide carpool contribution', () => {
  it('chia chi phí quãng đường cho hành khách và tài xế theo số ghế mở bán', () => {
    const result = PricingService.calculateCarpoolContribution({
      sharedDistanceKm: 60,
      originalDistanceKm: 90,
      detourKm: 0,
      offeredSeats: 2,
    }, config);

    expect(result.vehicleCostPerKm).toBe(3000);
    expect(result.distanceContribution).toBe(60_000);
    expect(result.recommendedPricePerSeat).toBe(60_000);
    expect(result.minimumPricePerSeat).toBe(51_000);
    expect(result.maximumPricePerSeat).toBe(69_000);
  });

  it('tính phần detour nhưng vẫn buộc tài xế chịu tối thiểu 20%', () => {
    const result = PricingService.calculateCarpoolContribution({
      sharedDistanceKm: 60,
      originalDistanceKm: 90,
      detourKm: 5,
      offeredSeats: 2,
    }, config);

    expect(result.detourContribution).toBe(12_000);
    expect(result.recommendedPricePerSeat).toBe(72_000);
  });

  it('loại ghép chuyến khi vượt một trong hai ngưỡng detour', () => {
    expect(() => PricingService.calculateCarpoolContribution({
      sharedDistanceKm: 5,
      originalDistanceKm: 10,
      detourKm: 2,
      offeredSeats: 1,
    }, config)).toThrow('vượt giới hạn carpool');
  });

  it('không cho tổng đóng góp vượt 80% chi phí chuyến', () => {
    const result = PricingService.calculateCarpoolContribution({
      sharedDistanceKm: 90,
      originalDistanceKm: 90,
      detourKm: 0,
      offeredSeats: 2,
      bookedSeats: 2,
      existingContributions: 150_000,
    }, config);

    expect(result.maximumPassengerContribution).toBe(216_000);
    expect(result.totalPrice).toBeLessThanOrEqual(66_000);
  });
});
