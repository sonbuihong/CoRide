'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { searchRideSchema, SearchRideInput } from '@repo/shared';
import { CalendarClock, Clock3, Minus, Plus, RotateCcw, Search, Users } from 'lucide-react';
import { RideLocationSearchFields } from './ride-location-search-fields';
import { geocodeAddress } from '@/lib/goong';
import type { GoongApiVersion } from '@/lib/goong';

const toLocalDateTimeValue = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const getInitialDateTime = (value?: string) => {
  if (!value) return toLocalDateTimeValue(new Date());
  if (value.includes('T')) {
    return value.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(value)
      ? toLocalDateTimeValue(new Date(value))
      : value.slice(0, 16);
  }

  const today = toLocalDateTimeValue(new Date()).slice(0, 10);
  return value === today ? toLocalDateTimeValue(new Date()) : `${value}T00:00`;
};

interface SearchFormProps {
  onSearch: (filters: SearchRideInput) => void;
  initialValues?: SearchRideInput;
  onDestinationFocus?: () => void;
  onDraftChange?: (filters: SearchRideInput) => void;
  onSuggestionsVisibilityChange?: (visible: boolean) => void;
  activeLocationField?: 'origin' | 'destination';
  isMapPicking?: boolean;
  onActiveLocationFieldChange?: (field: 'origin' | 'destination') => void;
  autocompleteVersion?: GoongApiVersion;
}

export function SearchForm({
  onSearch,
  initialValues,
  onDestinationFocus,
  onDraftChange,
  onSuggestionsVisibilityChange,
  activeLocationField,
  isMapPicking,
  onActiveLocationFieldChange,
  autocompleteVersion = 'v2',
}: SearchFormProps) {
  // Dùng chung một mốc khởi tạo cho value và min để tránh lệch phút sau re-render.
  const [minimumDateTime] = useState(() => toLocalDateTimeValue(new Date()));
  const [useCurrentTime, setUseCurrentTime] = useState(() => !initialValues?.date);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    resetField,
    watch,
    getValues,
    formState: { errors },
  } = useForm<SearchRideInput>({
    resolver: zodResolver(searchRideSchema),
    defaultValues: {
      origin: initialValues?.origin || '',
      originLat: initialValues?.originLat,
      originLng: initialValues?.originLng,
      destination: initialValues?.destination || '',
      destinationLat: initialValues?.destinationLat,
      destinationLng: initialValues?.destinationLng,
      date: initialValues?.date ? getInitialDateTime(initialValues.date) : minimumDateTime,
      seats: initialValues?.seats ?? 1,
    },
  });
  const selectedDateTime = watch('date') || minimumDateTime;
  const selectedSeats = watch('seats') ?? 1;

  useEffect(() => {
    if (!onDraftChange) return;

    onDraftChange(getValues());
    const subscription = watch((values) => {
      onDraftChange(values as SearchRideInput);
    });

    return () => subscription.unsubscribe();
  }, [getValues, onDraftChange, watch]);

  useEffect(() => {
    if (initialValues?.origin !== undefined) {
      setValue('origin', initialValues.origin);
      setValue('originLat', initialValues.originLat);
      setValue('originLng', initialValues.originLng);
    }
  }, [initialValues?.origin, initialValues?.originLat, initialValues?.originLng, setValue]);

  useEffect(() => {
    if (initialValues?.destination !== undefined) {
      setValue('destination', initialValues.destination);
      setValue('destinationLat', initialValues.destinationLat);
      setValue('destinationLng', initialValues.destinationLng);
    }
  }, [initialValues?.destination, initialValues?.destinationLat, initialValues?.destinationLng, setValue]);

  const setFutureOffset = (minutes: number) => {
    setValue('date', toLocalDateTimeValue(new Date(Date.now() + minutes * 60_000)), {
      shouldDirty: true,
    });
  };

  const updateDatePart = (datePart: string) => {
    const timePart = selectedDateTime.split('T')[1] || '00:00';
    setValue('date', `${datePart}T${timePart}`, { shouldDirty: true });
  };

  const updateTimePart = (timePart: string) => {
    const datePart = selectedDateTime.split('T')[0];
    setValue('date', `${datePart}T${timePart}`, { shouldDirty: true });
  };

  const onSubmit = async (data: SearchRideInput) => {
    // Giá trị mặc định có thể đã cũ nếu người dùng để trang mở lâu.
    // Khi họ chưa tự chỉnh thời gian, luôn lấy lại thời điểm hiện tại lúc bấm tìm kiếm.
    const hasExplicitDate = !useCurrentTime;
    const effectiveDate = hasExplicitDate ? data.date : '';

    if (hasExplicitDate && effectiveDate && new Date(effectiveDate).getTime() < Date.now() - 60_000) {
      setError('date', { type: 'validate', message: 'Vui lòng chọn thời gian trong tương lai.' });
      return;
    }
    let resolvedOrigin = data.originLat != null && data.originLng != null
      ? { lat: data.originLat, lng: data.originLng }
      : null;
    let resolvedDestination = data.destinationLat != null && data.destinationLng != null
      ? { lat: data.destinationLat, lng: data.destinationLng }
      : null;

    // Người dùng vẫn có thể gõ địa chỉ rồi bấm tìm mà không chọn autocomplete.
    // Geocode một lần tại submit để Route-Aware Matching luôn nhận được tọa độ.
    try {
      if (!resolvedOrigin && data.origin) {
        const result = await geocodeAddress(data.origin);
        resolvedOrigin = result?.geometry.location ?? null;
      }
      if (!resolvedDestination && data.destination) {
        const result = await geocodeAddress(data.destination);
        resolvedDestination = result?.geometry.location ?? null;
      }
    } catch (error) {
      console.warn('[RideSearch] Không thể geocode đầy đủ, dùng tìm kiếm địa chỉ dự phòng.', error);
    }

    onSearch({
      ...data,
      originLat: resolvedOrigin?.lat,
      originLng: resolvedOrigin?.lng,
      destinationLat: resolvedDestination?.lat,
      destinationLng: resolvedDestination?.lng,
      seats: data.seats ?? 1,
      // Gửi ISO kèm múi giờ để backend lọc đúng thời điểm của người dùng.
      // Khi dùng "thời gian hiện tại", không gửi một timestamp cứng. Backend sẽ
      // tìm toàn bộ chuyến sắp tới và chỉ áp tolerance khi người dùng chủ động chọn giờ.
      date: hasExplicitDate && effectiveDate ? new Date(effectiveDate).toISOString() : '',
    });
  };

  const handleOriginSelect = (address: string, coordinates?: { lat: number; lng: number }) => {
    setValue('origin', address);
    setValue('originLat', coordinates?.lat);
    setValue('originLng', coordinates?.lng);
  };

  const handleDestSelect = (address: string, coordinates?: { lat: number; lng: number }) => {
    setValue('destination', address);
    setValue('destinationLat', coordinates?.lat);
    setValue('destinationLng', coordinates?.lng);
  };

  return (
    <div className="w-full relative">
      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="flex w-full flex-col gap-3"
      >
        <RideLocationSearchFields
          autocompleteVersion={autocompleteVersion}
          initialOrigin={initialValues?.origin}
          initialDestination={initialValues?.destination}
          onOriginChange={handleOriginSelect}
          onDestinationChange={handleDestSelect}
          onDestinationFocus={onDestinationFocus}
          onSuggestionsVisibilityChange={onSuggestionsVisibilityChange}
          activeLocationField={activeLocationField}
          isMapPicking={isMapPicking}
          onActiveLocationFieldChange={onActiveLocationFieldChange}
        />

        {/* Date */}
        <div className={`flex w-full gap-3 rounded-[20px] bg-[#f5f8fa] px-4 focus-within:ring-2 focus-within:ring-[#0071e3]/20 dark:bg-gray-900 ${useCurrentTime ? 'h-[52px] items-center' : 'flex-wrap py-3'}`}>
          {useCurrentTime ? (
            <>
              <Clock3 className="h-5 w-5 shrink-0 text-[#0071e3]" strokeWidth={1.8} />
              <span className="min-w-0 flex-1 text-[14px] font-medium text-[#1d1d1f] dark:text-white">
                Sử dụng thời gian hiện tại
              </span>
              <button
                type="button"
                onClick={() => {
                  const suggestedTime = new Date(Date.now() + 5 * 60_000);
                  setValue('date', toLocalDateTimeValue(suggestedTime), { shouldDirty: true });
                  setUseCurrentTime(false);
                }}
                className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#0071e3] shadow-sm transition-colors hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                Chọn giờ khác
              </button>
            </>
          ) : (
            <>
              <div className="flex w-full items-center gap-3">
                <CalendarClock className="h-5 w-5 shrink-0 text-[#0071e3]" strokeWidth={1.8} />
                <span className="min-w-0 flex-1 text-[14px] font-semibold text-[#1d1d1f] dark:text-white">Chọn thời gian khởi hành</span>
                <button
                  type="button"
                  onClick={() => {
                    resetField('date', { defaultValue: minimumDateTime });
                    setUseCurrentTime(true);
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white hover:text-[#0071e3] dark:hover:bg-gray-800"
                  aria-label="Dùng thời gian hiện tại"
                  title="Dùng thời gian hiện tại"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              <div className="flex w-full gap-2 pl-8">
                {[30, 60, 120].map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setFutureOffset(minutes)}
                    className="flex-1 rounded-full border border-[#0071e3]/15 bg-white px-2 py-1.5 text-[12px] font-semibold text-[#0071e3] shadow-sm transition-all hover:border-[#0071e3]/30 hover:bg-blue-50 active:scale-95 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    +{minutes < 60 ? `${minutes} phút` : `${minutes / 60} giờ`}
                  </button>
                ))}
              </div>

              <div className="grid w-full grid-cols-[minmax(0,1fr)_120px] gap-2 pl-8">
                <label className="rounded-[14px] border border-black/5 bg-white px-3 py-2 shadow-sm dark:border-white/10 dark:bg-gray-800">
                  <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-gray-400">Ngày đi</span>
                  <input
                    type="date"
                    min={minimumDateTime.split('T')[0]}
                    value={selectedDateTime.split('T')[0]}
                    onChange={(event) => updateDatePart(event.target.value)}
                    className="w-full cursor-pointer bg-transparent text-[13px] font-semibold text-[#1d1d1f] outline-none [color-scheme:light] dark:text-white dark:[color-scheme:dark]"
                    aria-label="Ngày đi"
                  />
                </label>
                <label className="rounded-[14px] border border-black/5 bg-white px-3 py-2 shadow-sm dark:border-white/10 dark:bg-gray-800">
                  <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-gray-400">Giờ đi</span>
                  <input
                    type="time"
                    step={300}
                    value={selectedDateTime.split('T')[1] || ''}
                    onChange={(event) => updateTimePart(event.target.value)}
                    className="w-full cursor-pointer bg-transparent text-[13px] font-semibold text-[#1d1d1f] outline-none [color-scheme:light] dark:text-white dark:[color-scheme:dark]"
                    aria-label="Giờ đi"
                  />
                </label>
              </div>

              <input type="hidden" {...register('date')} />
            </>
          )}
        </div>

        <div className="flex h-[52px] w-full items-center gap-3 rounded-[20px] bg-[#f5f8fa] px-4 dark:bg-gray-900">
          <Users className="h-5 w-5 shrink-0 text-[#0071e3]" strokeWidth={1.8} aria-hidden="true" />
          <span className="min-w-0 flex-1 text-[14px] font-medium text-[#1d1d1f] dark:text-white">
            Số ghế cần đặt
          </span>
          <div className="flex items-center gap-2 rounded-full bg-white p-1 shadow-sm dark:bg-gray-800" aria-label="Chọn số ghế">
            <button
              type="button"
              onClick={() => setValue('seats', Math.max(1, selectedSeats - 1), { shouldDirty: true })}
              disabled={selectedSeats <= 1}
              className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-gray-700"
              aria-label="Giảm số ghế"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <output className="w-5 text-center text-[14px] font-bold text-[#1d1d1f] dark:text-white" aria-live="polite">
              {selectedSeats}
            </output>
            <button
              type="button"
              onClick={() => setValue('seats', Math.min(10, selectedSeats + 1), { shouldDirty: true })}
              disabled={selectedSeats >= 10}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0071e3] text-white transition-colors hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Tăng số ghế"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" className="flex h-[52px] w-full items-center justify-center rounded-[20px] bg-[#0071e3] text-[16px] font-semibold text-white shadow-sm transition-colors hover:bg-[#0077ed] active:scale-[0.99]">
          <Search className="mr-2 h-5 w-5" strokeWidth={2.5} />
          Tìm kiếm
        </button>
      </form>

      {(errors.origin || errors.destination || errors.date) && (
        <p className="absolute -bottom-6 left-4 text-[12px] text-[#d93025] font-medium tracking-tight">
          {errors.date?.message || 'Vui lòng kiểm tra lại thông tin tìm kiếm.'}
        </p>
      )}
    </div>
  );
}
