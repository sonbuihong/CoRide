'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, MapPin } from 'lucide-react';
import { autocompleteAddress, createGoongSessionToken, geocodeAddress, cleanAddressText, getPlaceDetail, buildFullAddressFromDetail } from '@/lib/goong';
import type { GoongApiVersion } from '@/lib/goong';
import useDebounce from '@/lib/hooks/use-debounce';
import { goongClientCache } from '@/lib/goong-client-cache';

interface AutocompleteResult {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface GoongAutocompleteProps {
  placeholder?: string;
  inputId?: string;
  onSelect?: (address: string, coordinates: { lat: number; lng: number }) => void;
  onClear?: () => void;
  onFocus?: (value: string) => void;
  onBlur?: (value: string) => void;
  onQueryChange?: (value: string) => void;
  className?: string;
  inputClassName?: string;
  variant?: 'default' | 'bare';
  defaultValue?: string;
  debounceMs?: number;
  suggestionsPlacement?: 'inline' | 'right-pane';
  suggestionsPortalId?: string;
  suggestionsMobilePortalId?: string;
  onSuggestionsVisibilityChange?: (visible: boolean) => void;
  apiVersion?: GoongApiVersion;
  biasLocation?: { lat: number; lng: number };
}

const GoongAutocomplete: React.FC<GoongAutocompleteProps> = ({
  placeholder = 'Nhập địa điểm...',
  inputId,
  onSelect,
  onClear,
  onFocus,
  onBlur,
  onQueryChange,
  className = '',
  inputClassName = '',
  variant = 'default',
  defaultValue = '',
  debounceMs = 300,
  suggestionsPlacement = 'inline',
  suggestionsPortalId,
  suggestionsMobilePortalId,
  onSuggestionsVisibilityChange,
  apiVersion = 'v2',
  biasLocation,
}) => {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  // Debounce 500ms — cân bằng giữa UX mượt mà và giảm số API call
  // WHY 500ms (thay vì 300ms cũ): ở tốc độ gõ bình thường (5-6 ký tự/giây)
  // mỗi ký tự cách nhau ~160ms → 500ms loại bỏ được 2-3 request trung gian
  const debouncedQuery = useDebounce(query, debounceMs);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionTokenRef = useRef(createGoongSessionToken());
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionsPanelRef = useRef<HTMLDivElement>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const isSuggestionsVisible = showSuggestions && (query.length >= 2 || loading);

  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    sessionTokenRef.current = createGoongSessionToken();
    goongClientCache.clear();
    setSuggestions([]);
  }, [apiVersion]);

  useEffect(() => {
    const targetId = isDesktop ? suggestionsPortalId : suggestionsMobilePortalId;
    setPortalTarget(targetId ? document.getElementById(targetId) : null);
  }, [isDesktop, suggestionsMobilePortalId, suggestionsPortalId]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateViewport = () => setIsDesktop(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    onSuggestionsVisibilityChange?.(isSuggestionsVisible);
  }, [isSuggestionsVisible, onSuggestionsVisibilityChange]);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchSuggestions = async () => {
      if (debouncedQuery.length < 2) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const results = await autocompleteAddress(debouncedQuery, {
          more_compound: true,
          version: apiVersion,
          sessionToken: sessionTokenRef.current,
          signal: controller.signal,
          location: biasLocation ? `${biasLocation.lat},${biasLocation.lng}` : undefined,
        });
        if (!cancelled) setSuggestions(results);
      } catch (error) {
        console.error('Autocomplete error:', error);
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSuggestions();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [apiVersion, biasLocation?.lat, biasLocation?.lng, debouncedQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !suggestionsPanelRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onQueryChange?.(e.target.value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    onClear?.();
    onQueryChange?.('');
    inputRef.current?.focus();
    sessionTokenRef.current = createGoongSessionToken();
  };

  const handleSelect = async (suggestion: AutocompleteResult) => {
    // Hiển thị tạm description trong khi chờ Place Detail trả về
    const fallbackAddress = cleanAddressText(suggestion.description);
    setQuery(fallbackAddress);
    setShowSuggestions(false);
    setSuggestions([]);

    try {
      // Ưu tiên dùng Place Detail: trả về name (số nhà) + formatted_address + tọa độ
      // Tốt hơn geocodeAddress vì không cần thêm 1 API call riêng cho tọa độ
      const placeDetail = await getPlaceDetail(suggestion.place_id, apiVersion, sessionTokenRef.current);
      if (placeDetail) {
        const fullAddress = buildFullAddressFromDetail(placeDetail) ?? fallbackAddress;
        setQuery(fullAddress); // Cập nhật input với địa chỉ đầy đủ

        const location = placeDetail.geometry?.location;
        const hasValidLocation =
          Number.isFinite(location?.lat) &&
          Number.isFinite(location?.lng) &&
          !(location?.lat === 0 && location?.lng === 0);

        if (hasValidLocation && onSelect) {
          onSelect(fullAddress, {
            lat: location.lat,
            lng: location.lng,
          });
        } else {
          // Không dùng (0, 0) làm tọa độ giả vì nó khiến Route-Aware tìm ở
          // Đại Tây Dương. Geocode lại địa chỉ; nếu vẫn lỗi, giữ text để form
          // có thể thử fallback thêm một lần khi submit.
          const geocodeResult = await geocodeAddress(fullAddress, apiVersion);
          if (geocodeResult?.geometry.location && onSelect) {
            onSelect(fullAddress, geocodeResult.geometry.location);
          } else {
            onQueryChange?.(fullAddress);
          }
        }
      } else {
        // Fallback: dùng geocodeAddress nếu Place Detail thất bại
        const geocodeResult = await geocodeAddress(fallbackAddress, apiVersion);
        if (geocodeResult && onSelect) {
          onSelect(fallbackAddress, {
            lat: geocodeResult.geometry.location.lat,
            lng: geocodeResult.geometry.location.lng,
          });
        }
      }
    } catch (error) {
      console.error('[GoongAutocomplete] Lỗi lấy chi tiết địa điểm:', error);
      // Cuối cùng fallback về geocode cũ
      try {
        const geocodeResult = await geocodeAddress(fallbackAddress, apiVersion);
        if (geocodeResult && onSelect) {
          onSelect(fallbackAddress, {
            lat: geocodeResult.geometry.location.lat,
            lng: geocodeResult.geometry.location.lng,
          });
        }
      } catch {
        console.error('[GoongAutocomplete] Cả geocode fallback cũng thất bại');
      }
    }
    sessionTokenRef.current = createGoongSessionToken();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (suggestions.length > 0) {
          handleSelect(suggestions[Math.max(0, selectedIndex)]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const appleInputClass = 
    "h-[52px] md:h-[60px] rounded-[12px] md:rounded-[14px] bg-[#fafafc] border-[2px] border-[rgba(0,0,0,0.04)] pl-3 md:pl-4 pr-16 md:pr-20 pt-4 md:pt-5 pb-1 text-[15px] md:text-[17px] text-[#1d1d1f] transition-all hover:bg-[rgba(0,0,0,0.02)] focus:bg-white focus:border-[rgba(0,0,0,0.08)] focus:outline focus:outline-[2px] focus:outline-[#0071e3] focus:outline-offset-1 dark:bg-[rgba(255,255,255,0.05)] dark:border-[rgba(255,255,255,0.05)] dark:text-white dark:focus:bg-[rgba(255,255,255,0.08)] text-ellipsis overflow-hidden whitespace-nowrap";
  const renderInRightPane = suggestionsPlacement === 'right-pane' && portalTarget !== null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setShowSuggestions(true);
            onFocus?.(query);
          }}
          onBlur={() => onBlur?.(query)}
          placeholder={placeholder}
          className={`w-full ${variant === 'default' ? appleInputClass : ''} ${inputClassName}`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-[rgba(0,0,0,0.48)] hover:text-[#1d1d1f] dark:text-[rgba(255,255,255,0.48)] dark:hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          )}
          <Search size={18} className="text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)]" />
        </div>
      </div>

      {isSuggestionsVisible && (() => {
        const panel = (
        <div ref={suggestionsPanelRef} className={renderInRightPane
          ? 'flex max-h-[calc(100vh-150px)] w-full max-w-4xl flex-col gap-2 overflow-y-auto md:gap-3'
          : 'absolute z-50 mt-2 max-h-[500px] w-full overflow-y-auto rounded-[8px] border border-[rgba(0,0,0,0.04)] bg-white shadow-[rgba(0,0,0,0.22)_3px_5px_30px_0px] dark:bg-[#1d1d1f]'}>
          {loading ? (
            <div className="p-4 text-center text-[14px] text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)]">
              Đang tìm kiếm...
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSelect(suggestion)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-all ${renderInRightPane ? 'min-h-[76px] items-center rounded-[20px] border border-gray-200 bg-white p-3 shadow-none hover:shadow-sm dark:border-gray-800 dark:bg-[#1c1c1e] md:min-h-[96px] md:gap-4 md:p-4' : ''} ${
                  index === selectedIndex
                    ? `bg-[#0071e3] text-white ${renderInRightPane ? 'border-[#0071e3] bg-[#eaf2f8] text-[#1d1d1f] dark:bg-blue-950/40 dark:text-white' : ''}`
                    : 'hover:bg-[#f5f5f7] dark:hover:bg-[rgba(255,255,255,0.05)]'
                }`}
              >
                <span className={renderInRightPane
                  ? 'flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#eef3f7] dark:bg-gray-800 md:h-16 md:w-16 md:rounded-[16px]'
                  : 'mt-0.5 flex shrink-0'}>
                  <span className={renderInRightPane
                    ? 'flex h-9 w-9 items-center justify-center rounded-xl border border-gray-100/50 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:border-gray-700 dark:bg-[#2c2c2e] md:h-10 md:w-10'
                    : ''}>
                    <MapPin size={18} className="flex-shrink-0 text-[#ff3b30]" />
                  </span>
                </span>
                <div className="flex-1">
                  <div className={`whitespace-normal text-[15px] font-medium ${renderInRightPane ? 'text-[16px] font-semibold leading-tight text-[#1d1d1f] dark:text-white' : ''}`} style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                    {cleanAddressText(suggestion.structured_formatting?.main_text || suggestion.description)}
                  </div>
                  {suggestion.structured_formatting?.secondary_text && (
                    <div className={`whitespace-normal text-[13px] text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] ${renderInRightPane ? 'mt-1 text-[14px] leading-snug text-gray-500 dark:text-gray-400' : ''}`} style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                      {cleanAddressText(suggestion.structured_formatting.secondary_text)}
                    </div>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-[14px] text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)]">
              Không tìm thấy kết quả
            </div>
          )}
        </div>
        );

        return renderInRightPane ? createPortal(panel, portalTarget!) : panel;
      })()}
    </div>
  );
};

export default GoongAutocomplete;
