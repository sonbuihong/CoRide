import axios from 'axios';
import type {
  GoongGeolocationRequest,
  GoongGeolocationResult,
  GoongMatrixResult,
  GoongOptimizedTripResult,
  GoongStaticMapOptions,
  GoongVehicleType,
} from '@repo/shared';
import goongConfig from '../../config/goong.config';
import { goongCache } from './goong.cache';

type GoongApiVersion = 'v1' | 'v2';

// Interface theo Goong Autocomplete V1 response
// Khi truyền more_compound=true → trả thêm compound (quận/xã/tỉnh)
// Ref: https://docs.goong.io/rest/place/autocomplete/
interface AutocompleteResult {
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
  types?: string[];
  distance_meters?: number;
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

// Cấu trúc response từ Goong Geocode V2
// compound chỉ còn 2 cấp (commune + province) do sáp nhập địa giới
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
  // Chỉ có khi truyền has_deprecated_administrative_unit=true
  deprecated_description?: string;
  deprecated_compound?: {
    commune?: string;
    district?: string;
    province: string;
  };
}

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
      points: string;
    };
  }>;
}

interface PolylinePoint { latitude: number; longitude: number }

const decodePolyline = (encoded: string): PolylinePoint[] => {
  const points: PolylinePoint[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  while (index < encoded.length) {
    const readValue = () => {
      let result = 0;
      let shift = 0;
      let byte: number;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20 && index <= encoded.length);
      return (result & 1) ? ~(result >> 1) : result >> 1;
    };
    latitude += readValue();
    longitude += readValue();
    points.push({ latitude: latitude / 1e5, longitude: longitude / 1e5 });
  }
  return points;
};

const encodePolyline = (points: PolylinePoint[]) => {
  let lastLatitude = 0;
  let lastLongitude = 0;
  const encodeValue = (raw: number) => {
    let value = raw < 0 ? ~(raw << 1) : raw << 1;
    let output = '';
    while (value >= 0x20) {
      output += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
      value >>= 5;
    }
    return output + String.fromCharCode(value + 63);
  };
  return points.map((point) => {
    const latitude = Math.round(point.latitude * 1e5);
    const longitude = Math.round(point.longitude * 1e5);
    const encoded = encodeValue(latitude - lastLatitude) + encodeValue(longitude - lastLongitude);
    lastLatitude = latitude;
    lastLongitude = longitude;
    return encoded;
  }).join('');
};

export interface DistanceMatrixResult {
  rows: Array<{
    elements: Array<{
      status: string;
      duration: { text: string; value: number };
      distance: { text: string; value: number };
    }>;
  }>;
}

class GoongService {
  private baseUrl: string;
  private consecutiveFailures = 0;
  private circuitOpenedUntil = 0;
  private readonly requestCounters = new Map<string, number>();

  constructor() {
    this.baseUrl = goongConfig.baseUrl;
  }

  // Đọc API key lazy qua getter — tránh cache giá trị rỗng
  // vì constructor chạy TRƯỚC dotenv.config() (do thứ tự import trong app.ts)
  private get apiKey(): string {
    return goongConfig.restApiKey;
  }

  private async getFromGoong<T>(endpoint: string, params: Record<string, unknown>, timeout = 10000, responseType?: 'arraybuffer'): Promise<T> {
    if (Date.now() < this.circuitOpenedUntil) throw new Error('GOONG_CIRCUIT_OPEN');

    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await axios.get(`${this.baseUrl}${endpoint}`, {
          params: { ...params, api_key: this.apiKey }, timeout,
          ...(responseType ? { responseType } : {}),
        });
        this.consecutiveFailures = 0;
        this.requestCounters.set(endpoint, (this.requestCounters.get(endpoint) ?? 0) + 1);
        return response.data as T;
      } catch (error: any) {
        lastError = error;
        const status = error?.response?.status;
        const retryable = status === 429 || status >= 500 || error?.code === 'ECONNABORTED';
        console.warn('[Goong]', endpoint, 'attempt', attempt + 1, 'status', status ?? error?.code ?? 'unknown');
        if (!retryable || attempt === 1) break;
        await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
      }
    }

    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= 5) {
      this.circuitOpenedUntil = Date.now() + 30_000;
      this.consecutiveFailures = 0;
    }
    throw lastError;
  }

  getUsageSnapshot(): Record<string, number> {
    return Object.fromEntries(this.requestCounters);
  }

  /**
   * Autocomplete V1/V2 — V2 trả địa chỉ theo địa giới hành chính sau sáp nhập
   * Ref: https://docs.goong.io/rest/place/autocomplete/
   *
   * @param query - Từ khóa tìm kiếm (VD: "91 Trung Kính")
   * @param limit - Số kết quả tối đa (mặc định 10)
   * @param location - Toạ độ ưu tiên "lat,lng" — kết quả gần vị trí này được xếp trước
   * @param radius - Bán kính tìm kiếm (km, mặc định 50)
   * @param more_compound - Nếu true, trả thêm compound (quận/xã/tỉnh tách sẵn)
   */
  async autocomplete(
    query: string,
    limit: number = 10,
    location?: string,
    radius?: number,
    more_compound: boolean = true,
    version: GoongApiVersion = 'v2',
    sessionToken?: string,
  ): Promise<AutocompleteResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    // Cache key bao gồm tất cả params ảnh hưởng đến kết quả
    const cacheKey = `autocomplete:${version}:${sessionToken ?? 'no-session'}:${query.toLowerCase().trim()}:${limit}:${location ?? ''}:${radius ?? ''}:${more_compound}`;
    const cached = goongCache.get<AutocompleteResult[]>(cacheKey);
    if (cached) return cached;

    try {
      const endpoint = version === 'v2' ? '/v2/place/autocomplete' : '/place/autocomplete';
      const response = await this.getFromGoong<{ predictions?: AutocompleteResult[] }>(endpoint, {
          input: query,
          limit,
          more_compound,
          ...(location && { location }),
          ...(radius && { radius }),
          ...(sessionToken && { sessiontoken: sessionToken }),
      });

      const results: AutocompleteResult[] = response.predictions || [];
      // TTL 60s — kết quả autocomplete có thể thay đổi nhưng ít xảy ra trong 1 phút
      goongCache.set(cacheKey, results, 60);
      return results;
    } catch (error) {
      console.error('Goong Autocomplete error:', error);
      throw new Error('Không thể tìm kiếm địa điểm');
    }
  }

  /**
   * Geocoding - Chuyển địa chỉ thành tọa độ
   * @param address - Địa chỉ cần geocode
   */
  async geocode(address: string): Promise<GeocodeResult | null> {
    if (!address) {
      return null;
    }

    const cacheKey = `geocode:${address.toLowerCase().trim()}`;
    const cached = goongCache.get<GeocodeResult>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.getFromGoong<{ results?: GeocodeResult[] }>('/geocode', { address });

      if (response.results && response.results.length > 0) {
        const result: GeocodeResult = response.results[0];
        // TTL 300s — tọa độ địa chỉ gần như không bao giờ thay đổi
        goongCache.set(cacheKey, result, 300);
        return result;
      }
      return null;
    } catch (error) {
      console.error('Goong Geocode error:', error);
      throw new Error('Không thể tìm thấy tọa độ cho địa chỉ này');
    }
  }

  async forwardGeocode(address: string, version: GoongApiVersion = 'v2'): Promise<any | null> {
    if (version === 'v1') return this.geocode(address);
    const results = await this.geocodeV2(address);
    return results?.[0] ?? null;
  }

  /**
   * Reverse Geocoding - Chuyển tọa độ thành địa chỉ
   * Trả đầy đủ dữ liệu (name, address, compound, place_id, geometry)
   * để frontend ghép địa chỉ chi tiết ngay mà không cần gọi thêm Place Detail
   * @param lat - Vĩ độ
   * @param lng - Kinh độ
   */
  async reverseGeocode(lat: number, lng: number, version: GoongApiVersion = 'v2'): Promise<any | null> {
    // Làm tròn 4 chữ số thập phân (~11m precision) để tăng cache hit rate
    // Tọa độ GPS thường chênh nhau vài mét → cùng địa điểm → nên cache chung
    const roundedLat = Math.round(lat * 10000) / 10000;
    const roundedLng = Math.round(lng * 10000) / 10000;
    const cacheKey = `reverse-geocode:${version}:${roundedLat},${roundedLng}`;

    const cached = goongCache.get<any>(cacheKey);
    if (cached) return cached;

    try {
      const endpoint = version === 'v2' ? '/v2/geocode' : '/geocode';
      const response = await this.getFromGoong<any>(endpoint, { latlng: `${lat},${lng}` });

      if (response.results && response.results.length > 0) {
        const result = response.results[0];
        const data = {
          // formatted_address: "Hertz Car Rental, 3 5 Nguyen Van Linh, Kim Ma, Long Biên, Hà Nội"
          address: result.formatted_address,
          // name: "Hertz Car Rental" (tên địa điểm cụ thể gần nhất)
          name: result.name,
          // address_components: mảng các thành phần địa chỉ (tên, đường, phường, quận, tỉnh)
          address_components: result.address_components,
          place_id: result.place_id,
          // compound: { commune, district, province } — địa giới tách sẵn
          compound: result.compound,
          geometry: result.geometry,
          plus_code: result.plus_code,
        };
        // TTL 300s — địa chỉ tại tọa độ cố định không thay đổi trong 5 phút
        goongCache.set(cacheKey, data, 300);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Goong Reverse Geocode error:', error);
      throw new Error('Không thể tìm thấy địa chỉ cho tọa độ này');
    }
  }

  /**
   * Directions V2 — Tính toán lộ trình, khoảng cách, thời gian
   *
   * Dùng endpoint V2 (`/v2/direction`) thay V1 (`/direction`):
   * - Kết quả tuyến đường chính xác hơn
   * - Hỗ trợ tham số `alternatives` để kiểm soát số route trả về
   *
   * @param origin      - Toạ độ điểm đi, format "lat,lng" (VD: "21.046623,105.790168")
   * @param destination - Toạ độ điểm đến, format "lat,lng"
   * @param vehicle     - Loại phương tiện: 'car' | 'bike' | 'truck' (mặc định: 'car')
   * @returns Đối tượng chứa routes[0].legs (distance, duration) và overview_polyline
   */
  async directions(
    origin: string,
    destination: string,
    vehicle: GoongVehicleType = 'car',
    alternatives = false,
    waypoints: string[] = [],
  ): Promise<DirectionsResult | null> {
    if (!origin || !destination) {
      return null;
    }

    const waypointKey = waypoints.join('|');
    const cacheKey = `directions:v2:${origin}:${waypointKey}:${destination}:${vehicle}:${alternatives}`;
    const cached = goongCache.get<DirectionsResult>(cacheKey);
    if (cached) return cached;

    try {
      // Goong Directions không hỗ trợ danh sách waypoint ổn định như Trip.
      // Với tối đa 3 điểm dừng, ghép từng chặng theo đúng thứ tự tài xế đã chọn.
      if (waypoints.length > 0) {
        const locations = [origin, ...waypoints, destination];
        const legs: DirectionsResult['routes'][number]['legs'] = [];
        const routePoints: PolylinePoint[] = [];
        for (let index = 0; index < locations.length - 1; index += 1) {
          const segment = await this.directions(locations[index], locations[index + 1], vehicle, false);
          const route = segment?.routes?.[0];
          if (!route) return null;
          legs.push(...route.legs);
          const decoded = decodePolyline(route.overview_polyline.points);
          routePoints.push(...(index === 0 ? decoded : decoded.slice(1)));
        }
        const response: DirectionsResult = {
          routes: [{
            summary: `Tuyến qua ${waypoints.length} điểm dừng`,
            legs,
            overview_polyline: { points: encodePolyline(routePoints) },
          }],
        };
        goongCache.set(cacheKey, response, 60);
        return response;
      }

      // Gọi Goong Directions API V2
      const response = await this.getFromGoong<DirectionsResult>('/v2/direction', {
          origin,
          destination,
          vehicle,
          alternatives,
      });

      if (response.routes && response.routes.length > 0) {
        goongCache.set(cacheKey, response, 60);
        return response;
      }
      return null;
    } catch (error: any) {
      console.error('Goong Directions V2 error:', error?.response?.data || error.message);
      throw new Error(`Goong API Error: ${error?.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Geocoding V2 - Chuyển địa chỉ thành tọa độ theo địa giới hành chính mới
   * Gọi endpoint /v2/geocode, trả kèm thông tin địa giới cũ để hiển thị so sánh
   * @param address - Địa chỉ cần geocode
   */
  async geocodeV2(address: string): Promise<GeocodeV2Result[] | null> {
    if (!address) {
      return null;
    }

    const cacheKey = `geocode-v2:${address.toLowerCase().trim()}`;
    const cached = goongCache.get<GeocodeV2Result[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.getFromGoong<{ results?: GeocodeV2Result[] }>('/v2/geocode', {
          address,
          // Luôn bật để frontend có thể hiển thị địa chỉ cũ so sánh
          has_deprecated_administrative_unit: true,
      });

      if (response.results && response.results.length > 0) {
        const results = response.results as GeocodeV2Result[];
        // TTL 300s — địa giới hành chính thay đổi rất ít
        goongCache.set(cacheKey, results, 300);
        return results;
      }
      return null;
    } catch (error) {
      console.error('Goong Geocode V2 error:', error);
      throw new Error('Không thể tìm thấy địa chỉ mới cho địa chỉ này');
    }
  }

  /**
   * Tính toán ma trận khoảng cách và thời gian giữa nhiều điểm (Distance Matrix)
   *
   * @param origins - Danh sách điểm xuất phát, cách nhau bằng dấu `|` (VD: "lat,lng|lat,lng")
   * @param destinations - Danh sách điểm đến, cách nhau bằng dấu `|`
   * @param vehicle - Phương tiện (car, bike, truck, hd)
   */
  async distanceMatrix(
    origins: string,
    destinations: string,
    vehicle: GoongVehicleType = 'car'
  ): Promise<GoongMatrixResult | null> {
    if (!origins || !destinations) return null;

    const cacheKey = `matrix:v2:${origins}:${destinations}:${vehicle}`;
    const cached = goongCache.get<GoongMatrixResult>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.getFromGoong<GoongMatrixResult>('/v2/distancematrix', {
          origins,
          destinations,
          vehicle,
      });

      if (response?.rows) {
        goongCache.set(cacheKey, response, 30);
        return response;
      }
      return null;
    } catch (error) {
      console.error('Goong Distance Matrix error:', error);
      throw new Error('Không thể tính toán khoảng cách lộ trình');
    }
  }

  /**
   * Lấy thông tin chi tiết về địa điểm từ place_id
   * @param placeId - ID của địa điểm
   */
  async getPlaceDetail(placeId: string, version: GoongApiVersion = 'v2', sessionToken?: string): Promise<any> {
    if (!placeId) {
      return null;
    }

    const cacheKey = `place-detail:${version}:${sessionToken ?? 'no-session'}:${placeId}`;
    const cached = goongCache.get<any>(cacheKey);
    if (cached) return cached;

    try {
      const endpoint = version === 'v2' ? '/v2/place/detail' : '/place/detail';
      const response = await this.getFromGoong<{ result?: any }>(endpoint, {
          place_id: placeId,
          ...(sessionToken && { sessiontoken: sessionToken }),
      });

      const result = response.result;
      if (result) {
        // TTL 600s — thông tin địa điểm (tên, tọa độ, địa chỉ) rất ổn định
        goongCache.set(cacheKey, result, 600);
      }
      return result;
    } catch (error) {
      console.error('Goong Place Detail error:', error);
      throw new Error('Không thể lấy thông tin chi tiết địa điểm');
    }
  }

  async optimizeTrip(origin: string | undefined, waypoints: string | undefined, destination: string | undefined, vehicle: GoongVehicleType = 'car', roundtrip = false): Promise<GoongOptimizedTripResult | null> {
    const cacheKey = `trip:v2:${origin ?? ''}:${waypoints ?? ''}:${destination ?? ''}:${vehicle}:${roundtrip}`;
    const cached = goongCache.get<GoongOptimizedTripResult>(cacheKey);
    if (cached) return cached;
    const result = await this.getFromGoong<GoongOptimizedTripResult>('/v2/trip', {
      ...(origin && { origin }), ...(waypoints && { waypoints }), ...(destination && { destination }), vehicle, roundtrip,
    }, 15000);
    if (result?.code === 'Ok') goongCache.set(cacheKey, result, 60);
    return result?.code === 'Ok' ? result : null;
  }

  async staticMap(options: GoongStaticMapOptions): Promise<Buffer> {
    const cacheKey = `static-map:${JSON.stringify(options)}`;
    const cached = goongCache.get<Buffer>(cacheKey);
    if (cached) return cached;
    const image = await this.getFromGoong<Buffer>('/staticmap/route', options as unknown as Record<string, unknown>, 15000, 'arraybuffer');
    goongCache.set(cacheKey, image, 3600);
    return image;
  }

  async geolocate(payload: GoongGeolocationRequest): Promise<GoongGeolocationResult> {
    if (!goongConfig.geolocationEnabled) throw new Error('GOONG_GEOLOCATION_DISABLED');
    const response = await axios.post(`${this.baseUrl}/v2/geolocation/geolocate`, payload, {
      params: { api_key: this.apiKey }, timeout: 10000,
    });
    return response.data as GoongGeolocationResult;
  }
}

export default new GoongService();
