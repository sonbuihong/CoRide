'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { reverseGeocode } from '@/lib/goong';

// Fix Leaflet's default icon issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface PassengerPickupMapProps {
  onConfirm: (lat: number, lng: number, address: string) => void;
  onCancel: () => void;
  defaultLat?: number;
  defaultLng?: number;
}

// Component bắt sự kiện di chuyển bản đồ để đổi toạ độ
function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    moveend() {
      const center = map.getCenter();
      onLocationSelect(center.lat, center.lng);
    },
  });
  return null;
}

export function PassengerPickupMap({ onConfirm, onCancel, defaultLat = 21.0285, defaultLng = 105.8542 }: PassengerPickupMapProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
          setLoading(false);
        },
        () => {
          // Lỗi lấy location, fallback về default
          setPosition([defaultLat, defaultLng]);
          setLoading(false);
        }
      );
    } else {
      setPosition([defaultLat, defaultLng]);
      setLoading(false);
    }
  }, [defaultLat, defaultLng]);

  // Reverse geocode whenever position changes
  useEffect(() => {
    const fetchAddress = async () => {
      if (!position) return;
      setLoadingAddress(true);
      try {
        const result = await reverseGeocode(position[0], position[1]);
        setAddress(result || 'Không thể xác định địa chỉ');
      } catch (error) {
        setAddress('Không thể xác định địa chỉ');
      } finally {
        setLoadingAddress(false);
      }
    };
    
    // Thêm chút delay để tránh gọi api liên tục nếu kéo thả nhanh
    const timer = setTimeout(() => {
      fetchAddress();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [position]);

  const handleMapMoveEnd = (lat: number, lng: number) => {
    setPosition([lat, lng]);
  };

  if (loading || !position) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] w-full bg-gray-50 rounded-md">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-4 text-sm text-gray-500 font-medium">Đang định vị...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative h-[300px] w-full rounded-md overflow-hidden border border-gray-200">
        <MapContainer
          center={position}
          zoom={15}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapEvents onLocationSelect={handleMapMoveEnd} />
        </MapContainer>
        
        {/* Shadow của ghim ở giữa bản đồ */}
        <div className="absolute top-1/2 left-1/2 z-[399] pointer-events-none" style={{ transform: 'translate(-12px, -41px)' }}>
          <img 
            src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png"
            alt="shadow"
            style={{ width: '41px', height: '41px' }}
          />
        </div>
        {/* Ghim cố định ở giữa bản đồ */}
        <div className="absolute top-1/2 left-1/2 z-[400] pointer-events-none" style={{ transform: 'translate(-50%, -100%)' }}>
          <img 
            src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png"
            alt="marker"
            style={{ width: '25px', height: '41px' }}
          />
        </div>

        {/* Nút re-center về vị trí hiện tại */}
        <button
          className="absolute bottom-2 right-2 z-[400] bg-white p-2 rounded-full shadow-md text-gray-700 hover:text-blue-600 focus:outline-none"
          onClick={() => {
            if ('geolocation' in navigator) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                  setPosition(newPos);
                  if (mapRef.current) {
                    mapRef.current.setView(newPos, 15);
                  }
                }
              );
            }
          }}
          title="Về vị trí hiện tại"
        >
          <MapPin className="h-5 w-5" />
        </button>
      </div>

      <div className="bg-gray-50 p-3 rounded-md text-sm min-h-[60px] flex items-center">
        {loadingAddress ? (
          <div className="flex items-center text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Đang lấy địa chỉ...
          </div>
        ) : (
          <div className="flex items-start">
            <MapPin className="h-4 w-4 mr-2 text-orange-500 mt-0.5 shrink-0" />
            <span className="text-gray-800 font-medium">{address}</span>
          </div>
        )}
      </div>
      
      <p className="text-xs text-gray-500 text-center">
        Bạn có thể di chuyển bản đồ để chọn chính xác điểm đón 📍.
      </p>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button 
          onClick={() => onConfirm(position[0], position[1], address)} 
          disabled={loadingAddress || !address}
        >
          Xác nhận điểm đón
        </Button>
      </div>
    </div>
  );
}
