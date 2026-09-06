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
  it('chia chuyến mở 4 ghế thành 5 phần gồm cả tài xế', () => {
    const result = PricingService.calculateCarpoolContribution({
      sharedDistanceKm: 100,
      originalDistanceKm: 100,
      detourKm: 0,
      offeredSeats: 4,
    }, config);

    expect(result.pricingPolicy).toBe('FIXED_PER_SEAT');
    expect(result.offeredSeats).toBe(4);
    expect(result.totalCostShares).toBe(5);
    expect(result.bookedSeats).toBe(1);
    expect(result.pricePerSeat).toBe(60_000);
    expect(result.totalPrice).toBe(60_000);
  });

  it.each([
    [1, 60_000],
    [2, 120_000],
    [4, 240_000],
  ])('giữ giá mỗi ghế cố định khi đặt %i ghế', (bookedSeats, totalPrice) => {
    const result = PricingService.calculateCarpoolContribution({
      sharedDistanceKm: 100,
      originalDistanceKm: 100,
      detourKm: 0,
      offeredSeats: 4,
      bookedSeats,
    }, config);

    expect(result.pricePerSeat).toBe(60_000);
    expect(result.totalPrice).toBe(totalPrice);
  });

  it('tính lại giá theo số ghế hành khách mở bán, không giữ giá của 4 ghế', () => {
    const fourSeats = PricingService.calculateCarpoolContribution({
      sharedDistanceKm: 100,
      originalDistanceKm: 100,
      detourKm: 0,
      offeredSeats: 4,
      costShareSeats: 4,
      bookedSeats: 1,
    }, config);
    const oneSeat = PricingService.calculateCarpoolContribution({
      sharedDistanceKm: 100,
      originalDistanceKm: 100,
      detourKm: 0,
      offeredSeats: 1,
      costShareSeats: 4,
      bookedSeats: 1,
    }, config);

    expect(fourSeats.totalCostShares).toBe(5);
    expect(oneSeat.offeredSeats).toBe(1);
    expect(oneSeat.costShareSeats).toBe(4);
    expect(oneSeat.totalCostShares).toBe(5);
    expect(oneSeat.totalPrice).toBe(60_000);
    expect(oneSeat.totalPrice).not.toBe(fourSeats.totalPrice * 4);
  });

  it('không chuyển chi phí ghế trống sang hành khách duy nhất', () => {
    const onePassenger = PricingService.calculateCarpoolContribution({
      sharedDistanceKm: 100,
      originalDistanceKm: 100,
      detourKm: 0,
      offeredSeats: 4,
      bookedSeats: 1,
    }, config);

    expect(onePassenger.totalPrice).toBe(300_000 / 5);
    expect(onePassenger.totalPrice).not.toBe(300_000 / 2);
  });

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

  it('giới hạn giá đăng theo toàn bộ ghế để booking sau không bị đổi giá', () => {
    const result = PricingService.calculateCarpoolContribution({
      sharedDistanceKm: 100,
      originalDistanceKm: 100,
      detourKm: 0,
      offeredSeats: 4,
      bookedSeats: 1,
      priceFactor: 1.15,
    }, config);

    expect(result.maximumPricePerSeat).toBe(60_000);
    expect(result.pricePerSeat).toBe(60_000);
    expect(result.pricePerSeat * result.offeredSeats)
      .toBeLessThanOrEqual(result.maximumPassengerContribution);
  });

  it('áp dụng đúng hai biên điều chỉnh khi trần chuyến còn dư', () => {
    const minimum = PricingService.calculateCarpoolContribution({
      sharedDistanceKm: 90,
      originalDistanceKm: 90,
      detourKm: 0,
      offeredSeats: 2,
      priceFactor: 0.85,
    }, config);
    const maximum = PricingService.calculateCarpoolContribution({
      sharedDistanceKm: 90,
      originalDistanceKm: 90,
      detourKm: 0,
      offeredSeats: 2,
      priceFactor: 1.15,
    }, config);

    expect(minimum.pricePerSeat).toBe(minimum.minimumPricePerSeat);
    expect(maximum.pricePerSeat).toBe(maximum.maximumPricePerSeat);
  });
});
