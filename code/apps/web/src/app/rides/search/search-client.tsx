'use client';

import React, { useCallback, useState, useEffect, Suspense, useRef } from 'react';
import axios from 'axios';
import { useSearchParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { SearchForm } from '@/components/rides/search-form';
import { RideCard, Ride } from '@/components/rides/ride-card';
import { SearchRideInput, SocketEvents } from '@repo/shared';
import { Loader2, Car, AlertCircle, Map, RefreshCw } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black pt-6 md:pt-12 pb-12 md:pb-24">
      <div className="container px-4 md:px-6 mx-auto max-w-[980px] space-y-6 md:space-y-12">
        
        {/* Header Section */}
        <div className="text-center space-y-2 md:space-y-3">
          <h1 className="text-[32px] md:text-[56px] font-semibold tracking-[-0.28px] leading-[1.07] text-[#1d1d1f] dark:text-white">
            Tìm chuyến đi.
          </h1>
          <p className="text-[15px] md:text-[21px] tracking-[-0.37px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] max-w-[600px] mx-auto">
            Hàng ngàn chuyến đi thân thiện đang chờ bạn.
          </p>
        </div>

        {/* Search Block */}
        <div className="relative z-20">
          <SearchForm onSearch={handleSearch} initialValues={initialValues} />
        </div>

        {/* Results and Map Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          
          {/* Left Column: Results */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[17px] md:text-[21px] font-semibold tracking-[-0.23px] text-[#1d1d1f] dark:text-white">
                {loading ? 'Đang tải dữ liệu...' : `Kết quả: ${rides.length} chuyến`}
              </h2>
              <button
                onClick={() => fetchRides(getCurrentFilters())}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(0,0,0,0.08)] dark:hover:bg-[rgba(255,255,255,0.12)] transition-colors text-[12px] md:text-[13px] font-medium text-[#1d1d1f] dark:text-white disabled:opacity-50"
                title="Làm mới danh sách"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
                <p className="text-[14px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] tracking-[-0.12px]">Đang quét hệ thống...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-[#1d1d1f]/50 backdrop-blur rounded-[24px] text-[#d93025] space-y-4 border border-[#d93025]/10">
                <AlertCircle className="h-10 w-10 opacity-80" />
                <p className="text-[17px] font-medium tracking-tight text-center max-w-[400px]">{error}</p>
                <button 
                  onClick={() => fetchRides(initialValues)}
                  className="mt-2 text-[#0066cc] dark:text-[#2997ff] text-[14px] hover:underline"
                >
                  Thử lại
                </button>
              </div>
            ) : rides.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
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
              <div className="flex flex-col items-center justify-center py-24 bg-white/50 dark:bg-[#1d1d1f]/50 backdrop-blur rounded-[24px] space-y-5 border border-transparent">
                <div className="h-16 w-16 bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.08)] rounded-full flex items-center justify-center">
                  <Car className="h-8 w-8 text-[rgba(0,0,0,0.32)] dark:text-[rgba(255,255,255,0.32)]" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-[21px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight">Không tìm thấy chuyến đi</p>
                  <p className="text-[14px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] max-w-xs mx-auto tracking-[-0.12px] leading-relaxed">
                    Hãy thử thay đổi điểm đến hoặc ngày đi để có nhiều sự lựa chọn hơn.
                  </p>
                </div>
                <button 
                  onClick={() => handleSearch({ origin: '', destination: '', date: '' })}
                  className="bg-[#1d1d1f] dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-[#f5f5f7] px-6 py-2.5 rounded-[980px] text-[14px] font-medium tracking-[-0.12px] transition-colors mt-2"
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Map */}
          <div className="hidden lg:block lg:col-span-5 relative">
            <div className="sticky top-24 h-[calc(100vh-140px)] min-h-[500px] w-full rounded-[24px] overflow-hidden bg-white dark:bg-[#1d1d1f] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              {hoveredRide ? (
                <div className="w-full h-full p-2">
                  {hoveredRide.originLat && hoveredRide.originLng && hoveredRide.destinationLat && hoveredRide.destinationLng ? (
                    <div className="w-full h-full rounded-[16px] overflow-hidden">
                      <RideRouteMap 
                        origin={{ lat: hoveredRide.originLat, lng: hoveredRide.originLng }}
                        destination={{ lat: hoveredRide.destinationLat, lng: hoveredRide.destinationLng }}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-[rgba(0,0,0,0.4)] dark:text-[rgba(255,255,255,0.4)] bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)] rounded-[16px]">
                      <Map className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-[14px]">Chuyến đi này chưa có toạ độ chi tiết</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)]">
                  <div className="h-16 w-16 bg-white dark:bg-[#2c2c2e] rounded-full shadow-sm flex items-center justify-center mb-5">
                    <Map className="h-7 w-7 text-[#0071e3]" />
                  </div>
                  <h3 className="text-[19px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white mb-2">
                    Bản đồ lộ trình
                  </h3>
                  <p className="text-[15px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] max-w-[250px] leading-relaxed">
                    Rê chuột vào một thẻ chuyến đi bên trái để xem trước lộ trình trực quan trên bản đồ.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
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
