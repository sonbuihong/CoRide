'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { SearchRideInput } from '@repo/shared';
import { SearchForm } from './search-form';
import type { GoongApiVersion } from '@/lib/goong';

interface RideSearchPanelProps {
  onBack: () => void;
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

export function RideSearchPanel({
  onBack,
  onSearch,
  initialValues,
  onDestinationFocus,
  onDraftChange,
  onSuggestionsVisibilityChange,
  activeLocationField,
  isMapPicking,
  onActiveLocationFieldChange,
  autocompleteVersion = 'v1',
}: RideSearchPanelProps) {
  return (
    <div className="w-full bg-white dark:bg-black">
      <div className="flex items-center justify-between p-6 pb-4">
        <h1 className="text-[22px] font-semibold text-[#1d1d1f] dark:text-white">
          Tìm kiếm điểm đến
        </h1>
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          aria-label="Quay lại"
          title="Quay lại"
        >
          <ArrowLeft className="h-5 w-5 text-[#1d1d1f] dark:text-white" />
        </button>
      </div>

      <div className="px-4 py-2 pb-4">
        <SearchForm
          autocompleteVersion={autocompleteVersion}
          onSearch={onSearch}
          initialValues={initialValues}
          onDestinationFocus={onDestinationFocus}
          onDraftChange={onDraftChange}
          onSuggestionsVisibilityChange={onSuggestionsVisibilityChange}
          activeLocationField={activeLocationField}
          isMapPicking={isMapPicking}
          onActiveLocationFieldChange={onActiveLocationFieldChange}
        />
      </div>
    </div>
  );
}
