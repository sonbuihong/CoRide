import {
  autocompleteQuerySchema,
  directionsBodySchema,
  distanceMatrixBodySchema,
  geolocationBodySchema,
  staticMapQuerySchema,
  tripBodySchema,
  placeSearchQuerySchema,
  reversePlacesQuerySchema,
} from './goong.validation';

describe('Goong proxy validation', () => {
  it('defaults autocomplete to V2 and accepts a session token', () => {
    const parsed = autocompleteQuerySchema.parse({ query: 'Bến xe', session_token: 'cb1f5a65-d68f-4b12-9522-cf643ba10c16' });
    expect(parsed.version).toBe('v2');
    expect(parsed.limit).toBe(10);
  });

  it('rejects an oversized matrix', () => {
    const coordinates = Array.from({ length: 26 }, (_, index) => `21.${index},105.${index}`).join('|');
    expect(distanceMatrixBodySchema.safeParse({ origins: coordinates, destinations: '21,105' }).success).toBe(false);
  });

  it('only calls Trip V2 for at least ten total coordinates', () => {
    const eightWaypoints = Array.from({ length: 8 }, (_, index) => `21.${index},105.${index}`).join(';');
    const sevenWaypoints = Array.from({ length: 7 }, (_, index) => `21.${index},105.${index}`).join(';');
    expect(tripBodySchema.safeParse({ origin: '21,105', destination: '22,106', waypoints: eightWaypoints }).success).toBe(true);
    expect(tripBodySchema.safeParse({ origin: '21,105', destination: '22,106', waypoints: sevenWaypoints }).success).toBe(false);
  });

  it('forbids server-IP geolocation and requires radio data', () => {
    expect(geolocationBodySchema.safeParse({ considerIp: true }).success).toBe(false);
    expect(geolocationBodySchema.safeParse({ considerIp: false }).success).toBe(false);
    expect(geolocationBodySchema.safeParse({ considerIp: false, wifiAccessPoints: [{ macAddress: '00:11:22:33:44:55' }] }).success).toBe(true);
  });

  it('constrains static map dimensions', () => {
    expect(staticMapQuerySchema.safeParse({ origin: '21,105', destination: '22,106', width: 2000 }).success).toBe(false);
  });

  it('accepts at most three ordered Directions waypoints', () => {
    const base = { origin: '21,105', destination: '22,106' };
    expect(directionsBodySchema.safeParse({ ...base, waypoints: ['21.1,105.1', '21.2,105.2', '21.3,105.3'] }).success).toBe(true);
    expect(directionsBodySchema.safeParse({ ...base, waypoints: ['21.1,105.1', '21.2,105.2', '21.3,105.3', '21.4,105.4'] }).success).toBe(false);
  });

  it('validates normalized place search and reverse candidate limits', () => {
    expect(placeSearchQuerySchema.parse({ q: 'LK645 DV-26 Khu C Yên Nghĩa' }).version).toBe('v2');
    expect(reversePlacesQuerySchema.safeParse({ lat: 21.02, lng: 105.85, limit: 5 }).success).toBe(true);
    expect(reversePlacesQuerySchema.safeParse({ lat: 21.02, lng: 105.85, limit: 20 }).success).toBe(false);
  });
});
