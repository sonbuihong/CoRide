// Mobile service cho Goong Autocomplete và Place Detail
// Gọi qua backend API proxy — không gọi Goong trực tiếp để bảo vệ API key
// Lưu ý: URL phải trỏ đến IP thực (hoặc domain) của backend, không dùng localhost
// vì emulator/device không resolve localhost giống máy phát triển

import type { GoongAutocompletePrediction, GoongPlaceDetailResult } from '../../../../packages/shared/src/goong';

// Expo hỗ trợ process.env qua app.config hoặc .env + expo-constants
// Với emulator Android: 10.0.2.2 thay cho localhost
// Với device thật: dùng IP LAN của máy phát triển
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5001/api';

interface AutocompleteOptions {
  location?: string;
  limit?: number;
  radius?: number;
  more_compound?: boolean;
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

  try {
    const params = new URLSearchParams({
      query: input,
      // more_compound mặc định true — trả thêm quận/xã/tỉnh tách sẵn
      more_compound: options?.more_compound !== false ? 'true' : 'false',
      ...(options?.location && { location: options.location }),
      ...(options?.limit && { limit: String(options.limit) }),
      ...(options?.radius && { radius: String(options.radius) }),
    }).toString();

    const response = await fetch(`${API_BASE_URL}/goong/autocomplete?${params}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Không thể tìm kiếm địa điểm`);
    }

    const data: GoongAutocompletePrediction[] = await response.json();
    return data;
  } catch (err) {
    console.error('[Mobile] Goong Autocomplete error:', err);
    return [];
  }
};

/**
 * Lấy chi tiết địa điểm từ place_id (proxy qua backend)
 * Trả null khi lỗi — caller cần handle trường hợp null
 */
export const getPlaceDetailMobile = async (placeId: string): Promise<GoongPlaceDetailResult | null> => {
  if (!placeId) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/goong/place-detail?place_id=${encodeURIComponent(placeId)}`, {
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
