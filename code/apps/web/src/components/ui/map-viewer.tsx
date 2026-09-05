/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDirections, formatDuration, decodePolyline } from '@/lib/goong';
import dynamic from 'next/dynamic';

const GoongMap = dynamic(() => import('@/components/goong/goong-map'), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[200px] flex items-center justify-center bg-[rgba(0,0,0,0.03)] animate-pulse rounded-[14px]" />
});
interface Location {
  lat: number;
  lng: number;
}

interface MapViewerProps {
  origin?: Location;
  destination?: Location;
  waypoints?: Location[];
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
  waypoints = [],
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
    if (!hasValidCoords || !origin || !destination) {
      setPolyline([]);
      setRouteInfo(null);
      return;
    }

    if (origin.lat === destination.lat && origin.lng === destination.lng) {
      setPolyline([]);
      setRouteInfo(null);
      return;
    }

    setIsLoadingRoute(true);
    // Goong Directions API nhận "lat,lng"
    const originStr = `${origin?.lat},${origin?.lng}`;
    const destStr = `${destination?.lat},${destination?.lng}`;
    const waypointsStr = (waypoints || [])
      .filter((w) => isValidCoord(w.lat) && isValidCoord(w.lng))
      .map((w) => `${w.lat},${w.lng}`);

    getDirections(originStr, destStr, 'car', false, waypointsStr)
      .then((data) => {
        if (data?.routes?.length) {
          const route = data.routes[0];
          if (route.overview_polyline?.points) {
            // decodePolyline trả về [lng, lat][] (đã xử lý trong goong.ts)
            const decoded = decodePolyline(route.overview_polyline.points);
            setPolyline(decoded);
          }
          if (route.legs?.length) {
            const totalDistance = route.legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0);
            const totalDuration = route.legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0);
            setRouteInfo({
              distance: `${(totalDistance / 1000).toFixed(1)} km`,
              duration: formatDuration(totalDuration),
            });
          }
        }
      })
      .catch((err) => console.error('[MapViewer] Lỗi lấy route:', err))
      .finally(() => setIsLoadingRoute(false));
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng, hasValidCoords, JSON.stringify(waypoints)]);

  // GoongMap nhận center dạng [lat, lng] (format cũ của codebase)
  // GoongMap sẽ tự convert sang [lng, lat] bên trong
  const center: [number, number] = origin
    ? [origin.lat, origin.lng]
    : DEFAULT_CENTER_LAT_LNG;

  // Markers cho GoongMap: position phải là [lng, lat]
  // origin = vị trí bắt đầu (dot xanh), waypoints = các điểm dừng (pin vàng/cam), destination = điểm đến (pin đỏ)
  const mapMarkers = [
    ...(origin ? [{
      position: [origin.lng, origin.lat] as [number, number],
      type: 'dot' as const,
      color: '#4285F4',
    }] : []),
    ...(waypoints || [])
      .filter((w) => isValidCoord(w.lat) && isValidCoord(w.lng))
      .map((w, index) => ({
        position: [w.lng, w.lat] as [number, number],
        type: 'pin' as const,
        color: '#F59E0B',
      })),
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
