'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { searchRideSchema, SearchRideInput } from '@repo/shared';
import { MapPin, Calendar, Search, Navigation, Loader2 } from 'lucide-react';
import GoongAutocomplete from '@/components/goong/goong-autocomplete';
import { reverseGeocodeDetailed, cleanAddressText, buildFullAddressFromDetail } from '@/lib/goong';

// ==========================================
// THIẾT KẾ APPLE: Utilities CSS
// ==========================================
const appleInputWrapperClass = 
  "flex-1 relative group";

const appleLabelClass = 
  "absolute left-4 top-2 text-[10px] font-semibold uppercase tracking-wider text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] z-10 flex items-center gap-1.5";

const appleInputClass = 
  "w-full h-[60px] pl-4 pr-4 pt-5 pb-1 rounded-[14px] bg-[#fafafc] border-[2px] border-[rgba(0,0,0,0.04)] text-[17px] font-medium text-[#1d1d1f] transition-all hover:bg-[rgba(0,0,0,0.02)] focus:bg-white focus:border-[rgba(0,0,0,0.08)] focus:outline focus:outline-[2px] focus:outline-[#7c3aed] focus:outline-offset-1 dark:bg-[rgba(255,255,255,0.05)] dark:border-[rgba(255,255,255,0.05)] dark:text-white dark:focus:bg-[rgba(255,255,255,0.08)]";

const appleSubmitButtonClass = 
  "h-[60px] px-8 rounded-[14px] bg-[#7c3aed] text-white text-[17px] font-medium tracking-tight transition-all hover:bg-[#6d28d9] active:scale-95 flex items-center justify-center shrink-0 w-full md:w-auto shadow-[0_4px_14px_rgba(124,58,237,0.4)]";

interface BookFormProps {
  onSearch: (filters: SearchRideInput) => void;
  initialValues?: SearchRideInput;
}

export function BookForm({ onSearch, initialValues }: BookFormProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [originKey, setOriginKey] = useState(0);
  const [originDefaultValue, setOriginDefaultValue] = useState(initialValues?.origin || '');
  
  // Trạng thái cho "Đặt chuyến trong tương lai"
  const [isFutureRide, setIsFutureRide] = useState(
    initialValues?.date ? initialValues.date !== new Date().toISOString().split('T')[0] : false
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SearchRideInput>({
    resolver: zodResolver(searchRideSchema),
    defaultValues: initialValues || {
      origin: '',
      destination: '',
      date: new Date().toISOString().split('T')[0], // Mặc định là ngày hôm nay
    },
  });

  const onSubmit = (data: SearchRideInput) => {
    // Nếu không đặt chuyến tương lai, ép buộc ngày là hôm nay
    if (!isFutureRide) {
      data.date = new Date().toISOString().split('T')[0];
    }
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

  useEffect(() => {
    if (initialValues?.origin) return;
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
          console.warn('[BookForm] Không lấy được địa chỉ từ GPS');
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        console.error('[BookForm] GPS error:', err);
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
    <div className="w-full relative space-y-3">
      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="flex flex-col md:flex-row gap-3 p-3 bg-white dark:bg-[#1d1d1f] rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)]"
      >
        {/* Origin */}
        <div className={appleInputWrapperClass}>
          <label htmlFor="origin" className={appleLabelClass}>
            <MapPin className="h-2.5 w-2.5" /> Điểm đi
            <button
              type="button"
              onClick={handleAutoFillOrigin}
              disabled={isLocating}
              title="Dùng vị trí hiện tại"
              className="flex items-center gap-0.5 text-[#7c3aed] hover:text-[#6d28d9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-1"
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

        {/* Date — chỉ hiện khi isFutureRide là true */}
        {isFutureRide && (
          <div className={appleInputWrapperClass + " animate-in slide-in-from-left-4 fade-in duration-300"}>
            <label htmlFor="date" className={appleLabelClass}>
              <Calendar className="h-2.5 w-2.5" /> Ngày đi
            </label>
            <input
              id="date"
              type="date"
              min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]} // Min là ngày mai
              className={appleInputClass}
              {...register('date')}
            />
          </div>
        )}

        {/* Submit */}
        <button type="submit" className={appleSubmitButtonClass}>
          <Search className="mr-2 h-5 w-5" />
          Tìm chuyến
        </button>
      </form>

      <div className="flex items-center justify-between px-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div className="relative flex items-center">
            <input 
              type="checkbox"
              className="peer sr-only"
              checked={isFutureRide}
              onChange={(e) => {
                setIsFutureRide(e.target.checked);
                if (!e.target.checked) {
                  // Đặt lại ngày là hôm nay khi bỏ check
                  setValue('date', new Date().toISOString().split('T')[0]);
                } else {
                  // Đặt là ngày mai khi check
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setValue('date', tomorrow.toISOString().split('T')[0]);
                }
              }}
            />
            <div className="w-10 h-6 bg-[rgba(0,0,0,0.16)] dark:bg-[rgba(255,255,255,0.16)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[rgba(0,0,0,0.04)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7c3aed]"></div>
          </div>
          <span className="text-[14px] font-medium text-[rgba(255,255,255,0.9)] drop-shadow-sm">
            Đặt chuyến đi trước
          </span>
        </label>

        {(errors.origin || errors.destination || errors.date) && (
          <p className="text-[12px] text-white bg-[#d93025] px-2.5 py-1 rounded-md font-medium tracking-tight animate-in fade-in">
            Vui lòng kiểm tra lại thông tin tìm kiếm.
          </p>
        )}
      </div>
    </div>
  );
}
