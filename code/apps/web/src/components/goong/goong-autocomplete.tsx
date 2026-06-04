'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { autocompleteAddress, geocodeAddress, cleanAddressText, getPlaceDetail, buildFullAddressFromDetail } from '@/lib/goong';
import useDebounce from '@/lib/hooks/use-debounce';

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
  onSelect?: (address: string, coordinates: { lat: number; lng: number }) => void;
  className?: string;
  defaultValue?: string;
}

const GoongAutocomplete: React.FC<GoongAutocompleteProps> = ({
  placeholder = 'Nhập địa điểm...',
  onSelect,
  className = '',
  defaultValue = '',
}) => {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const results = await autocompleteAddress(debouncedQuery, { limit: 10, more_compound: true });
        setSuggestions(results);
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowSuggestions(true);
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
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
      const placeDetail = await getPlaceDetail(suggestion.place_id);
      if (placeDetail) {
        const fullAddress = buildFullAddressFromDetail(placeDetail) ?? fallbackAddress;
        setQuery(fullAddress); // Cập nhật input với địa chỉ đầy đủ

        if (placeDetail.geometry?.location && onSelect) {
          onSelect(fullAddress, {
            lat: placeDetail.geometry.location.lat,
            lng: placeDetail.geometry.location.lng,
          });
        } else if (onSelect) {
          onSelect(fullAddress, { lat: 0, lng: 0 });
        }
      } else {
        // Fallback: dùng geocodeAddress nếu Place Detail thất bại
        const geocodeResult = await geocodeAddress(fallbackAddress);
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
        const geocodeResult = await geocodeAddress(fallbackAddress);
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
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const appleInputClass = 
    "h-[60px] rounded-[14px] bg-[#fafafc] border-[2px] border-[rgba(0,0,0,0.04)] pl-4 pr-20 pt-5 pb-1 text-[17px] text-[#1d1d1f] transition-all hover:bg-[rgba(0,0,0,0.02)] focus:bg-white focus:border-[rgba(0,0,0,0.08)] focus:outline focus:outline-[2px] focus:outline-[#0071e3] focus:outline-offset-1 dark:bg-[rgba(255,255,255,0.05)] dark:border-[rgba(255,255,255,0.05)] dark:text-white dark:focus:bg-[rgba(255,255,255,0.08)]";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className={`w-full ${appleInputClass}`}
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

      {showSuggestions && (query.length >= 2 || loading) && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1d1d1f] rounded-[8px] shadow-[rgba(0,0,0,0.22)_3px_5px_30px_0px] border border-[rgba(0,0,0,0.04)] max-h-[500px] overflow-y-auto">
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
                className={`px-4 py-3 text-left flex items-start gap-3 transition-colors ${
                  index === selectedIndex
                    ? 'bg-[#0071e3] text-white'
                    : 'hover:bg-[#f5f5f7] dark:hover:bg-[rgba(255,255,255,0.05)]'
                }`}
                style={{ width: '100%' }}
              >
                <MapPin size={18} className="mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-[15px] font-medium whitespace-normal" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                    {cleanAddressText(suggestion.structured_formatting?.main_text || suggestion.description)}
                  </div>
                  {suggestion.structured_formatting?.secondary_text && (
                    <div className="text-[13px] text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] whitespace-normal" style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
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
      )}
    </div>
  );
};

export default GoongAutocomplete;
