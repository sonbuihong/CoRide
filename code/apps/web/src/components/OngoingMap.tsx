import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2 } from 'lucide-react';

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

// Fix Leaflet's default icon issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom icons
const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const createNumberedIcon = (number: number) => {
  return L.divIcon({
    className: 'custom-numbered-icon',
    html: `<div style="background-color: #f97316; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); font-size: 14px;">${number}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const driverIcon = L.divIcon({
  className: '', // Removes default leaflet-div-icon styles
  html: '<div class="driver-location-marker"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

import { getGoongMultiStopRoute, decodeGoongPolyline } from '../lib/tsp.utils';

// Helper component to adjust map bounds
const MapBounds = ({ originPos, destPos, waypoints = [] }: { originPos: [number, number]; destPos: [number, number]; waypoints?: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (originPos && destPos) {
      const bounds = L.latLngBounds([originPos, destPos, ...waypoints]);
      map.fitBounds(bounds, { padding: [50, 50], animate: false });
    }
  }, [map, originPos, destPos, waypoints]);
  return null;
};

const OngoingMap: React.FC<OngoingMapProps> = ({ 
  originLat, originLng, destLat, destLng, 
  waypoints = [], driverLocation = null,
  onRouteOptimized, useCustomOrder = false
}) => {
  const [route, setRoute] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dùng ref để tránh gọi onRouteOptimized liên tục (infinite loop)
  const lastOptimizedIds = React.useRef<string>('');

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
            setRoute(polylineCoords);

            // Lấy thứ tự đón khách
            if (data.waypoints && onRouteOptimized) {
              // Mảng data.waypoints map 1-1 với: Origin, WP1, WP2..., Destination
              const middleWaypoints = data.waypoints.slice(1, -1);
              const optimalOrderIds = middleWaypoints
                .map((wp: any, idx: number) => ({ id: waypoints[idx].id, order: wp.waypoint_index }))
                .sort((a: any, b: any) => a.order - b.order)
                .map((item: any) => item.id as string);
                
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
            setRoute(polylineCoords);
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
  }, [originLat, originLng, destLat, destLng, driverLocation, waypoints.map(w => w.id).join(','), useCustomOrder]);

  // Remove early return for loading and error to prevent MapContainer from unmounting

  // Tính toán lại originPos cho marker
  const startLat = driverLocation?.lat ?? originLat;
  const startLng = driverLocation?.lng ?? originLng;
  
  // Nếu tọa độ không hợp lệ, không render Map để tránh lỗi Leaflet "Cannot read properties of null (reading 'lat')"
  if (typeof startLat !== 'number' || typeof startLng !== 'number' || typeof destLat !== 'number' || typeof destLng !== 'number') {
    return (
      <div className="h-full w-full z-0 relative bg-gray-50 flex flex-col items-center justify-center border border-gray-100 rounded-[24px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-4 text-[14px] text-gray-500 font-medium">Đang lấy toạ độ chuyến đi...</p>
      </div>
    );
  }

  const originPos: [number, number] = [startLat, startLng];
  const destPos: [number, number] = [destLat, destLng];
  const waypointsPos: [number, number][] = waypoints.map(wp => [wp.lat, wp.lng]);

  return (
    <div className="h-full w-full z-0 relative">
      {loading && route.length === 0 && (
        <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-4 text-sm text-gray-500 font-medium">Đang tìm đường...</p>
        </div>
      )}
      {error && route.length === 0 && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-red-50 p-4 text-center">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}
      <MapContainer 
        center={originPos} 
        zoom={13} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={false} // Ẩn nút zoom để giao diện giống mobile app
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" // Map style sáng, đẹp giống Apple Maps
        />
        <Marker position={originPos} icon={originIcon} />
        <Marker position={destPos} icon={destIcon} />
        {waypointsPos.map((wp, i) => (
          <Marker key={i} position={wp} icon={createNumberedIcon(i + 1)} />
        ))}
        {driverLocation && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon} />
        )}
        {route.length > 0 && (
          <Polyline positions={route} color="#0071e3" weight={5} opacity={0.8} />
        )}
        <MapBounds originPos={originPos} destPos={destPos} waypoints={waypointsPos} />
      </MapContainer>
    </div>
  );
};

export default OngoingMap;
