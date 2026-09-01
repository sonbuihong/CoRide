import { MATCH_CONFIG, RideMatchingService } from './ride-matching.service';

const departureTime = new Date('2030-01-01T08:00:00.000Z');
const routePolyline = JSON.stringify({
  coordinates: [
    [105.8, 21],
    [105.85, 21],
    [105.9, 21],
  ],
});

const ride = {
  originLat: 21,
  originLng: 105.8,
  destinationLat: 21,
  destinationLng: 105.9,
  routePolyline,
  distance: 10.4,
  duration: 60,
  departureTime,
};

describe('RideMatchingService', () => {
  it('ưu tiên chuyến trùng điểm đầu và cuối', () => {
    const result = RideMatchingService.match(ride, {
      origin: { lat: 21.0005, lng: 105.8005 },
      destination: { lat: 21.0005, lng: 105.8995 },
      desiredTime: new Date('2030-01-01T08:00:00.000Z'),
    });

    expect(result?.matchType).toBe('DIRECT');
    expect(result?.matchScore).toBeGreaterThanOrEqual(90);
    expect(result?.originDistanceKm).toBeLessThan(0.1);
  });

  it('ghép khách ở giữa tuyến khi đi đúng chiều', () => {
    const result = RideMatchingService.match(ride, {
      origin: { lat: 21, lng: 105.825 },
      destination: { lat: 21, lng: 105.875 },
      desiredTime: new Date('2030-01-01T08:15:00.000Z'),
    });

    expect(result?.matchType).toBe('ON_ROUTE');
    expect(result?.matchScore).toBeGreaterThanOrEqual(90);
    expect(result?.pickupDistanceKm).toBeLessThan(0.01);
    expect(result?.sharedDistanceKm).toBeGreaterThan(5);
  });

  it('không ghép khách giữa tuyến khi tài xế tắt đón dọc đường', () => {
    const result = RideMatchingService.match({ ...ride, allowRoutePickup: false }, {
      origin: { lat: 21, lng: 105.825 },
      destination: { lat: 21, lng: 105.875 },
    });

    expect(result).toBeNull();
  });

  it('vẫn nhận Direct Match khi tài xế tắt đón dọc đường', () => {
    const result = RideMatchingService.match({ ...ride, allowRoutePickup: false }, {
      origin: { lat: 21.0005, lng: 105.8005 },
      destination: { lat: 21.0005, lng: 105.8995 },
    });

    expect(result?.matchType).toBe('DIRECT');
  });

  it('loại hành trình ngược chiều trên cùng một tuyến', () => {
    const result = RideMatchingService.match(ride, {
      origin: { lat: 21, lng: 105.875 },
      destination: { lat: 21, lng: 105.825 },
      desiredTime: new Date('2030-01-01T08:45:00.000Z'),
    });

    expect(result).toBeNull();
  });

  it('rejects a reverse direct match on a short route', () => {
    const shortRide = {
      ...ride,
      destinationLng: 105.808,
      distance: 0.83,
      routePolyline: JSON.stringify({
        coordinates: [[105.8, 21], [105.808, 21]],
      }),
    };

    const result = RideMatchingService.match(shortRide, {
      origin: { lat: 21, lng: 105.8078 },
      destination: { lat: 21, lng: 105.8002 },
    });

    expect(result).toBeNull();
  });

  it('loại điểm đón và trả nằm quá xa hành lang tuyến', () => {
    const result = RideMatchingService.match(ride, {
      origin: { lat: 21.05, lng: 105.825 },
      destination: { lat: 21.05, lng: 105.875 },
      desiredTime: new Date('2030-01-01T08:15:00.000Z'),
    });

    expect(result).toBeNull();
  });

  it('matches a destination coordinate without requiring an origin', () => {
    const result = RideMatchingService.matchDestination(ride, {
      lat: 21.0005,
      lng: 105.8995,
    });

    expect(result?.matchType).toBe('DIRECT');
    expect(result?.matchScore).toBeGreaterThanOrEqual(90);
    expect(result?.dropoffDistanceKm).toBeLessThan(0.1);
  });

  it('does not treat the start of a route as an en-route destination', () => {
    const result = RideMatchingService.matchDestination(ride, {
      lat: 21,
      lng: 105.8,
    });

    expect(result).toBeNull();
  });

  it('vẫn nhận Direct Match khi hai đầu hành trình thực sự gần nhau', () => {
    const shortRide = {
      ...ride,
      distance: 2,
      routePolyline: JSON.stringify({
        coordinates: [
          [105.8, 21],
          [105.82, 21],
        ],
      }),
      destinationLng: 105.82,
    };

    const result = RideMatchingService.match(shortRide, {
      origin: { lat: 21.0005, lng: 105.8 },
      destination: { lat: 21.0005, lng: 105.82 },
    });

    expect(result?.matchType).toBe('DIRECT');
    expect(result?.matchScore).toBeGreaterThanOrEqual(MATCH_CONFIG.MIN_MATCH_SCORE);
  });

  it('ghép Nearby khi điểm đón/trả gần hai đầu tuyến và detour trong giới hạn', () => {
    const result = RideMatchingService.match(ride, {
      origin: { lat: 21, lng: 105.812 },
      destination: { lat: 21, lng: 105.888 },
    });

    expect(result?.matchType).toBe('NEARBY');
    expect(result?.detourKm).toBeLessThanOrEqual(MATCH_CONFIG.MAX_DETOUR_KM);
    expect(result?.detourRatio).toBeLessThanOrEqual(MATCH_CONFIG.MAX_DETOUR_RATIO);
  });

  it('loại chuyến khi một trong hai ngưỡng detour bị vượt', () => {
    const result = RideMatchingService.match(ride, {
      origin: { lat: 21.0105, lng: 105.8 },
      destination: { lat: 21, lng: 105.9 },
    });

    expect(result).toBeNull();
  });

  it('không ghép điểm đón nằm phía sau tài xế đang di chuyển', () => {
    const result = RideMatchingService.match(ride, {
      origin: { lat: 21, lng: 105.825 },
      destination: { lat: 21, lng: 105.875 },
    }, { lat: 21, lng: 105.86 });

    expect(result).toBeNull();
  });

  it('ghép điểm đón nằm trên phần tuyến còn lại của tài xế', () => {
    const result = RideMatchingService.match(ride, {
      origin: { lat: 21, lng: 105.87 },
      destination: { lat: 21, lng: 105.89 },
    }, { lat: 21, lng: 105.86 });

    expect(result).not.toBeNull();
    expect(result?.originDistanceKm).toBeGreaterThan(0);
    expect(result?.pickupRoutePosition).toBeGreaterThan(0.6);
  });
});
