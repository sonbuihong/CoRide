import axios from 'axios';
import goongConfig from '../../config/goong.config';

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

class GoongService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = goongConfig.baseUrl;
  }

  // Đọc API key lazy qua getter — tránh cache giá trị rỗng
  // vì constructor chạy TRƯỚC dotenv.config() (do thứ tự import trong app.ts)
  private get apiKey(): string {
    return goongConfig.restApiKey;
  }

  /**
   * Autocomplete V1 — gợi ý địa điểm từ chuỗi tìm kiếm
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
    more_compound: boolean = true
  ): Promise<AutocompleteResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/place/autocomplete`, {
        params: {
          api_key: this.apiKey,
          input: query,
          limit,
          more_compound,
          ...(location && { location }),
          ...(radius && { radius }),
        },
      });

      return response.data.predictions || [];
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

    try {
      const response = await axios.get(`${this.baseUrl}/geocode`, {
        params: {
          api_key: this.apiKey,
          address,
        },
      });

      if (response.data.results && response.data.results.length > 0) {
        return response.data.results[0];
      }
      return null;
    } catch (error) {
      console.error('Goong Geocode error:', error);
      throw new Error('Không thể tìm thấy tọa độ cho địa chỉ này');
    }
  }

  /**
   * Reverse Geocoding - Chuyển tọa độ thành địa chỉ
   * Trả đầy đủ dữ liệu (name, address, compound, place_id, geometry)
   * để frontend ghép địa chỉ chi tiết ngay mà không cần gọi thêm Place Detail
   * @param lat - Vĩ độ
   * @param lng - Kinh độ
   */
  async reverseGeocode(lat: number, lng: number): Promise<any | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode`, {
        params: {
          api_key: this.apiKey,
          latlng: `${lat},${lng}`,
        },
      });

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
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
    vehicle: string = 'car'
  ): Promise<DirectionsResult | null> {
    if (!origin || !destination) {
      return null;
    }

    try {
      // Gọi Goong Directions API V2
      const response = await axios.get(`${this.baseUrl}/v2/direction`, {
        params: {
          api_key: this.apiKey,
          origin,
          destination,
          vehicle,
          // Chỉ lấy 1 tuyến đường tối ưu nhất — giảm payload, tăng tốc response
          alternatives: false,
        },
        timeout: 10000,
      });

      if (response.data.routes && response.data.routes.length > 0) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Goong Directions V2 error:', error);
      throw new Error('Không thể tính toán lộ trình');
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

    try {
      const response = await axios.get(`${this.baseUrl}/v2/geocode`, {
        params: {
          api_key: this.apiKey,
          address,
          // Luôn bật để frontend có thể hiển thị địa chỉ cũ so sánh
          has_deprecated_administrative_unit: true,
        },
      });

      if (response.data.results && response.data.results.length > 0) {
        return response.data.results as GeocodeV2Result[];
      }
      return null;
    } catch (error) {
      console.error('Goong Geocode V2 error:', error);
      throw new Error('Không thể tìm thấy địa chỉ mới cho địa chỉ này');
    }
  }

  /**
   * Lấy thông tin chi tiết về địa điểm từ place_id
   * @param placeId - ID của địa điểm
   */
  async getPlaceDetail(placeId: string): Promise<any> {
    if (!placeId) {
      return null;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/place/detail`, {
        params: {
          api_key: this.apiKey,
          place_id: placeId,
        },
      });

      return response.data.result;
    } catch (error) {
      console.error('Goong Place Detail error:', error);
      throw new Error('Không thể lấy thông tin chi tiết địa điểm');
    }
  }
}

export default new GoongService();
