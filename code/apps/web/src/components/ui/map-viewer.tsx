/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDirections, formatDuration, decodePolyline } from '@/lib/goong';
import GoongMap from '@/components/goong/goong-map';

interface Location {
  lat: number;
  lng: number;
}

interface MapViewerProps {
  origin?: Location;
  destination?: Location;
  className?: string;
  zoom?: number;
  /** Hiển thị thanh tìm kiếm + chọn kiểu bản đồ */
  showControls?: boolean;
  /** Bán kính vòng tròn xung quanh marker (mét), 0 = tắt */
  circleRadius?: number;
}

// Hà Nội làm center mặc định khi chưa có toạ độ
const DEFAULT_CENTER_LAT_LNG: [number, number] = [21.028511, 105.804817];

export const MapViewer: React.FC<MapViewerProps> = ({
  origin,
  destination,
  className,
  zoom = 14,
  showControls = false,
  circleRadius = 0,
}) => {
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  // polyline dạng [lng, lat][] để truyền vào GoongMap (MapLibre format)
  const [polyline, setPolyline] = useState<Array<[number, number]>>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  const isValidCoord = (v: unknown): v is number =>
    typeof v === 'number' && !isNaN(v);

  const hasValidCoords =
    isValidCoord(origin?.lat) &&
    isValidCoord(origin?.lng) &&
    isValidCoord(destination?.lat) &&
    isValidCoord(destination?.lng);

  useEffect(() => {
    if (!hasValidCoords) {
      setPolyline([]);
      setRouteInfo(null);
      return;
    }

    setIsLoadingRoute(true);
    // Goong Directions API nhận "lat,lng"
    const originStr = `${origin?.lat},${origin?.lng}`;
    const destStr = `${destination?.lat},${destination?.lng}`;

    getDirections(originStr, destStr)
      .then((data) => {
        if (data?.routes?.length) {
          const route = data.routes[0];
          if (route.overview_polyline?.points) {
            // decodePolyline trả về [lng, lat][] (đã xử lý trong goong.ts)
            const decoded = decodePolyline(route.overview_polyline.points);
            setPolyline(decoded);
          }
          if (route.legs?.length) {
            const leg = route.legs[0];
            setRouteInfo({
              distance: leg.distance.text,
              duration: formatDuration(leg.duration.value),
            });
          }
        }
      })
      .catch((err) => console.error('[MapViewer] Lỗi lấy route:', err))
      .finally(() => setIsLoadingRoute(false));
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng, hasValidCoords]);

  // GoongMap nhận center dạng [lat, lng] (format cũ của codebase)
  // GoongMap sẽ tự convert sang [lng, lat] bên trong
  const center: [number, number] = origin
    ? [origin.lat, origin.lng]
    : DEFAULT_CENTER_LAT_LNG;

  // Markers cho GoongMap: position phải là [lng, lat]
  // origin = vị trí hiện tại (dot xanh), destination = điểm đến (pin đỏ)
  const mapMarkers = [
    ...(origin ? [{
      position: [origin.lng, origin.lat] as [number, number],
      type: 'dot' as const,
      color: '#4285F4',
    }] : []),
    ...(destination ? [{
      position: [destination.lng, destination.lat] as [number, number],
      type: 'pin' as const,
      color: '#EA4335',
    }] : []),
  ];

  return (
    <div className={cn('rounded-[24px] overflow-hidden border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] relative', className)}>
      {isLoadingRoute && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/50 dark:bg-black/50 rounded-[24px]">
          <Loader2 className="w-6 h-6 animate-spin text-[#0071e3]" />
        </div>
      )}

      <GoongMap
        center={center}
        zoom={zoom}
        height="100%"
        className="w-full h-full"
        markers={mapMarkers}
        polylines={polyline.length > 0 ? [{ positions: polyline, color: '#0071e3' }] : []}
        routeInfo={routeInfo ?? undefined}
        circleRadius={circleRadius}
        showControls={showControls}
      />
    </div>
  );
};
