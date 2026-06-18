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

// Helper component to adjust map bounds
const MapBounds = ({ originPos, destPos }: { originPos: [number, number]; destPos: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (originPos && destPos) {
      const bounds = L.latLngBounds([originPos, destPos]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, originPos, destPos]);
  return null;
};

const OngoingMap: React.FC<OngoingMapProps> = ({ originLat, originLng, destLat, destLng }) => {
  const [route, setRoute] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        setLoading(true);
        // OSRM expects: longitude,latitude
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        if (data.code === 'Ok' && data.routes.length > 0) {
          // GeoJSON returns [lng, lat], we need [lat, lng] for Leaflet Polyline
          const coordinates = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          setRoute(coordinates);
        } else {
          setError('Không thể tìm thấy đường đi.');
        }
      } catch (err: unknown) {
        setError('Lỗi khi lấy thông tin đường đi.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [originLat, originLng, destLat, destLng]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-4 text-sm text-gray-500 font-medium">Đang tìm đường...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-red-50 p-4 text-center">
        <p className="text-sm text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  const originPos: [number, number] = [originLat, originLng];
  const destPos: [number, number] = [destLat, destLng];

  return (
    <div className="h-full w-full z-0 relative">
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
        {route.length > 0 && (
          <Polyline positions={route} color="#0071e3" weight={5} opacity={0.8} />
        )}
        <MapBounds originPos={originPos} destPos={destPos} />
      </MapContainer>
    </div>
  );
};

export default OngoingMap;
