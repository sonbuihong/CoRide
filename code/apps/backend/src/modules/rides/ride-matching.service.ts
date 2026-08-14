export const MATCH_CONFIG = {
  DIRECT_RADIUS_KM: 1,
  NEARBY_RADIUS_KM: 1.5,
  PICKUP_RADIUS_KM: 1.5,
  DROPOFF_RADIUS_KM: 1.5,
  MAX_DETOUR_KM: 3,
  MAX_DETOUR_RATIO: 0.15,
  TIME_TOLERANCE_MINUTES: 30,
  MIN_MATCH_SCORE: 60,
} as const;

export type RideMatchType = 'DIRECT' | 'NEARBY' | 'ON_ROUTE';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface MatchableRide {
  originLat: number | null;
  originLng: number | null;
  destinationLat: number | null;
  destinationLng: number | null;
  routePolyline: string | null;
  distance: number | null;
  duration: number | null;
  departureTime: Date;
  allowRoutePickup?: boolean;
}

export interface PassengerSearch {
  origin: GeoPoint;
  destination: GeoPoint;
  desiredTime?: Date;
}

export interface RideMatchMetadata {
  matchType: RideMatchType;
  matchScore: number;
  originDistanceKm: number;
  pickupDistanceKm: number;
  dropoffDistanceKm: number;
  detourKm: number;
  detourRatio: number;
  routeOverlap: number;
  expectedPickupTime: string;
  timeDifferenceMinutes: number;
}

export type DestinationMatchMetadata = Pick<
  RideMatchMetadata,
  'matchType' | 'matchScore' | 'dropoffDistanceKm'
>;

interface RouteProjection {
  distanceKm: number;
  routePosition: number;
  distanceAlongRouteKm: number;
}

const EARTH_RADIUS_KM = 6371;

export class RideMatchingService {
  static match(
    ride: MatchableRide,
    passenger: PassengerSearch,
    driverCurrentLocation?: GeoPoint
  ): RideMatchMetadata | null {
    if (
      ride.originLat == null || ride.originLng == null ||
      ride.destinationLat == null || ride.destinationLng == null
    ) {
      return null;
    }

    const scheduledOrigin = { lat: ride.originLat, lng: ride.originLng };
    const driverOrigin = driverCurrentLocation ?? scheduledOrigin;
    const driverDestination = { lat: ride.destinationLat, lng: ride.destinationLng };
    const fullRoute = this.getRoutePoints(ride.routePolyline, scheduledOrigin, driverDestination);
    const route = driverCurrentLocation
      ? this.trimRouteFromPoint(fullRoute, driverCurrentLocation)
      : fullRoute;
    const pickupProjection = this.projectPointToRoute(passenger.origin, route);
    const dropoffProjection = this.projectPointToRoute(passenger.destination, route);

    const originEndpointDistance = this.haversine(passenger.origin, driverOrigin);
    const destinationEndpointDistance = this.haversine(passenger.destination, driverDestination);
    const isDirect =
      originEndpointDistance <= MATCH_CONFIG.DIRECT_RADIUS_KM &&
      destinationEndpointDistance <= MATCH_CONFIG.DIRECT_RADIUS_KM;
    const isNearby =
      originEndpointDistance <= MATCH_CONFIG.NEARBY_RADIUS_KM &&
      destinationEndpointDistance <= MATCH_CONFIG.NEARBY_RADIUS_KM;

    if (ride.allowRoutePickup === false && !isDirect) return null;

    if (!isDirect) {
      if (
        pickupProjection.distanceKm > MATCH_CONFIG.PICKUP_RADIUS_KM ||
        dropoffProjection.distanceKm > MATCH_CONFIG.DROPOFF_RADIUS_KM ||
        pickupProjection.routePosition >= dropoffProjection.routePosition
      ) {
        return null;
      }
    }

    const routeDistanceKm = Math.max(
      driverCurrentLocation ? this.routeLength(route) : (ride.distance ?? this.routeLength(route)),
      0.1
    );
    // Fast geometry-stage detour estimate. Only the lateral movement needed to
    // enter and return to the driver's corridor is counted here.
    const detourKm = 2 * (pickupProjection.distanceKm + dropoffProjection.distanceKm);
    const detourRatio = detourKm / routeDistanceKm;

    // Theo tài liệu thuật toán, chỉ loại khi CẢ quãng đường vòng và tỷ lệ
    // vòng đều vượt ngưỡng. Bọc toàn bộ điều kiện trong !isDirect để Direct
    // Match không bị loại bởi sai số chiếu điểm lên polyline.
    if (
      !isDirect &&
      detourKm > MATCH_CONFIG.MAX_DETOUR_KM &&
      detourRatio > MATCH_CONFIG.MAX_DETOUR_RATIO
    ) {
      return null;
    }

    const fullRouteLengthKm = Math.max(this.routeLength(fullRoute), 0.1);
    const durationMinutes = Math.max(
      driverCurrentLocation
        ? (ride.duration ?? 0) * Math.min(1, routeDistanceKm / fullRouteLengthKm)
        : (ride.duration ?? 0),
      0
    );
    const estimateStartTime = driverCurrentLocation ? new Date() : ride.departureTime;
    const expectedPickup = new Date(
      estimateStartTime.getTime() + durationMinutes * pickupProjection.routePosition * 60_000
    );
    const timeDifferenceMinutes = passenger.desiredTime
      ? Math.abs(expectedPickup.getTime() - passenger.desiredTime.getTime()) / 60_000
      : 0;

    if (
      passenger.desiredTime &&
      timeDifferenceMinutes > MATCH_CONFIG.TIME_TOLERANCE_MINUTES
    ) {
      return null;
    }

    const originScore = Math.max(0, 1 - pickupProjection.distanceKm / MATCH_CONFIG.PICKUP_RADIUS_KM);
    const destinationScore = Math.max(0, 1 - dropoffProjection.distanceKm / MATCH_CONFIG.DROPOFF_RADIUS_KM);
    const passengerDistance = this.haversine(passenger.origin, passenger.destination);
    const sharedRouteDistance = Math.max(
      0,
      dropoffProjection.distanceAlongRouteKm - pickupProjection.distanceAlongRouteKm
    );
    const routeLengthSimilarity = Math.min(passengerDistance, sharedRouteDistance) /
      Math.max(passengerDistance, sharedRouteDistance, 0.1);
    const routeOverlap = Math.max(0, Math.min(1,
      routeLengthSimilarity * ((originScore + destinationScore) / 2)
    ));
    const detourScore = Math.max(
      0,
      1 - detourRatio / MATCH_CONFIG.MAX_DETOUR_RATIO
    );
    const timeScore = passenger.desiredTime
      ? Math.max(0, 1 - timeDifferenceMinutes / MATCH_CONFIG.TIME_TOLERANCE_MINUTES)
      : 1;

    let matchScore = Math.round(100 * (
      0.25 * originScore +
      0.25 * destinationScore +
      0.20 * routeOverlap +
      0.15 * detourScore +
      0.15 * timeScore
    ));

    const matchType: RideMatchType = isDirect ? 'DIRECT' : isNearby ? 'NEARBY' : 'ON_ROUTE';
    if (matchType === 'DIRECT') matchScore = Math.max(matchScore, 90);
    if (matchType === 'NEARBY') matchScore = Math.max(matchScore, 75);
    if (matchScore < MATCH_CONFIG.MIN_MATCH_SCORE) return null;

    return {
      matchType,
      matchScore: Math.min(matchScore, 100),
      originDistanceKm: this.round(originEndpointDistance),
      pickupDistanceKm: this.round(pickupProjection.distanceKm),
      dropoffDistanceKm: this.round(dropoffProjection.distanceKm),
      detourKm: this.round(detourKm),
      detourRatio: this.round(detourRatio, 3),
      routeOverlap: Math.round(routeOverlap * 100),
      expectedPickupTime: expectedPickup.toISOString(),
      timeDifferenceMinutes: Math.round(timeDifferenceMinutes),
    };
  }

  /**
   * Ghép chuyến khi hành khách mới chọn điểm đến (ví dụ từ danh sách địa điểm
   * nổi bật). Điểm đến có thể là điểm cuối hoặc một điểm trả dọc theo tuyến,
   * nhưng không được nằm ngay đầu tuyến.
   */
  static matchDestination(
    ride: MatchableRide,
    destination: GeoPoint,
    driverCurrentLocation?: GeoPoint
  ): DestinationMatchMetadata | null {
    if (
      ride.originLat == null || ride.originLng == null ||
      ride.destinationLat == null || ride.destinationLng == null
    ) {
      return null;
    }

    const scheduledOrigin = { lat: ride.originLat, lng: ride.originLng };
    const driverDestination = { lat: ride.destinationLat, lng: ride.destinationLng };
    const fullRoute = this.getRoutePoints(ride.routePolyline, scheduledOrigin, driverDestination);
    const route = driverCurrentLocation
      ? this.trimRouteFromPoint(fullRoute, driverCurrentLocation)
      : fullRoute;
    const projection = this.projectPointToRoute(destination, route);
    const endpointDistance = this.haversine(destination, driverDestination);

    if (
      projection.distanceKm > MATCH_CONFIG.DROPOFF_RADIUS_KM ||
      (projection.routePosition <= 0.01 && endpointDistance > MATCH_CONFIG.DIRECT_RADIUS_KM)
    ) {
      return null;
    }

    const isDirect = endpointDistance <= MATCH_CONFIG.DIRECT_RADIUS_KM;
    const isNearby = endpointDistance <= MATCH_CONFIG.NEARBY_RADIUS_KM;
    if (ride.allowRoutePickup === false && !isDirect) return null;
    const matchType: RideMatchType = isDirect ? 'DIRECT' : isNearby ? 'NEARBY' : 'ON_ROUTE';
    const distanceScore = Math.max(
      0,
      1 - projection.distanceKm / MATCH_CONFIG.DROPOFF_RADIUS_KM
    );
    const routeProgressScore = 0.5 + 0.5 * projection.routePosition;
    let matchScore = Math.round(100 * (0.8 * distanceScore + 0.2 * routeProgressScore));

    if (matchType === 'DIRECT') matchScore = Math.max(matchScore, 90);
    if (matchType === 'NEARBY') matchScore = Math.max(matchScore, 75);
    if (matchScore < MATCH_CONFIG.MIN_MATCH_SCORE) return null;

    return {
      matchType,
      matchScore: Math.min(matchScore, 100),
      dropoffDistanceKm: this.round(projection.distanceKm),
    };
  }

  static haversine(a: GeoPoint, b: GeoPoint): number {
    const toRad = (degrees: number) => degrees * Math.PI / 180;
    const deltaLat = toRad(b.lat - a.lat);
    const deltaLng = toRad(b.lng - a.lng);
    const value =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(deltaLng / 2) ** 2;
    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  }

  static sharedRouteDistance(
    ride: MatchableRide,
    pickup: GeoPoint,
    dropoff: GeoPoint
  ): number {
    if (
      ride.originLat == null || ride.originLng == null ||
      ride.destinationLat == null || ride.destinationLng == null
    ) return this.haversine(pickup, dropoff);

    const route = this.getRoutePoints(
      ride.routePolyline,
      { lat: ride.originLat, lng: ride.originLng },
      { lat: ride.destinationLat, lng: ride.destinationLng }
    );
    const from = this.projectPointToRoute(pickup, route);
    const to = this.projectPointToRoute(dropoff, route);
    return Math.max(0, to.distanceAlongRouteKm - from.distanceAlongRouteKm);
  }

  static projectPointToRoute(point: GeoPoint, route: GeoPoint[]): RouteProjection {
    let bestDistance = Number.POSITIVE_INFINITY;
    let bestDistanceAlong = 0;
    let traversed = 0;
    const totalLength = Math.max(this.routeLength(route), 0.001);

    for (let index = 0; index < route.length - 1; index += 1) {
      const start = route[index];
      const end = route[index + 1];
      const segmentLength = this.haversine(start, end);
      const latitudeScale = Math.cos(((start.lat + end.lat + point.lat) / 3) * Math.PI / 180);
      const ax = start.lng * latitudeScale;
      const ay = start.lat;
      const bx = end.lng * latitudeScale;
      const by = end.lat;
      const px = point.lng * latitudeScale;
      const py = point.lat;
      const abSquared = (bx - ax) ** 2 + (by - ay) ** 2;
      const projectionRatio = abSquared === 0 ? 0 : Math.max(0, Math.min(1,
        ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / abSquared
      ));
      const projected = {
        lat: start.lat + projectionRatio * (end.lat - start.lat),
        lng: start.lng + projectionRatio * (end.lng - start.lng),
      };
      const distance = this.haversine(point, projected);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestDistanceAlong = traversed + projectionRatio * segmentLength;
      }
      traversed += segmentLength;
    }

    return {
      distanceKm: bestDistance,
      distanceAlongRouteKm: bestDistanceAlong,
      routePosition: Math.max(0, Math.min(1, bestDistanceAlong / totalLength)),
    };
  }

  private static getRoutePoints(
    polyline: string | null,
    origin: GeoPoint,
    destination: GeoPoint
  ): GeoPoint[] {
    if (!polyline) return [origin, destination];

    try {
      const parsed = JSON.parse(polyline) as unknown;
      const coordinates = Array.isArray(parsed)
        ? parsed
        : (parsed as { coordinates?: unknown })?.coordinates;
      if (Array.isArray(coordinates) && coordinates.length >= 2) {
        return coordinates
          .filter((coordinate): coordinate is [number, number] =>
            Array.isArray(coordinate) && coordinate.length >= 2 &&
            Number.isFinite(coordinate[0]) && Number.isFinite(coordinate[1]))
          .map(([lng, lat]) => ({ lat, lng }));
      }
    } catch {
      // Goong's encoded polyline is not JSON; decode it below.
    }

    const decoded = this.decodeEncodedPolyline(polyline);
    return decoded.length >= 2 ? decoded : [origin, destination];
  }

  private static trimRouteFromPoint(route: GeoPoint[], currentLocation: GeoPoint): GeoPoint[] {
    if (route.length < 2) return [currentLocation, ...route];

    let closestSegmentIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < route.length - 1; index += 1) {
      const segmentProjection = this.projectPointToRoute(currentLocation, [route[index], route[index + 1]]);
      if (segmentProjection.distanceKm < closestDistance) {
        closestDistance = segmentProjection.distanceKm;
        closestSegmentIndex = index;
      }
    }

    return [currentLocation, ...route.slice(closestSegmentIndex + 1)];
  }

  private static decodeEncodedPolyline(encoded: string): GeoPoint[] {
    const points: GeoPoint[] = [];
    let index = 0;
    let latitude = 0;
    let longitude = 0;
    while (index < encoded.length) {
      const decodeValue = () => {
        let result = 0;
        let shift = 0;
        let byte = 0;
        do {
          if (index >= encoded.length) return null;
          byte = encoded.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);
        return (result & 1) ? ~(result >> 1) : result >> 1;
      };
      const latitudeDelta = decodeValue();
      const longitudeDelta = decodeValue();
      if (latitudeDelta == null || longitudeDelta == null) break;
      latitude += latitudeDelta;
      longitude += longitudeDelta;
      points.push({ lat: latitude / 1e5, lng: longitude / 1e5 });
    }
    return points;
  }

  private static routeLength(route: GeoPoint[]): number {
    let length = 0;
    for (let index = 0; index < route.length - 1; index += 1) {
      length += this.haversine(route[index], route[index + 1]);
    }
    return length;
  }

  private static round(value: number, precision = 2): number {
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
  }
}
