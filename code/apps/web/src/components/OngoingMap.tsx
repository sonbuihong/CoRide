import React, { useEffect, useState, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Loader2 } from 'lucide-react';
import { getGoongMultiStopRoute, decodeGoongPolyline } from '../lib/tsp.utils';

interface OngoingMapProps {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  waypoints?: { id?: string; lat: number; lng: number }[];
  driverLocation?: { lat: number; lng: number } | null;
  onRouteOptimized?: (orderedIds: string[]) => void;
  useCustomOrder?: boolean;
}

const OngoingMap: React.FC<OngoingMapProps> = ({ 
  originLat, originLng, destLat, destLng, 
  waypoints = [], driverLocation = null,
  onRouteOptimized, useCustomOrder = false
}) => {
  const [route, setRoute] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const driverMarkerRef = useRef<maplibregl.Marker | null>(null);
  
  const MAP_KEY = process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY || '';

  // Dùng ref để tránh gọi onRouteOptimized liên tục (infinite loop)
  const lastOptimizedIds = useRef<string>('');

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const startLat = driverLocation?.lat ?? originLat;
        const startLng = driverLocation?.lng ?? originLng;
        
        // Ngăn chặn gọi API nếu tọa độ chưa hợp lệ
        if (typeof startLat !== 'number' || typeof startLng !== 'number' || typeof destLat !== 'number' || typeof destLng !== 'number') {
          return;
        }

        setLoading(true);
        setError(null);
        
        const startCoord = { lat: startLat, lng: startLng };
        const destCoord = { lat: destLat, lng: destLng };

        // 1. Sắp xếp waypoint bằng Goong /v2/trip API (tương đương OSRM /trip)
        if (waypoints.length > 1 && !useCustomOrder) {
          const waypointsStr = waypoints.map(wp => `${wp.lat},${wp.lng}`).join(';');
          // Goong v2/trip nhận origin, destination, waypoints
          // Thêm roundtrip=false để không vẽ đường quay ngược lại điểm xuất phát
          const apiKey = process.env.NEXT_PUBLIC_GOONG_API_KEY || '';
          const url = `https://rsapi.goong.io/v2/trip?origin=${startLat},${startLng}&destination=${destLat},${destLng}&waypoints=${waypointsStr}&roundtrip=false&api_key=${apiKey}`;
          
          const res = await fetch(url);
          const data = await res.json();
          
          if (data.code === 'Ok' && data.trips && data.trips.length > 0) {
            // Lấy polyline
            const trip = data.trips[0];
            const polylineCoords = decodeGoongPolyline(trip.geometry);
            setRoute(polylineCoords.map(c => [c[1], c[0]]));

            // Lấy thứ tự đón khách
            if (data.waypoints && onRouteOptimized) {
              // Mảng data.waypoints map 1-1 với: Origin, WP1, WP2..., Destination
              const middleWaypoints = data.waypoints.slice(1, -1);
              const optimalOrderIds = middleWaypoints
                .map((wp: { waypoint_index: number }, idx: number) => ({ id: waypoints[idx].id, order: wp.waypoint_index }))
                .sort((a: { order: number }, b: { order: number }) => a.order - b.order)
                .map((item: { id: string | undefined }) => item.id as string);
                
              const currentIdsString = optimalOrderIds.join(',');
              if (lastOptimizedIds.current !== currentIdsString) {
                lastOptimizedIds.current = currentIdsString;
                onRouteOptimized(optimalOrderIds);
              }
            }
          } else {
            setError('Không thể tìm thấy đường đi (Goong Trip API).');
          }
        } else {
          // 2. Nếu <= 1 waypoint HOẶC useCustomOrder = true, gọi API Direction từng chặng
          const polylineCoords = await getGoongMultiStopRoute(startCoord, waypoints, destCoord);
          if (polylineCoords.length > 0) {
            setRoute(polylineCoords.map(c => [c[1], c[0]]));
          } else {
            setError('Không thể tìm thấy đường đi (Goong Direction API).');
          }
        }

      } catch (err: unknown) {
        console.error(err);
        setError('Lỗi khi lấy thông tin đường đi.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originLat, originLng, destLat, destLng, waypoints.map(w => w.id).join(','), useCustomOrder]);

  const startLat = driverLocation?.lat ?? originLat;
  const startLng = driverLocation?.lng ?? originLng;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    if (typeof startLat !== 'number' || typeof startLng !== 'number' || typeof destLat !== 'number' || typeof destLng !== 'number') {
      return;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://tiles.goong.io/assets/goong_map_web.json?api_key=${MAP_KEY}`,
      center: [originLng, originLat],
      zoom: 13,
    });

    mapRef.current = map;

    const driverElement = document.createElement('div');
    driverElement.className = 'goong-driver-marker';
    driverElement.style.width = '20px';
    driverElement.style.height = '20px';
    driverElement.style.backgroundColor = '#4285F4';
    driverElement.style.borderRadius = '50%';
    driverElement.style.border = '3px solid white';
    driverElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    driverMarkerRef.current = new maplibregl.Marker({ element: driverElement })
      .setLngLat([startLng, startLat])
      .addTo(map);

    return () => {
      driverMarkerRef.current?.remove();
      driverMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  // Marker tài xế được cập nhật riêng, không khởi tạo lại bản đồ theo GPS.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originLat, originLng, destLat, destLng, MAP_KEY]);

  useEffect(() => {
    driverMarkerRef.current?.setLngLat([startLng, startLat]);
  }, [startLat, startLng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || typeof startLat !== 'number' || typeof startLng !== 'number' || typeof destLat !== 'number' || typeof destLng !== 'number') return;

    // Remove existing markers
    const existingMarkers = mapContainerRef.current?.querySelectorAll('.goong-static-marker') ?? [];
    existingMarkers.forEach(m => m.remove());

    // Add dest marker
    const destEl = document.createElement('div');
    destEl.className = 'goong-static-marker';
    destEl.style.width = '25px';
    destEl.style.height = '41px';
    destEl.style.backgroundImage = 'url(https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png)';
    destEl.style.backgroundSize = '100% 100%';
    new maplibregl.Marker({ element: destEl, offset: [0, -20] }).setLngLat([destLng, destLat]).addTo(map);

    // Add waypoints
    waypoints.forEach((wp, i) => {
      const wpEl = document.createElement('div');
      wpEl.className = 'goong-static-marker';
      wpEl.innerHTML = `<div style="background-color: #f97316; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); font-size: 14px;">${i + 1}</div>`;
      new maplibregl.Marker({ element: wpEl }).setLngLat([wp.lng, wp.lat]).addTo(map);
    });

    // Update route polyline
    if (map.getSource('route')) {
      (map.getSource('route') as maplibregl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: route,
        },
      });
    } else if (route.length > 0) {
      const addRoute = () => {
        if (!mapRef.current) return;
        const currentMap = mapRef.current;
        if (!currentMap.getSource('route')) {
          currentMap.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: route,
              },
            },
          });
          currentMap.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#0071e3',
              'line-width': 5,
              'line-opacity': 0.8,
            },
          });
        }
      };

      if (map.loaded()) {
        addRoute();
      } else {
        map.once('load', addRoute);
      }
    }

    // Fit bounds
    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([originLng, originLat]);
    bounds.extend([destLng, destLat]);
    waypoints.forEach(wp => bounds.extend([wp.lng, wp.lat]));
    
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 50 });
    }
  }, [originLat, originLng, destLat, destLng, waypoints, route]);

  if (typeof startLat !== 'number' || typeof startLng !== 'number' || typeof destLat !== 'number' || typeof destLng !== 'number') {
    return (
      <div className="h-full w-full z-0 relative bg-gray-50 flex flex-col items-center justify-center border border-gray-100 rounded-[24px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-4 text-[14px] text-gray-500 font-medium">Đang lấy toạ độ chuyến đi...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full z-0 relative">
      {loading && route.length === 0 && (
        <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-white/70">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-4 text-sm text-gray-500 font-medium">Đang tìm đường...</p>
        </div>
      )}
      {error && route.length === 0 && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-red-50/90 p-4 text-center">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default OngoingMap;
