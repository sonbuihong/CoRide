/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  autocompleteAddress,
  reverseGeocodeDetailed,
  geocodeAddressV2,
  cleanAddressText,
  AutocompleteResult,
  GeocodeV2Result,
  getPlaceDetail,
  buildFullAddressFromDetail,
} from '@/lib/goong';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressAutocompleteProps {
  onAddressSelect: (address: string, lat?: number, lng?: number, structured?: any) => void;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
  inputClassName?: string;
  detailLevel?: 'FULL' | 'WARD' | 'DISTRICT';
}

// State V2 cho từng item gợi ý — fetch riêng khi user bấm "Xem địa chỉ mới"
type V2ItemStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface V2ItemState {
  status: V2ItemStatus;
  isExpanded: boolean;
  result: GeocodeV2Result | null;
}

// ─────────────────────────────────────────────
// SuggestionItem: mỗi dòng gợi ý trong dropdown
// Quản lý state V2 độc lập để không ảnh hưởng item khác
// ─────────────────────────────────────────────
interface SuggestionItemProps {
  result: AutocompleteResult;
  onSelect: (result: AutocompleteResult) => void;
}

const SuggestionItem: React.FC<SuggestionItemProps> = ({ result, onSelect }) => {
  const [v2, setV2] = useState<V2ItemState>({
    status: 'idle',
    isExpanded: false,
    result: null,
  });

  const mainText = cleanAddressText(
    result.structured_formatting?.main_text || result.description
  );
  const secondaryText = result.structured_formatting?.secondary_text
    ? cleanAddressText(result.structured_formatting.secondary_text)
    : undefined;

  const handleToggleNewAddress = async (e: React.MouseEvent) => {
    // Không trigger onSelect khi bấm nút toggle
    e.stopPropagation();

    // Nếu đã có kết quả V2 → chỉ toggle hiển thị
    if (v2.result) {
      setV2((prev) => ({ ...prev, isExpanded: !prev.isExpanded }));
      return;
    }

    // Lần đầu bấm → fetch V2
    setV2({ status: 'loading', isExpanded: true, result: null });
    try {
      const v2Results = await geocodeAddressV2(result.description);
      if (v2Results && v2Results.length > 0) {
        setV2({ status: 'loaded', isExpanded: true, result: v2Results[0] });
      } else {
        setV2({ status: 'error', isExpanded: false, result: null });
      }
    } catch {
      setV2({ status: 'error', isExpanded: false, result: null });
    }
  };

  return (
    <li
      onMouseDown={(e) => e.preventDefault()} // Giữ focus vào input
      className="px-4 pt-2.5 pb-2 border-b border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)] last:border-0 cursor-pointer"
    >
      {/* Phần body chính — click để chọn địa chỉ */}
      <div
        onClick={() => onSelect(result)}
        className="hover:bg-[rgba(0,0,0,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] -mx-1 px-1 rounded-[6px] transition-colors"
      >
        {/* Tên địa điểm (bold) */}
        <div className="text-[14px] font-semibold text-[#1d1d1f] dark:text-white leading-snug">
          {mainText}
        </div>
        {/* Địa chỉ cũ V1 (secondary) */}
        {secondaryText && (
          <div className="text-[12px] text-[rgba(0,0,0,0.5)] dark:text-[rgba(255,255,255,0.45)] leading-snug mt-0.5">
            {secondaryText}
          </div>
        )}

        {/* Địa chỉ mới (V2) — chỉ hiện khi expanded */}
        {v2.isExpanded && v2.status === 'loaded' && v2.result && (
          <div className="text-[12px] text-[rgba(0,0,0,0.45)] dark:text-[rgba(255,255,255,0.4)] leading-snug mt-0.5">
            {v2.result.formatted_address}
          </div>
        )}
      </div>

      {/* Nút toggle "Xem địa chỉ mới / Thu gọn" */}
      {v2.status !== 'error' && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleToggleNewAddress}
          disabled={v2.status === 'loading'}
          className="mt-1 flex items-center gap-1 text-[12px] text-[#0071e3] hover:text-[#0077ed] transition-colors disabled:opacity-50"
        >
          {v2.status === 'loading' ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Đang tải...</span>
            </>
          ) : v2.isExpanded && v2.result ? (
            // Ký tự ^ thay cho icon để không dùng lucide
            <span>Thu gọn ^</span>
          ) : (
            <span>Xem địa chỉ mới v</span>
          )}
        </button>
      )}
    </li>
  );
};

// ─────────────────────────────────────────────
// AddressAutocomplete: component chính
// ─────────────────────────────────────────────
export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onAddressSelect,
  placeholder = 'Nhập địa chỉ...',
  defaultValue = '',
  className,
  inputClassName,
  detailLevel = 'FULL',
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const results = await autocompleteAddress(query, { limit: 10, more_compound: true });
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (err) {
      console.error('[AddressAutocomplete] Lỗi tìm địa chỉ:', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onAddressSelect(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 400);
  };

  const handleSelect = async (result: AutocompleteResult) => {
    // Hiển thị tạm description từ autocomplete trong khi chờ Place Detail
    const fallbackAddress = cleanAddressText(result.description);
    setInputValue(fallbackAddress);
    setSuggestions([]);
    setShowSuggestions(false);

    try {
      // Place Detail trả về name (số nhà + đường) và formatted_address (phường/quận/tỉnh)
      // Ghép lại để có địa chỉ đầy đủ có số nhà — thông tin mà Autocomplete không cung cấp
      const placeDetail = await getPlaceDetail(result.place_id);
      if (placeDetail) {
        const fullAddress = buildFullAddressFromDetail(placeDetail) ?? fallbackAddress;
        setInputValue(fullAddress); // Cập nhật input với địa chỉ đầy đủ

        if (placeDetail.geometry?.location) {
          const { lat, lng } = placeDetail.geometry.location;
          onAddressSelect(fullAddress, lat, lng, placeDetail);
        } else {
          onAddressSelect(fullAddress);
        }
      } else {
        onAddressSelect(fallbackAddress);
      }
    } catch (error) {
      console.error('[AddressAutocomplete] Lỗi lấy chi tiết địa điểm:', error);
      onAddressSelect(fallbackAddress);
    }
  };

  /**
   * GPS → reverseGeocodeDetailed → ghép name + address ngay lập tức
   * Goong reverse geocode đã trả đầy đủ: name (tên địa điểm), address (số nhà + đường),
   * compound (địa giới), place_id, geometry
   * → Chỉ cần 1 API call thay vì 3 calls (reverse + autocomplete + Place Detail)
   */
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị.');
      return;
    }
    setIsLoadingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        try {
          const result = await reverseGeocodeDetailed(lat, lng);
          if (!result) {
            const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            setInputValue(fallback);
            onAddressSelect(fallback, lat, lng);
            return;
          }

          // Ghép name + address giống buildFullAddressFromDetail
          // VD: name="Hertz Car Rental", address="3 5 Nguyen Van Linh, Kim Ma, Hà Nội"
          // → "Hertz Car Rental, 3 5 Nguyen Van Linh, Kim Ma, Hà Nội"
          const fullAddress = buildFullAddressFromDetail({
            name: result.name,
            formatted_address: result.address,
          }) || cleanAddressText(result.address);

          const finalLat = result.geometry?.location?.lat ?? lat;
          const finalLng = result.geometry?.location?.lng ?? lng;

          setInputValue(fullAddress);
          onAddressSelect(fullAddress, finalLat, finalLng, {
            name: result.name,
            formatted_address: result.address,
            place_id: result.place_id,
            compound: result.compound,
            geometry: result.geometry,
          });
        } catch {
          const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setInputValue(fallback);
          onAddressSelect(fallback, lat, lng);
        } finally {
          setIsLoadingGPS(false);
        }
      },
      (err) => {
        console.error('[AddressAutocomplete] Lỗi định vị:', err);
        alert('Không thể lấy vị trí hiện tại.');
        setIsLoadingGPS(false);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder={placeholder}
            className={cn(
              'h-[52px] w-full rounded-[11px] bg-[#fafafc] border-[3px] border-[rgba(0,0,0,0.04)] px-4 pr-10 text-[17px] text-[#1d1d1f] transition-all hover:border-[rgba(0,0,0,0.08)] focus:outline-[2px] focus:outline-[#0071e3] focus:outline-offset-1 focus:outline dark:bg-[rgba(255,255,255,0.05)] dark:text-white dark:border-[rgba(255,255,255,0.05)]',
              inputClassName
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isLoading
              ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              : <MapPin className="h-4 w-4 text-gray-400" />
            }
          </div>
        </div>

        {/* Nút lấy vị trí hiện tại */}
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLoadingGPS}
          title="Lấy vị trí hiện tại"
          className="h-[52px] w-[52px] shrink-0 rounded-[11px] bg-[#fafafc] border-[3px] border-[rgba(0,0,0,0.04)] flex items-center justify-center hover:border-[rgba(0,0,0,0.12)] transition-colors dark:bg-[rgba(255,255,255,0.05)] dark:border-[rgba(255,255,255,0.05)]"
        >
          <Navigation className={cn('h-4 w-4 text-[#0071e3]', isLoadingGPS && 'animate-pulse')} />
        </button>
      </div>

      {/* Dropdown gợi ý địa chỉ */}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1.5 w-full bg-white/95 dark:bg-[#1d1d1f]/95 backdrop-blur-md border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] max-h-[360px] overflow-y-auto">
          {suggestions.map((result) => (
            <SuggestionItem
              key={result.place_id}
              result={result}
              onSelect={handleSelect}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
