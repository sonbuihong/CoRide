import {
  buildDispatchWaves,
  dispatchWavesSequentially,
  rankRideHailingCandidates,
  scoreRideHailingCandidate,
  type DriverRouteCandidate,
} from './ride-hailing-matcher';

const route = {
  id: 'route-1',
  originLat: 21,
  originLng: 105.8,
  destinationLat: 21,
  destinationLng: 105.9,
  routePolyline: JSON.stringify({ coordinates: [[105.8, 21], [105.85, 21], [105.9, 21]] }),
  distance: 10.4,
  duration: 30,
  departureTime: new Date(),
  allowRoutePickup: true,
};

const candidate = (overrides: Partial<DriverRouteCandidate> = {}): DriverRouteCandidate => ({
  driverId: 'driver-1',
  distanceKm: 0.5,
  driverRating: 4.8,
  availableSeats: 2,
  route,
  ...overrides,
});

describe('Ride-Hailing route-aware matching', () => {
  it('scores exact endpoint and same-direction on-route matches', () => {
    const exact = scoreRideHailingCandidate(candidate(), {
      origin: { lat: 21.0002, lng: 105.8002 },
      destination: { lat: 21.0002, lng: 105.8998 },
      vehicleType: 'CAR',
    });
    const alongRoute = scoreRideHailingCandidate(candidate(), {
      origin: { lat: 21, lng: 105.825 },
      destination: { lat: 21, lng: 105.875 },
      vehicleType: 'CAR',
    });

    expect(exact?.matchType).toBe('DIRECT');
    expect(exact?.matchScore).toBeGreaterThanOrEqual(80);
    expect(alongRoute?.matchType).toBe('ON_ROUTE');
    expect(alongRoute?.routeDirectionCompatible).toBe(true);
  });

  it('rejects reverse direction, excessive detour, and insufficient seats', () => {
    const reverse = scoreRideHailingCandidate(candidate(), {
      origin: { lat: 21, lng: 105.875 },
      destination: { lat: 21, lng: 105.825 },
      vehicleType: 'CAR',
    });
    const detour = scoreRideHailingCandidate(candidate(), {
      origin: { lat: 21.05, lng: 105.825 },
      destination: { lat: 21.05, lng: 105.875 },
      vehicleType: 'CAR',
    });
    const noSeats = scoreRideHailingCandidate(candidate({ availableSeats: 0 }), {
      origin: { lat: 21, lng: 105.825 },
      destination: { lat: 21, lng: 105.875 },
      vehicleType: 'CAR',
    });

    expect(reverse).toBeNull();
    expect(detour).toBeNull();
    expect(noSeats).toBeNull();
  });

  it('sorts by normalized score and groups dispatch waves', () => {
    const ranked = rankRideHailingCandidates([
      candidate({ driverId: 'far', distanceKm: 2, driverRating: 4 }),
      candidate({ driverId: 'near', distanceKm: 0.2, driverRating: 5 }),
      candidate({ driverId: 'fallback', distanceKm: 0.4, route: undefined }),
    ], {
      origin: { lat: 21, lng: 105.825 },
      destination: { lat: 21, lng: 105.875 },
      vehicleType: 'CAR',
    });
    expect(ranked[0].driverId).toBe('near');
    expect(buildDispatchWaves(ranked, 2).map((wave) => wave.length)).toEqual([2, 1]);
  });

  it('advances to the next dispatch wave after timeout and stops on acceptance', async () => {
    const waves = buildDispatchWaves(['d1', 'd2', 'd3', 'd4', 'd5'], 2);
    const dispatch = jest.fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    await expect(dispatchWavesSequentially(waves, dispatch)).resolves.toBe(true);
    expect(dispatch).toHaveBeenNthCalledWith(1, ['d1', 'd2'], 0);
    expect(dispatch).toHaveBeenNthCalledWith(2, ['d3', 'd4'], 1);
    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it('reports no driver after every dispatch wave expires', async () => {
    const dispatch = jest.fn().mockResolvedValue(false);
    await expect(dispatchWavesSequentially([['d1'], ['d2']], dispatch)).resolves.toBe(false);
    expect(dispatch).toHaveBeenCalledTimes(2);
  });
});
