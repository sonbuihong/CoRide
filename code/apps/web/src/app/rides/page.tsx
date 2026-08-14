'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Heart, Loader2, RefreshCw,
  Bus, Clock, Store, MoreVertical, MapPin, Building2, Plus, X
} from 'lucide-react';
import { RideSearchPanel } from '@/components/rides/ride-search-panel';
import { RideSearchActions } from '@/components/rides/ride-search-actions';
import { SearchRideInput } from '@repo/shared';
import apiClient from '@/lib/api-client';
import { cleanAddressText, geocodeAddress, geocodeAddressV2 } from '@/lib/goong';
import { Ride, RideCard } from '@/components/rides/ride-card';
import { RideListFilters } from '@/components/rides/ride-list-filters';
import GoongAutocomplete from '@/components/goong/goong-autocomplete';
import { MapLocationPicker } from '@/components/rides/map-location-picker';

const mockLocations = [
  {
    id: '1',
    name: 'Bến Xe Nước Ngầm',
    address: '1 Đường Ngọc Hồi, Phường Yên Sở, Thành Phố Hà Nội, Việt Nam',
    distance: '7.04 km', lat: 20.9646, lng: 105.8422,
    type: 'bus'
  },
  {
    id: '2',
    name: 'Bến Xe Giáp Bát',
    address: 'Đường Giải Phóng, Phường Hoàng Mai, Thành Phố Hà Nội, Việt Nam',
    distance: '5.41 km', lat: 20.9806, lng: 105.8414,
    type: 'recent'
  },
  {
    id: '3',
    name: 'Lotte Mall Tây Hồ',
    address: '272 Đường Võ Chí Công, Phường Tây Hồ, Thành Phố Hà Nội, Việt Nam',
    distance: '7.31 km', lat: 21.0777, lng: 105.7907,
    type: 'store'
  },
  {
    id: '4',
    name: 'Bệnh viện Bạch Mai',
    address: '78 Đường Giải Phóng, Phường Kim Liên, Thành Phố Hà Nội, Việt Nam',
    distance: '3.27 km', lat: 21.0005, lng: 105.8410,
    type: 'hospital'
  },
  {
    id: '5',
    name: 'Bến Xe Gia Lâm',
    address: 'Phố Ngô Gia Khảm, Phường Bồ Đề, Thành Phố Hà Nội, Việt Nam',
    distance: '3.26 km', lat: 21.0403, lng: 105.8780,
    type: 'bus'
  }
];

const SAVED_LOCATIONS_STORAGE_KEY = 'coride_saved_destination_ids';
type LocationItem = typeof mockLocations[number];
type LocationField = 'origin' | 'destination';
type AddressVersions = { v1: string; v2: string };

export default function SearchPage() {
  const router = useRouter();
  const [showMergedToggle, setShowMergedToggle] = useState(true);
  const [showRideList, setShowRideList] = useState(true);
  const [activeContent, setActiveContent] = useState<'rides' | 'recent' | 'saved' | 'map'>('rides');
  const [sidebarRides, setSidebarRides] = useState<Ride[]>([]);
  const [initialRides, setInitialRides] = useState<Ride[]>([]);
  const [isLoadingRides, setIsLoadingRides] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState('');
  const [selectedDestinationCoords, setSelectedDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState('');
  const [selectedOriginCoords, setSelectedOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [activeLocationField, setActiveLocationField] = useState<LocationField>('destination');
  const [isDesktopViewport, setIsDesktopViewport] = useState<boolean | null>(null);
  const [areAutocompleteSuggestionsVisible, setAreAutocompleteSuggestionsVisible] = useState(false);
  const [savedLocations, setSavedLocations] = useState<LocationItem[]>([]);
  const [showAddSavedLocation, setShowAddSavedLocation] = useState(false);
  const [newSavedLocationQuery, setNewSavedLocationQuery] = useState('');
  const [newSavedLocationSelection, setNewSavedLocationSelection] = useState<{
    address: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [savedLocationError, setSavedLocationError] = useState('');
  const [rideFilters, setRideFilters] = useState<SearchRideInput>({});
  const [addressVersions, setAddressVersions] = useState<Record<string, AddressVersions>>({});
  const searchDraftRef = useRef<SearchRideInput>({});
  const requestedAddressVersionsRef = useRef(new Set<string>());

  const getDisplayedAddress = useCallback((address: string) => {
    if (!address) return address;
    const versions = addressVersions[address];
    if (!versions) return address;
    return showMergedToggle ? versions.v2 : versions.v1;
  }, [addressVersions, showMergedToggle]);

  useEffect(() => {
    const addresses = Array.from(new Set([
      ...mockLocations.map((location) => location.address),
      ...savedLocations.map((location) => location.address),
      ...sidebarRides.flatMap((ride) => [ride.origin, ride.destination]),
      selectedOrigin,
      selectedDestination,
      newSavedLocationSelection?.address ?? '',
    ].map((address) => address.trim()).filter(Boolean)));

    const unresolvedAddresses = addresses.filter((address) => (
      !addressVersions[address] && !requestedAddressVersionsRef.current.has(address)
    ));
    if (unresolvedAddresses.length === 0) return;

    unresolvedAddresses.forEach((address) => requestedAddressVersionsRef.current.add(address));

    void (async () => {
      const resolvedVersions: Array<{ source: string; versions: AddressVersions }> = [];

      // Giới hạn 4 request đồng thời để tránh tạo tải đột biến khi danh sách chuyến đi dài.
      for (let index = 0; index < unresolvedAddresses.length; index += 4) {
        const batch = unresolvedAddresses.slice(index, index + 4);
        const batchResults = await Promise.all(batch.map(async (source) => {
          const results = await geocodeAddressV2(source);
          const result = results?.[0];
          if (!result) {
            requestedAddressVersionsRef.current.delete(source);
            return null;
          }

          return {
            source,
            versions: {
              v1: cleanAddressText(result.deprecated_description || source),
              v2: cleanAddressText(result.formatted_address || source),
            },
          };
        }));
        resolvedVersions.push(...batchResults.filter((item): item is { source: string; versions: AddressVersions } => item !== null));
      }

      if (resolvedVersions.length === 0) return;
      setAddressVersions((current) => {
        const next = { ...current };
        resolvedVersions.forEach(({ source, versions }) => {
          // Lưu cả ba khóa để địa chỉ vẫn đổi đúng sau khi được chọn vào ô tìm kiếm.
          next[source] = versions;
          next[versions.v1] = versions;
          next[versions.v2] = versions;
        });
        return next;
      });
    })();
  }, [
    addressVersions,
    newSavedLocationSelection?.address,
    savedLocations,
    selectedDestination,
    selectedOrigin,
    sidebarRides,
  ]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateViewport = () => setIsDesktopViewport(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    try {
      const savedData: unknown = JSON.parse(localStorage.getItem(SAVED_LOCATIONS_STORAGE_KEY) ?? '[]');
      if (Array.isArray(savedData)) {
        // Tương thích dữ liệu cũ chỉ lưu id và định dạng mới lưu đầy đủ địa điểm.
        if (savedData.every((item) => typeof item === 'string')) {
          setSavedLocations(mockLocations.filter((location) => savedData.includes(location.id)));
        } else {
          setSavedLocations(savedData.filter((item): item is LocationItem => {
            if (!item || typeof item !== 'object') return false;
            const location = item as Partial<LocationItem>;
            return typeof location.id === 'string' && typeof location.name === 'string' &&
              typeof location.address === 'string' && typeof location.lat === 'number' &&
              typeof location.lng === 'number' && typeof location.distance === 'string' &&
              typeof location.type === 'string';
          }));
        }
      }
    } catch {
      localStorage.removeItem(SAVED_LOCATIONS_STORAGE_KEY);
    }
  }, []);

  const handleSearchDraftChange = useCallback((filters: SearchRideInput) => {
    searchDraftRef.current = filters;
  }, []);

  const handleSuggestionsVisibilityChange = useCallback((visible: boolean) => {
    setAreAutocompleteSuggestionsVisible(visible);
    if (visible) {
      setShowRideList(false);
      setActiveContent('recent');
    } else {
      setSidebarRides(initialRides);
      setRideFilters({});
      setShowRideList(true);
      setActiveContent('rides');
    }
  }, [initialRides]);

  useEffect(() => {
    let isMounted = true;

    const loadInitialRides = async () => {
      setIsLoadingRides(true);
      try {
        const response = await apiClient.get('/rides');
        if (isMounted) {
          const rides = response.data.rides ?? [];
          setInitialRides(rides);
          setSidebarRides(rides);
        }
      } catch (error) {
        console.error('Không thể tải danh sách chuyến đi:', error);
        if (isMounted) setSidebarRides([]);
      } finally {
        if (isMounted) setIsLoadingRides(false);
      }
    };

    loadInitialRides();
    return () => { isMounted = false; };
  }, []);

  const handleShowRideList = async () => {
    setActiveContent('rides');
    setShowRideList(true);
    setIsLoadingRides(true);
    try {
      const response = await apiClient.get('/rides', { params: rideFilters });
      setSidebarRides(response.data.rides ?? []);
    } catch (error) {
      console.error('Không thể tải danh sách chuyến đi:', error);
      setSidebarRides([]);
    } finally {
      setIsLoadingRides(false);
    }
  };

  const handleSearch = async (filters: SearchRideInput) => {
    setRideFilters(filters);
    setActiveContent('rides');
    setShowRideList(true);
    setIsLoadingRides(true);
    try {
      const response = await apiClient.get('/rides', { params: filters });
      setSidebarRides(response.data.rides ?? []);
    } catch (error) {
      console.error('Không thể tìm kiếm chuyến đi:', error);
      setSidebarRides([]);
    } finally {
      setIsLoadingRides(false);
    }
  };

  const handleListFilterChange = async (patch: Partial<SearchRideInput>) => {
    const nextFilters: SearchRideInput = { ...rideFilters, ...patch };
    setRideFilters(nextFilters);
    setActiveContent('rides');
    setShowRideList(true);
    setIsLoadingRides(true);
    try {
      const response = await apiClient.get('/rides', { params: nextFilters });
      setSidebarRides(response.data.rides ?? []);
    } catch (error) {
      console.error('Không thể lọc danh sách chuyến đi:', error);
      setSidebarRides([]);
    } finally {
      setIsLoadingRides(false);
    }
  };

  const getRideDetailHref = useCallback((rideId: string) => {
    const params = new URLSearchParams();
    if (
      rideFilters.originLat != null &&
      rideFilters.originLng != null &&
      rideFilters.destinationLat != null &&
      rideFilters.destinationLng != null
    ) {
      params.set('passengerOriginLat', String(rideFilters.originLat));
      params.set('passengerOriginLng', String(rideFilters.originLng));
      params.set('passengerDestinationLat', String(rideFilters.destinationLat));
      params.set('passengerDestinationLng', String(rideFilters.destinationLng));
    }

    const query = params.toString();
    return `/rides/${rideId}${query ? `?${query}` : ''}`;
  }, [rideFilters]);

  const handleSelectFeaturedLocation = async (location: typeof mockLocations[number]) => {
    const draft = searchDraftRef.current;
    const displayedAddress = getDisplayedAddress(location.address);
    let originCoordinates = draft.originLat != null && draft.originLng != null
      ? { lat: draft.originLat, lng: draft.originLng }
      : null;

    if (!originCoordinates && draft.origin) {
      try {
        const result = await geocodeAddress(draft.origin);
        originCoordinates = result?.geometry.location ?? null;
      } catch (error) {
        console.warn('[FeaturedLocation] Không thể geocode điểm đi đã nhập.', error);
      }
    }

    if (!originCoordinates && navigator.geolocation) {
      try {
        originCoordinates = await new Promise<{ lat: number; lng: number }>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
            reject,
            { timeout: 10000, maximumAge: 60000 }
          );
        });
      } catch (error) {
        console.warn('[FeaturedLocation] Không thể lấy vị trí hiện tại.', error);
      }
    }

    const selectedDate = draft.date ? new Date(draft.date) : null;
    // Giá trị mặc định của form là thời điểm mở trang. Nếu người dùng không chủ
    // động chọn giờ, để trống date để backend trả về các chuyến sắp tới.
    const explicitDate = selectedDate &&
      !Number.isNaN(selectedDate.getTime()) &&
      selectedDate.getTime() > Date.now()
        ? selectedDate.toISOString()
        : '';
    const filters: SearchRideInput = {
      ...draft,
      originLat: originCoordinates?.lat,
      originLng: originCoordinates?.lng,
      destination: displayedAddress,
      destinationLat: location.lat,
      destinationLng: location.lng,
      date: explicitDate,
      seats: draft.seats ?? 1,
    };
    setSelectedDestination(displayedAddress);
    setSelectedDestinationCoords({ lat: location.lat, lng: location.lng });
    setRideFilters(filters);
    setActiveContent('rides');
    setShowRideList(true);
    setIsLoadingRides(true);
    try {
      const response = await apiClient.get('/rides', {
        params: filters,
      });
      setSidebarRides(response.data.rides ?? []);
    } catch (error) {
      console.error('Không thể tìm chuyến theo điểm đến đã chọn:', error);
      setSidebarRides([]);
    } finally {
      setIsLoadingRides(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'bus': return <Bus className="h-5 w-5 text-[#1d1d1f] dark:text-white" strokeWidth={1.5} />;
      case 'recent': return <Clock className="h-5 w-5 text-[#1d1d1f] dark:text-white" strokeWidth={1.5} />;
      case 'store': return <Store className="h-5 w-5 text-[#1d1d1f] dark:text-white" strokeWidth={1.5} />;
      case 'hospital': return <Building2 className="h-5 w-5 text-[#1d1d1f] dark:text-white" strokeWidth={1.5} />;
      default: return <MapPin className="h-5 w-5 text-[#1d1d1f] dark:text-white" strokeWidth={1.5} />;
    }
  };

  const toggleSavedLocation = (event: React.MouseEvent, location: LocationItem) => {
    event.preventDefault();
    event.stopPropagation();
    setSavedLocations((currentLocations) => {
      const nextLocations = currentLocations.some((item) => item.id === location.id)
        ? currentLocations.filter((item) => item.id !== location.id)
        : [...currentLocations, location];
      localStorage.setItem(SAVED_LOCATIONS_STORAGE_KEY, JSON.stringify(nextLocations));
      return nextLocations;
    });
  };

  const handleAddSavedLocation = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newSavedLocationSelection) {
      setSavedLocationError('Vui lòng chọn một địa điểm trong danh sách gợi ý.');
      return;
    }

    const { address, lat, lng } = newSavedLocationSelection;
    const newLocation: LocationItem = {
      id: `custom-${lat.toFixed(6)}-${lng.toFixed(6)}`,
      name: address.split(',')[0]?.trim() || newSavedLocationQuery.trim(),
      address,
      distance: 'Đã lưu',
      lat,
      lng,
      type: 'saved',
    };

    setSavedLocations((currentLocations) => {
      const withoutDuplicate = currentLocations.filter((item) => item.id !== newLocation.id);
      const nextLocations = [...withoutDuplicate, newLocation];
      localStorage.setItem(SAVED_LOCATIONS_STORAGE_KEY, JSON.stringify(nextLocations));
      return nextLocations;
    });
    setNewSavedLocationQuery('');
    setNewSavedLocationSelection(null);
    setSavedLocationError('');
    setShowAddSavedLocation(false);
  };

  const isLocationSaved = (locationId: string) =>
    savedLocations.some((location) => location.id === locationId);

  const displayedLocations = activeContent === 'saved'
    ? savedLocations
    : mockLocations;

  const handleMapLocationConfirm = (address: string, coordinates: { lat: number; lng: number }) => {
    if (activeLocationField === 'origin') {
      setSelectedOrigin(address);
      setSelectedOriginCoords(coordinates);
      searchDraftRef.current = {
        ...searchDraftRef.current,
        origin: address,
        originLat: coordinates.lat,
        originLng: coordinates.lng,
      };
    } else {
      setSelectedDestination(address);
      setSelectedDestinationCoords(coordinates);
      searchDraftRef.current = {
        ...searchDraftRef.current,
        destination: address,
        destinationLat: coordinates.lat,
        destinationLng: coordinates.lng,
      };
    }

    setShowRideList(false);
    setActiveContent('recent');
  };

  const mapInitialCenter = activeLocationField === 'origin'
    ? selectedOriginCoords ?? (
        searchDraftRef.current.originLat != null && searchDraftRef.current.originLng != null
          ? { lat: searchDraftRef.current.originLat, lng: searchDraftRef.current.originLng }
          : selectedDestinationCoords
      )
    : selectedDestinationCoords ?? (
        searchDraftRef.current.destinationLat != null && searchDraftRef.current.destinationLng != null
          ? { lat: searchDraftRef.current.destinationLat, lng: searchDraftRef.current.destinationLng }
          : selectedOriginCoords
      );

  const mapPicker = (
    <MapLocationPicker
      target={activeLocationField}
      initialCenter={mapInitialCenter}
      onTargetChange={setActiveLocationField}
      onConfirm={handleMapLocationConfirm}
    />
  );

  const searchActions = (
    <RideSearchActions
      showMergedAddresses={showMergedToggle}
      onToggleMergedAddresses={() => setShowMergedToggle((value) => !value)}
      onShowRideList={handleShowRideList}
      onShowRecentLocations={() => { setShowRideList(false); setActiveContent('recent'); }}
      onShowSavedLocations={() => { setShowRideList(false); setActiveContent('saved'); }}
      onShowMap={() => { setShowRideList(false); setActiveContent('map'); }}
      activeItem={activeContent}
    />
  );

  return (
    <div className="flex h-[calc(100dvh-128px)] min-h-0 w-full overflow-hidden bg-white font-sans dark:bg-black lg:h-[calc(100dvh-48px)]">
      
      {/* Left Sidebar */}
      <div className="z-10 flex h-full min-h-0 w-full flex-shrink-0 flex-col border-r border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-black md:w-[380px] lg:w-[420px]">
        
        <div className="shrink-0">
          <RideSearchPanel
            autocompleteVersion={showMergedToggle ? 'v2' : 'v1'}
            onBack={() => router.push('/')}
            onSearch={handleSearch}
            initialValues={{
              origin: getDisplayedAddress(selectedOrigin),
              originLat: selectedOriginCoords?.lat,
              originLng: selectedOriginCoords?.lng,
              destination: getDisplayedAddress(selectedDestination),
              destinationLat: selectedDestinationCoords?.lat,
              destinationLng: selectedDestinationCoords?.lng,
            }}
            onDestinationFocus={() => {
              setShowRideList(false);
              setActiveContent('recent');
            }}
            onDraftChange={handleSearchDraftChange}
            onSuggestionsVisibilityChange={handleSuggestionsVisibilityChange}
            activeLocationField={activeLocationField}
            isMapPicking={activeContent === 'map'}
            onActiveLocationFieldChange={setActiveLocationField}
          />
        </div>

        <div className="mx-4 my-2 h-px shrink-0 bg-gray-100 dark:bg-gray-800" />

        {/* Menu Items */}
        <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-x-hidden overflow-y-auto px-3 py-2 pb-5">
          <div
            id="ride-autocomplete-suggestions-mobile"
            className={`${areAutocompleteSuggestionsVisible ? 'block' : 'hidden'} mb-2 mt-2 w-full md:hidden`}
          />
          {showRideList ? (
            <>
            <div className="flex flex-col gap-3 pb-3 md:hidden">
              <div className="sticky top-0 z-10 flex items-center justify-between rounded-[18px] bg-white/95 px-2 py-2 backdrop-blur-md dark:bg-black/95">
                <button
                  type="button"
                  onClick={() => setShowRideList(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
                  aria-label="Quay lại chức năng tìm kiếm"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h2 className="text-[16px] font-semibold text-[#1d1d1f] dark:text-white">Danh sách chuyến đi</h2>
                <span className="min-w-9 text-right text-[12px] font-medium text-gray-500">{sidebarRides.length}</span>
              </div>

              <RideListFilters
                filters={rideFilters}
                disabled={isLoadingRides}
                onChange={handleListFilterChange}
              />

              {isLoadingRides ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-[#0071e3]" />
                </div>
              ) : sidebarRides.length > 0 ? (
                sidebarRides.map((ride) => (
                  <RideCard
                    key={ride.id}
                    ride={ride}
                    href={getRideDetailHref(ride.id)}
                  />
                ))
              ) : (
                <p className="rounded-[18px] bg-[#f5f8fa] px-4 py-8 text-center text-[14px] text-gray-500 dark:bg-gray-900">
                  Hiện chưa có chuyến đi phù hợp.
                </p>
              )}
            </div>
            {searchActions}
            </>
          ) : (
          <>
           {activeContent === 'map' && !areAutocompleteSuggestionsVisible && isDesktopViewport === false && (
             <div className="mb-2 mt-2 min-w-0 max-w-full overflow-hidden md:hidden">
               {mapPicker}
             </div>
           )}
           {/* Mobile Only List */}
           <div className={`${areAutocompleteSuggestionsVisible || activeContent === 'map' ? 'hidden' : 'flex'} md:hidden flex-col gap-2 mb-2 mt-2`}>
              <h3 className="text-[15px] font-bold text-[#1d1d1f] dark:text-white px-2 mb-1">
                {activeContent === 'saved' ? 'Địa chỉ đã lưu' : 'Địa điểm nổi bật'}
              </h3>
              {displayedLocations.map(loc => (
                 <div role="button" tabIndex={0} onClick={() => handleSelectFeaturedLocation(loc)} onKeyDown={(event) => { if (event.key === 'Enter') handleSelectFeaturedLocation(loc); }} key={loc.id} className="flex w-full items-center p-3 text-left sm:p-4 bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-gray-800 rounded-[20px] hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer shadow-sm">
                    {/* Icon Area */}
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-[14px] sm:rounded-[16px] bg-[#eef3f7] dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mr-3 relative overflow-hidden">
                       <div className="absolute inset-0 opacity-40" 
                            style={{ 
                              backgroundImage: 'radial-gradient(circle at center, #94a3b8 1.5px, transparent 1.5px)', 
                              backgroundSize: '10px 10px' 
                            }}>
                       </div>
                       <div className="absolute inset-0 bg-blue-100/30 dark:bg-blue-900/10"></div>
                       <div className="absolute bottom-[-10px] right-[-10px] w-8 h-8 bg-green-200/40 dark:bg-green-800/20 rounded-full blur-md"></div>
                       <div className="absolute top-[-5px] left-[-15px] w-12 h-6 bg-blue-200/50 dark:bg-blue-800/30 rotate-45"></div>

                       <div className="relative z-10 bg-white dark:bg-[#2c2c2e] p-2 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100/50 dark:border-gray-700">
                          {getIconForType(loc.type)}
                       </div>
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 pr-2">
                       <h3 className="text-[14px] font-semibold text-[#1d1d1f] dark:text-white mb-0.5 leading-tight">{loc.name}</h3>
                       <p className="text-[12px] text-gray-500 line-clamp-1 leading-snug">{getDisplayedAddress(loc.address)}</p>
                    </div>

                    {/* Actions & Distance */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                       <span className="text-[12px] font-medium text-[#1d1d1f] dark:text-white">{loc.distance}</span>
                       <button
                         type="button"
                         aria-label={isLocationSaved(loc.id) ? `Bỏ lưu ${loc.name}` : `Lưu ${loc.name}`}
                         aria-pressed={isLocationSaved(loc.id)}
                         onClick={(event) => toggleSavedLocation(event, loc)}
                         onKeyDown={(event) => event.stopPropagation()}
                         className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                       >
                          <Heart className={`h-[16px] w-[16px] ${isLocationSaved(loc.id) ? 'fill-[#ff3b30] text-[#ff3b30]' : 'text-gray-400'}`} strokeWidth={1.5} />
                       </button>
                    </div>
                 </div>
              ))}
              {activeContent !== 'saved' && (
                <button className="mt-1 w-full h-[44px] bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-gray-800 rounded-[16px] flex items-center justify-center text-[14px] font-semibold text-[#1d1d1f] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
                   Xem tất cả
                </button>
              )}
           </div>

           {searchActions}
          </>
          )}
        </div>

        {/* Footer Area */}
        <div className="mt-auto shrink-0 p-6 pt-4">
           <p className="text-[15px] font-bold text-[#1d1d1f] dark:text-white mb-4">Không thấy địa điểm bạn cần?</p>
           <button className="w-full h-[52px] rounded-[16px] border border-gray-300 dark:border-gray-700 flex items-center justify-center text-[15px] font-semibold text-[#1d1d1f] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
              Thêm ngay địa điểm mới
           </button>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="relative hidden min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-[#fafafc] px-5 py-8 dark:bg-[#0a0a0c] md:flex lg:px-10 lg:py-10 xl:px-16">
         <div className="mb-8 flex items-center justify-between gap-4">
           <h2 className="text-[32px] font-bold text-[#1d1d1f] dark:text-white">
             {areAutocompleteSuggestionsVisible
               ? 'Gợi ý địa điểm'
               : activeContent === 'rides'
               ? 'Danh sách chuyến đi'
               : activeContent === 'saved'
                 ? 'Địa chỉ đã lưu'
                 : activeContent === 'map'
                   ? 'Chọn trên bản đồ'
                   : 'Địa điểm nổi bật'}
           </h2>
           {showRideList && (
             <button
               type="button"
               onClick={handleShowRideList}
               disabled={isLoadingRides}
               className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-[14px] font-medium text-[#1d1d1f] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-[#1c1c1e] dark:text-white dark:hover:bg-gray-800"
             >
               <RefreshCw className={`h-4 w-4 ${isLoadingRides ? 'animate-spin' : ''}`} />
               Làm mới danh sách
             </button>
           )}
         </div>

         <div id="ride-autocomplete-suggestions" className="w-full max-w-4xl" />

         {showRideList && (
           <RideListFilters
             filters={rideFilters}
             disabled={isLoadingRides}
             onChange={handleListFilterChange}
           />
         )}

         {showRideList && (
           <div className="flex w-full max-w-4xl flex-col gap-3">
             {isLoadingRides ? (
               <div className="flex items-center justify-center py-24">
                 <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
               </div>
             ) : sidebarRides.length > 0 ? (
               sidebarRides.map((ride) => (
                 <RideCard
                   key={ride.id}
                   ride={{
                     ...ride,
                     origin: getDisplayedAddress(ride.origin),
                     destination: getDisplayedAddress(ride.destination),
                   }}
                   href={getRideDetailHref(ride.id)}
                 />
               ))
             ) : (
               <div className="rounded-[24px] border border-gray-200 bg-white px-6 py-16 text-center text-[15px] text-gray-500 dark:border-gray-800 dark:bg-[#1c1c1e]">
                 Hiện chưa có chuyến đi phù hợp.
               </div>
             )}
           </div>
         )}

         {activeContent === 'map' && isDesktopViewport === true && (
           mapPicker
         )}

         {activeContent === 'saved' && !showRideList && !areAutocompleteSuggestionsVisible && (
           <section className="mb-5 w-full max-w-4xl rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#1c1c1e] md:p-6">
             <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
               <div className="flex items-start gap-3">
                 <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-[#ff3b30] dark:bg-red-500/10">
                   <Heart className="h-5 w-5 fill-current" aria-hidden="true" />
                 </span>
                 <div>
                   <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white">
                     Điểm đến yêu thích của bạn
                   </h3>
                   <p className="mt-1 text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
                     Lưu những nơi thường đến để chọn nhanh khi tìm chuyến đi.
                     {savedLocations.length > 0 ? ` Hiện có ${savedLocations.length} địa điểm đã lưu.` : ''}
                   </p>
                 </div>
               </div>

               <button
                 type="button"
                 onClick={() => {
                   setShowAddSavedLocation((visible) => !visible);
                   setSavedLocationError('');
                 }}
                 className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#0071e3] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#0077ed]"
               >
                 {showAddSavedLocation ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                 {showAddSavedLocation ? 'Đóng' : 'Thêm địa điểm mới'}
               </button>
             </div>

             {showAddSavedLocation && (
               <form onSubmit={handleAddSavedLocation} className="mt-5 rounded-[18px] bg-[#f5f8fa] p-3 dark:bg-gray-900 sm:flex sm:items-start sm:gap-2">
                 <div className="min-w-0 flex-1">
                   <label htmlFor="new-saved-location" className="sr-only">Địa chỉ muốn lưu</label>
                   <div className="rounded-[14px] border border-gray-200 bg-white px-3 focus-within:border-[#0071e3] focus-within:ring-2 focus-within:ring-[#0071e3]/10 dark:border-gray-700 dark:bg-[#1c1c1e]">
                     <GoongAutocomplete
                       apiVersion={showMergedToggle ? 'v2' : 'v1'}
                       inputId="new-saved-location"
                       placeholder="Nhập địa chỉ muốn lưu"
                       defaultValue={newSavedLocationQuery}
                       debounceMs={1000}
                       variant="bare"
                       className="w-full"
                       inputClassName="h-11 w-full bg-transparent pr-16 text-[14px] text-[#1d1d1f] outline-none placeholder:text-gray-400 dark:text-white"
                       onQueryChange={(value) => {
                         setNewSavedLocationQuery(value);
                         setNewSavedLocationSelection(null);
                         setSavedLocationError('');
                       }}
                       onClear={() => {
                         setNewSavedLocationQuery('');
                         setNewSavedLocationSelection(null);
                       }}
                       onSelect={(address, coordinates) => {
                         setNewSavedLocationQuery(address);
                         setNewSavedLocationSelection({ address, ...coordinates });
                         setSavedLocationError('');
                       }}
                     />
                   </div>
                   {savedLocationError && (
                     <p className="mt-2 px-1 text-[12px] font-medium text-[#d93025]" role="alert">
                       {savedLocationError}
                     </p>
                   )}
                 </div>
                 <button
                   type="submit"
                   disabled={!newSavedLocationQuery.trim()}
                   className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-[14px] bg-[#1d1d1f] px-5 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-[#1d1d1f] sm:mt-0 sm:w-auto"
                 >
                   Lưu địa điểm
                 </button>
               </form>
             )}

             {savedLocations.length === 0 && !showAddSavedLocation && (
               <div className="mt-5 rounded-[18px] border border-dashed border-gray-200 px-4 py-7 text-center dark:border-gray-700">
                 <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400">
                   Bạn chưa lưu địa điểm nào. Hãy thêm địa điểm mới hoặc nhấn biểu tượng trái tim tại danh sách nổi bật.
                 </p>
               </div>
             )}
           </section>
         )}

         <div className={`flex flex-col gap-3 max-w-4xl w-full ${showRideList || activeContent === 'map' || areAutocompleteSuggestionsVisible ? 'hidden' : ''}`}>
            {/* Cards */}
            {displayedLocations.map(loc => (
               <div role="button" tabIndex={0} onClick={() => handleSelectFeaturedLocation(loc)} onKeyDown={(event) => { if (event.key === 'Enter') handleSelectFeaturedLocation(loc); }} key={loc.id} className="flex w-full items-center p-4 text-left bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-gray-800 rounded-[20px] hover:shadow-sm transition-all cursor-pointer">
                  {/* Icon Area */}
                  <div className="h-16 w-16 rounded-[16px] bg-[#eef3f7] dark:bg-gray-800 flex items-center justify-center flex-shrink-0 mr-4 relative overflow-hidden">
                     {/* Map snippet pattern */}
                     <div className="absolute inset-0 opacity-40" 
                          style={{ 
                            backgroundImage: 'radial-gradient(circle at center, #94a3b8 1.5px, transparent 1.5px)', 
                            backgroundSize: '10px 10px' 
                          }}>
                     </div>
                     <div className="absolute inset-0 bg-blue-100/30 dark:bg-blue-900/10"></div>
                     <div className="absolute bottom-[-10px] right-[-10px] w-12 h-12 bg-green-200/40 dark:bg-green-800/20 rounded-full blur-md"></div>
                     <div className="absolute top-[-5px] left-[-15px] w-16 h-8 bg-blue-200/50 dark:bg-blue-800/30 rotate-45"></div>

                     <div className="relative z-10 bg-white dark:bg-[#2c2c2e] p-2.5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100/50 dark:border-gray-700">
                        {getIconForType(loc.type)}
                     </div>
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 pr-4">
                     <h3 className="text-[16px] font-semibold text-[#1d1d1f] dark:text-white mb-1 leading-tight">{loc.name}</h3>
                     <p className="text-[14px] text-gray-500 line-clamp-2 leading-snug">{getDisplayedAddress(loc.address)}</p>
                  </div>

                  {/* Actions & Distance */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                     <span className="text-[14px] font-medium text-[#1d1d1f] dark:text-white px-2">{loc.distance}</span>
                     <button
                       type="button"
                       aria-label={isLocationSaved(loc.id) ? `Bỏ lưu ${loc.name}` : `Lưu ${loc.name}`}
                       aria-pressed={isLocationSaved(loc.id)}
                       onClick={(event) => toggleSavedLocation(event, loc)}
                       onKeyDown={(event) => event.stopPropagation()}
                       className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                     >
                        <Heart className={`h-[22px] w-[22px] ${isLocationSaved(loc.id) ? 'fill-[#ff3b30] text-[#ff3b30]' : 'text-gray-400'}`} strokeWidth={1.5} />
                     </button>
                     <button type="button" onClick={(event) => event.stopPropagation()} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <MoreVertical className="h-[22px] w-[22px] text-gray-400" strokeWidth={1.5} />
                     </button>
                  </div>
               </div>
            ))}

            {/* Xem tất cả button */}
            {activeContent !== 'saved' && (
              <button className="mt-2 w-full h-[52px] bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-gray-800 rounded-[16px] flex items-center justify-center text-[16px] font-semibold text-[#1d1d1f] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
                 Xem tất cả
              </button>
            )}
         </div>
      </div>
    </div>
  );
}
