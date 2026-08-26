'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import GoongAutocomplete from '@/components/goong/goong-autocomplete';
import { buildFullAddressFromDetail, cleanAddressText, reverseGeocodeDetailed } from '@/lib/goong';
import type { GoongApiVersion } from '@/lib/goong';

interface RideLocationSearchFieldsProps {
  initialOrigin?: string;
  initialDestination?: string;
  onOriginChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  onDestinationChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  onDestinationFocus?: () => void;
  onSuggestionsVisibilityChange?: (visible: boolean) => void;
  activeLocationField?: 'origin' | 'destination';
  isMapPicking?: boolean;
  onActiveLocationFieldChange?: (field: 'origin' | 'destination') => void;
  autocompleteVersion?: GoongApiVersion;
}

const locationInputClass =
  'h-[52px] w-full bg-transparent pr-12 text-[15px] font-medium text-[#1d1d1f] focus:outline-none dark:text-white';

export function RideLocationSearchFields({
  initialOrigin = '',
  initialDestination = '',
  onOriginChange,
  onDestinationChange,
  onDestinationFocus,
  onSuggestionsVisibilityChange,
  activeLocationField = 'destination',
  isMapPicking = false,
  onActiveLocationFieldChange,
  autocompleteVersion = 'v2',
}: RideLocationSearchFieldsProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [gpsAddress, setGpsAddress] = useState('');
  const [gpsCoordinates, setGpsCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isOriginFocused, setIsOriginFocused] = useState(false);
  const [isDestinationSelected, setIsDestinationSelected] = useState(Boolean(initialDestination.trim()));
  const onOriginChangeRef = useRef(onOriginChange);
  const reverseVersionRef = useRef(autocompleteVersion);

  useEffect(() => {
    onOriginChangeRef.current = onOriginChange;
  }, [onOriginChange]);

  useEffect(() => {
    setIsDestinationSelected(Boolean(initialDestination.trim()));
  }, [initialDestination]);

  useEffect(() => {
    if (initialOrigin || !navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const result = await reverseGeocodeDetailed(coords.latitude, coords.longitude, autocompleteVersion);
          if (!result) return;

          const address = buildFullAddressFromDetail({
            name: result.name,
            formatted_address: result.address,
          }) || cleanAddressText(result.address);

          setGpsAddress(address);
          setGpsCoordinates({ lat: coords.latitude, lng: coords.longitude });
          reverseVersionRef.current = autocompleteVersion;
          onOriginChangeRef.current(address, {
            lat: coords.latitude,
            lng: coords.longitude,
          });
        } catch {
          console.warn('Không lấy được địa chỉ từ GPS');
        } finally {
          setIsLocating(false);
        }
      },
      () => setIsLocating(false),
      { timeout: 10000, maximumAge: 60000 }
    );
  }, [autocompleteVersion, initialOrigin]);

  useEffect(() => {
    if (!gpsCoordinates || reverseVersionRef.current === autocompleteVersion) return;
    reverseVersionRef.current = autocompleteVersion;
    reverseGeocodeDetailed(gpsCoordinates.lat, gpsCoordinates.lng, autocompleteVersion).then((result) => {
      if (!result) return;
      const address = buildFullAddressFromDetail({ name: result.name, formatted_address: result.address }) || cleanAddressText(result.address);
      setGpsAddress(address);
      onOriginChangeRef.current(address, gpsCoordinates);
    });
  }, [autocompleteVersion, gpsCoordinates]);

  return (
    <div className="flex flex-col gap-3">
      <div className={`flex h-[52px] w-full items-center gap-3 rounded-[20px] border-[1.5px] bg-[#f5f8fa] px-4 transition-all hover:bg-[#eaf2f8] dark:bg-gray-900 dark:hover:bg-gray-800 ${isOriginFocused || (isMapPicking && activeLocationField === 'origin') ? 'border-[#0071e3] shadow-[0_0_0_4px_rgba(0,113,227,0.12)]' : 'border-transparent shadow-none'}`}>
        {isLocating ? (
          <Loader2 className="ml-0.5 h-4 w-4 shrink-0 animate-spin text-[#0071e3]" />
        ) : (
          <span className="ml-1 h-2 w-2 shrink-0 rounded-full bg-[#0071e3]" />
        )}
        <GoongAutocomplete
          apiVersion={autocompleteVersion}
          biasLocation={gpsCoordinates || undefined}
          placeholder={isOriginFocused
            ? (gpsAddress || (isLocating ? 'Đang lấy địa chỉ hiện tại...' : 'Nhập điểm đi'))
            : 'Sử dụng vị trí hiện tại'}
          defaultValue={initialOrigin}
          onSelect={(address, coordinates) => onOriginChange(address, coordinates)}
          onClear={() => onOriginChange('')}
          onQueryChange={(address) => onOriginChange(address)}
          variant="bare"
          className="min-w-0 flex-1"
          inputClassName={`${locationInputClass} ${isOriginFocused ? 'placeholder:text-[#1d1d1f]/35 dark:placeholder:text-white/35' : 'placeholder:text-[#1d1d1f]/80 dark:placeholder:text-white/80'}`}
          onFocus={() => {
            setIsOriginFocused(true);
            onActiveLocationFieldChange?.('origin');
          }}
          onBlur={() => setIsOriginFocused(false)}
          suggestionsPlacement="right-pane"
          suggestionsPortalId="ride-autocomplete-suggestions"
          suggestionsMobilePortalId="ride-autocomplete-suggestions-mobile"
          onSuggestionsVisibilityChange={onSuggestionsVisibilityChange}
        />
      </div>

      <div className={`flex h-[52px] w-full items-center gap-3 rounded-[20px] border-[1.5px] bg-white px-4 transition-all dark:bg-gray-900 ${(!isOriginFocused && !isDestinationSelected) || (isMapPicking && activeLocationField === 'destination') ? 'border-[#0071e3] shadow-[0_0_0_4px_rgba(0,113,227,0.08)]' : 'border-gray-200 shadow-none dark:border-gray-700'}`}>
        <MapPin className="h-5 w-5 shrink-0 text-[#ff3b30]" strokeWidth={2} />
        <GoongAutocomplete
          apiVersion={autocompleteVersion}
          biasLocation={gpsCoordinates || undefined}
          placeholder="Bạn muốn đi đâu"
          defaultValue={initialDestination}
          onSelect={(address, coordinates) => {
            setIsDestinationSelected(true);
            onDestinationChange(address, coordinates);
          }}
          onClear={() => {
            setIsDestinationSelected(false);
            onDestinationChange('');
          }}
          onQueryChange={(address) => {
            setIsDestinationSelected(false);
            onDestinationChange(address);
          }}
          variant="bare"
          className="min-w-0 flex-1"
          inputClassName={`${locationInputClass} placeholder:text-[#1d1d1f]/60 dark:placeholder:text-white/60`}
          onFocus={() => {
            setIsOriginFocused(false);
            onActiveLocationFieldChange?.('destination');
            onDestinationFocus?.();
          }}
          suggestionsPlacement="right-pane"
          suggestionsPortalId="ride-autocomplete-suggestions"
          suggestionsMobilePortalId="ride-autocomplete-suggestions-mobile"
          onSuggestionsVisibilityChange={onSuggestionsVisibilityChange}
        />
      </div>
    </div>
  );
}
