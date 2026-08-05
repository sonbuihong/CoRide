'use client';

import React, { useCallback, useState, useEffect, Suspense, useRef } from 'react';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { SearchForm } from '@/components/rides/search-form';
import { RideCard, Ride } from '@/components/rides/ride-card';
import { SearchRideInput, SocketEvents } from '@repo/shared';
import { Loader2, Car, AlertCircle, Map, RefreshCw, Bike, Package, Utensils, Plane, Key, Bus, LayoutGrid, Search } from 'lucide-react';
import RideRouteMap from '@/components/rides/ride-route-map';
import { useSocket } from '@/components/providers/socket-provider';
import { toast } from 'sonner';

function RidesList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hoveredRide, setHoveredRide] = useState<Ride | null>(null);
  const { socket } = useSocket();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.warn('Không thể lấy vị trí hiện tại:', err);
        }
      );
    }
  }, []);

  const getCurrentFilters = useCallback((): SearchRideInput => ({
    origin: searchParams.get('origin') || '',
    destination: searchParams.get('destination') || '',
    date: searchParams.get('date') || '',
  }), [searchParams]);

  const fetchRides = useCallback(async (
    filters: SearchRideInput,
    options: { showLoading?: boolean } = {}
  ) => {
    // Hủy request cũ nếu có
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const showLoading = options.showLoading ?? true;

    if (showLoading) {
      setLoading(true);
      setError(null);
    }
    try {
      const response = await apiClient.get('/rides', { 
        params: { ...filters, _t: Date.now() },
        signal: abortController.signal
      });
      setRides(response.data.rides ?? []);
    } catch (err: unknown) {
      // Bỏ qua lỗi do abort
      if (axios.isCancel(err) || (err as any).name === 'CanceledError') {
        return;
      }
      
      if (!showLoading) {
        console.error('[SearchResults] Background ride refresh failed:', err);
        return;
      }
      console.error('Lỗi khi tìm kiếm chuyến đi:', err);
      setError('Đã xảy ra lỗi khi tải danh sách chuyến đi. Vui lòng thử lại sau.');
    } finally {
      if (showLoading && abortControllerRef.current === abortController) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchRides(getCurrentFilters());
  }, [fetchRides, getCurrentFilters]);

  // Lắng nghe socket realtime: cập nhật số ghế và ẩn chuyến hết chỗ mà không cần reload
  useEffect(() => {
    if (!socket) return;

    const handleSeatsUpdated = (data: { rideId: string; availableSeats: number }) => {
      setRides((prevRides) =>
        prevRides.map((ride) =>
          ride.id === data.rideId
            ? { ...ride, availableSeats: data.availableSeats }
            : ride
        )
      );
    };

    // Khi chuyến hết ghế → filter khỏi danh sách hiển thị ngay lập tức
    // Đây là UX đúng: hành khách không nên thấy chuyến đã đủ người
    const handleRideFull = (data: { rideId: string }) => {
      setRides((prevRides) => prevRides.filter((ride) => ride.id !== data.rideId));
      // Đồng thời xóa khỏi hoveredRide nếu đang hiển thị bản đồ của chuyến này
      setHoveredRide((prev) => (prev?.id === data.rideId ? null : prev));
    };

    const handleRideRefresh = () => {
      fetchRides(getCurrentFilters(), { showLoading: false });
    };

    const handleRideCreated = (newRide: any) => {
      toast.success('Có chuyến đi mới vừa được đăng, đang cập nhật danh sách...');
      
      // Cập nhật state trực tiếp để UI phản hồi ngay lập tức
      setRides((prevRides) => {
        const filters = getCurrentFilters();
        
        // Kiểm tra xem chuyến mới có khớp với filter không
        if (filters.origin && !newRide.origin.toLowerCase().includes(filters.origin.toLowerCase())) return prevRides;
        if (filters.destination && !newRide.destination.toLowerCase().includes(filters.destination.toLowerCase())) return prevRides;
        if (filters.date) {
          const searchDate = new Date(filters.date).toDateString();
          const rideDate = new Date(newRide.departureTime).toDateString();
          if (searchDate !== rideDate) return prevRides;
        }

        // Tránh trùng lặp
        if (prevRides.some(r => r.id === newRide.id)) return prevRides;

        // Thêm vào danh sách và sắp xếp theo thời gian khởi hành
        const updated = [...prevRides, newRide];
        return updated.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
      });

      // Vẫn gọi fetch background để đảm bảo đồng bộ hoàn toàn
      handleRideRefresh();
    };

    const handleRideDeleted = (data: { id: string }) => {
      setRides((prevRides) => prevRides.filter((ride) => ride.id !== data.id));
      setHoveredRide((prev) => (prev?.id === data.id ? null : prev));
    };

    // Xử lý khi ride thay đổi trạng thái (event global từ backend)
    // CANCELLED/COMPLETED → ẩn chuyến ngay lập tức (hành khách không cần thấy nữa)
    // ONGOING → vẫn hiển thị (hành khách vẫn có thể đặt ghép chuyến)
    const handleRideStatus = (data: { rideId: string; status: string }) => {
      if (data.status === 'CANCELLED' || data.status === 'COMPLETED') {
        setRides((prevRides) => prevRides.filter((ride) => ride.id !== data.rideId));
        setHoveredRide((prev) => (prev?.id === data.rideId ? null : prev));
      } else if (data.status === 'ONGOING') {
        // Chuyến vừa bắt đầu — cập nhật status trong state để UI phản ánh đúng
        setRides((prevRides) =>
          prevRides.map((ride) =>
            ride.id === data.rideId ? { ...ride, status: data.status } : ride
          )
        );
      }
    };

    socket.on(SocketEvents.RIDE_SEATS_UPDATED, handleSeatsUpdated);
    socket.on(SocketEvents.RIDE_FULL, handleRideFull);
    socket.on(SocketEvents.RIDE_CREATED, handleRideCreated);
    socket.on(SocketEvents.RIDE_UPDATED, handleRideRefresh);
    socket.on(SocketEvents.RIDE_DELETED, handleRideDeleted);
    socket.on(SocketEvents.RIDE_STATUS_UPDATED, handleRideStatus);

    return () => {
      socket.off(SocketEvents.RIDE_SEATS_UPDATED, handleSeatsUpdated);
      socket.off(SocketEvents.RIDE_FULL, handleRideFull);
      socket.off(SocketEvents.RIDE_CREATED, handleRideCreated);
      socket.off(SocketEvents.RIDE_UPDATED, handleRideRefresh);
      socket.off(SocketEvents.RIDE_DELETED, handleRideDeleted);
      socket.off(SocketEvents.RIDE_STATUS_UPDATED, handleRideStatus);
    };
  }, [socket, fetchRides, getCurrentFilters]);

  const handleSearch = (filters: SearchRideInput) => {
    const params = new URLSearchParams();
    if (filters.origin) params.set('origin', filters.origin);
    if (filters.destination) params.set('destination', filters.destination);
    if (filters.date) params.set('date', filters.date);
    
    router.push(`/rides/search?${params.toString()}`);
  };

  const initialValues = {
    origin: searchParams.get('origin') || '',
    destination: searchParams.get('destination') || '',
    date: searchParams.get('date') || '',
  };

  const categories = [
    { id: 'bike', name: 'Xe máy', icon: <Bike className="h-6 w-6" />, color: 'bg-[#fafafc] text-[#1d1d1f] dark:bg-[#272729] dark:text-white' },
    { id: 'car', name: 'Ô tô', icon: <Car className="h-6 w-6" />, color: 'bg-[#fafafc] text-[#1d1d1f] dark:bg-[#272729] dark:text-white' },
    { id: 'delivery', name: 'Giao hàng', icon: <Package className="h-6 w-6" />, color: 'bg-[#fafafc] text-[#1d1d1f] dark:bg-[#272729] dark:text-white' },
    { id: 'food', name: 'Đồ ăn', icon: <Utensils className="h-6 w-6" />, color: 'bg-[#fafafc] text-[#1d1d1f] dark:bg-[#272729] dark:text-white' },
    { id: 'airport', name: 'Sân bay', icon: <Plane className="h-6 w-6" />, color: 'bg-[#fafafc] text-[#1d1d1f] dark:bg-[#272729] dark:text-white' },
    { id: 'rent', name: 'Thuê xe', icon: <Key className="h-6 w-6" />, color: 'bg-[#fafafc] text-[#1d1d1f] dark:bg-[#272729] dark:text-white' },
    { id: 'intercity', name: 'Liên tỉnh', icon: <Bus className="h-6 w-6" />, color: 'bg-[#fafafc] text-[#1d1d1f] dark:bg-[#272729] dark:text-white' },
    { id: 'more', name: 'Xem thêm', icon: <LayoutGrid className="h-6 w-6" />, color: 'bg-[#fafafc] text-[#1d1d1f] dark:bg-[#272729] dark:text-white' },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black font-sans -mt-[64px] pt-[64px]">
      {/* 1. Cinematic Hero Section (Dark Theme by default) */}
      <div className="w-full bg-black text-white pt-16 md:pt-28 pb-32 md:pb-40 px-4 relative overflow-hidden flex flex-col items-center">
        {/* Subtle blue glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#0071e3] opacity-20 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10 w-full">
          <h1 className="text-[40px] md:text-[64px] font-semibold tracking-[-0.015em] leading-[1.07] mb-4 text-white">
            Khởi hành cùng nhau.
          </h1>
          <p className="text-[17px] md:text-[21px] text-[rgba(255,255,255,0.72)] tracking-[-0.015em] max-w-[600px] mx-auto mb-12">
            Chia sẻ hành trình, tiết kiệm chi phí và bảo vệ môi trường. Hàng ngàn chuyến đi thân thiện đang chờ bạn.
          </p>

          <div className="w-full max-w-[600px] mx-auto relative group mt-8">
            {/* Horizontal Search Bar (Click to navigate) */}
            <div 
              onClick={() => router.push('/rides/search')}
              className="w-full h-[64px] md:h-[72px] bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.15)] backdrop-blur-xl border border-[rgba(255,255,255,0.2)] rounded-[980px] flex items-center px-6 md:px-8 cursor-pointer transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.2)] hover:scale-[1.02] hover:shadow-[0_16px_48px_rgba(0,113,227,0.3)]"
            >
              <Search className="h-6 w-6 md:h-7 md:w-7 text-[rgba(255,255,255,0.7)] group-hover:text-white transition-colors mr-4" strokeWidth={2.5} />
              <div className="flex-1 text-left">
                <span className="text-[17px] md:text-[19px] font-medium text-[rgba(255,255,255,0.7)] group-hover:text-white transition-colors tracking-tight">
                  Bạn muốn đi đâu?
                </span>
              </div>
              <div className="hidden md:flex items-center justify-center bg-white text-black text-[12px] font-bold px-3 py-1.5 rounded-full ml-4 shadow-sm">
                Tìm kiếm
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Content Section (Light/Dark Contextual) */}
      <div className="w-full bg-[#f5f5f7] dark:bg-[#000000] py-16 px-4">
        <div className="max-w-[1070px] mx-auto">
          
          <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
            <h2 className="text-[28px] md:text-[40px] font-semibold tracking-[-0.015em] leading-[1.1] text-[#1d1d1f] dark:text-white text-center md:text-left">
              {loading ? 'Đang tìm kiếm...' : (rides.length > 0 ? `Khám phá ${rides.length} chuyến đi` : 'Chưa tìm thấy chuyến đi')}
            </h2>
            <button
              onClick={() => fetchRides(getCurrentFilters())}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-[980px] bg-[rgba(0,0,0,0.05)] dark:bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(0,0,0,0.08)] dark:hover:bg-[rgba(255,255,255,0.15)] transition-colors text-[14px] font-medium text-[#1d1d1f] dark:text-white disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới danh sách
            </button>
          </div>

          <div className="w-full">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-[#0071e3]" />
                <p className="text-[17px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] tracking-[-0.015em]">Đang quét hệ thống...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-[#1d1d1f] rounded-[24px] text-[#d93025] space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-transparent">
                <AlertCircle className="h-12 w-12 opacity-80" />
                <p className="text-[19px] font-medium tracking-tight text-center max-w-[400px]">{error}</p>
                <button 
                  onClick={() => fetchRides(initialValues)}
                  className="mt-4 text-[#0066cc] dark:text-[#2997ff] text-[17px] hover:underline flex items-center"
                >
                  Thử lại
                </button>
              </div>
            ) : rides.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {rides.map((ride) => (
                  <RideCard 
                    key={ride.id} 
                    ride={ride} 
                    userLocation={userLocation}
                    onMouseEnter={() => setHoveredRide(ride)}
                    onMouseLeave={() => setHoveredRide(null)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-[#1d1d1f] rounded-[24px] space-y-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <div className="h-20 w-20 bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.04)] rounded-full flex items-center justify-center">
                  <Car className="h-10 w-10 text-[rgba(0,0,0,0.32)] dark:text-[rgba(255,255,255,0.32)]" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-[24px] font-semibold text-[#1d1d1f] dark:text-white tracking-[-0.015em]">Chưa có chuyến đi nào phù hợp</p>
                  <p className="text-[17px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] max-w-md mx-auto tracking-[-0.015em] leading-relaxed">
                    Hãy thử thay đổi điểm đến hoặc ngày đi để có nhiều sự lựa chọn hơn.
                  </p>
                </div>
                <button 
                  onClick={() => handleSearch({ origin: '', destination: '', date: '' })}
                  className="bg-[#0071e3] text-white hover:bg-[#0077ED] active:scale-95 px-6 py-3 rounded-[980px] text-[17px] font-medium tracking-tight transition-all mt-6"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RidesClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f5f7] flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
      </div>
    }>
      <RidesList />
    </Suspense>
  );
}
