/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import axios from 'axios';
import { goongClientCache } from './goong-client-cache';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export type GoongApiVersion = 'v1' | 'v2';
export const createGoongSessionToken = () => crypto.randomUUID();

/**
 * Loại bỏ mã bưu chính (5-6 chữ số) và "Việt Nam" dư thừa
 * mà Goong API tự chèn vào các trường description / secondary_text.
 * Export để dùng chung ở mọi component hiển thị địa chỉ.
 *
 * Ví dụ:
 *   "Phường Yên Nghĩa, Hà Nội, 10189, Việt Nam" → "Phường Yên Nghĩa, Hà Nội"
 *   "Văn Quán, Hà Đông, Hà Nội, 12100, Việt Nam" → "Văn Quán, Hà Đông, Hà Nội"
 */
export function cleanAddressText(text: string): string {
  if (!text) return text;
  return text
    .replace(/,?\s*\b\d{5,6}\b/g, '')  // xóa mã bưu chính 5-6 chữ số
    .replace(/,?\s*Việt Nam\s*$/i, '')  // xóa "Việt Nam" ở cuối chuỗi
    .replace(/,\s*,/g, ',')            // dọn dấu phẩy đôi nếu sinh ra
    .trim();
}

/**
 * Ghép name (số nhà + tên đường) với formatted_address (phường/quận/tỉnh)
 * để tạo địa chỉ đầy đủ có số nhà từ Place Detail API.
 *
 * Goong Autocomplete chỉ trả về tên đường, không có số nhà.
 * Place Detail mới có trường `name` chứa số nhà + tên đường.
 *
 * Ví dụ:
 *   name: "91 Trung Kính"
 *   formatted_address: "Phường Trung Hòa, Quận Cầu Giấy, Thành phố Hà Nội"
 *   => "91 Trung Kính, Phường Trung Hòa, Quận Cầu Giấy, Thành phố Hà Nội"
 */
export function buildFullAddressFromDetail(detail: { name?: string; formatted_address?: string }): string | null {
  const name = detail.name?.trim();
  const formatted = detail.formatted_address?.trim();

  if (!name && !formatted) return null;

  // Nếu name đã chứa luôn formatted_address → tránh lặp lại (Goong đôi khi trả về địa chỉ đầy đủ trong name)
  if (name && formatted && !name.includes(formatted)) {
    return cleanAddressText(`${name}, ${formatted}`);
  }

  return cleanAddressText(name || formatted || '');
}



// Interface đầy đủ theo Goong Autocomplete V1 response
// Ref: https://docs.goong.io/rest/place/autocomplete/
export interface AutocompleteResult {
  description: string;
  place_id: string;
  reference: string;
  matched_substrings: Array<{ length: number; offset: number }>;
  structured_formatting: {
    main_text: string;
    main_text_matched_substrings?: Array<{ length: number; offset: number }>;
    secondary_text: string;
    secondary_text_matched_substrings?: Array<{ length: number; offset: number }>;
  };
  terms: Array<{ offset: number; value: string }>;
  has_children: boolean;
  display_type?: string;
  score?: number;
  plus_code?: {
    compound_code: string;
    global_code: string;
  };
  // Chỉ có khi more_compound=true
  compound?: {
    commune: string;
    district?: string;
    province: string;
  };
}

interface GeocodeResult {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  formatted_address: string;
}

// Cấu trúc kết quả từ Goong Geocode V2
// compound chỉ còn 2 cấp do sáp nhập địa giới hành chính
export interface GeocodeV2Result {
  place_id: string;
  formatted_address: string;
  name: string;
  address: string;
  types: string[];
  geometry: {
    location: { lat: number; lng: number };
    boundary: string | null;
  };
  address_components: Array<{ long_name: string; short_name: string }>;
  compound: {
    commune: string;
    province: string;
  };
  plus_code: { compound_code: string; global_code: string };
  // Trả về khi has_deprecated_administrative_unit=true
  deprecated_description?: string;
  deprecated_compound?: {
    commune?: string;
    district?: string;
    province: string;
  };
}

export type RouteGeometry = string | Array<[number, number]>;

interface DirectionsResult {
  routes: Array<{
    summary: string;
    legs: Array<{
      distance: {
        value: number;
        text: string;
      };
      duration: {
        value: number;
        text: string;
      };
      steps: any[];
    }>;
    overview_polyline: {
      points: RouteGeometry;
    };
  }>;
}

// Fallback: Nominatim/OSRM khi Goong không hoạt động
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OSRM_BASE = 'https://router.project-osrm.org';

/**
 * Autocomplete địa điểm - Gọi qua backend API
 * API Docs: https://docs.goong.io/rest/place/autocomplete/
 */
export async function autocompleteAddress(
  query: string,
  options?: {
    limit?: number;
    location?: string; // Format: "lat,lng"
    radius?: number; // in km
    more_compound?: boolean;
    version?: GoongApiVersion;
    sessionToken?: string;
    signal?: AbortSignal;
  }
): Promise<AutocompleteResult[]> {
  // Không khóa cứng Hà Nội/radius; caller truyền vị trí người dùng khi có.
  const { 
    limit = 5, 
    location,
    radius,
    more_compound,
    version = 'v2',
    sessionToken,
    signal,
  } = options || {};

  // JS cache: ngăn duplicate calls trong cùng tab ngay tại tầng JavaScript
  const cacheKey = `autocomplete:${version}:${query.toLowerCase().trim()}:${limit}:${location}:${radius}:${more_compound ?? true}`;
  const cached = goongClientCache.get<AutocompleteResult[]>(cacheKey);
  if (cached) return cached;

  try {
    const params: any = {
      query,
      limit,
      location,
      radius,
      version,
      ...(sessionToken && { session_token: sessionToken }),
      // more_compound=true → backend truyền cho Goong, trả thêm compound (quận/xã/tỉnh)
      more_compound: more_compound !== false ? 'true' : 'false',
    };

    const response = await axios.get(`${API_URL}/goong/autocomplete`, {
      params,
      timeout: 5000,
      signal,
    });

    const results: AutocompleteResult[] = response.data || [];
    // TTL 60s — đồng bộ với backend cache TTL
    goongClientCache.set(cacheKey, results, 60);
    return results;
  } catch (error) {
    if (axios.isCancel(error)) return [];
    console.warn('Backend Autocomplete failed, falling back to Nominatim');
    
    // Fallback Nominatim
    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        countrycodes: 'vn',
        limit: limit.toString(),
        addressdetails: '0',
      });

      const res = await axios.get(`${NOMINATIM_BASE}/search?${params}`, {
        headers: {
          'Accept-Language': 'vi,en',
        },
        timeout: 5000,
        signal,
      });

      return res.data.map((item: any) => ({
        description: item.display_name,
        place_id: item.place_id.toString(),
        structured_formatting: {
          main_text: item.display_name.split(',')[0],
          secondary_text: item.display_name.split(',').slice(1).join(','),
        },
      }));
    } catch (error) {
      console.error('Autocomplete error:', error);
      return [];
    }
  }
}

/**
 * Geocoding - Gọi qua backend API
 */
export async function geocodeAddress(address: string, version: GoongApiVersion = 'v2'): Promise<GeocodeResult | null> {
  try {
    const response = await axios.get(`${API_URL}/goong/geocode`, {
      params: { address, version },
      timeout: 5000,
    });

    if (response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.warn('Backend Geocode failed, falling back to Nominatim');
    
    // Fallback Nominatim
    try {
      const params = new URLSearchParams({
        q: address,
        format: 'json',
        limit: '1',
      });

      const res = await axios.get(`${NOMINATIM_BASE}/search?${params}`, {
        headers: {
          'Accept-Language': 'vi,en',
        },
        timeout: 5000,
      });

      if (res.data && res.data.length > 0) {
        const item = res.data[0];
        return {
          geometry: {
            location: {
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            },
          },
          formatted_address: item.display_name,
        };
      }
      return null;
    } catch (error) {
      console.error('Geocode error:', error);
      return null;
    }
  }
}

/**
 * Geocoding V2 - Lấy địa chỉ theo đơn vị hành chính MỚI (sau sáp nhập)
 * Trả về mảng kết quả, mỗi item có:
 * - formatted_address: địa chỉ mới (đơn vị hành chính mới)
 * - deprecated_description: địa chỉ cũ trước khi sáp nhập (để so sánh)
 * Dùng để hiển thị nút "Hiện địa chỉ mới" trong UI
 */
export async function geocodeAddressV2(address: string): Promise<GeocodeV2Result[] | null> {
  const cacheKey = `geocode-v2:${address.toLowerCase().trim()}`;
  const cached = goongClientCache.get<GeocodeV2Result[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${API_URL}/goong/geocode-v2`, {
      params: { address },
      timeout: 8000,
    });

    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      const results = response.data as GeocodeV2Result[];
      goongClientCache.set(cacheKey, results, 300);
      return results;
    }
    return null;
  } catch (error) {
    // V2 không fallback - lỗi thì tính năng "hiện địa chỉ mới" ẩn đi
    console.warn('[geocodeAddressV2] Không lấy được địa chỉ V2:', error);
    return null;
  }
}

/**
 * Reverse Geocoding - Gọi qua backend API
 * Trả string đơn giản (backward compatibility cho các nơi chỉ cần hiện text)
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  // Làm tròn 4 chữ số thập phân (~11m) để cache hit dù GPS trả giá trị hơi khác nhau
  const roundedLat = Math.round(lat * 10000) / 10000;
  const roundedLng = Math.round(lng * 10000) / 10000;
  const cacheKey = `reverse-geocode:${roundedLat},${roundedLng}`;
  const cached = goongClientCache.get<string>(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${API_URL}/goong/reverse-geocode`, {
      params: { lat, lng },
      timeout: 5000,
    });

    if (response.data && response.data.address) {
      goongClientCache.set(cacheKey, response.data.address, 300);
      return response.data.address;
    }
    return null;
  } catch (error) {
    console.warn('Backend Reverse Geocode failed, falling back to Nominatim');
    
    // Fallback Nominatim
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json',
        zoom: '16',
      });

      const res = await axios.get(`${NOMINATIM_BASE}/reverse?${params}`, {
        headers: {
          'Accept-Language': 'vi,en',
        },
        timeout: 5000,
      });

      if (res.data && res.data.display_name) {
        return res.data.display_name;
      }
      return null;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return null;
    }
  }
}

/**
 * Reverse Geocoding chi tiết — trả đầy đủ dữ liệu từ Goong:
 * - name: tên địa điểm gần nhất (VD: "Hertz Car Rental")
 * - address: formatted_address (VD: "3 5 Nguyen Van Linh, Kim Ma, Hà Nội")
 * - place_id: dùng để gọi Place Detail nếu cần
 * - compound: { commune, district, province } — địa giới tách sẵn
 * - geometry: { location: { lat, lng } }
 *
 * Dùng cho GPS auto-fill: ghép name + address ngay lập tức
 * mà không cần gọi thêm autocomplete + Place Detail (tiết kiệm 2 API calls)
 */
export interface ReverseGeocodeDetailedResult {
  address: string;
  name?: string;
  address_components?: Array<{ long_name: string; short_name: string }>;
  place_id?: string;
  compound?: {
    commune: string;
    district?: string;
    province: string;
  };
  geometry?: {
    location: { lat: number; lng: number };
  };
  plus_code?: {
    compound_code: string;
    global_code: string;
  };
}

export async function reverseGeocodeDetailed(
  lat: number,
  lng: number,
  version: GoongApiVersion = 'v2',
): Promise<ReverseGeocodeDetailedResult | null> {
  // Làm tròn 4 chữ số thập phân — cùng lý do với reverseGeocode ở trên
  const roundedLat = Math.round(lat * 10000) / 10000;
  const roundedLng = Math.round(lng * 10000) / 10000;
  const cacheKey = `reverse-geocode-detailed:${version}:${roundedLat},${roundedLng}`;
  const cached = goongClientCache.get<ReverseGeocodeDetailedResult>(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${API_URL}/goong/reverse-geocode`, {
      params: { lat, lng, version },
      timeout: 5000,
    });

    if (response.data && response.data.address) {
      goongClientCache.set(cacheKey, response.data as ReverseGeocodeDetailedResult, 300);
      return response.data as ReverseGeocodeDetailedResult;
    }
    return null;
  } catch (error) {
    console.warn('[reverseGeocodeDetailed] Backend lỗi:', error);
    return null;
  }
}

/**
 * Reverse Geocoding với structured data - Gọi qua backend API
 * Trả về địa chỉ đã parse theo cấu trúc Việt Nam
 */
export async function reverseGeocodeStructured(lat: number, lng: number): Promise<{
  fullAddress: string;
  province?: string;
  district?: string;
  ward?: string;
  street?: string;
  houseNumber?: string;
} | null> {
  try {
    const response = await axios.get(`${API_URL}/goong/reverse-geocode`, {
      params: { lat, lng },
      timeout: 5000,
    });

    if (response.data && response.data.address) {
      const address = response.data.address;
      const components = response.data.address_components;
      
      // Parse from address_components if available (more accurate)
      if (components && Array.isArray(components)) {
        const parsed: any = {
          fullAddress: address,
        };
        
        // Map Goong address components to Vietnamese address structure
        // Goong returns components in order: specific -> general
        // We need to identify each component by its type or content
        for (const comp of components) {
          const longName = comp.long_name;
          
          // Common patterns for Vietnamese addresses
          if (!parsed.province && (longName.includes('Thành phố') || longName.includes('Tỉnh'))) {
            parsed.province = longName;
          } else if (!parsed.district && (longName.includes('Quận') || longName.includes('Huyện') || longName.includes('Thị xã'))) {
            parsed.district = longName;
          } else if (!parsed.ward && (longName.includes('Phường') || longName.includes('Xã') || longName.includes('Thị trấn'))) {
            parsed.ward = longName;
          } else if (!parsed.street && (longName.includes('Đường') || longName.includes('Phố'))) {
            parsed.street = longName;
          } else if (!parsed.houseNumber && /^\d+/.test(longName)) {
            parsed.houseNumber = longName;
          }
        }
        
        // Fallback: if structured parsing failed, use the last components
        if (!parsed.province || !parsed.district) {
          const parts = address.split(',').map((p: string) => p.trim());
          const len = parts.length;
          if (!parsed.province) parsed.province = len >= 1 ? parts[len - 1] : undefined;
          if (!parsed.district) parsed.district = len >= 2 ? parts[len - 2] : undefined;
          if (!parsed.ward) parsed.ward = len >= 3 ? parts[len - 3] : undefined;
          if (!parsed.street) parsed.street = len >= 4 ? parts[len - 4] : undefined;
          if (!parsed.houseNumber) parsed.houseNumber = len >= 1 ? parts[0] : undefined;
        }
        
        // Clean up undefined values
        Object.keys(parsed).forEach(key => {
          if (!parsed[key]) delete parsed[key];
        });
        
        return parsed;
      }
      
      // Fallback: Parse from formatted_address (backward compatibility)
      const parts = address.split(',').map((p: string) => p.trim());
      const len = parts.length;
      
      const parsed: any = {
        fullAddress: address,
        province: len >= 1 ? parts[len - 1] : undefined,
        district: len >= 2 ? parts[len - 2] : undefined,
        ward: len >= 3 ? parts[len - 3] : undefined,
        street: len >= 4 ? parts[len - 4] : undefined,
        houseNumber: len >= 1 ? parts[0] : undefined,
      };
      
      // Clean up undefined values
      Object.keys(parsed).forEach(key => {
        if (!parsed[key]) delete parsed[key];
      });
      
      return parsed;
    }
    return null;
  } catch (error) {
    console.warn('Backend Reverse Geocode Structured failed, falling back to Nominatim');
    
    // Fallback Nominatim
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json',
        addressdetails: '1',
        zoom: '16',
      });

      const res = await axios.get(`${NOMINATIM_BASE}/reverse?${params}`, {
        headers: {
          'Accept-Language': 'vi,en',
        },
        timeout: 5000,
      });

      if (res.data && res.data.address) {
        const addr = res.data.address;
        const parsed: any = {
          fullAddress: res.data.display_name,
          province: addr.state || addr.province || addr.city,
          district: addr.district || addr.county,
          ward: addr.suburb || addr.ward || addr.town,
          street: addr.road || addr.street,
          houseNumber: addr.house_number || addr.building,
        };
        
        // Clean up undefined values
        Object.keys(parsed).forEach(key => {
          if (!parsed[key]) delete parsed[key];
        });
        
        return parsed;
      }
      return null;
    } catch (error) {
      console.error('Reverse geocode structured error:', error);
      return null;
    }
  }
}

/**
 * Directions V2 — Gọi qua backend API proxy
 * Backend sử dụng Goong Directions API V2 (`/v2/direction`)
 *
 * @param origin      - Toạ độ điểm đi "lat,lng" (VD: "21.046623,105.790168")
 * @param destination - Toạ độ điểm đến "lat,lng"
 * @param vehicle     - Loại phương tiện: 'car' | 'bike' (mặc định: 'car')
 * @returns DirectionsResult chứa routes[0].legs (distance, duration) + overview_polyline
 */
export async function getDirections(
  origin: string,
  destination: string,
  vehicle: string = 'car',
  alternatives = false,
  waypoints: string[] = [],
): Promise<DirectionsResult | null> {
  try {
    const response = await axios.post(`${API_URL}/goong/directions`, {
      origin,
      destination,
      vehicle,
      alternatives,
      waypoints,
    }, { timeout: 10000 });

    if (response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    console.warn('Backend Directions failed, falling back to OSRM');
    
    // Fallback OSRM
    try {
      const coords = [origin, ...waypoints, destination].join(';');
      const url = `${OSRM_BASE}/route/v1/driving/${coords}?overview=full&geometries=geojson`;

      const res = await axios.get(url, { timeout: 5000 });

      if (res.data.code === 'Ok' && res.data.routes.length > 0) {
        const route = res.data.routes[0];
        // Convert OSRM format to Goong-like format
        // Store GeoJSON geometry in overview_polyline.points for decodePolyline to handle
        return {
          routes: [{
            summary: 'Route',
            legs: [{
              distance: {
                value: route.distance,
                text: `${(route.distance / 1000).toFixed(1)} km`,
              },
              duration: {
                value: route.duration,
                text: `${Math.round(route.duration / 60)} min`,
              },
              steps: [],
            }],
            overview_polyline: {
              points: route.geometry.coordinates as any, // Pass GeoJSON for decodePolyline
            },
          }],
        };
      }
      return null;
    } catch (error) {
      console.error('Directions error:', error);
      return null;
    }
  }
}

export async function getDistanceMatrix(origins: string, destinations: string, vehicle = 'car') {
  try {
    const response = await axios.post(`${API_URL}/goong/distance-matrix`, { origins, destinations, vehicle }, { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.warn('[getDistanceMatrix] Backend proxy failed:', error);
    return null;
  }
}

export function getStaticMapUrl(options: {
  origin: string; destination: string; width?: number; height?: number;
  vehicle?: string; type?: 'fastest' | 'shortest'; color?: string;
}) {
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });
  return `${API_URL}/goong/static-map?${params.toString()}`;
}

export async function geolocateFromNetwork(payload: Record<string, unknown>) {
  try {
    const response = await axios.post(`${API_URL}/goong/geolocation`, { ...payload, considerIp: false }, { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.warn('[geolocateFromNetwork] unavailable:', error);
    return null;
  }
}

/**
 * Lấy thông tin chi tiết về địa điểm
 * Gọi qua backend API proxy để không lộ API key trên client
 * API Docs: https://docs.goong.io/rest/place/details/
 */
export async function getPlaceDetail(placeId: string, version: GoongApiVersion = 'v2', sessionToken?: string): Promise<any> {
  try {
    // Ưu tiên gọi qua backend proxy (nhất quán với autocompleteAddress)
    const response = await axios.get(`${API_URL}/goong/place-detail`, {
      params: { place_id: placeId, version, ...(sessionToken && { session_token: sessionToken }) },
      timeout: 5000,
    });
    return response.data?.result || response.data || null;
  } catch (error) {
    console.warn('[getPlaceDetail] Backend proxy failed');
    return null;
  }
}

/**
 * Trip API - Tối ưu hóa lộ trình cho nhiều điểm (TSP với farthest-insertion)
 * Phù hợp cho: giao hàng, tour du lịch, lập kế hoạch tuyến đường nhiều điểm
 */
export async function getTripOptimization(
  origin?: string,
  waypoints?: string,
  destination?: string,
  vehicle: string = 'car'
): Promise<any> {
  try {
    const response = await axios.post(`${API_URL}/goong/trip`, {
        origin,
        waypoints,
        destination,
        vehicle,
        roundtrip: false,
      }, { timeout: 15000 });

    if (response.data.code === 'Ok') {
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('Trip optimization error:', error);
    return null;
  }
}

/**
 * Format khoảng cách từ mét sang km
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format thời gian từ giây sang phút/giờ
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Decode polyline từ Goong Directions API
 * Trả về mảng [lng, lat][] — đúng format MapLibre/Goong Map cần
 */
export function decodePolyline(encoded: RouteGeometry): Array<[number, number]> {
  // Nếu encoded là GeoJSON array (từ OSRM fallback)
  // OSRM GeoJSON coordinates đã là [lng, lat] → giữ nguyên
  if (Array.isArray(encoded)) {
    return encoded as [number, number][];
  }

  // Decode Goong encoded polyline
  const points: Array<[number, number]> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    // MapLibre yêu cầu [lng, lat]
    points.push([lng / 1e5, lat / 1e5]);
  }

  return points;
}

