import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2 } from 'lucide-react';

interface BookingDirectionsMapProps {
  pickupLat: number;
  pickupLng: number;
}

// Fix Leaflet's default icon issue with webpack/Next.js
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom icons
const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Helper component to adjust map bounds
const MapBounds = ({ driverPos, pickupPos }: { driverPos: [number, number]; pickupPos: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (driverPos && pickupPos) {
      const bounds = L.latLngBounds([driverPos, pickupPos]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, driverPos, pickupPos]);
  return null;
};

const BookingDirectionsMap: React.FC<BookingDirectionsMapProps> = ({ pickupLat, pickupLng }) => {
  const [driverPos, setDriverPos] = useState<[number, number] | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Get driver location
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ Geolocation.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const currentPos: [number, number] = [position.coords.latitude, position.coords.longitude];
        setDriverPos(currentPos);

        // 2. Fetch directions from OSRM
        try {
          // OSRM expects: longitude,latitude
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${currentPos[1]},${currentPos[0]};${pickupLng},${pickupLat}?overview=full&geometries=geojson`
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
      },
      () => {
        setError('Không thể lấy vị trí hiện tại. Vui lòng cấp quyền truy cập vị trí.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [pickupLat, pickupLng]);

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

  const pickupPos: [number, number] = [pickupLat, pickupLng];

  return (
    <div className="h-80 w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm z-0 relative">
      <MapContainer 
        center={driverPos} 
        zoom={13} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={driverPos} icon={driverIcon} />
        <Marker position={pickupPos} icon={pickupIcon} />
        {route.length > 0 && (
          <Polyline positions={route} color="#0071e3" weight={5} opacity={0.7} />
        )}
        <MapBounds driverPos={driverPos} pickupPos={pickupPos} />
      </MapContainer>
    </div>
  );
};

export default BookingDirectionsMap;
