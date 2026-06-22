'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
const OngoingMap = dynamic(() => import('@/components/OngoingMap'), { ssr: false, loading: () => <div className="flex h-full w-full items-center justify-center bg-gray-50"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div> });
import DriverView from './driver-view';
import PassengerView from './passenger-view';
import { useSocket } from '@/components/providers/socket-provider';
import { toast } from 'sonner';

export default function OngoingPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeData, setActiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { socket } = useSocket();

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

  // Lần đầu load + polling 30 giây làm backup (socket đã xử lý realtime)
  useEffect(() => {
    fetchActiveRide();
    
    const interval = setInterval(() => {
      fetchActiveRide();
    }, 30000);
    
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Lắng nghe socket events để cập nhật UI ngay lập tức (không cần refresh trang)
  useEffect(() => {
    if (!socket || !activeData) return;

    // Join ride room để nhận các broadcast chung của chuyến đi (VD: ride:status)
    const rideId = activeData.userRole === 'DRIVER' ? activeData.ride.id : activeData.ride.id;
    socket.emit('ride:join', rideId);

    const handleBookingConfirmed = () => {
      // Tài xế vừa chấp nhận → fetch lại ngay để cập nhật trạng thái
      toast.success('Tài xế đã xác nhận chuyến đi của bạn!');
      fetchActiveRide();
    };

    const handleBookingRejected = (data: { reason?: string }) => {
      // Tài xế từ chối hoặc timeout → thông báo và fetch lại
      toast.error(data?.reason || 'Yêu cầu đặt chỗ bị từ chối');
      fetchActiveRide();
    };

    const handleRideStatus = () => {
      // Tài xế bắt đầu / hoàn thành chuyến đi → cập nhật trạng thái
      fetchActiveRide();
    };

    const handleBookingPickedUp = (data: { message?: string }) => {
      toast.success(data?.message || 'Tài xế đã đón bạn thành công!');
      fetchActiveRide();
    };

    const handleBookingCompleted = (data: { message?: string }) => {
      toast.success(data?.message || 'Chuyến đi của bạn đã hoàn thành!');
      fetchActiveRide();
    };

    const handleDriverLocation = (data: { latitude: number; longitude: number }) => {
      setDriverLocation({ lat: data.latitude, lng: data.longitude });
    };

    // Khi có khách mới đặt chỗ → tự động refresh + expand bottom sheet
    // Tài xế không cần kéo tay mới thấy yêu cầu
    const handleNewBookingRequest = () => {
      fetchActiveRide();
      setIsExpanded(true);
      toast.info('Có khách mới muốn đặt chỗ!', { duration: 3000 });
    };

    socket.on('booking:confirmed', handleBookingConfirmed);
    socket.on('booking:rejected', handleBookingRejected);
    socket.on('booking:picked_up', handleBookingPickedUp);
    socket.on('booking:completed', handleBookingCompleted);
    socket.on('ride:status', handleRideStatus);
    socket.on('driver:location', handleDriverLocation);
    socket.on('booking:new_request', handleNewBookingRequest);

    return () => {
      socket.emit('ride:leave', rideId);
      socket.off('booking:confirmed', handleBookingConfirmed);
      socket.off('booking:rejected', handleBookingRejected);
      socket.off('booking:picked_up', handleBookingPickedUp);
      socket.off('booking:completed', handleBookingCompleted);
      socket.off('ride:status', handleRideStatus);
      socket.off('driver:location', handleDriverLocation);
      socket.off('booking:new_request', handleNewBookingRequest);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, activeData?.id]);

  // Auto-expand bottom sheet khi có pending booking
  // Đảm bảo tài xế luôn thấy yêu cầu người dùng không bỏ lỡ dù đang nhìn bản đồ
  useEffect(() => {
    if (!activeData) return;
    const pendingCount = activeData.ride?.bookings?.filter(
      (b: any) => b.status === 'PENDING'
    ).length ?? 0;
    if (pendingCount > 0) {
      setIsExpanded(true);
    }
  }, [activeData]);

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

  // Lấy danh sách điểm đón khách (chỉ dành cho driver)
  // Lọc các booking CONFIRMED và CHƯA đón, có toạ độ đón
  const waypoints = role === 'DRIVER' 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (ride.bookings?.filter((b: any) => b.status === 'CONFIRMED' && !b.isPickedUp && b.passengerLat && b.passengerLng) || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((b: any) => ({ lat: b.passengerLat, lng: b.passengerLng }))
    : [];

  return (
    <div className="relative h-[calc(100vh-48px)] w-full overflow-hidden bg-gray-100 flex flex-col">
      {/* Map Section - Chiếm phần lớn màn hình */}
      <div className="flex-1 w-full relative z-0" onClick={() => setIsExpanded(false)}>
        <OngoingMap
          originLat={ride.originLat}
          originLng={ride.originLng}
          destLat={ride.destinationLat}
          destLng={ride.destinationLng}
          waypoints={waypoints}
          driverLocation={driverLocation}
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
