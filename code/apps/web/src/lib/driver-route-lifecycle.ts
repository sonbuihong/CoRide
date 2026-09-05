import type { GoongVehicleType } from '@repo/shared';

import { decodePolyline, getDirections, type RouteGeometry } from './goong';

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface LiveLocation extends RoutePoint {
  accuracy?: number;
  timestamp?: number;
}

const MAX_BROWSER_ACCURACY_METERS = 500;
const RECENT_FIX_WINDOW_MS = 30_000;

/**
 * Filters only obviously stale or very poor browser fixes. This affects the
 * live marker/socket stream; it must never be used to decide when to reroute.
 */
export const shouldAcceptLiveLocation = (
  current: LiveLocation | null,
  candidate: LiveLocation,
): boolean => {
  if (!Number.isFinite(candidate.lat) || !Number.isFinite(candidate.lng)) return false;
  if (candidate.lat < -90 || candidate.lat > 90 || candidate.lng < -180 || candidate.lng > 180) return false;
  if (candidate.timestamp != null && !Number.isFinite(candidate.timestamp)) return false;
  if (candidate.accuracy != null && (!Number.isFinite(candidate.accuracy) || candidate.accuracy > MAX_BROWSER_ACCURACY_METERS)) return false;
  if (current?.timestamp != null && candidate.timestamp != null && candidate.timestamp < current.timestamp) return false;

  const bothRecent = current?.timestamp != null && candidate.timestamp != null
    && candidate.timestamp - current.timestamp <= RECENT_FIX_WINDOW_MS;
  const currentAccuracy = current?.accuracy;
  if (
    bothRecent
    && currentAccuracy != null
    && candidate.accuracy != null
    && currentAccuracy <= 100
    && candidate.accuracy > Math.max(250, currentAccuracy * 3)
  ) return false;

  return true;
};

export type DriverRouteMode = 'BASE' | 'PICKUP' | 'DIRECT';
export type DriverRouteSegmentType = 'TO_PICKUP' | 'TO_DESTINATION';

export interface DriverRouteSegment {
  type: DriverRouteSegmentType;
  origin: RoutePoint;
  destination: RoutePoint;
  distanceMeters: number;
  durationSeconds: number;
  coordinates: Array<[number, number]>;
}

export interface DriverRoute {
  key: string;
  mode: DriverRouteMode;
  origin: RoutePoint;
  pickups: RoutePoint[];
  destination: RoutePoint;
  segments: DriverRouteSegment[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  coordinates: Array<[number, number]>;
}

interface DirectionsResponse {
  routes?: Array<{
    legs?: Array<{
      distance: { value: number };
      duration: { value: number };
    }>;
    overview_polyline?: { points: RouteGeometry };
  }>;
}

export type DirectionsLoader = (
  origin: string,
  destination: string,
  vehicle: string,
  alternatives?: boolean,
) => Promise<DirectionsResponse | null>;

export interface DriverRouteRequest {
  mode: DriverRouteMode;
  origin: RoutePoint;
  pickups?: RoutePoint[];
  destination: RoutePoint;
  vehicle: GoongVehicleType;
}

export interface DriverRouteResult {
  route: DriverRoute;
  isLatest: boolean;
  fromCache: boolean;
}

const pointKey = (point: RoutePoint) => `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;

export const createDriverRouteKey = (request: DriverRouteRequest) => [
  request.mode,
  request.vehicle,
  pointKey(request.origin),
  ...(request.pickups ?? []).map(pointKey),
  pointKey(request.destination),
].join(':');

const calculateDriverRoute = async (
  request: DriverRouteRequest,
  loader: DirectionsLoader,
): Promise<DriverRoute> => {
  const pickups = request.pickups ?? [];
  const points = [request.origin, ...pickups, request.destination];
  const segments: DriverRouteSegment[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const origin = points[index];
    const destination = points[index + 1];
    const response = await loader(
      `${origin.lat},${origin.lng}`,
      `${destination.lat},${destination.lng}`,
      request.vehicle,
      false,
    );
    const route = response?.routes?.[0];
    if (!route?.overview_polyline?.points || !route.legs?.length) {
      throw new Error('Không tìm thấy tuyến đường phù hợp.');
    }
    segments.push({
      type: index < pickups.length ? 'TO_PICKUP' : 'TO_DESTINATION',
      origin,
      destination,
      distanceMeters: route.legs.reduce((total, leg) => total + leg.distance.value, 0),
      durationSeconds: route.legs.reduce((total, leg) => total + leg.duration.value, 0),
      coordinates: decodePolyline(route.overview_polyline.points),
    });
  }

  return {
    key: createDriverRouteKey(request),
    mode: request.mode,
    origin: request.origin,
    pickups,
    destination: request.destination,
    segments,
    totalDistanceMeters: segments.reduce((total, segment) => total + segment.distanceMeters, 0),
    totalDurationSeconds: segments.reduce((total, segment) => total + segment.durationSeconds, 0),
    coordinates: segments.flatMap((segment, index) => index === 0 ? segment.coordinates : segment.coordinates.slice(1)),
  };
};

export class DriverRouteRequestCoordinator {
  private readonly cache = new Map<string, DriverRoute>();
  private readonly inFlight = new Map<string, Promise<DriverRoute>>();
  private latestRequestVersion = 0;

  constructor(private readonly loader: DirectionsLoader = getDirections) {}

  async request(request: DriverRouteRequest): Promise<DriverRouteResult> {
    const key = createDriverRouteKey(request);
    const requestVersion = ++this.latestRequestVersion;
    const cached = this.cache.get(key);
    if (cached) {
      return { route: cached, isLatest: requestVersion === this.latestRequestVersion, fromCache: true };
    }

    let pending = this.inFlight.get(key);
    const reusedInFlight = Boolean(pending);
    if (!pending) {
      pending = calculateDriverRoute(request, this.loader);
      this.inFlight.set(key, pending);
      void pending
        .then((route) => this.cache.set(key, route), () => undefined)
        .finally(() => this.inFlight.delete(key));
    }

    const route = await pending;
    return {
      route,
      isLatest: requestVersion === this.latestRequestVersion,
      fromCache: reusedInFlight,
    };
  }
}

export class DriverRouteLifecycle {
  private liveLocation: LiveLocation | null = null;
  private confirmedOrigin: RoutePoint | null = null;
  private confirmedDestination: RoutePoint | null = null;
  private readonly baseCoordinator: DriverRouteRequestCoordinator;
  private readonly activeCoordinator: DriverRouteRequestCoordinator;

  constructor(loader: DirectionsLoader = getDirections) {
    this.baseCoordinator = new DriverRouteRequestCoordinator(loader);
    this.activeCoordinator = new DriverRouteRequestCoordinator(loader);
  }

  updateLiveLocation(location: LiveLocation | null): void {
    this.liveLocation = location;
  }

  confirmRoute(origin: RoutePoint, destination: RoutePoint, vehicle: GoongVehicleType) {
    this.confirmedOrigin = { ...origin };
    this.confirmedDestination = { ...destination };
    return this.baseCoordinator.request({ mode: 'BASE', origin: this.confirmedOrigin, destination: this.confirmedDestination, vehicle });
  }

  acceptPickups(pickups: RoutePoint[], vehicle: GoongVehicleType) {
    if (!this.confirmedOrigin || !this.confirmedDestination) throw new Error('Route has not been confirmed.');
    const rerouteOrigin = this.liveLocation ? { lat: this.liveLocation.lat, lng: this.liveLocation.lng } : { ...this.confirmedOrigin };
    return this.activeCoordinator.request({
      mode: 'PICKUP',
      origin: rerouteOrigin,
      pickups: pickups.map((point) => ({ ...point })),
      destination: { ...this.confirmedDestination },
      vehicle,
    });
  }

  removePickups(vehicle: GoongVehicleType) {
    if (!this.confirmedOrigin || !this.confirmedDestination) throw new Error('Route has not been confirmed.');
    const rerouteOrigin = this.liveLocation ? { lat: this.liveLocation.lat, lng: this.liveLocation.lng } : { ...this.confirmedOrigin };
    return this.activeCoordinator.request({
      mode: 'DIRECT',
      origin: rerouteOrigin,
      destination: { ...this.confirmedDestination },
      vehicle,
    });
  }
}
