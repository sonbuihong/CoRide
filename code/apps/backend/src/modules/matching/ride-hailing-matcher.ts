import {
  RideMatchingService,
  type GeoPoint,
  type MatchableRide,
  type RideMatchType,
} from '../rides/ride-matching.service';
import { MATCH_SCORE_WEIGHTS, RIDE_HAILING_CONFIG } from './matching.config';

export interface RideHailingSearch {
  origin: GeoPoint;
  destination: GeoPoint;
  vehicleType: 'BIKE' | 'CAR';
}

export interface DriverRouteCandidate {
  driverId: string;
  distanceKm: number;
  driverRating: number;
  availableSeats: number;
  currentLocation?: GeoPoint;
  route?: MatchableRide & { id: string };
}

export interface ScoredDriverCandidate extends DriverRouteCandidate {
  matchScore: number;
  matchType: RideMatchType | 'NEARBY_ACTIVE';
  pickupEtaMinutes: number;
  pickupDistanceKm: number;
  destinationDistanceKm: number | null;
  detourDistanceKm: number;
  detourDurationMinutes: number;
  routeDirectionCompatible: boolean;
}

const clamp = (value: number): number => Math.max(0, Math.min(1, value));

export function scoreRideHailingCandidate(
  candidate: DriverRouteCandidate,
  search: RideHailingSearch,
): ScoredDriverCandidate | null {
  if (candidate.availableSeats < 1 || candidate.distanceKm > RIDE_HAILING_CONFIG.MAX_PICKUP_DISTANCE_KM) {
    return null;
  }

  const averageSpeedKmH = search.vehicleType === 'CAR' ? 28 : 24;
  const pickupEtaMinutes = candidate.distanceKm / averageSpeedKmH * 60;
  if (pickupEtaMinutes > RIDE_HAILING_CONFIG.MAX_PICKUP_ETA_MINUTES) return null;

  const routeMatch = candidate.route
    ? RideMatchingService.match(
      candidate.route,
      { origin: search.origin, destination: search.destination },
      candidate.currentLocation,
    )
    : null;

  // A driver already following a Ride route must match that route. Falling back
  // to proximity here would incorrectly accept reverse-direction passengers.
  if (candidate.route && !routeMatch) return null;

  if (
    routeMatch && (
      routeMatch.dropoffDistanceKm > RIDE_HAILING_CONFIG.MAX_DESTINATION_DISTANCE_KM ||
      routeMatch.detourKm > RIDE_HAILING_CONFIG.MAX_DETOUR_DISTANCE_KM
    )
  ) return null;

  const detourDistanceKm = routeMatch?.detourKm ?? 0;
  const detourDurationMinutes = detourDistanceKm / averageSpeedKmH * 60;
  if (detourDurationMinutes > RIDE_HAILING_CONFIG.MAX_DETOUR_DURATION_MINUTES) return null;

  const routeCompatibility = routeMatch
    ? clamp(Math.max(routeMatch.routeOverlap / 100, routeMatch.matchScore / 100))
    : 0.55;
  const pickupProximity = clamp(
    1 - candidate.distanceKm / RIDE_HAILING_CONFIG.MAX_PICKUP_DISTANCE_KM,
  );
  const destinationProximity = routeMatch
    ? clamp(1 - routeMatch.dropoffDistanceKm / RIDE_HAILING_CONFIG.MAX_DESTINATION_DISTANCE_KM)
    : 0.5;
  const pickupEtaScore = clamp(
    1 - pickupEtaMinutes / RIDE_HAILING_CONFIG.MAX_PICKUP_ETA_MINUTES,
  );
  const ratingScore = clamp(candidate.driverRating / 5);
  const seatScore = clamp(candidate.availableSeats / (search.vehicleType === 'CAR' ? 4 : 1));
  const priceSuitability = 1;

  const matchScore = Math.round(100 * (
    routeCompatibility * MATCH_SCORE_WEIGHTS.routeCompatibility +
    pickupProximity * MATCH_SCORE_WEIGHTS.pickupProximity +
    destinationProximity * MATCH_SCORE_WEIGHTS.destinationProximity +
    pickupEtaScore * MATCH_SCORE_WEIGHTS.pickupEta +
    ratingScore * MATCH_SCORE_WEIGHTS.driverRating +
    seatScore * MATCH_SCORE_WEIGHTS.availableSeats +
    priceSuitability * MATCH_SCORE_WEIGHTS.priceSuitability
  ));

  if (matchScore < RIDE_HAILING_CONFIG.MIN_MATCH_SCORE) return null;

  return {
    ...candidate,
    matchScore,
    matchType: routeMatch?.matchType ?? 'NEARBY_ACTIVE',
    pickupEtaMinutes: Math.max(1, Math.round(pickupEtaMinutes)),
    pickupDistanceKm: routeMatch?.pickupDistanceKm ?? candidate.distanceKm,
    destinationDistanceKm: routeMatch?.dropoffDistanceKm ?? null,
    detourDistanceKm,
    detourDurationMinutes: Math.round(detourDurationMinutes * 10) / 10,
    routeDirectionCompatible: true,
  };
}

export function rankRideHailingCandidates(
  candidates: DriverRouteCandidate[],
  search: RideHailingSearch,
): ScoredDriverCandidate[] {
  return candidates
    .map((candidate) => scoreRideHailingCandidate(candidate, search))
    .filter((candidate): candidate is ScoredDriverCandidate => candidate !== null)
    .sort((a, b) => b.matchScore - a.matchScore || a.distanceKm - b.distanceKm);
}

export function buildDispatchWaves<T>(candidates: T[], batchSize: number): T[][] {
  const size = Math.max(1, Math.floor(batchSize));
  const waves: T[][] = [];
  for (let index = 0; index < candidates.length; index += size) {
    waves.push(candidates.slice(index, index + size));
  }
  return waves;
}

export async function dispatchWavesSequentially<T>(
  waves: T[][],
  dispatch: (wave: T[], waveIndex: number) => Promise<boolean>,
  canContinue: () => boolean = () => true,
): Promise<boolean> {
  for (let waveIndex = 0; waveIndex < waves.length; waveIndex += 1) {
    if (!canContinue()) return false;
    if (await dispatch(waves[waveIndex], waveIndex)) return true;
  }
  return false;
}
