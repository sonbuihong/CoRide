'use client';

import React from 'react';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { SearchRideInput } from '@repo/shared';

interface RideListFiltersProps {
  filters: SearchRideInput;
  disabled?: boolean;
  onChange: (patch: Partial<SearchRideInput>) => void;
}

const selectClass =
  'h-11 w-full rounded-[14px] border border-gray-200 bg-white px-3 text-[13px] font-medium text-[#1d1d1f] outline-none transition-colors focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-[#1c1c1e] dark:text-white';

export function RideListFilters({ filters, disabled = false, onChange }: RideListFiltersProps) {
  const hasFilters = Boolean(
    filters.maxPrice || filters.departurePeriod || filters.vehicleType || (filters.seats ?? 1) > 1
  );

  return (
    <section className="mb-5 w-full max-w-4xl rounded-[20px] border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-[#1c1c1e] md:p-4" aria-label="Bộ lọc chuyến đi">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-[#1d1d1f] dark:text-white">
          <SlidersHorizontal className="h-4 w-4 text-[#0071e3]" aria-hidden="true" />
          Bộ lọc chuyến đi
        </div>
        {hasFilters && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({
              maxPrice: undefined,
              departurePeriod: undefined,
              vehicleType: undefined,
              seats: 1,
            })}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-semibold text-[#0071e3] transition-colors hover:bg-blue-50 disabled:opacity-50 dark:hover:bg-blue-950/30"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Đặt lại
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <label className="space-y-1">
          <span className="block px-1 text-[11px] font-semibold text-gray-500">Giá tối đa</span>
          <select
            aria-label="Lọc theo giá tối đa"
            disabled={disabled}
            value={filters.maxPrice ?? ''}
            onChange={(event) => onChange({ maxPrice: event.target.value ? Number(event.target.value) : undefined })}
            className={selectClass}
          >
            <option value="">Mọi mức giá</option>
            <option value="50000">Đến 50.000đ</option>
            <option value="100000">Đến 100.000đ</option>
            <option value="200000">Đến 200.000đ</option>
            <option value="500000">Đến 500.000đ</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="block px-1 text-[11px] font-semibold text-gray-500">Khởi hành</span>
          <select
            aria-label="Lọc theo thời gian khởi hành"
            disabled={disabled}
            value={filters.departurePeriod ?? ''}
            onChange={(event) => onChange({ departurePeriod: (event.target.value || undefined) as SearchRideInput['departurePeriod'] })}
            className={selectClass}
          >
            <option value="">Mọi thời gian</option>
            <option value="MORNING">Buổi sáng · 05–12h</option>
            <option value="AFTERNOON">Buổi chiều · 12–18h</option>
            <option value="EVENING">Buổi tối · 18–05h</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="block px-1 text-[11px] font-semibold text-gray-500">Phương tiện</span>
          <select
            aria-label="Lọc theo loại phương tiện"
            disabled={disabled}
            value={filters.vehicleType ?? ''}
            onChange={(event) => onChange({ vehicleType: (event.target.value || undefined) as SearchRideInput['vehicleType'] })}
            className={selectClass}
          >
            <option value="">Mọi phương tiện</option>
            <option value="BIKE">Xe máy</option>
            <option value="CAR">Ô tô</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="block px-1 text-[11px] font-semibold text-gray-500">Số ghế</span>
          <select
            aria-label="Lọc theo số ghế"
            disabled={disabled}
            value={filters.seats ?? 1}
            onChange={(event) => onChange({ seats: Number(event.target.value) })}
            className={selectClass}
          >
            <option value="1">Từ 1 ghế</option>
            <option value="2">Từ 2 ghế</option>
            <option value="3">Từ 3 ghế</option>
            <option value="4">Từ 4 ghế</option>
          </select>
        </label>
      </div>
    </section>
  );
}
