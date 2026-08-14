'use client';

import React from 'react';
import { Bus, Heart, Lightbulb, List, Map } from 'lucide-react';

interface RideSearchActionsProps {
  showMergedAddresses: boolean;
  onToggleMergedAddresses: () => void;
  compact?: boolean;
  onShowRideList?: () => void;
  onShowRecentLocations?: () => void;
  onShowSavedLocations?: () => void;
  onShowMap?: () => void;
  activeItem?: 'rides' | 'recent' | 'saved' | 'map';
}

export function RideSearchActions({
  showMergedAddresses,
  onToggleMergedAddresses,
  compact = false,
  onShowRideList,
  onShowRecentLocations,
  onShowSavedLocations,
  onShowMap,
  activeItem,
}: RideSearchActionsProps) {
  const rowClass = compact ? 'h-[44px]' : 'h-[52px]';

  return (
    <div className="flex flex-col gap-1.5 px-3 py-3">
      {onShowRideList && (
        <button
          type="button"
          onClick={onShowRideList}
          className={`flex w-full items-center gap-4 rounded-[20px] px-4 transition-colors ${activeItem === 'rides' ? 'bg-[#eaf2f8] dark:bg-blue-950/40' : 'hover:bg-gray-50 dark:hover:bg-gray-900'} ${rowClass}`}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0071e3] text-white">
            <List className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="text-[15px] font-semibold text-[#1d1d1f] dark:text-white">Danh sách chuyến đi</span>
        </button>
      )}

      <button type="button" onClick={onShowRecentLocations} className={`flex w-full items-center gap-4 rounded-[20px] px-4 transition-colors ${activeItem === 'recent' ? 'bg-[#f5f8fa] dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-900'} ${rowClass}`}>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
          <Bus className="h-4 w-4 text-gray-600 dark:text-gray-300" strokeWidth={2} />
        </span>
        <span className="text-[15px] font-medium text-[#1d1d1f] dark:text-white">Địa điểm nổi bật</span>
      </button>

      <button type="button" onClick={onShowSavedLocations} className={`flex w-full items-center gap-4 rounded-[20px] px-4 transition-colors ${activeItem === 'saved' ? 'bg-[#f5f8fa] dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-900'} ${rowClass}`}>
        <span className="flex h-8 w-8 items-center justify-center">
          <Heart className="h-5 w-5 fill-[#ff3b30] text-[#ff3b30]" />
        </span>
        <span className="text-[15px] font-medium text-[#1d1d1f] dark:text-white">Địa chỉ đã lưu</span>
      </button>

      <button type="button" onClick={onShowMap} className={`flex w-full items-center gap-4 rounded-[20px] px-4 transition-colors ${activeItem === 'map' ? 'bg-[#f5f8fa] dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-900'} ${rowClass}`}>
        <span className="flex h-8 w-8 items-center justify-center">
          <Map className="h-5 w-5 text-gray-500" strokeWidth={1.5} />
        </span>
        <span className="text-[15px] font-medium text-[#1d1d1f] dark:text-white">Chọn trên bản đồ</span>
      </button>

      <button
        type="button"
        onMouseDown={(event) => {
          // Không để thao tác switch bị xem là click ra ngoài autocomplete.
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.stopPropagation();
          onToggleMergedAddresses();
        }}
        role="switch"
        aria-checked={showMergedAddresses}
        className={`flex w-full items-center justify-between rounded-[20px] px-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900 ${rowClass}`}
      >
        <span className="flex items-center gap-4">
          <span className="flex h-8 w-8 items-center justify-center">
            <Lightbulb className="h-5 w-5 text-gray-500" strokeWidth={1.5} />
          </span>
          <span className="text-left text-[15px] font-medium text-[#1d1d1f] dark:text-white">Hiển thị địa chỉ sau sáp nhập</span>
        </span>
        <span className={`flex h-[26px] w-[48px] shrink-0 items-center rounded-full p-0.5 transition-colors ${showMergedAddresses ? 'bg-[#0071e3]' : 'bg-gray-300 dark:bg-gray-700'}`}>
          <span className={`h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-transform ${showMergedAddresses ? 'translate-x-[22px]' : 'translate-x-0'}`} />
        </span>
      </button>
    </div>
  );
}
