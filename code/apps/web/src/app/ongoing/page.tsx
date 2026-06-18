'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { Loader2 } from 'lucide-react';
import OngoingMap from '@/components/OngoingMap';
import DriverView from './driver-view';
import PassengerView from './passenger-view';

export default function OngoingPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeData, setActiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchActiveRide = async () => {
    try {
      const res = await apiClient.get('/bookings/active');
      if (res.data.activeBooking) {
        setActiveData(res.data.activeBooking);
      } else {
        // Không có chuyến đi, đá ra ngoài
        router.replace('/rides/search');
      }
    } catch (error) {
      console.error(error);
      router.replace('/rides/search');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRide();
    
    // Poll API mỗi 10 giây để cập nhật trạng thái mới nhất
    const interval = setInterval(() => {
      fetchActiveRide();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [router]);

  if (loading || !activeData) {
    return (
      <div className="flex min-h-[calc(100vh-48px)] flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#0071e3]" />
        <p className="mt-4 text-sm font-medium text-gray-500">Đang tải thông tin chuyến đi...</p>
      </div>
    );
  }

  const role = activeData.userRole; // 'DRIVER' hoặc 'PASSENGER'
  // Cả 2 role đều trả về object có thuộc tính ride
  const ride = role === 'DRIVER' ? activeData.ride : activeData.ride;

  return (
    <div className="relative h-[calc(100vh-48px)] w-full overflow-hidden bg-gray-100 flex flex-col">
      {/* Map Section - Chiếm phần lớn màn hình */}
      <div className="flex-1 w-full relative z-0" onClick={() => setIsExpanded(false)}>
        <OngoingMap
          originLat={ride.originLat}
          originLng={ride.originLng}
          destLat={ride.destinationLat}
          destLng={ride.destinationLng}
        />
      </div>

      {/* Bottom Sheet Section - Lớp phủ lên bản đồ */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-10 w-full bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out flex flex-col ${isExpanded ? 'h-[85vh]' : 'h-auto max-h-[45vh]'}`}
      >
        {/* Thanh điều khiển (Drag Handle) */}
        <div 
          className="w-full flex justify-center pt-4 pb-2 cursor-pointer sticky top-0 bg-white z-20 shrink-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>
        
        <div className={`flex-1 w-full ${isExpanded ? 'overflow-y-auto' : 'overflow-hidden'}`}>
          {role === 'DRIVER' ? (
            <DriverView data={activeData} onRefresh={fetchActiveRide} isExpanded={isExpanded} onExpand={() => setIsExpanded(true)} />
          ) : (
            <PassengerView data={activeData} onRefresh={fetchActiveRide} isExpanded={isExpanded} onExpand={() => setIsExpanded(true)} />
          )}
        </div>
      </div>
    </div>
  );
}
