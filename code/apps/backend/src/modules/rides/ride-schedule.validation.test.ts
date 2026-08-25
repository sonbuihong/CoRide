import { createRideScheduleSchema } from "@repo/shared";

const futureAt = (days: number) => {
  const value = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  value.setHours(9, 0, 0, 0);
  return value.toISOString();
};

const base = {
  origin: "Tòa nhà LPB, 17 Tông Đản, Hà Nội",
  originProvince: "Hà Nội",
  originLat: 21.0266,
  originLng: 105.8578,
  destination: "Bến xe Mỹ Đình, Hà Nội",
  destProvince: "Hà Nội",
  destinationLat: 21.0285,
  destinationLng: 105.7784,
  availableSeats: 4,
  pricePerSeat: 50_000,
  bookingPolicy: "DRIVER_APPROVAL" as const,
  timezone: "Asia/Ho_Chi_Minh" as const,
};

describe("createRideScheduleSchema", () => {
  it("accepts one to thirty unique future departures", () => {
    expect(
      createRideScheduleSchema.safeParse({
        ...base,
        departureTimes: [futureAt(1)],
      }).success,
    ).toBe(true);
    expect(
      createRideScheduleSchema.safeParse({
        ...base,
        departureTimes: Array.from({ length: 30 }, (_, index) =>
          futureAt(index + 1),
        ),
      }).success,
    ).toBe(true);
  });

  it("rejects more than thirty dates and duplicate departures", () => {
    expect(
      createRideScheduleSchema.safeParse({
        ...base,
        departureTimes: Array.from({ length: 31 }, (_, index) =>
          futureAt(index + 1),
        ),
      }).success,
    ).toBe(false);
    expect(
      createRideScheduleSchema.safeParse({
        ...base,
        departureTimes: [futureAt(1), futureAt(1)],
      }).success,
    ).toBe(false);
  });

  it("rejects a departure beyond six months and more than three public stops", () => {
    expect(
      createRideScheduleSchema.safeParse({
        ...base,
        departureTimes: [futureAt(190)],
      }).success,
    ).toBe(false);
    const stops = Array.from({ length: 4 }, (_, index) => ({
      address: `Điểm đón ${index + 1}`,
      latitude: 21 + index / 100,
      longitude: 105 + index / 100,
    }));
    expect(
      createRideScheduleSchema.safeParse({
        ...base,
        departureTimes: [futureAt(1)],
        stops,
      }).success,
    ).toBe(false);
  });
});
