// Mobile service cho Goong Autocomplete và Place Detail
// Gọi qua backend API proxy — không gọi Goong trực tiếp để bảo vệ API key
// Lưu ý: URL phải trỏ đến IP thực (hoặc domain) của backend, không dùng localhost
// vì emulator/device không resolve localhost giống máy phát triển

import type {
  GoongAutocompletePrediction, GoongDirectionsResult, GoongGeolocationRequest,
  GoongGeolocationResult, GoongMatrixResult, GoongOptimizedTripResult, GoongPlaceDetailResult,
  GoongStaticMapOptions,
  PlaceSearchResult,
} from '../../../../packages/shared/src/goong';
import { API_URL as API_BASE_URL } from '../config/network';

export type GoongApiVersion = 'v1' | 'v2';

// Expo hỗ trợ process.env qua app.config hoặc .env + expo-constants
// Với emulator Android: 10.0.2.2 thay cho localhost
// Với device thật: dùng IP LAN của máy phát triển
export interface AutocompleteOptions {
  location?: string;
  limit?: number;
  radius?: number;
  more_compound?: boolean;
  version?: GoongApiVersion;
  sessionToken?: string;
}

export const createGoongSessionToken = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    return (char === 'x' ? value : (value & 0x3) | 0x8).toString(16);
  });

export interface GoongReverseGeocodeResult {
  address: string;
  name?: string;
  place_id?: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

/**
 * Tìm kiếm địa điểm qua Goong Autocomplete V1 (proxy qua backend)
 * Trả mảng rỗng thay vì throw error — mobile cần graceful failure
 * vì user có thể mất mạng giữa chừng
 */
export const getAutocompletePredictionsMobile = async (
  input: string,
  options?: AutocompleteOptions
): Promise<GoongAutocompletePrediction[]> => {
  if (!input || input.trim().length < 2) return [];

  const { limit = 5, location, radius, more_compound, version = 'v2', sessionToken } = options || {};

  try {
    const params = new URLSearchParams({
      query: input,
      more_compound: more_compound !== false ? 'true' : 'false',
      limit: String(limit),
      version,
    });
    if (location) params.set('location', location);
    if (radius !== undefined) params.set('radius', String(radius));
    if (sessionToken) params.set('session_token', sessionToken);

    const response = await fetch(`${API_BASE_URL}/goong/autocomplete?${params.toString()}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Không thể tìm kiếm địa điểm`);
    }

    const data: GoongAutocompletePrediction[] = await response.json();
    return data;
  } catch (err) {
    console.error('[Mobile] Goong Autocomplete error:', err);
    throw err;
  }
};

export const searchPlacesMobile = async (
  query: string,
  options?: Omit<AutocompleteOptions, 'radius' | 'more_compound'>,
): Promise<PlaceSearchResult[]> => {
  if (query.trim().length < 2) return [];
  const { limit = 10, location, version = 'v2', sessionToken } = options || {};
  const params = new URLSearchParams({ q: query, limit: String(limit), version });
  if (location) params.set('location', location);
  if (sessionToken) params.set('session_token', sessionToken);
  const response = await fetch(`${API_BASE_URL}/goong/places/search?${params.toString()}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}: Không thể tìm kiếm địa điểm`);
  return await response.json() as PlaceSearchResult[];
};

/**
 * Lấy chi tiết địa điểm từ place_id (proxy qua backend)
 * Trả null khi lỗi — caller cần handle trường hợp null
 */
export const getPlaceDetailMobile = async (placeId: string, version: GoongApiVersion = 'v2', sessionToken?: string): Promise<GoongPlaceDetailResult | null> => {
  if (!placeId) return null;

  try {
    const params = new URLSearchParams({ place_id: placeId, version });
    if (sessionToken) params.set('session_token', sessionToken);
    const response = await fetch(`${API_BASE_URL}/goong/place-detail?${params.toString()}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Không thể lấy chi tiết địa điểm`);
    }

    const data = await response.json();
    // Backend trả về trực tiếp result object (không wrap trong { result: ... })
    return data as GoongPlaceDetailResult;
  } catch (err) {
    console.error('[Mobile] Goong Place Detail error:', err);
    return null;
  }
};

/**
 * Chuyển tọa độ GPS thành địa chỉ qua proxy backend.
 * Trả null khi không thể xác định địa chỉ để UI cho phép nhập thủ công.
 */
export const getReverseGeocodeMobile = async (
  lat: number,
  lng: number,
  version: GoongApiVersion = 'v1',
): Promise<GoongReverseGeocodeResult | null> => {
  try {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng), version });
    const response = await fetch(`${API_BASE_URL}/goong/reverse-geocode?${params.toString()}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) return null;

    return await response.json() as GoongReverseGeocodeResult;
  } catch (error) {
    if (__DEV__) console.warn('[Mobile] Không thể reverse geocode; cho phép nhập địa chỉ thủ công.', error);
    return null;
  }
};

export const reversePlacesMobile = async (
  latitude: number,
  longitude: number,
  limit = 5,
  version: GoongApiVersion = 'v2',
): Promise<PlaceSearchResult[]> => {
  const params = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude),
    limit: String(limit),
    version,
  });
  const response = await fetch(`${API_BASE_URL}/goong/places/reverse?${params.toString()}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}: Không thể xác định địa điểm`);
  return await response.json() as PlaceSearchResult[];
};

export const forwardGeocodeMobile = async (address: string, version: GoongApiVersion = 'v2'): Promise<GoongPlaceDetailResult | null> => {
  const params = new URLSearchParams({ address, version });
  const response = await fetch(`${API_BASE_URL}/goong/geocode?${params.toString()}`);
  if (!response.ok) return null;
  return await response.json() as GoongPlaceDetailResult;
};

export const getDirectionsMobile = async (
  origin: string,
  destination: string,
  vehicle = 'car',
  alternatives = false,
  waypoints: string[] = [],
): Promise<GoongDirectionsResult | null> => {
  const response = await fetch(`${API_BASE_URL}/goong/directions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin, destination, vehicle, alternatives, waypoints }),
  });
  return response.ok ? await response.json() as GoongDirectionsResult : null;
};

export const getDistanceMatrixMobile = async (origins: string, destinations: string, vehicle = 'car'): Promise<GoongMatrixResult | null> => {
  const response = await fetch(`${API_BASE_URL}/goong/distance-matrix`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ origins, destinations, vehicle }),
  });
  return response.ok ? await response.json() as GoongMatrixResult : null;
};

export const optimizeTripMobile = async (input: { origin?: string; waypoints?: string; destination?: string; vehicle?: string; roundtrip?: boolean }): Promise<GoongOptimizedTripResult | null> => {
  const response = await fetch(`${API_BASE_URL}/goong/trip`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  });
  return response.ok ? await response.json() as GoongOptimizedTripResult : null;
};

export const getStaticMapUrlMobile = (options: GoongStaticMapOptions) => {
  const params = new URLSearchParams(Object.entries(options).reduce<Record<string, string>>((result, [key, value]) => {
    if (value !== undefined) result[key] = String(value);
    return result;
  }, {}));
  return `${API_BASE_URL}/goong/static-map?${params.toString()}`;
};

export const geolocateMobile = async (payload: GoongGeolocationRequest): Promise<GoongGeolocationResult | null> => {
  const response = await fetch(`${API_BASE_URL}/goong/geolocation`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  return response.ok ? await response.json() as GoongGeolocationResult : null;
};
