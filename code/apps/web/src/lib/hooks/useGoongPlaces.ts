// Custom hook cho Goong Autocomplete và Place Detail
// Đóng gói logic debounce + fetch predictions + lấy chi tiết địa điểm
// để các component chỉ cần gọi hook thay vì tự quản lý state

import { useState, useEffect, useCallback } from 'react';
import type { GoongAutocompletePrediction, GoongPlaceDetailResult } from '@repo/shared';
import { autocompleteAddress, getPlaceDetail, buildFullAddressFromDetail } from '../goong';

interface AutocompleteOptions {
  location?: string;
  limit?: number;
  radius?: number;
}

/**
 * Hook autocomplete địa điểm với debounce 300ms
 * Gọi qua backend proxy để không lộ API key
 */
export const useAutocomplete = (input: string, options?: AutocompleteOptions) => {
  const [predictions, setPredictions] = useState<GoongAutocompletePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPredictions = useCallback(async () => {
    if (!input || input.trim().length < 2) {
      setPredictions([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Tái sử dụng hàm autocompleteAddress đã có sẵn trong lib/goong.ts
      // Hàm này đã xử lý fallback sang Nominatim khi Goong fail
      const results = await autocompleteAddress(input, {
        limit: options?.limit,
        location: options?.location,
        radius: options?.radius,
      });
      // Map kết quả về đúng kiểu GoongAutocompletePrediction
      setPredictions(results as unknown as GoongAutocompletePrediction[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tìm kiếm địa điểm';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [input, options?.limit, options?.location, options?.radius]);

  useEffect(() => {
    // Debounce 300ms — tránh gọi API quá nhiều khi user đang gõ
    const handler = setTimeout(() => {
      fetchPredictions();
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [fetchPredictions]);

  return { predictions, loading, error };
};

/**
 * Lấy chi tiết địa điểm từ place_id
 * Trả về kết quả đã enriched với full address (có số nhà)
 * thông qua hàm buildFullAddressFromDetail
 */
export const getPlaceDetailClient = async (placeId: string): Promise<GoongPlaceDetailResult | null> => {
  try {
    const detail = await getPlaceDetail(placeId);
    if (!detail) return null;

    // Enrich formatted_address bằng cách ghép name (số nhà + đường)
    // với formatted_address (phường/quận/tỉnh) — giải quyết vấn đề autocomplete thiếu số nhà
    const fullAddress = buildFullAddressFromDetail(detail);

    return {
      place_id: detail.place_id || placeId,
      name: detail.name || '',
      formatted_address: fullAddress || detail.formatted_address || '',
      geometry: detail.geometry || { location: { lat: 0, lng: 0 } },
    };
  } catch (err) {
    console.error('[getPlaceDetailClient] Lỗi:', err);
    return null;
  }
};
