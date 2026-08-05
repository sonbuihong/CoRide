'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { searchRideSchema, SearchRideInput } from '@repo/shared';
import { MapPin, Calendar, Search, Navigation, Loader2 } from 'lucide-react';
import GoongAutocomplete from '../goong/goong-autocomplete';
import { reverseGeocodeDetailed, cleanAddressText, buildFullAddressFromDetail } from '@/lib/goong';

// ==========================================
// THIẾT KẾ MỚI TỪ HÌNH ẢNH (WIDGET DỌC)
// ==========================================
const inputWrapperClass = 
  "flex-1 relative group w-full bg-[#f7f7f9] dark:bg-[rgba(255,255,255,0.05)] rounded-2xl border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)] transition-all hover:bg-[rgba(0,0,0,0.02)] focus-within:bg-white dark:focus-within:bg-[rgba(255,255,255,0.08)] focus-within:border-[rgba(0,0,0,0.08)] focus-within:ring-2 focus-within:ring-[#0071e3] focus-within:ring-offset-1";

const labelContainerClass = 
  "absolute left-4 top-3 flex items-center gap-1.5 z-10 w-[calc(100%-48px)]";

const labelTextClass = 
  "text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5";

const inputClass = 
  "w-full h-[64px] pl-4 pr-12 pt-7 pb-2 bg-transparent text-[16px] font-medium text-[#1d1d1f] dark:text-white placeholder:text-gray-400 focus:outline-none appearance-none";

const submitButtonClass = 
  "w-full h-[54px] rounded-xl bg-[#0071e3] text-white text-[16px] font-semibold tracking-tight transition-all hover:bg-[#0077ED] active:scale-[0.98] flex items-center justify-center mt-1";

interface SearchFormProps {
  onSearch: (filters: SearchRideInput) => void;
  initialValues?: SearchRideInput;
}

export function SearchForm({ onSearch, initialValues }: SearchFormProps) {
  const [isLocating, setIsLocating] = useState(false);

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

  const resolveGpsToAddress = async (lat: number, lng: number): Promise<string | null> => {
    const result = await reverseGeocodeDetailed(lat, lng);
    if (!result) return null;

    const fullAddress = buildFullAddressFromDetail({
      name: result.name,
      formatted_address: result.address,
    });

    return fullAddress || cleanAddressText(result.address);
  };

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
        className="flex flex-col gap-3 p-4 bg-white dark:bg-[#1d1d1f] rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)] w-full max-w-[400px] mx-auto md:mx-0"
      >
        
        {/* Origin */}
        <div className={inputWrapperClass}>
          <div className={labelContainerClass}>
            <MapPin className="h-3 w-3 text-gray-400" />
            <span className={labelTextClass}>Điểm đi</span>
            {/* Auto-fill button */}
            <button
              type="button"
              onClick={handleAutoFillOrigin}
              disabled={isLocating}
              title="Dùng vị trí hiện tại"
              className="flex items-center gap-1 text-[#0071e3] hover:text-[#0077ed] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2"
            >
              {isLocating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Navigation className="h-3 w-3" />
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {isLocating ? 'Đang lấy...' : 'Vị trí của tôi'}
              </span>
            </button>
          </div>
          
          <div className="relative">
            <GoongAutocomplete
              placeholder="Sử dụng vị trí hiện tại"
              defaultValue={initialValues?.origin || ''}
              onSelect={handleOriginSelect}
              className={inputClass}
            />
            <div className="absolute right-4 top-[22px] pointer-events-none">
               <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Destination */}
        <div className={inputWrapperClass}>
          <div className={labelContainerClass}>
            <MapPin className="h-3 w-3 text-gray-400" />
            <span className={labelTextClass}>Điểm đến</span>
          </div>
          <div className="relative">
            <GoongAutocomplete
              placeholder="Bạn muốn đi đâu"
              defaultValue={initialValues?.destination}
              onSelect={handleDestSelect}
              className={inputClass}
            />
            <div className="absolute right-4 top-[22px] pointer-events-none">
               <Search className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Date */}
        <div className={inputWrapperClass}>
          <div className={labelContainerClass}>
            <Calendar className="h-3 w-3 text-gray-400" />
            <span className={labelTextClass}>Ngày đi</span>
          </div>
          <div className="relative">
            <input
              id="date"
              type="date"
              className={inputClass}
              {...register('date')}
            />
            {/* Native date inputs have their own calendar icon on some browsers, so we might not need an absolute icon here, but keeping it to match design if standard input is overridden */}
          </div>
        </div>

        {/* Submit */}
        <button type="submit" className={submitButtonClass}>
          <Search className="mr-2 h-5 w-5" strokeWidth={2.5} />
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
