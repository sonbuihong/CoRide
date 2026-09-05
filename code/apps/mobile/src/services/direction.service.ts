// Gọi Goong Directions API V2 trực tiếp từ mobile (primary)
// Backend proxy (/api/goong/directions) là fallback khi direct call fail
// Decode polyline thành mảng tọa độ cho react-native-maps Polyline component

import { apiClient as api } from '../api/client';

const GOONG_REST_BASE = 'https://rsapi.goong.io';
// Goong sử dụng 2 API key khác nhau: Maptiles Key (hiển thị bản đồ) và REST API Key (Directions, Geocode)
// Để gọi direct từ mobile, chúng ta cần dùng REST API Key.
const GOONG_REST_API_KEY = (process.env.EXPO_PUBLIC_GOONG_REST_API_KEY as string | undefined) ?? '';

interface LatLng {
  latitude: number;
  longitude: number;
}

interface DirectionsResult {
  distance: number; // meters
  duration: number; // seconds
  polylineCoords: LatLng[];
}

/**
 * Decode Google Encoded Polyline thành mảng tọa độ.
 * Goong API trả polyline dạng encoded string (cùng format Google Maps).
 * Thuật toán: đọc từng byte, shift bits, tính delta lat/lng
 */
export const decodePolyline = (encoded: string): LatLng[] => {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;

    // Decode latitude delta
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    // Decode longitude delta
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
};

/**
 * Parse response từ Goong Directions API V2 thành DirectionsResult.
 * Dùng chung cho cả direct call và backend proxy (cùng format response).
 */
const parseGoongResponse = (data: any): DirectionsResult | null => {
  if (!data?.routes || data.routes.length === 0) {
    console.warn('[Directions] Không tìm thấy route nào');
    return null;
  }

  const route = data.routes[0];
  const legs = route.legs ?? [];
  const encodedPolyline = route.overview_polyline?.points;

  if (!encodedPolyline) {
    console.warn('[Directions] Không có polyline data');
    return null;
  }

  return {
    distance: legs.reduce((sum: number, leg: any) => sum + (leg.distance?.value ?? 0), 0),
    duration: legs.reduce((sum: number, leg: any) => sum + (leg.duration?.value ?? 0), 0),
    polylineCoords: decodePolyline(encodedPolyline),
  };
};

/**
 * Gọi trực tiếp Goong Directions V2 API từ mobile.
 * - Nhanh hơn: không có network hop qua backend
 * - Hoạt động khi backend offline
 * - API key đã public trong bundle (cùng key với Maptiles, không thể giấu khỏi client)
 */
const getDirectionsDirect = async (
  origin: LatLng,
  destination: LatLng,
  vehicle: string,
  waypoints: LatLng[] = [],
): Promise<DirectionsResult | null> => {
  if (!GOONG_REST_API_KEY) {
    console.warn('[Directions] EXPO_PUBLIC_GOONG_REST_API_KEY chưa được cấu hình');
    throw new Error('Missing REST API Key for direct call');
  }

  const originStr = `${origin.latitude},${origin.longitude}`;
  const destinationStr = `${destination.latitude},${destination.longitude}`;

  const params = new URLSearchParams({
    origin: originStr,
    destination: destinationStr,
    vehicle,
    api_key: GOONG_REST_API_KEY,
  });

  // Goong Directions V2 hỗ trợ waypoints dạng "lat,lng|lat,lng"
  if (waypoints.length > 0) {
    params.set('waypoints', waypoints.map((p) => `${p.latitude},${p.longitude}`).join('|'));
  }

  const response = await fetch(`${GOONG_REST_BASE}/v2/direction?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Goong direct API error: ${response.status}`);
  }

  const data = await response.json();
  return parseGoongResponse(data);
};

/**
 * Gọi Goong Directions qua backend proxy.
 * Dùng api instance (axios) — auto-attach JWT token, centralize error handling.
 * Là fallback khi direct call thất bại.
 */
const getDirectionsViaProxy = async (
  origin: LatLng,
  destination: LatLng,
  vehicle: string,
  waypoints: LatLng[] = [],
): Promise<DirectionsResult | null> => {
  const { data } = await api.post('/goong/directions', {
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
    vehicle,
    waypoints: waypoints.map((point) => `${point.latitude},${point.longitude}`),
  });
  return parseGoongResponse(data);
};

/**
 * Lấy directions từ Goong API V2.
 *
 * Strategy:
 * 1. Thử gọi trực tiếp Goong API từ mobile (nhanh hơn, ít hop hơn)
 * 2. Nếu fail → fallback sang backend proxy (có JWT auth, rate limit)
 *
 * @param origin      - Tọa độ xuất phát
 * @param destination - Tọa độ đích đến
 * @param vehicle     - 'car' | 'bike' (mặc định 'car')
 * @param waypoints   - Danh sách điểm dừng giữa đường (tùy chọn)
 */
export const getDirections = async (
  origin: LatLng,
  destination: LatLng,
  vehicle: string = 'car',
  waypoints: LatLng[] = [],
): Promise<DirectionsResult | null> => {
  try {
    // Primary: gọi trực tiếp Goong Directions V2 từ mobile
    const direct = await getDirectionsDirect(origin, destination, vehicle, waypoints);
    if (direct) return direct;
  } catch (directError) {
    console.warn('[Directions] Direct Goong call failed, falling back to proxy:', directError);
  }

  try {
    // Fallback: backend proxy (hoạt động khi direct bị firewall hoặc key thiếu)
    return await getDirectionsViaProxy(origin, destination, vehicle, waypoints);
  } catch (proxyError) {
    console.error('[Direction Service] Both direct and proxy failed:', proxyError);
    return null;
  }
};

/**
 * Tạo một polyline xuyên suốt nhiều điểm dừng mà vẫn tôn trọng giới hạn
 * tối đa 3 waypoint mỗi request của Goong Directions V2.
 */
export const getDirectionsThroughStops = async (
  points: LatLng[],
  vehicle: string = 'car',
): Promise<DirectionsResult | null> => {
  if (points.length < 2) return null;
  const chunks: LatLng[][] = [];
  for (let cursor = 0; cursor < points.length - 1; cursor += 4) {
    const chunk = points.slice(cursor, cursor + 5);
    if (chunk.length >= 2) chunks.push(chunk);
  }

  const results = await Promise.all(chunks.map((chunk) =>
    getDirections(chunk[0], chunk[chunk.length - 1], vehicle, chunk.slice(1, -1)),
  ));
  const valid = results.filter((result): result is DirectionsResult => Boolean(result));
  if (!valid.length) return null;
  return {
    distance: valid.reduce((sum, result) => sum + result.distance, 0),
    duration: valid.reduce((sum, result) => sum + result.duration, 0),
    polylineCoords: valid.flatMap((result, index) => index === 0 ? result.polylineCoords : result.polylineCoords.slice(1)),
  };
};
