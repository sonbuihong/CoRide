'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import GoongMap from '@/components/goong/goong-map';
import { getDirections, formatDistance, formatDuration, decodePolyline } from '@/lib/goong';

interface RideRouteMapProps {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  /** Callback trả về distance (km) và duration (giây) sau khi tính xong */
  onRouteCalculated?: (distanceKm: number, durationSeconds: number) => void;
}

const RideRouteMap = ({ origin, destination, onRouteCalculated }: RideRouteMapProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [routeData, setRouteData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [polyline, setPolyline] = useState<Array<[number, number]>>([]);

  // Guard: kiểm tra tọa độ hợp lệ
  const isValidCoord = (v: unknown): v is number =>
    typeof v === 'number' && !isNaN(v);

  const hasValidCoords =
    isValidCoord(origin.lat) &&
    isValidCoord(origin.lng) &&
    isValidCoord(destination.lat) &&
    isValidCoord(destination.lng);

  useEffect(() => {
    if (!hasValidCoords) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const originStr = `${origin.lat},${origin.lng}`;
    const destStr = `${destination.lat},${destination.lng}`;

    getDirections(originStr, destStr)
      .then((data) => {
        if (data && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          setRouteData(route);
          
          // Decode polyline
          if (route.overview_polyline?.points) {
            const decoded = decodePolyline(route.overview_polyline.points);
            setPolyline(decoded);
          }

          // Callback với distance và duration
          if (route.legs && route.legs.length > 0 && onRouteCalculated) {
            const leg = route.legs[0];
            const distanceKm = leg.distance.value / 1000; // Convert meters to km
            const durationSeconds = leg.duration.value;
            onRouteCalculated(distanceKm, durationSeconds);
          }
        }
      })
      .catch((err) => console.error('[RideRouteMap] Lỗi lấy route:', err))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin.lat, origin.lng, destination.lat, destination.lng, onRouteCalculated, hasValidCoords]);

  if (isLoading) {
    return (
      <div className="w-full h-[400px] bg-[rgba(0,0,0,0.02)] rounded-[16px] flex items-center justify-center border border-[rgba(0,0,0,0.04)]">
        <Loader2 className="h-6 w-6 animate-spin text-[#0071e3]" />
      </div>
    );
  }

  // Guard: không có toạ độ hợp lệ
  if (!hasValidCoords) {
    return (
      <div className="w-full h-[200px] bg-[rgba(0,0,0,0.02)] rounded-[16px] flex items-center justify-center border border-[rgba(0,0,0,0.04)] text-[14px] text-[rgba(0,0,0,0.4)] dark:text-[rgba(255,255,255,0.4)]">
        Không có dữ liệu bản đồ cho chuyến đi này.
      </div>
    );
  }

  return (
    <div className="w-full border border-[rgba(0,0,0,0.08)] rounded-[16px] overflow-hidden shadow-sm">
      {/* Thông tin route tổng quan */}
      {routeData && routeData.legs && routeData.legs.length > 0 && (
        <div className="bg-white dark:bg-[#1d1d1f] px-4 py-2.5 flex items-center gap-6 border-b border-[rgba(0,0,0,0.05)] text-[13px] text-[rgba(0,0,0,0.6)] dark:text-[rgba(255,255,255,0.6)]">
          <span>Khoảng cách: <strong className="text-[#1d1d1f] dark:text-white">{formatDistance(routeData.legs[0].distance.value)}</strong></span>
          <span>Thời gian: <strong className="text-[#1d1d1f] dark:text-white">{formatDuration(routeData.legs[0].duration.value)}</strong></span>
        </div>
      )}

      <GoongMap
        center={[origin.lat, origin.lng]}
        zoom={13}
        height="380px"
        markers={[
          { position: [origin.lng, origin.lat], type: 'dot' as const, color: '#4285F4' },
          { position: [destination.lng, destination.lat], type: 'pin' as const, color: '#EA4335' },
        ]}
        polylines={polyline.length > 0 ? [{ positions: polyline, color: '#0071e3' }] : []}
      />
    </div>
  );
};

export default RideRouteMap;
