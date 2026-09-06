'use client';

import type { GoongVehicleType } from '@repo/shared';
import { Loader2 } from 'lucide-react';
import * as maplibregl from 'maplibre-gl';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  DriverRouteLifecycle,
  type DriverRoute,
  type LiveLocation,
} from '../lib/driver-route-lifecycle';

interface OngoingMapProps {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  waypoints?: Array<{ id?: string; lat: number; lng: number }>;
  driverLocation?: LiveLocation | null;
  vehicle?: GoongVehicleType;
}

const OngoingMap: React.FC<OngoingMapProps> = ({
  originLat,
  originLng,
  destLat,
  destLng,
  waypoints = [],
  driverLocation = null,
  vehicle = 'car',
}) => {
  const [baseRoute, setBaseRoute] = useState<DriverRoute | null>(null);
  const [activeRoute, setActiveRoute] = useState<DriverRoute | null>(null);
  const [baseLoading, setBaseLoading] = useState(true);
  const [activeLoading, setActiveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const driverMarkerRef = useRef<maplibregl.Marker | null>(null);
  const staticMarkersRef = useRef<maplibregl.Marker[]>([]);
  const lifecycleRef = useRef(new DriverRouteLifecycle());
  const waypointsRef = useRef(waypoints);
  const hadPickupTopologyRef = useRef(false);

  waypointsRef.current = waypoints;

  const mapKey = process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY || '';
  const waypointKey = waypoints
    .map((point) => `${point.id ?? ''}:${point.lat.toFixed(6)},${point.lng.toFixed(6)}`)
    .join('|');
  const displayedRoute = activeRoute ?? baseRoute;
  const route = useMemo(() => displayedRoute?.coordinates ?? [], [displayedRoute]);
  const startLat = driverLocation?.lat ?? originLat;
  const startLng = driverLocation?.lng ?? originLng;

  // GPS only updates the live snapshot used by the marker and future events.
  useEffect(() => {
    lifecycleRef.current.updateLiveLocation(driverLocation);
  }, [driverLocation]);

  // Initial route: one request for confirmed origin -> confirmed destination.
  useEffect(() => {
    let cancelled = false;
    setBaseLoading(true);
    setError(null);

    void lifecycleRef.current
      .confirmRoute(
        { lat: originLat, lng: originLng },
        { lat: destLat, lng: destLng },
        vehicle,
      )
      .then((result) => {
        if (!cancelled && result.isLatest) setBaseRoute(result.route);
      })
      .catch(() => {
        if (!cancelled) setError('Không thể tìm thấy tuyến đường phù hợp.');
      })
      .finally(() => {
        if (!cancelled) setBaseLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [destLat, destLng, originLat, originLng, vehicle]);

  // Booking stop changes are business events. GPS is deliberately absent here.
  useEffect(() => {
    const hasPickups = waypointKey.length > 0;
    const hadPickups = hadPickupTopologyRef.current;
    if (!hasPickups && !hadPickups) return;
    hadPickupTopologyRef.current = hasPickups || hadPickups;

    let cancelled = false;
    setActiveLoading(true);
    setError(null);
    const request = hasPickups
      ? lifecycleRef.current.acceptPickups(
          waypointsRef.current.map(({ lat, lng }) => ({ lat, lng })),
          vehicle,
        )
      : lifecycleRef.current.removePickups(vehicle);

    void request
      .then((result) => {
        if (!cancelled && result.isLatest) setActiveRoute(result.route);
      })
      .catch(() => {
        if (!cancelled) setError('Không thể cập nhật tuyến đường đón khách.');
      })
      .finally(() => {
        if (!cancelled) setActiveLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [destLat, destLng, originLat, originLng, vehicle, waypointKey]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://tiles.goong.io/assets/goong_map_web.json?api_key=${mapKey}`,
      center: [originLng, originLat],
      zoom: 13,
    });
    mapRef.current = map;

    const driverElement = document.createElement('div');
    driverElement.className = 'goong-driver-marker';
    driverElement.style.cssText = `
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      pointer-events: none;
    `;
    driverElement.innerHTML = `
      <div style="
        background: #0071e3;
        color: #ffffff;
        font-size: 11px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 12px;
        margin-bottom: 4px;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        border: 1.5px solid #ffffff;
        letter-spacing: 0.2px;
      ">Tài xế</div>
      <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          background: #0071e3;
          opacity: 0.35;
          animation: driver-pulse 2s ease-out infinite;
        "></div>
        <div style="
          position: relative;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #0071e3;
          border: 3px solid #ffffff;
          box-shadow: 0 3px 10px rgba(0,113,227,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z"/>
            <circle cx="7.5" cy="14.5" r="1.5"/>
            <circle cx="16.5" cy="14.5" r="1.5"/>
          </svg>
        </div>
      </div>
    `;
    if (!document.getElementById('driver-marker-keyframes')) {
      const style = document.createElement('style');
      style.id = 'driver-marker-keyframes';
      style.textContent = `
        @keyframes driver-pulse {
          0% { transform: scale(0.85); opacity: 0.5; }
          100% { transform: scale(1.7); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    driverMarkerRef.current = new maplibregl.Marker({ element: driverElement, anchor: 'center' })
      .setLngLat([startLng, startLat])
      .addTo(map);

    return () => {
      staticMarkersRef.current.forEach((marker) => marker.remove());
      staticMarkersRef.current = [];
      driverMarkerRef.current?.remove();
      driverMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // GPS updates are handled by the marker effect, not map recreation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapKey]);

  useEffect(() => {
    driverMarkerRef.current?.setLngLat([startLng, startLat]);
  }, [startLat, startLng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    staticMarkersRef.current.forEach((marker) => marker.remove());
    staticMarkersRef.current = [];

    const destinationElement = document.createElement('div');
    destinationElement.className = 'goong-static-marker';
    Object.assign(destinationElement.style, {
      width: '25px',
      height: '41px',
      backgroundImage: 'url(https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png)',
      backgroundSize: '100% 100%',
    });
    staticMarkersRef.current.push(
      new maplibregl.Marker({ element: destinationElement, offset: [0, -20] })
        .setLngLat([destLng, destLat])
        .addTo(map),
    );

    waypointsRef.current.forEach((point, index) => {
      const element = document.createElement('div');
      element.className = 'goong-static-marker';
      element.textContent = String(index + 1);
      Object.assign(element.style, {
        backgroundColor: '#f97316',
        color: 'white',
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        border: '2px solid white',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
        fontSize: '14px',
      });
      staticMarkersRef.current.push(
        new maplibregl.Marker({ element }).setLngLat([point.lng, point.lat]).addTo(map),
      );
    });

    const routeData: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: route },
    };
    const updateRoute = () => {
      const currentMap = mapRef.current;
      if (!currentMap || route.length === 0) return;
      const source = currentMap.getSource('route') as maplibregl.GeoJSONSource | undefined;
      if (source) source.setData(routeData);
      else {
        currentMap.addSource('route', { type: 'geojson', data: routeData });
        currentMap.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#0071e3', 'line-width': 5, 'line-opacity': 0.8 },
        });
      }
    };
    if (map.loaded()) updateRoute();
    else map.once('load', updateRoute);

    // Bounds represent route topology and never follow the noisy GPS marker.
    const bounds = new maplibregl.LngLatBounds();
    if (route.length > 0) route.forEach((coordinate) => bounds.extend(coordinate));
    else {
      bounds.extend([originLng, originLat]);
      bounds.extend([destLng, destLat]);
      waypointsRef.current.forEach((point) => bounds.extend([point.lng, point.lat]));
    }
    if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 50 });
  }, [destLat, destLng, originLat, originLng, route, waypointKey]);

  const loading = baseLoading || activeLoading;
  return (
    <div className="relative z-0 h-full w-full">
      {loading && route.length === 0 && (
        <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-white/70">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-4 text-sm font-medium text-gray-500">Đang tìm đường...</p>
        </div>
      )}
      {error && route.length === 0 && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-red-50/90 p-4 text-center">
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
};

export default OngoingMap;
