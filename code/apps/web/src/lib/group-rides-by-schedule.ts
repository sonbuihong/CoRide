export interface SchedulableRide {
  id: string;
  scheduleId?: string | null;
  departureTime: string | Date;
  status?: string;
}

export interface RideScheduleGroup<T extends SchedulableRide> {
  key: string;
  primaryRide: T;
  rides: T[];
}

export function groupRidesBySchedule<T extends SchedulableRide>(rides: T[]): RideScheduleGroup<T>[] {
  const groups = new Map<string, T[]>();

  rides.forEach((ride) => {
    // Chuyến đang chạy cần đứng độc lập để không bị ẩn trong lịch các ngày tương lai.
    const key = ride.scheduleId && ride.status !== 'ONGOING'
      ? `schedule:${ride.scheduleId}`
      : `ride:${ride.id}`;
    groups.set(key, [...(groups.get(key) ?? []), ride]);
  });

  return Array.from(groups.entries())
    .map(([key, groupedRides]) => {
      const sortedRides = [...groupedRides].sort(
        (left, right) => new Date(left.departureTime).getTime() - new Date(right.departureTime).getTime(),
      );
      return { key, primaryRide: sortedRides[0], rides: sortedRides };
    })
    .sort(
      (left, right) =>
        new Date(left.primaryRide.departureTime).getTime() -
        new Date(right.primaryRide.departureTime).getTime(),
    );
}
