import type { PlaceSearchResult } from '@repo/shared';

export const SNAP_RADIUS_METERS = 25;
export const SNAP_EPSILON_METERS = 1.5;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function resolveMapCandidate(
  center: Coordinates,
  candidates: PlaceSearchResult[],
  previousSnapId?: string,
  allowSnap = true,
): { selected?: PlaceSearchResult; snapTarget?: Coordinates; snapId?: string } {
  const nearest = candidates.find((place) => place.latitude != null && place.longitude != null);
  if (!nearest) return {};
  const withinSnapRadius = (nearest.distance ?? Number.MAX_VALUE) <= SNAP_RADIUS_METERS;
  const selected = allowSnap && withinSnapRadius ? nearest : {
    ...nearest,
    latitude: center.latitude,
    longitude: center.longitude,
    confidence: withinSnapRadius ? nearest.confidence : 'APPROXIMATE' as const,
  };
  const shouldSnap = allowSnap && withinSnapRadius
    && (nearest.distance ?? 0) > SNAP_EPSILON_METERS
    && previousSnapId !== nearest.id;
  return {
    selected,
    ...(shouldSnap ? {
      snapTarget: { latitude: nearest.latitude!, longitude: nearest.longitude! },
      snapId: nearest.id,
    } : {}),
  };
}
