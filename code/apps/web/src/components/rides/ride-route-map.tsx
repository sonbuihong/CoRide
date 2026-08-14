'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { decodePolyline, formatDistance, formatDuration, getDirections } from '@/lib/goong';

const GoongMap = dynamic(() => import('@/components/goong/goong-map'), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[200px] w-full animate-pulse rounded-[14px] bg-[rgba(0,0,0,0.03)]" />
  ),
});

interface GeoPoint {
  lat: number;
  lng: number;
}

interface RouteSummary {
  distanceMeters: number;
  durationSeconds: number;
}

interface RideRouteMapProps {
  origin: GeoPoint;
  destination: GeoPoint;
  passengerOrigin?: GeoPoint | null;
  passengerDestination?: GeoPoint | null;
  /** Callback trả về distance (km) và duration (giây) của tuyến tài xế. */
  onRouteCalculated?: (distanceKm: number, durationSeconds: number) => void;
}

const DRIVER_ROUTE_COLOR = '#0071e3';
const PASSENGER_ROUTE_COLOR = '#f97316';

const isValidPoint = (point?: GeoPoint | null): point is GeoPoint =>
  Boolean(
    point &&
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    point.lat >= -90 && point.lat <= 90 &&
    point.lng >= -180 && point.lng <= 180
  );

const fallbackPolyline = (origin: GeoPoint, destination: GeoPoint): Array<[number, number]> => [
  [origin.lng, origin.lat],
  [destination.lng, destination.lat],
];

const RideRouteMap = ({
  origin,
  destination,
  passengerOrigin,
  passengerDestination,
  onRouteCalculated,
}: RideRouteMapProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [driverPolyline, setDriverPolyline] = useState<Array<[number, number]>>([]);
  const [passengerPolyline, setPassengerPolyline] = useState<Array<[number, number]>>([]);
  const [driverSummary, setDriverSummary] = useState<RouteSummary | null>(null);
  const [passengerSummary, setPassengerSummary] = useState<RouteSummary | null>(null);

  const hasDriverRoute = isValidPoint(origin) && isValidPoint(destination);
  const hasPassengerOrigin = isValidPoint(passengerOrigin);
  const hasPassengerRoute =
    hasPassengerOrigin && isValidPoint(passengerDestination);

  useEffect(() => {
    let cancelled = false;

    if (!hasDriverRoute || (origin.lat === destination.lat && origin.lng === destination.lng)) {
      setDriverPolyline([]);
      setPassengerPolyline([]);
      setIsLoading(false);
      return () => { cancelled = true; };
    }

    const loadRoute = async (start: GeoPoint, end: GeoPoint) => {
      const data = await getDirections(`${start.lat},${start.lng}`, `${end.lat},${end.lng}`);
      const route = data?.routes?.[0];
      const points = route?.overview_polyline?.points
        ? decodePolyline(route.overview_polyline.points)
        : fallbackPolyline(start, end);
      const leg = route?.legs?.[0];

      return {
        polyline: points.length >= 2 ? points : fallbackPolyline(start, end),
        summary: leg
          ? {
              distanceMeters: leg.distance.value,
              durationSeconds: leg.duration.value,
            }
          : null,
      };
    };

    const loadRoutes = async () => {
      setIsLoading(true);
      setDriverSummary(null);
      setPassengerSummary(null);
      setPassengerPolyline([]);

      try {
        const driverRequest = loadRoute(origin, destination);
        const passengerRequest = hasPassengerRoute
          ? loadRoute(passengerOrigin, passengerDestination)
          : Promise.resolve(null);
        const [driverResult, passengerResult] = await Promise.all([
          driverRequest,
          passengerRequest,
        ]);

        if (cancelled) return;

        setDriverPolyline(driverResult.polyline);
        setDriverSummary(driverResult.summary);
        if (driverResult.summary && onRouteCalculated) {
          onRouteCalculated(
            driverResult.summary.distanceMeters / 1000,
            driverResult.summary.durationSeconds
          );
        }

        if (passengerResult) {
          setPassengerPolyline(passengerResult.polyline);
          setPassengerSummary(passengerResult.summary);
        }
      } catch (error) {
        if (cancelled) return;
        console.error('[RideRouteMap] Lỗi lấy dữ liệu tuyến:', error);
        setDriverPolyline(fallbackPolyline(origin, destination));
        if (hasPassengerRoute) {
          setPassengerPolyline(fallbackPolyline(passengerOrigin, passengerDestination));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadRoutes();
    return () => { cancelled = true; };
    // Tọa độ scalar bên dưới đã bao phủ đầy đủ các object point và tránh gọi
    // lại Directions API chỉ vì parent tạo object mới trong một lần render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    destination.lat,
    destination.lng,
    hasDriverRoute,
    hasPassengerRoute,
    onRouteCalculated,
    origin.lat,
    origin.lng,
    passengerDestination?.lat,
    passengerDestination?.lng,
    passengerOrigin?.lat,
    passengerOrigin?.lng,
  ]);

  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center rounded-[16px] border border-black/5 bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.02]">
        <Loader2 className="h-6 w-6 animate-spin text-[#0071e3]" />
      </div>
    );
  }

  if (!hasDriverRoute) {
    return (
      <div className="flex h-[200px] w-full items-center justify-center rounded-[16px] border border-black/5 bg-black/[0.02] text-[14px] text-black/40 dark:border-white/5 dark:bg-white/[0.02] dark:text-white/40">
        Không có dữ liệu bản đồ cho chuyến đi này.
      </div>
    );
  }

  const showPassengerRoute = hasPassengerRoute && passengerPolyline.length >= 2;
  const markers = [
    {
      position: [origin.lng, origin.lat] as [number, number],
      type: 'dot' as const,
      color: DRIVER_ROUTE_COLOR,
      renderMode: 'layer' as const,
    },
    {
      position: [destination.lng, destination.lat] as [number, number],
      type: 'pin' as const,
      color: DRIVER_ROUTE_COLOR,
      renderMode: 'layer' as const,
    },
    ...(hasPassengerOrigin
      ? [
          {
            position: [passengerOrigin.lng, passengerOrigin.lat] as [number, number],
            type: 'dot' as const,
            color: PASSENGER_ROUTE_COLOR,
            renderMode: 'layer' as const,
          },
        ]
      : []),
    ...(showPassengerRoute
      ? [
          {
            position: [passengerDestination.lng, passengerDestination.lat] as [number, number],
            type: 'pin' as const,
            color: PASSENGER_ROUTE_COLOR,
            renderMode: 'layer' as const,
          },
        ]
      : []),
  ];

  return (
    <div className="w-full overflow-hidden rounded-[16px] border border-black/10 shadow-sm dark:border-white/10">
      <div className="flex flex-col gap-3 border-b border-black/5 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#1d1d1f] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-black/60 dark:text-white/60">
          {driverSummary && (
            <span>
              Tuyến tài xế: <strong className="text-[#1d1d1f] dark:text-white">{formatDistance(driverSummary.distanceMeters)} · {formatDuration(driverSummary.durationSeconds)}</strong>
            </span>
          )}
          {showPassengerRoute && passengerSummary && (
            <span>
              Tuyến của bạn: <strong className="text-[#1d1d1f] dark:text-white">{formatDistance(passengerSummary.distanceMeters)} · {formatDuration(passengerSummary.durationSeconds)}</strong>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3" aria-label="Chú giải tuyến đường">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[#1d1d1f] dark:text-white">
            <span className="block h-[4px] w-8 rounded-full bg-[#0071e3]" aria-hidden="true" />
            Tuyến tài xế
          </div>
          {hasPassengerOrigin && (
            <div className="flex items-center gap-2 text-[12px] font-semibold text-[#1d1d1f] dark:text-white">
              <span className="block h-3 w-3 rounded-full bg-[#f97316] ring-2 ring-[#f97316]/20" aria-hidden="true" />
              {showPassengerRoute ? 'Vị trí & tuyến hành khách' : 'Vị trí hành khách'}
            </div>
          )}
        </div>
      </div>

      <GoongMap
        center={[origin.lat, origin.lng]}
        zoom={13}
        height="320px"
        markers={markers}
        polylines={[
          { positions: driverPolyline, color: DRIVER_ROUTE_COLOR, width: 6, opacity: 0.9 },
          ...(showPassengerRoute
            ? [{
                positions: passengerPolyline,
                color: PASSENGER_ROUTE_COLOR,
                width: 5,
                opacity: 0.95,
                dashArray: [1.5, 1.2],
              }]
            : []),
        ]}
      />
    </div>
  );
};

export default RideRouteMap;
