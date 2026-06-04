'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { searchRideSchema, SearchRideInput } from '@repo/shared';
import { MapPin, Calendar, Search, Navigation, Loader2 } from 'lucide-react';
import GoongAutocomplete from '../goong/goong-autocomplete';
import { reverseGeocodeDetailed, cleanAddressText, buildFullAddressFromDetail } from '@/lib/goong';

// ==========================================
// THIẾT KẾ APPLE: Utilities CSS
// ==========================================
const appleInputWrapperClass = 
  "flex-1 relative group";

const appleLabelClass = 
  "absolute left-4 top-2 text-[10px] font-semibold uppercase tracking-wider text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] z-10 flex items-center gap-1.5";

const appleInputClass = 
  "w-full h-[60px] pl-4 pr-4 pt-5 pb-1 rounded-[14px] bg-[#fafafc] border-[2px] border-[rgba(0,0,0,0.04)] text-[17px] font-medium text-[#1d1d1f] transition-all hover:bg-[rgba(0,0,0,0.02)] focus:bg-white focus:border-[rgba(0,0,0,0.08)] focus:outline focus:outline-[2px] focus:outline-[#0071e3] focus:outline-offset-1 dark:bg-[rgba(255,255,255,0.05)] dark:border-[rgba(255,255,255,0.05)] dark:text-white dark:focus:bg-[rgba(255,255,255,0.08)]";

const appleSubmitButtonClass = 
  "h-[60px] px-8 rounded-[14px] bg-[#0071e3] text-white text-[17px] font-medium tracking-tight transition-all hover:bg-[#0077ED] active:scale-95 flex items-center justify-center shrink-0 w-full md:w-auto shadow-[0_4px_14px_rgba(0,113,227,0.4)]";

interface SearchFormProps {
  onSearch: (filters: SearchRideInput) => void;
  initialValues?: SearchRideInput;
}

export function SearchForm({ onSearch, initialValues }: SearchFormProps) {
  const [isLocating, setIsLocating] = useState(false);
  // Dùng key để force re-render GoongAutocomplete khi cần set giá trị từ GPS
  const [originKey, setOriginKey] = useState(0);
  const [originDefaultValue, setOriginDefaultValue] = useState(initialValues?.origin || '');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SearchRideInput>({
    resolver: zodResolver(searchRideSchema),
    defaultValues: initialValues || {
      origin: '',
      destination: '',
      date: '',
    },
  });

  const onSubmit = (data: SearchRideInput) => {
    onSearch(data);
  };

  const handleOriginSelect = (address: string) => {
    setValue('origin', address);
  };

  const handleDestSelect = (address: string) => {
    setValue('destination', address);
  };

  /**
   * GPS → reverseGeocodeDetailed → ghép name + address ngay lập tức
   * Goong reverse geocode đã trả đầy đủ (name, address, compound, geometry)
   * → Chỉ cần 1 API call thay vì 3 (reverse + autocomplete + Place Detail)
   */
  const resolveGpsToAddress = async (lat: number, lng: number): Promise<string | null> => {
    const result = await reverseGeocodeDetailed(lat, lng);
    if (!result) return null;

    // Ghép name + address giống buildFullAddressFromDetail
    // VD: name="Circle K", address="91 Trung Kính, Trung Hòa, Cầu Giấy, Hà Nội"
    // → "Circle K, 91 Trung Kính, Trung Hòa, Cầu Giấy, Hà Nội"
    const fullAddress = buildFullAddressFromDetail({
      name: result.name,
      formatted_address: result.address,
    });

    return fullAddress || cleanAddressText(result.address);
  };

  /**
   * Auto-fill GPS khi mount — chỉ chạy khi ô "Điểm đi" đang trống
   * Nếu user đã có origin từ URL params thì không ghi đè
   */
  useEffect(() => {
    if (initialValues?.origin) return; // Đã có giá trị, bỏ qua
    if (!navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const address = await resolveGpsToAddress(coords.latitude, coords.longitude);
          if (address) {
            setValue('origin', address);
            setOriginDefaultValue(address);
            setOriginKey((k) => k + 1);
          }
        } catch {
          // Lỗi silent — không alert, user tự nhập nếu muốn
          console.warn('[SearchForm] Không lấy được địa chỉ từ GPS');
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        // Từ chối quyền hoặc lỗi GPS — silent fail
        setIsLocating(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy 1 lần khi mount

  /**
   * Lấy vị trí GPS → autocomplete → điền địa chỉ chi tiết vào ô "Điểm đi"
   * Chỉ được gọi khi user bấm nút (manual trigger)
   */
  const handleAutoFillOrigin = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ định vị GPS.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const address = await resolveGpsToAddress(coords.latitude, coords.longitude);
          if (address) {
            setValue('origin', address);
            setOriginDefaultValue(address);
            setOriginKey((k) => k + 1);
          } else {
            alert('Không thể xác định địa chỉ từ vị trí hiện tại.');
          }
        } catch {
          alert('Đã xảy ra lỗi khi lấy địa chỉ. Vui lòng thử lại.');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.error('[SearchForm] GPS error:', err);
        if (err.code === err.PERMISSION_DENIED) {
          alert('Bạn đã từ chối quyền truy cập vị trí. Hãy cấp quyền trong cài đặt trình duyệt.');
        } else {
          alert('Không thể lấy vị trí. Vui lòng thử lại.');
        }
        setIsLocating(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="w-full relative">
      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="flex flex-col md:flex-row gap-3 p-3 bg-white dark:bg-[#1d1d1f] rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)]"
      >
        
        {/* Origin — có nút GPS auto-fill */}
        <div className={appleInputWrapperClass}>
          <label htmlFor="origin" className={appleLabelClass}>
            <MapPin className="h-2.5 w-2.5" /> Điểm đi
            {/* Nút nhỏ lấy vị trí hiện tại — nằm cùng hàng với label */}
            <button
              type="button"
              onClick={handleAutoFillOrigin}
              disabled={isLocating}
              title="Dùng vị trí hiện tại"
              className="flex items-center gap-0.5 text-[#0071e3] hover:text-[#0077ed] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-1"
            >
              {isLocating ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <Navigation className="h-2.5 w-2.5" />
              )}
              <span className="text-[9px] font-semibold uppercase tracking-wider">
                {isLocating ? 'Đang lấy...' : 'Vị trí của tôi'}
              </span>
            </button>
          </label>
          <GoongAutocomplete
            key={originKey}
            placeholder="Bạn muốn đi từ đâu?"
            defaultValue={originDefaultValue}
            onSelect={handleOriginSelect}
            className="w-full"
          />
        </div>

        {/* Destination */}
        <div className={appleInputWrapperClass}>
          <label htmlFor="destination" className={appleLabelClass}>
            <MapPin className="h-2.5 w-2.5" /> Điểm đến
          </label>
          <GoongAutocomplete
            placeholder="Bạn muốn đi đến đâu?"
            defaultValue={initialValues?.destination}
            onSelect={handleDestSelect}
            className="w-full"
          />
        </div>

        {/* Date */}
        <div className={appleInputWrapperClass}>
          <label htmlFor="date" className={appleLabelClass}>
            <Calendar className="h-2.5 w-2.5" /> Ngày đi
          </label>
          <input
            id="date"
            type="date"
            className={appleInputClass}
            {...register('date')}
          />
        </div>

        {/* Submit */}
        <button type="submit" className={appleSubmitButtonClass}>
          <Search className="mr-2 h-5 w-5" />
          Tìm kiếm
        </button>
      </form>

      {(errors.origin || errors.destination || errors.date) && (
        <p className="absolute -bottom-6 left-4 text-[12px] text-[#d93025] font-medium tracking-tight">
          Vui lòng kiểm tra lại thông tin tìm kiếm.
        </p>
      )}
    </div>
  );
}
