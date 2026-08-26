import type { PlaceSearchConfidence, PlaceSearchResult } from '@repo/shared';
import goongService, { type GeocodeV2Result } from './goong.service';

const MAX_QUERY_VARIANTS = 3;
const SPECIFIC_ADDRESS_PATTERN = /\b(?:lk|dv|lo|lô|so|số)\s*[-/]?\s*\d+/iu;

const compactSpaces = (value: string) => value.trim().replace(/\s+/g, ' ');
const searchable = (value: string) => compactSpaces(value).toLocaleLowerCase('vi');
const comparable = (value: string) => searchable(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

export const normalizeVietnameseAddressQueries = (rawQuery: string): string[] => {
  const original = compactSpaces(rawQuery);
  if (!original) return [];
  const spaced = compactSpaces(original
    .replace(/\b(LK|DV|KĐT|CC)\s*[-/]?\s*(\d+)/giu, '$1 $2')
    .replace(/[-/]+/g, ' '));
  const expanded = compactSpaces(spaced
    .replace(/\bLK\b/giu, 'Liền kề')
    .replace(/\bKĐT\b/giu, 'Khu đô thị')
    .replace(/\bCC\b/giu, 'Chung cư'));
  return [...new Set([original, spaced, expanded])].slice(0, MAX_QUERY_VARIANTS);
};

const tokensOf = (value: string) => comparable(value).split(' ').filter(Boolean);
const numbersOf = (value: string) => tokensOf(value).filter((token) => /^\d+$/.test(token));

const textScore = (query: string, candidate: string) => {
  const queryText = comparable(query);
  const candidateText = comparable(candidate);
  if (!queryText || !candidateText) return 0;
  if (candidateText === queryText) return 1;
  if (candidateText.includes(queryText)) return 0.9;
  const queryTokens = tokensOf(query);
  const candidateTokens = new Set(tokensOf(candidate));
  return queryTokens.filter((token) => candidateTokens.has(token)).length / queryTokens.length;
};

const confidenceFor = (query: string, candidate: string, source: PlaceSearchResult['source']): PlaceSearchConfidence => {
  const score = textScore(query, candidate);
  const queryNumbers = numbersOf(query);
  const candidateNumbers = new Set(numbersOf(candidate));
  const missingSpecificNumber = queryNumbers.some((number) => !candidateNumbers.has(number));
  if (source === 'GOONG_GEOCODE' && (missingSpecificNumber || (SPECIFIC_ADDRESS_PATTERN.test(query) && score < 0.8))) return 'APPROXIMATE';
  if (!missingSpecificNumber && score >= 0.78) return 'HIGH';
  return score >= 0.45 ? 'MEDIUM' : 'APPROXIMATE';
};

const rankValue = (result: PlaceSearchResult, query: string) => {
  const confidence = result.confidence === 'HIGH' ? 300 : result.confidence === 'MEDIUM' ? 180 : 40;
  const source = result.source === 'GOONG_AUTOCOMPLETE' ? 30 : 10;
  const distance = result.distance == null ? 0 : Math.max(-30, 20 - result.distance / 1000);
  return confidence + source + textScore(query, `${result.name} ${result.address}`) * 100 + distance;
};

const uniqueResults = (results: PlaceSearchResult[]) => {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = result.placeId || `${comparable(result.name)}|${comparable(result.address)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const autocompleteResult = (prediction: Awaited<ReturnType<typeof goongService.autocomplete>>[number], query: string): PlaceSearchResult => {
  const address = prediction.description;
  const name = prediction.structured_formatting?.main_text || address.split(',')[0]?.trim() || address;
  return {
    id: prediction.place_id,
    placeId: prediction.place_id,
    name,
    address,
    distance: prediction.distance_meters,
    source: 'GOONG_AUTOCOMPLETE',
    type: prediction.types?.[0] || prediction.display_type,
    confidence: confidenceFor(query, address, 'GOONG_AUTOCOMPLETE'),
  };
};

const geocodeResult = (result: GeocodeV2Result, query: string): PlaceSearchResult => ({
  id: result.place_id || `geocode:${result.geometry.location.lat},${result.geometry.location.lng}`,
  placeId: result.place_id,
  name: result.name || result.formatted_address.split(',')[0]?.trim() || result.formatted_address,
  address: result.formatted_address,
  latitude: result.geometry.location.lat,
  longitude: result.geometry.location.lng,
  source: 'GOONG_GEOCODE',
  type: result.types?.[0],
  confidence: confidenceFor(query, `${result.name} ${result.formatted_address}`, 'GOONG_GEOCODE'),
});

const distanceMeters = (from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) => {
  const earthRadius = 6_371_000;
  const toRadians = (value: number) => value * Math.PI / 180;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const value = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(deltaLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

export async function reversePlaces(latitude: number, longitude: number, limit = 5, version: 'v1' | 'v2' = 'v2'): Promise<PlaceSearchResult[]> {
  const center = { latitude, longitude };
  const results = await goongService.reverseGeocodeCandidates(latitude, longitude, version);
  return uniqueResults(results.map((result) => {
    const place = geocodeResult(result, result.formatted_address);
    const point = { latitude: result.geometry.location.lat, longitude: result.geometry.location.lng };
    return { ...place, confidence: 'HIGH' as const, distance: distanceMeters(center, point) };
  }))
    .sort((a, b) => (a.distance ?? Number.MAX_VALUE) - (b.distance ?? Number.MAX_VALUE))
    .slice(0, limit);
}

export interface PlaceSearchOptions {
  limit?: number;
  location?: string;
  version?: 'v1' | 'v2';
  sessionToken?: string;
}

export async function searchPlaces(query: string, options: PlaceSearchOptions = {}): Promise<PlaceSearchResult[]> {
  const variants = normalizeVietnameseAddressQueries(query);
  const limit = options.limit ?? 10;
  const autocompleteGroups = await Promise.all(variants.map((variant) =>
    goongService.autocomplete(variant, limit, options.location, undefined, true, options.version ?? 'v2', options.sessionToken)
      .catch(() => []),
  ));
  const autocomplete = uniqueResults(autocompleteGroups.flat().map((prediction) => autocompleteResult(prediction, query)));
  const hasGoodResult = autocomplete.some((result) => result.confidence === 'HIGH');
  let fallback: PlaceSearchResult[] = [];
  if (!hasGoodResult) {
    const fallbackQueries = [...new Set([variants[0], variants.at(-1)])].filter((value): value is string => Boolean(value));
    const geocodeGroups = await Promise.all(fallbackQueries.map((variant) =>
      goongService.geocodeV2(variant).catch(() => null),
    ));
    fallback = geocodeGroups.flatMap((results) => results ?? []).map((result) => geocodeResult(result, query));
  }
  return uniqueResults([...autocomplete, ...fallback])
    .sort((a, b) => rankValue(b, query) - rankValue(a, query))
    .slice(0, limit);
}
