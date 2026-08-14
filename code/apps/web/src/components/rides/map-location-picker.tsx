'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { Crosshair, Loader2, MapPin } from 'lucide-react';
import { reverseGeocode } from '@/lib/goong';

type LocationField = 'origin' | 'destination';

interface MapLocationPickerProps {
  target: LocationField;
  initialCenter?: { lat: number; lng: number } | null;
  onTargetChange: (target: LocationField) => void;
  onConfirm: (address: string, coordinates: { lat: number; lng: number }) => void;
}

const DEFAULT_CENTER = { lat: 21.0285, lng: 105.8542 };

export function MapLocationPicker({
  target,
  initialCenter,
  onTargetChange,
  onConfirm,
}: MapLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [center, setCenter] = useState(initialCenter ?? DEFAULT_CENTER);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: `https://tiles.goong.io/assets/goong_map_web.json?api_key=${process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY || ''}`,
      center: [center.lng, center.lat],
      zoom: 16,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () => {
      setIsMapReady(true);
      map.resize();
    });
    map.on('movestart', () => {
      setIsMoving(true);
      setError('');
    });
    map.on('moveend', () => {
      const nextCenter = map.getCenter();
      setCenter({ lat: nextCenter.lat, lng: nextCenter.lng });
      setIsMoving(false);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Tọa độ ban đầu chỉ dùng khi khởi tạo. Các thay đổi sau được xử lý bằng flyTo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!initialCenter || !mapRef.current) return;
    setCenter(initialCenter);
    mapRef.current.flyTo({ center: [initialCenter.lng, initialCenter.lat], zoom: 16 });
  }, [initialCenter?.lat, initialCenter?.lng]);

  useEffect(() => {
    if (initialCenter || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const currentPosition = { lat: coords.latitude, lng: coords.longitude };
        setCenter(currentPosition);
        mapRef.current?.flyTo({ center: [currentPosition.lng, currentPosition.lat], zoom: 16 });
      },
      () => undefined,
      { timeout: 8000, maximumAge: 60_000 }
    );
  }, [initialCenter]);

  const handleConfirm = async () => {
    setIsResolving(true);
    setError('');
    try {
      const address = await reverseGeocode(center.lat, center.lng);
      onConfirm(
        address || `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`,
        center
      );
    } catch {
      setError('Không thể lấy địa chỉ tại vị trí này. Vui lòng thử lại.');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <section className="min-w-0 w-full max-w-full overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#1c1c1e]">
      <div className="flex min-w-0 flex-col gap-3 border-b border-black/5 px-4 py-4 dark:border-white/10 sm:px-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white">Di chuyển bản đồ đến vị trí chính xác</h3>
          <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400">Đầu ghim chính là tọa độ sẽ được điền vào ô tìm kiếm.</p>
        </div>
        <div className="flex w-full min-w-0 rounded-full bg-[#f2f2f7] p-1 dark:bg-gray-900 xl:w-auto xl:shrink-0" aria-label="Chọn loại địa điểm">
          {(['origin', 'destination'] as const).map((field) => (
            <button
              key={field}
              type="button"
              onClick={() => onTargetChange(field)}
              className={`min-w-0 flex-1 rounded-full px-3 py-2 text-[13px] font-semibold transition-colors xl:flex-none xl:px-4 ${target === field ? 'bg-[#0071e3] text-white shadow-sm' : 'text-gray-500 hover:text-[#1d1d1f] dark:hover:text-white'}`}
            >
              {field === 'origin' ? 'Điểm đi' : 'Điểm đến'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-[300px] w-full sm:h-[360px] lg:h-[420px] xl:h-[460px]">
        <div ref={containerRef} className="h-full w-full" />
        {!isMapReady && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#f5f5f7] dark:bg-[#1d1d1f]">
            <Loader2 className="h-7 w-7 animate-spin text-[#0071e3]" />
          </div>
        )}
        <div
          className={`pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 transition-transform duration-150 ${isMoving ? '-translate-y-[calc(100%+8px)]' : '-translate-y-full'}`}
          aria-hidden="true"
        >
          <MapPin
            className={`h-11 w-11 drop-shadow-[0_4px_5px_rgba(0,0,0,0.35)] ${target === 'origin' ? 'fill-[#0071e3] text-[#0071e3]' : 'fill-[#ff3b30] text-[#ff3b30]'}`}
            strokeWidth={1.6}
          />
          <span className="absolute left-1/2 top-[15px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white" />
        </div>
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-medium text-gray-600 shadow-sm backdrop-blur dark:bg-black/75 dark:text-gray-300">
          {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
        </div>

        <div className="absolute bottom-3 left-3 right-3 z-20 min-w-0 rounded-[18px] border border-white/60 bg-white/95 p-3 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-md dark:border-white/10 dark:bg-black/80">
          <div className="flex min-w-0 flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-2 text-[13px] text-gray-600 dark:text-gray-300">
            <Crosshair className="h-4 w-4 shrink-0 text-[#0071e3]" />
            <span className="min-w-0 truncate">{isMoving ? 'Đang xác định tọa độ...' : `Sẵn sàng chọn làm ${target === 'origin' ? 'điểm đi' : 'điểm đến'}`}</span>
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isMapReady || isMoving || isResolving}
              className="inline-flex h-11 w-full min-w-0 shrink-0 items-center justify-center rounded-full bg-[#0071e3] px-4 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:opacity-50 xl:w-auto xl:px-6"
            >
              {isResolving && <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />}
              <span className="truncate">Dùng làm {target === 'origin' ? 'điểm đi' : 'điểm đến'}</span>
            </button>
          </div>
          {error && <p className="mt-2 break-words text-[12px] font-medium text-red-500">{error}</p>}
        </div>
      </div>
    </section>
  );
}
