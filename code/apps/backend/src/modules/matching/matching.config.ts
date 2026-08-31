const numberFromEnv = (name: string, fallback: number, minimum = 0): number => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= minimum ? value : fallback;
};

const radiiFromEnv = (): number[] => {
  const configured = process.env.RIDE_HAILING_SEARCH_RADII_KM
    ?.split(',')
    .map(Number)
    .filter((value) => Number.isFinite(value) && value > 0);
  return configured?.length ? [...new Set(configured)].sort((a, b) => a - b) : [5, 8];
};

export const RIDE_HAILING_CONFIG = Object.freeze({
  DISPATCH_BATCH_SIZE: Math.floor(numberFromEnv('DISPATCH_BATCH_SIZE', 3, 1)),
  DRIVER_ACCEPT_TIMEOUT_MS: numberFromEnv('DRIVER_ACCEPT_TIMEOUT_MS', 12_000, 1_000),
  SEARCH_TIMEOUT_MS: numberFromEnv('RIDE_HAILING_SEARCH_TIMEOUT_MS', 60_000, 5_000),
  DISPATCH_POLL_INTERVAL_MS: numberFromEnv('DISPATCH_POLL_INTERVAL_MS', 250, 100),
  SEARCH_RADII_KM: radiiFromEnv(),
  MIN_MATCH_SCORE: numberFromEnv('MIN_RIDE_HAILING_MATCH_SCORE', 55, 0),
  MAX_PICKUP_DISTANCE_KM: numberFromEnv('MAX_RIDE_HAILING_PICKUP_DISTANCE_KM', 8, 0.1),
  MAX_DESTINATION_DISTANCE_KM: numberFromEnv('MAX_RIDE_HAILING_DESTINATION_DISTANCE_KM', 1.5, 0.1),
  MAX_DETOUR_DISTANCE_KM: numberFromEnv('MAX_RIDE_HAILING_DETOUR_DISTANCE_KM', 3, 0.1),
  MAX_DETOUR_DURATION_MINUTES: numberFromEnv('MAX_RIDE_HAILING_DETOUR_DURATION_MINUTES', 12, 1),
  MAX_PICKUP_ETA_MINUTES: numberFromEnv('MAX_RIDE_HAILING_PICKUP_ETA_MINUTES', 20, 1),
  TRIP_COMPLETION_RADIUS_METERS: numberFromEnv('TRIP_COMPLETION_RADIUS_METERS', 500, 50),
});

export const MATCH_SCORE_WEIGHTS = Object.freeze({
  routeCompatibility: 0.4,
  pickupProximity: 0.2,
  destinationProximity: 0.15,
  pickupEta: 0.1,
  driverRating: 0.05,
  availableSeats: 0.05,
  priceSuitability: 0.05,
});
