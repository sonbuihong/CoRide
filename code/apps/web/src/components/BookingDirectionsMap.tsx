'use client';

import React, { useEffect, useState, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Loader2 } from 'lucide-react';
import { getDirections, decodePolyline } from '@/lib/goong';

interface BookingDirectionsMapProps {
  pickupLat: number;
  pickupLng: number;
}

const BookingDirectionsMap: React.FC<BookingDirectionsMapProps> = ({ pickupLat, pickupLng }) => {
  const [driverPos, setDriverPos] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  
  const MAP_KEY = process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY || '';

  useEffect(() => {
    // 1. Get driver location
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ Geolocation.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentPos: [number, number] = [position.coords.latitude, position.coords.longitude];
        setDriverPos(currentPos);
        setLoading(false);
      },
      () => {
        setError('Không thể lấy vị trí hiện tại. Vui lòng cấp quyền truy cập vị trí.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (!driverPos || !mapContainerRef.current || mapRef.current) return;

    // Initialize MapLibre
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://tiles.goong.io/assets/goong_map_web.json?api_key=${MAP_KEY}`,
      center: [driverPos[1], driverPos[0]], // [lng, lat]
      zoom: 13,
    });

    map.on('load', async () => {
      // Add markers
      const driverEl = document.createElement('div');
      driverEl.className = 'driver-location-marker';
      driverEl.style.width = '18px';
      driverEl.style.height = '18px';
      driverEl.style.backgroundColor = '#4285F4';
      driverEl.style.borderRadius = '50%';
      driverEl.style.border = '2px solid white';
      driverEl.style.boxShadow = '0 0 4px rgba(0,0,0,0.3)';

      new maplibregl.Marker({ element: driverEl })
        .setLngLat([driverPos[1], driverPos[0]])
        .addTo(map);

      new maplibregl.Marker({ color: '#EA4335' })
        .setLngLat([pickupLng, pickupLat])
        .addTo(map);

      // Fit bounds
      const bounds = new maplibregl.LngLatBounds()
        .extend([driverPos[1], driverPos[0]])
        .extend([pickupLng, pickupLat]);
        
      map.fitBounds(bounds, { padding: 50 });

      // Fetch directions using Goong API
      try {
        const originStr = `${driverPos[0]},${driverPos[1]}`;
        const destStr = `${pickupLat},${pickupLng}`;
        const data = await getDirections(originStr, destStr);

        if (data && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          if (route.overview_polyline?.points) {
            const decoded = decodePolyline(route.overview_polyline.points);
            
            map.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: decoded, // decodePolyline already returns [lng, lat]
                },
              },
            });

            map.addLayer({
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
        }
      } catch (err) {
        console.error('Error fetching directions:', err);
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [driverPos, pickupLat, pickupLng, MAP_KEY]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl border border-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-4 text-sm text-gray-500 font-medium">Đang lấy vị trí và tìm đường...</p>
      </div>
    );
  }

  if (error || !driverPos) {
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 rounded-xl border border-red-100 p-4 text-center">
        <p className="text-sm text-red-600 font-medium">{error || 'Có lỗi xảy ra'}</p>
      </div>
    );
  }

  return (
    <div className="h-80 w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm z-0 relative">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};

export default BookingDirectionsMap;
