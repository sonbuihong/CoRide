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

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hoveredRide, setHoveredRide] = useState<Ride | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
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
    <div className="h-[100dvh] md:h-screen overflow-hidden bg-[#f0f0f5] dark:bg-[#0a0a0c] font-sans -mt-[64px] pt-[80px] md:pt-[88px] pb-4 md:pb-6 px-4 md:px-6 lg:px-8 flex flex-col md:flex-row gap-4 md:gap-6 relative">
      
      {/* Decorative ambient background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#0071e3] opacity-[0.03] dark:opacity-[0.07] blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[60%] bg-[#0071e3] opacity-[0.02] dark:opacity-[0.05] blur-[120px] rounded-full"></div>
      </div>

      {/* Left Panel: Search & Results */}
      <div className={`w-full md:w-[400px] lg:w-[460px] h-full flex-col gap-4 z-10 ${mobileView === 'list' ? 'flex' : 'hidden md:flex'}`}>
        
        {/* Title */}
        <div className="shrink-0 pt-2 pb-1 px-1">
          <h1 className="text-[24px] md:text-[34px] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-white leading-tight">
            Kết quả tìm kiếm
          </h1>
          <p className="text-[13px] md:text-[14px] text-gray-500 dark:text-gray-400 mt-1">
            {rides.length} chuyến đi được tìm thấy
          </p>
        </div>

        {/* Search Widget */}
        <div className="shrink-0 relative z-20">
          <SearchForm onSearch={handleSearch} initialValues={initialValues} />
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto bg-white/70 dark:bg-[#1c1c1e]/70 backdrop-blur-2xl rounded-[32px] p-2 md:p-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/50 dark:border-white/5 custom-scrollbar">
          
          <div className="flex items-center justify-between px-3 pt-2 pb-3 sticky top-0 bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-md z-10 rounded-t-[24px]">
            <span className="text-[14px] font-medium text-gray-500">Danh sách chuyến đi</span>
            <button
              onClick={() => fetchRides(getCurrentFilters())}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-[980px] bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 transition-all text-[13px] font-medium text-[#1d1d1f] dark:text-white disabled:opacity-50 active:scale-95"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>

          <div className="px-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
                <p className="text-[14px] text-gray-500 tracking-tight">Đang quét hệ thống...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 bg-red-50/50 dark:bg-red-900/10 rounded-[24px] text-[#d93025] space-y-3 m-2 border border-red-100 dark:border-red-900/30">
                <AlertCircle className="h-8 w-8 opacity-80" />
                <p className="text-[15px] font-medium tracking-tight text-center px-4">{error}</p>
                <button 
                  onClick={() => fetchRides(initialValues)}
                  className="mt-2 text-[#0071e3] text-[14px] hover:underline font-medium"
                >
                  Thử lại
                </button>
              </div>
            ) : rides.length > 0 ? (
              <div className="flex flex-col gap-3 pb-4">
                {rides.map((ride) => (
                  <div key={ride.id} className="transition-transform hover:-translate-y-0.5 duration-300">
                    <RideCard 
                      ride={ride} 
                      userLocation={userLocation}
                      onMouseEnter={() => setHoveredRide(ride)}
                      onMouseLeave={() => setHoveredRide(null)}
                      onClick={() => {
                        setHoveredRide(ride);
                        // Chỉ tự động chuyển sang map trên mobile khi bấm vào card
                        if (window.innerWidth < 768) {
                          setMobileView('map');
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 m-2">
                <div className="h-16 w-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Car className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight">Không tìm thấy chuyến đi</p>
                  <p className="text-[14px] text-gray-500 mt-1 max-w-[250px] mx-auto leading-relaxed">
                    Hãy thử thay đổi điểm đến hoặc ngày đi để có nhiều sự lựa chọn hơn.
                  </p>
                </div>
                <button 
                  onClick={() => handleSearch({ origin: '', destination: '', date: '' })}
                  className="bg-[#0071e3] text-white hover:bg-[#0077ED] active:scale-95 px-6 py-2.5 rounded-[980px] text-[15px] font-medium tracking-tight transition-all mt-2 shadow-md shadow-blue-500/20"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Map */}
      <div className={`flex-1 h-full relative z-10 ${mobileView === 'map' ? 'block' : 'hidden md:block'}`}>
        <div className="w-full h-full rounded-[24px] md:rounded-[32px] overflow-hidden bg-white/70 dark:bg-[#1c1c1e]/70 backdrop-blur-2xl border border-white/50 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative">
          {hoveredRide ? (
            <div className="w-full h-full p-2">
              {hoveredRide.originLat && hoveredRide.originLng && hoveredRide.destinationLat && hoveredRide.destinationLng ? (
                <div className="w-full h-full rounded-[24px] overflow-hidden shadow-inner">
                  <RideRouteMap 
                    origin={{ lat: hoveredRide.originLat, lng: hoveredRide.originLng }}
                    destination={{ lat: hoveredRide.destinationLat, lng: hoveredRide.destinationLng }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-[24px]">
                  <Map className="h-10 w-10 mb-3 opacity-50" strokeWidth={1.5} />
                  <p className="text-[15px] font-medium">Chưa có toạ độ chi tiết cho chuyến đi này</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-[#0071e3] blur-[40px] opacity-20 rounded-full animate-pulse"></div>
                <div className="h-20 w-20 bg-white dark:bg-[#2c2c2e] rounded-full shadow-xl flex items-center justify-center mb-6 relative z-10 border border-gray-100 dark:border-gray-700">
                  <Map className="h-8 w-8 text-[#0071e3]" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="text-[20px] md:text-[22px] font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-white mb-2">
                Bản đồ lộ trình
              </h3>
              <p className="text-[14px] md:text-[15px] text-gray-500 max-w-[280px] leading-relaxed hidden md:block">
                Rê chuột vào một thẻ chuyến đi bên trái để xem trước lộ trình trực quan trên bản đồ.
              </p>
              <p className="text-[14px] md:text-[15px] text-gray-500 max-w-[280px] leading-relaxed md:hidden">
                Bấm vào "Danh sách" và chọn một chuyến đi để xem lộ trình trên bản đồ.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => setMobileView(prev => prev === 'list' ? 'map' : 'list')}
          className="flex items-center gap-2 px-6 py-3 bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] font-medium text-[15px] transition-transform active:scale-95"
        >
          {mobileView === 'list' ? (
            <>
              <Map className="w-5 h-5" />
              Bản đồ
            </>
          ) : (
            <>
              <LayoutGrid className="w-5 h-5" />
              Danh sách
            </>
          )}
        </button>
      </div>
      
      {/* Global styles for custom scrollbar in this layout */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(150, 150, 150, 0.3);
          border-radius: 20px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(200, 200, 200, 0.2);
        }
      `}} />
    </div>
  );
}

export default function SearchClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f5f7] flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
