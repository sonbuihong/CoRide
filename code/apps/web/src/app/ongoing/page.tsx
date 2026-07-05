'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
const OngoingMap = dynamic(() => import('@/components/OngoingMap'), { ssr: false, loading: () => <div className="flex h-full w-full items-center justify-center bg-gray-50"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div> });
import DriverView from './driver-view';
import PassengerView from './passenger-view';
import { useSocket } from '@/components/providers/socket-provider';
import { toast } from 'sonner';
import { SocketEvents } from '@repo/shared';

export default function OngoingPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeData, setActiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { socket, isConnected } = useSocket();
  const [optimalOrder, setOptimalOrder] = useState<string[]>([]);
  const [customOrder, setCustomOrder] = useState<string[]>([]);
  const [useCustomOrder, setUseCustomOrder] = useState(false);

  // Ref để tránh join lại room khi component re-render
  const joinedRideIdRef = useRef<string | null>(null);

  /**
   * Fetch dữ liệu active booking/ride từ API.
   * Đây là nguồn sự thật duy nhất — socket chỉ trigger fetch này.
   */
  const fetchActiveRide = useCallback(async () => {
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
  }, [router]);

  // Lần đầu load
  useEffect(() => {
    fetchActiveRide();
  }, [fetchActiveRide]);

  // Polling 30 giây làm backup cho trường hợp socket miss event
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActiveRide();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchActiveRide]);

  /**
   * Quản lý việc join/leave ride room và lắng nghe socket events.
   * Dependency: socket instance và rideId của activeData.
   *
   * Thiết kế:
   * - Chỉ join ride room 1 lần, không join lại khi component re-render.
   * - Cleanup tất cả listeners khi dependency thay đổi hoặc component unmount.
   * - Sau khi socket reconnect, fetch lại dữ liệu để đồng bộ.
   */
  useEffect(() => {
    if (!socket || !activeData) return;

    const rideId: string = activeData.ride?.id;
    if (!rideId) return;

    // Join ride room nếu chưa join (hoặc rideId thay đổi)
    if (joinedRideIdRef.current !== rideId) {
      // Leave room cũ nếu có
      if (joinedRideIdRef.current) {
        socket.emit('ride:leave', joinedRideIdRef.current);
      }
      socket.emit('ride:join', rideId);
      joinedRideIdRef.current = rideId;
    }

    // ─── Event Handlers ────────────────────────────────────────────────

    const handleBookingConfirmed = (data: { message?: string }) => {
      // Chỉ hiện toast cho hành khách, vì tài xế đã có toast báo thành công riêng
      if (activeData?.userRole !== 'DRIVER') {
        toast.success(data?.message || 'Tài xế đã xác nhận chuyến đi của bạn!');
      }
      fetchActiveRide();
    };

    const handleBookingRejected = (data: { reason?: string }) => {
      if (activeData?.userRole !== 'DRIVER') {
        toast.error(data?.reason || 'Yêu cầu đặt chỗ bị từ chối');
      }
      fetchActiveRide();
    };

    const handleRideStatusUpdated = (data: { rideId?: string; status?: string }) => {
      // Bỏ qua event từ ride không phải ride đang theo dõi
      // ride:status giờ emit global nên cần filter chính xác
      if (data?.rideId && data.rideId !== rideId) return;

      // COMPLETED/CANCELLED → chuyến đi đã kết thúc, redirect ngay lập tức
      // Không cần fetch API vì đã biết chắc chuyến không còn active
      if (data?.status === 'COMPLETED') {
        toast.success('Chuyến đi đã hoàn thành!');
        router.replace('/rides/search');
        return;
      }
      if (data?.status === 'CANCELLED') {
        if (activeData?.userRole !== 'DRIVER') {
          toast.error('Chuyến đi đã bị hủy bởi tài xế');
        }
        router.replace('/rides/search');
        return;
      }
      // Các trạng thái khác (SCHEDULED → ONGOING) → fetch lại để cập nhật UI
      fetchActiveRide();
    };

    const handleBookingPickedUp = (data: { message?: string }) => {
      if (activeData?.userRole !== 'DRIVER') {
        toast.success(data?.message || 'Tài xế đã đón bạn thành công!');
      }
      fetchActiveRide();
    };

    const handleBookingCompleted = (data: { message?: string }) => {
      if (activeData?.userRole !== 'DRIVER') {
        toast.success(data?.message || 'Chuyến đi của bạn đã hoàn thành!');
      }
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
    };

    // Sau khi reconnect → fetch lại dữ liệu mới nhất từ API
    // Đảm bảo không mất state khi mạng bị ngắt tạm thời
    const handleReconnect = async () => {
      console.log('[Ongoing] Socket reconnected — re-joining ride room and fetching data');
      // Re-join ride room sau reconnect
      socket.emit('ride:join', rideId);
      await fetchActiveRide();
    };

    socket.on(SocketEvents.BOOKING_CONFIRMED, handleBookingConfirmed);
    socket.on(SocketEvents.BOOKING_REJECTED, handleBookingRejected);
    socket.on(SocketEvents.BOOKING_PICKED_UP, handleBookingPickedUp);
    socket.on(SocketEvents.BOOKING_COMPLETED, handleBookingCompleted);
    socket.on(SocketEvents.RIDE_STATUS_UPDATED, handleRideStatusUpdated);
    socket.on(SocketEvents.DRIVER_LOCATION, handleDriverLocation);
    socket.on(SocketEvents.BOOKING_NEW_REQUEST, handleNewBookingRequest);
    socket.on('connect', handleReconnect);

    return () => {
      // Cleanup: bỏ tất cả listeners để tránh memory leak và duplicate handlers
      socket.off(SocketEvents.BOOKING_CONFIRMED, handleBookingConfirmed);
      socket.off(SocketEvents.BOOKING_REJECTED, handleBookingRejected);
      socket.off(SocketEvents.BOOKING_PICKED_UP, handleBookingPickedUp);
      socket.off(SocketEvents.BOOKING_COMPLETED, handleBookingCompleted);
      socket.off(SocketEvents.RIDE_STATUS_UPDATED, handleRideStatusUpdated);
      socket.off(SocketEvents.DRIVER_LOCATION, handleDriverLocation);
      socket.off(SocketEvents.BOOKING_NEW_REQUEST, handleNewBookingRequest);
      socket.off('connect', handleReconnect);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, activeData?.ride?.id]);

  // Khi socket reconnect (isConnected đổi từ false → true), fetch lại
  useEffect(() => {
    if (isConnected && activeData) {
      // Re-join ride room sau khi mất kết nối
      const rideId = activeData.ride?.id;
      if (rideId && socket) {
        socket.emit('ride:join', rideId);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  // Auto-expand bottom sheet khi có pending booking
  // Đảm bảo tài xế luôn thấy yêu cầu, không bỏ lỡ dù đang nhìn bản đồ
  useEffect(() => {
    if (!activeData) return;
    const pendingCount = activeData.ride?.bookings?.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (b: any) => b.status === 'PENDING'
    ).length ?? 0;
    if (pendingCount > 0) {
      setIsExpanded(true);
    }
  }, [activeData]);

  // Cleanup: leave ride room khi component unmount
  useEffect(() => {
    return () => {
      if (socket && joinedRideIdRef.current) {
        socket.emit('ride:leave', joinedRideIdRef.current);
        joinedRideIdRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  // Theo dõi vị trí tài xế liên tục nếu user là DRIVER
  useEffect(() => {
    let watchId: number;
    const role = activeData?.userRole;
    if (role === 'DRIVER') {
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setDriverLocation(loc);
            
            // Nếu muốn, emit vị trí mới của tài xế lên socket để khách thấy
            if (socket && isConnected) {
              socket.emit('driver:location', loc);
            }
          },
          (err) => {
            console.error('Lỗi định vị tài xế:', err);
          },
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      }
    }
    return () => {
      if (watchId !== undefined && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [activeData?.userRole, socket, isConnected]);

  const activeOrder = useCustomOrder ? customOrder : optimalOrder;

  const waypoints = React.useMemo(() => {
    if (!activeData || !activeData.ride) return [];
    const role = activeData.userRole;
    const ride = activeData.ride;
    if (role !== 'DRIVER') return [];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let list = ride.bookings?.filter((b: any) => (b.status === 'CONFIRMED' || b.status === 'PENDING') && !b.isPickedUp && b.passengerLat && b.passengerLng) || [];
    
    if (activeOrder.length > 0) {
      list = [...list].sort((a, b) => {
        const idxA = activeOrder.indexOf(a.id);
        const idxB = activeOrder.indexOf(b.id);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return list.map((b: any) => ({ id: b.id, lat: b.passengerLat, lng: b.passengerLng }));
  }, [activeData, activeOrder]);

  if (loading || !activeData) {
    return (
      <div className="flex min-h-[calc(100vh-48px)] flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-[#0071e3]" />
        <p className="mt-4 text-sm font-medium text-gray-500">Đang tải thông tin chuyến đi...</p>
      </div>
    );
  }

  const role = activeData.userRole; // 'DRIVER' hoặc 'PASSENGER'
  const ride = activeData.ride;

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
          onRouteOptimized={setOptimalOrder}
          useCustomOrder={useCustomOrder}
        />
      </div>

      {/* Bottom Sheet Section - Lớp phủ lên bản đồ */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-10 w-full bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-all duration-300 ease-in-out flex flex-col ${isExpanded ? 'h-[85vh]' : 'max-h-[60vh]'}`}
      >
        {/* Thanh điều khiển (Drag Handle) */}
        <div
          className="w-full flex justify-center pt-4 pb-2 cursor-pointer sticky top-0 bg-white z-20 shrink-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="flex-1 w-full flex flex-col min-h-0">
          {role === 'DRIVER' ? (
            <DriverView 
              data={activeData} 
              onRefresh={fetchActiveRide} 
              isExpanded={isExpanded} 
              onExpand={() => setIsExpanded(true)} 
              activeOrder={activeOrder}
              onReorder={(newOrder) => {
                setCustomOrder(newOrder);
                setUseCustomOrder(true);
              }}
            />
          ) : (
            <PassengerView data={activeData} onRefresh={fetchActiveRide} isExpanded={isExpanded} onExpand={() => setIsExpanded(true)} />
          )}
        </div>
      </div>
    </div>
  );
}
