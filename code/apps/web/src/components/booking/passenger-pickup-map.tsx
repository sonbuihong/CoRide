'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { reverseGeocode } from '@/lib/goong';

interface PassengerPickupMapProps {
  onConfirm: (lat: number, lng: number, address: string) => void;
  onCancel: () => void;
  defaultLat?: number;
  defaultLng?: number;
}

export function PassengerPickupMap({ onConfirm, onCancel, defaultLat = 21.0285, defaultLng = 105.8542 }: PassengerPickupMapProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  // This remains stable while the live center changes during pan/zoom.
  const [initialPosition, setInitialPosition] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const MAP_KEY = process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY || '';

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const nextPosition: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setPosition(nextPosition);
          setInitialPosition(nextPosition);
          setLoading(false);
        },
        () => {
          // Lỗi lấy location, fallback về default
          const fallbackPosition: [number, number] = [defaultLat, defaultLng];
          setPosition(fallbackPosition);
          setInitialPosition(fallbackPosition);
          setLoading(false);
        }
      );
    } else {
      const fallbackPosition: [number, number] = [defaultLat, defaultLng];
      setPosition(fallbackPosition);
      setInitialPosition(fallbackPosition);
      setLoading(false);
    }
  }, [defaultLat, defaultLng]);

  // Khởi tạo bản đồ MapLibre
  useEffect(() => {
    if (loading || !initialPosition || !mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: `https://tiles.goong.io/assets/goong_map_web.json?api_key=${MAP_KEY}`,
      center: [initialPosition[1], initialPosition[0]], // [lng, lat]
      zoom: 15,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('moveend', () => {
      const center = map.getCenter();
      setPosition([center.lat, center.lng]);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [loading, initialPosition, MAP_KEY]);

  // Reverse geocode whenever position changes
  useEffect(() => {
    const fetchAddress = async () => {
      if (!position) return;
      setLoadingAddress(true);
      try {
        const result = await reverseGeocode(position[0], position[1]);
        setAddress(result || 'Không thể xác định địa chỉ');
      } catch (err) {
        console.error(err);
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
      <div className="relative h-[300px] w-full rounded-md overflow-hidden border border-gray-200 bg-gray-100">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
        
        {/* Ghim cố định ở giữa bản đồ */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 z-[11]"
          style={{ transform: 'translate(-50%, -100%)' }}
          aria-hidden="true"
        >
          <MapPin className="h-10 w-10 fill-orange-500 text-white drop-shadow-[0_3px_3px_rgba(0,0,0,0.35)]" strokeWidth={1.8} />
        </div>

        {/* Nút re-center về vị trí hiện tại */}
        <button
          className="absolute bottom-4 right-2 z-[11] bg-white p-2 rounded-full shadow-md text-gray-700 hover:text-blue-600 focus:outline-none"
          onClick={() => {
            if ('geolocation' in navigator) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                  setPosition(newPos);
                  if (mapRef.current) {
                    mapRef.current.flyTo({ center: [newPos[1], newPos[0]], zoom: 15 });
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
