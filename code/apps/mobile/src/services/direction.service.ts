// Gọi Goong Directions API qua backend proxy
// Decode polyline thành mảng tọa độ cho react-native-maps Polyline component

import { api } from './auth.service';

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
const decodePolyline = (encoded: string): LatLng[] => {
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
 * Lấy directions từ Goong API qua backend proxy.
 * Input: origin và destination dạng "lat,lng"
 * Output: khoảng cách, thời gian, mảng tọa độ polyline
 */
export const getDirections = async (
  origin: LatLng,
  destination: LatLng,
  vehicle: string = 'car'
): Promise<DirectionsResult | null> => {
  try {
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destinationStr = `${destination.latitude},${destination.longitude}`;

    // Dùng api instance (axios) thay vì raw fetch — auto-attach JWT token, centralize error handling
    const { data } = await api.post('/goong/directions', {
      origin: originStr,
      destination: destinationStr,
      vehicle,
    });

    // Goong trả về routes[0].legs[0] chứa distance, duration
    // routes[0].overview_polyline.points chứa encoded polyline
    if (!data.routes || data.routes.length === 0) {
      console.warn('[Directions] Không tìm thấy route nào');
      return null;
    }

    const route = data.routes[0];
    const leg = route.legs[0];
    const encodedPolyline = route.overview_polyline?.points;

    if (!encodedPolyline) {
      console.warn('[Directions] Không có polyline data');
      return null;
    }

    return {
      distance: leg.distance?.value || 0,
      duration: leg.duration?.value || 0,
      polylineCoords: decodePolyline(encodedPolyline),
    };
  } catch (error) {
    console.error('[Direction Service] Error:', error);
    return null;
  }
};
