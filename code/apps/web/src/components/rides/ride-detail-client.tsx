'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { 
  Loader2, 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  User, 
  Car, 
  Users, 
  Clock,
  Info,
  MessageSquare,
  Cigarette,
  PawPrint,
  Luggage,
  CircleCheck,
  CircleX,
  ShieldCheck
} from 'lucide-react';
import RideRouteMap from '@/components/rides/ride-route-map';
import { BookingButton } from '@/components/booking/booking-button';
import { ReviewDialog } from '@/components/rides/review-dialog';
import { ChatWindow } from '@/components/chat/chat-window';
import { useSocket } from '@/components/providers/socket-provider';
import { SocketEvents } from '@repo/shared';

interface RideDetailClientProps {
  rideId: string;
}

interface GeoPoint {
  lat: number;
  lng: number;
}

interface PassengerRoute {
  origin: GeoPoint;
  destination?: GeoPoint;
}

interface RideDetail {
  id: string;
  origin: string;
  destination: string;
  originLat?: number | null;
  originLng?: number | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  currentDriverLat?: number | null;
  currentDriverLng?: number | null;
  driverLocationUpdatedAt?: number | null;
  departureTime: string;
  availableSeats: number;
  offeredSeats: number;
  pricePerSeat: number;
  status: string;
  driverId?: string;
  driver?: { id: string; fullName?: string; avatarUrl?: string };
  description?: string;
  allowRoutePickup: boolean;
  allowSmoking: boolean;
  allowPets: boolean;
  allowLuggage: boolean;
}

interface PassengerBooking {
  rideId?: string;
  status?: string;
  passengerLat?: number | null;
  passengerLng?: number | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  ride?: { id?: string };
}

const isValidCoordinate = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const calculateDistanceKm = (first: GeoPoint, second: GeoPoint) => {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = toRadians(second.lat - first.lat);
  const longitudeDelta = toRadians(second.lng - first.lng);
  const firstLatitude = toRadians(first.lat);
  const secondLatitude = toRadians(second.lat);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

export default function RideDetailClient({ rideId }: RideDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const passengerRouteFromSearch = useMemo<PassengerRoute | null>(() => {
    const readCoordinate = (name: string) => {
      const rawValue = searchParams.get(name);
      if (rawValue == null || rawValue.trim() === '') return null;
      const value = Number(rawValue);
      return Number.isFinite(value) ? value : null;
    };

    const originLat = readCoordinate('passengerOriginLat');
    const originLng = readCoordinate('passengerOriginLng');
    const destinationLat = readCoordinate('passengerDestinationLat');
    const destinationLng = readCoordinate('passengerDestinationLng');

    if (
      originLat == null || originLng == null ||
      destinationLat == null || destinationLng == null
    ) {
      return null;
    }

    return {
      origin: { lat: originLat, lng: originLng },
      destination: { lat: destinationLat, lng: destinationLng },
    };
  }, [searchParams]);

  const [ride, setRide] = useState<RideDetail | null>(null);
  const [passengerRoute, setPassengerRoute] = useState<PassengerRoute | null>(null);
  const [routeEstimate, setRouteEstimate] = useState<{ distanceKm: number; durationSeconds: number } | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; fullName?: string; avatarUrl?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setPassengerRoute(passengerRouteFromSearch);
        const [rideRes, userRes] = await Promise.allSettled([
          apiClient.get(`/rides/${rideId}`),
          apiClient.get('/users/me')
        ]);

        let loadedRide: RideDetail | null = null;
        if (rideRes.status === 'fulfilled') {
          loadedRide = rideRes.value.data as RideDetail;
          setRide(loadedRide);
        } else {
          setError('Không tìm thấy thông tin chuyến đi.');
        }

        if (userRes.status === 'fulfilled') {
          setCurrentUser(userRes.value.data);

          // Nếu hành khách đã đặt chuyến, ưu tiên điểm đón/trả thực tế đã lưu
          // trong booking thay cho tọa độ tìm kiếm trên URL.
          try {
            const bookingsRes = await apiClient.get('/bookings/my');
            const bookings = (bookingsRes.data?.bookings ?? []) as PassengerBooking[];
            const booking = bookings.find((item) =>
              (item.rideId === rideId || item.ride?.id === rideId) &&
              item.status !== 'REJECTED' &&
              item.status !== 'CANCELLED'
            );

            if (
              booking && loadedRide &&
              isValidCoordinate(booking.passengerLat) &&
              isValidCoordinate(booking.passengerLng)
            ) {
              const dropoffLat = isValidCoordinate(booking.dropoffLat)
                ? booking.dropoffLat
                : loadedRide.destinationLat;
              const dropoffLng = isValidCoordinate(booking.dropoffLng)
                ? booking.dropoffLng
                : loadedRide.destinationLng;

              if (isValidCoordinate(dropoffLat) && isValidCoordinate(dropoffLng)) {
                setPassengerRoute({
                  origin: { lat: booking.passengerLat, lng: booking.passengerLng },
                  destination: { lat: dropoffLat, lng: dropoffLng },
                });
              }
            }
          } catch (bookingError) {
            console.warn('[RideDetail] Không thể tải tuyến hành khách từ booking.', bookingError);
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu:', err);
        setError('Đã xảy ra lỗi khi tải thông tin. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (rideId) {
      fetchData();
    }
  }, [passengerRouteFromSearch, rideId]);

  useEffect(() => {
    if (passengerRouteFromSearch || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPassengerRoute((currentRoute) => currentRoute ?? {
          origin: { lat: coords.latitude, lng: coords.longitude },
        });
      },
      () => {
        // Bản đồ vẫn hiển thị tuyến tài xế khi người dùng không cấp quyền vị trí.
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 }
    );
  }, [passengerRouteFromSearch]);

  const handleRouteCalculated = useCallback((distanceKm: number, durationSeconds: number) => {
    setRouteEstimate({ distanceKm, durationSeconds });
  }, []);

  // Lắng nghe socket realtime: cập nhật số ghế + ẩn chuyến hết chỗ mà không cần reload
  useEffect(() => {
    if (!socket || !rideId) return;

    const handleSeatsUpdated = (data: { rideId: string; availableSeats: number }) => {
      // Chỉ xử lý event có liên quan đến chuyến đang xem
      if (data.rideId !== rideId) return;
      setRide((prev) => prev ? { ...prev, availableSeats: data.availableSeats } : prev);
    };

    const handleRideFull = (data: { rideId: string }) => {
      if (data.rideId !== rideId) return;
      // Ẩn nút đặt chỗ bằng cách set availableSeats = 0
      setRide((prev) => prev ? { ...prev, availableSeats: 0 } : prev);
    };

    socket.on(SocketEvents.RIDE_SEATS_UPDATED, handleSeatsUpdated);
    socket.on(SocketEvents.RIDE_FULL, handleRideFull);

    return () => {
      socket.off(SocketEvents.RIDE_SEATS_UPDATED, handleSeatsUpdated);
      socket.off(SocketEvents.RIDE_FULL, handleRideFull);
    };
  }, [socket, rideId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col space-y-4 bg-[#f5f5f7] dark:bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-[#0071e3]" />
        <p className="text-base font-medium leading-6 text-black/55 dark:text-white/55">Đang tải thông tin chuyến đi...</p>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-black py-20 flex flex-col items-center justify-center space-y-6">
        <div className="p-5 rounded-full bg-[#d93025]/10">
          <Info className="h-12 w-12 text-[#d93025]" />
        </div>
        <h2 className="text-2xl font-semibold leading-8 tracking-tight text-[#1d1d1f] dark:text-white">{error || 'Không tìm thấy chuyến đi'}</h2>
        <button 
          onClick={() => router.back()} 
          className="bg-[#1d1d1f] text-white dark:bg-white dark:text-black px-6 py-2.5 rounded-[980px] text-[14px] font-medium transition-colors"
        >
          Trở lại
        </button>
      </div>
    );
  }

  const hasMapData =
    isValidCoordinate(ride.originLat) &&
    isValidCoordinate(ride.originLng) &&
    isValidCoordinate(ride.destinationLat) &&
    isValidCoordinate(ride.destinationLng);

  const hasLiveDriverLocation =
    isValidCoordinate(ride.currentDriverLat) &&
    isValidCoordinate(ride.currentDriverLng);
  const origin = hasMapData
    ? hasLiveDriverLocation
      ? { lat: ride.currentDriverLat as number, lng: ride.currentDriverLng as number }
      : { lat: ride.originLat as number, lng: ride.originLng as number }
    : null;
  const destination = hasMapData
    ? { lat: ride.destinationLat as number, lng: ride.destinationLng as number }
    : null;
  const driverPassengerDistanceKm = origin && passengerRoute?.origin
    ? calculateDistanceKm(origin, passengerRoute.origin)
    : null;

  const departureDate = new Date(ride.departureTime);
  const rideRules = [
    {
      label: 'Đón khách dọc đường',
      description: ride.allowRoutePickup ? 'Có thể đón và trả khách gần tuyến' : 'Chỉ nhận hành trình gần trùng khớp',
      allowed: ride.allowRoutePickup,
      icon: MapPin,
    },
    {
      label: 'Hút thuốc',
      description: ride.allowSmoking ? 'Được phép hút thuốc trên xe' : 'Không hút thuốc trên xe',
      allowed: ride.allowSmoking,
      icon: Cigarette,
    },
    {
      label: 'Mang theo thú cưng',
      description: ride.allowPets ? 'Được mang theo thú cưng' : 'Không mang theo thú cưng',
      allowed: ride.allowPets,
      icon: PawPrint,
    },
    {
      label: 'Hành lý cồng kềnh',
      description: ride.allowLuggage ? 'Được mang hành lý cồng kềnh' : 'Chỉ mang theo hành lý nhỏ gọn',
      allowed: ride.allowLuggage,
      icon: Luggage,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] pb-32 pt-8 font-sans text-[15px] leading-6 antialiased transition-colors duration-300 dark:bg-black lg:text-sm lg:leading-5">
      <div className="container mx-auto max-w-[1020px] animate-in space-y-8 px-4 fade-in duration-700 md:px-8 lg:space-y-5">
        
        {/* Header / Back Navigation */}
        <div className="mb-8 flex items-center justify-between border-b border-black/[0.08] pb-4 dark:border-white/[0.08] lg:mb-5 lg:pb-3">
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-[14px] font-medium text-[#0071e3] transition-colors hover:text-[#005ea6] group"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Tìm chuyến chuyên biệt
          </button>
          
          <div className="bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.08)] px-3 py-1 rounded-[980px]">
            <p className="text-[12px] font-medium tracking-tight text-[#1d1d1f] dark:text-white">
              {ride.availableSeats > 0 ? `Còn ${ride.availableSeats} chỗ` : 'Đã đủ người'}
            </p>
          </div>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-3 lg:gap-5">
          
          {/* Left Column (Primary Info) */}
          <div className="flex min-w-0 flex-col gap-8 lg:col-span-2 lg:h-full lg:gap-5">
            
            {/* HÀNH TRÌNH BLOCK */}
            <div className="rounded-[24px] border border-transparent bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:border-white/[0.05] dark:bg-[#1d1d1f] dark:shadow-none lg:p-6">
              <h2 className="mb-6 flex items-center text-xl font-semibold leading-7 tracking-[-0.015em] text-[#1d1d1f] dark:text-white lg:mb-4 lg:text-lg lg:leading-6">
                <Car className="mr-2 h-5 w-5 text-black/50 dark:text-white/50" /> Hành trình
              </h2>

              <div className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className="w-3.5 h-3.5 rounded-full border-[3px] border-[#1d1d1f] dark:border-white bg-white dark:bg-[#1d1d1f] mt-1.5" />
                  <div className="my-1 h-20 w-[2px] bg-gradient-to-b from-[#1d1d1f] to-transparent opacity-20 dark:from-white lg:h-14" />
                  <MapPin className="h-5 w-5 text-[#1d1d1f] dark:text-white" />
                </div>
                <div className="flex-1 space-y-10 lg:space-y-6">
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase leading-4 tracking-[0.06em] text-black/45 dark:text-white/45">Điểm bắt đầu</p>
                    <p className="text-xl font-semibold leading-7 tracking-[-0.015em] text-[#1d1d1f] dark:text-white sm:text-2xl sm:leading-8 lg:text-xl lg:leading-7">{ride.origin}</p>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase leading-4 tracking-[0.06em] text-black/45 dark:text-white/45">Điểm đến</p>
                    <p className="text-xl font-semibold leading-7 tracking-[-0.015em] text-[#1d1d1f] dark:text-white sm:text-2xl sm:leading-8 lg:text-xl lg:leading-7">{ride.destination}</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 border-t border-black/[0.08] pt-8 dark:border-white/[0.08] lg:mt-6 lg:pt-5">
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:gap-4">
                  <div>
                    <p className="text-[12px] font-semibold text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] flex items-center gap-1.5 mb-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Lịch trình
                    </p>
                    <p className="text-base font-semibold leading-6 tracking-tight text-[#1d1d1f] dark:text-white lg:text-sm lg:leading-5">{departureDate.toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] flex items-center gap-1.5 mb-1.5">
                      <Clock className="h-3.5 w-3.5" /> Khởi hành lúc
                    </p>
                    <p className="text-base font-semibold leading-6 tracking-tight text-[#1d1d1f] dark:text-white lg:text-sm lg:leading-5">{departureDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] flex items-center gap-1.5 mb-1.5">
                      <Users className="h-3.5 w-3.5" /> Hiện trạng
                    </p>
                    <p className="text-base font-semibold leading-6 tracking-tight text-[#1d1d1f] dark:text-white lg:text-sm lg:leading-5">
                      {ride.availableSeats}/{ride.offeredSeats} ghế trống
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)] flex items-center gap-1.5 mb-1.5">
                      <Info className="h-3.5 w-3.5" /> Trạng thái
                    </p>
                    <p className="text-base font-semibold leading-6 tracking-tight text-[#0071e3] lg:text-sm lg:leading-5">Khả dụng</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 border-t border-black/5 pt-6 dark:border-white/10 sm:grid-cols-2 lg:mt-5 lg:grid-cols-3 lg:pt-4">
                <div className="rounded-[18px] bg-[#f5f8ff] px-5 py-4 dark:bg-[#0071e3]/10 lg:px-4 lg:py-3">
                  <p className="text-[12px] font-semibold text-black/50 dark:text-white/50">Khoảng cách dự kiến</p>
                  <p className="mt-1 text-xl font-semibold leading-7 tracking-tight text-[#0071e3] lg:text-lg lg:leading-6">
                    {routeEstimate ? `${routeEstimate.distanceKm.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km` : 'Đang tính...'}
                  </p>
                </div>
                <div className="rounded-[18px] bg-[#fff7ed] px-5 py-4 dark:bg-[#f97316]/10 lg:px-4 lg:py-3">
                  <p className="text-[12px] font-semibold text-black/50 dark:text-white/50">Thời gian dự kiến</p>
                  <p className="mt-1 text-xl font-semibold leading-7 tracking-tight text-[#f97316] lg:text-lg lg:leading-6">
                    {routeEstimate
                      ? routeEstimate.durationSeconds < 3600
                        ? `${Math.max(1, Math.round(routeEstimate.durationSeconds / 60))} phút`
                        : `${Math.floor(routeEstimate.durationSeconds / 3600)} giờ ${Math.round((routeEstimate.durationSeconds % 3600) / 60)} phút`
                      : 'Đang tính...'}
                  </p>
                </div>
                <div className="rounded-[18px] bg-[#f6f5ff] px-5 py-4 dark:bg-[#7657d6]/10 sm:col-span-2 lg:col-span-1 lg:px-4 lg:py-3">
                  <p className="text-[12px] font-semibold text-black/50 dark:text-white/50">Khoảng cách tài xế và bạn</p>
                  <p className="mt-1 text-xl font-semibold leading-7 tracking-tight text-[#7657d6] lg:text-lg lg:leading-6">
                    {driverPassengerDistanceKm == null
                      ? 'Chưa có vị trí'
                      : driverPassengerDistanceKm < 1
                        ? `${Math.max(1, Math.round(driverPassengerDistanceKm * 1000))} m`
                        : `${driverPassengerDistanceKm.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km`}
                  </p>
                  <p className="mt-1 text-xs leading-[18px] text-black/45 dark:text-white/45">Từ điểm đi của tài xế đến vị trí của bạn</p>
                </div>
              </div>
            </div>

            {/* BẢN ĐỒ BLOCK */}
            <div className="overflow-hidden rounded-[24px] border border-transparent bg-white p-2 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:border-white/[0.05] dark:bg-[#1d1d1f] dark:shadow-none lg:flex lg:flex-1 lg:flex-col">
              <div className="p-4 pl-6 pb-2">
                <h2 className="flex items-center text-xl font-semibold leading-7 tracking-[-0.015em] text-[#1d1d1f] dark:text-white lg:text-lg lg:leading-6">
                  Bản đồ tuyến
                </h2>
              </div>
              <div className="overflow-hidden rounded-[20px] lg:flex-1">
                {hasMapData && origin && destination ? (
                  <RideRouteMap
                    origin={origin}
                    destination={destination}
                    passengerOrigin={passengerRoute?.origin}
                    passengerDestination={passengerRoute?.destination}
                    onRouteCalculated={handleRouteCalculated}
                  />
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-[14px] text-[rgba(0,0,0,0.4)] dark:text-[rgba(255,255,255,0.4)] bg-[rgba(0,0,0,0.02)] dark:bg-[rgba(255,255,255,0.02)] rounded-[20px]">
                    Chuyến đi này chưa có dữ liệu bản đồ.
                  </div>
                )}
              </div>
            </div>


          </div>

          {/* Right Column (Sidebar) */}
          <div className="flex min-w-0 flex-col gap-8 lg:h-full lg:gap-5">
            
            {/* TÀI XẾ BLOCK */}
            <div className="rounded-[24px] border border-transparent bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)] dark:border-white/[0.05] dark:bg-[#1d1d1f] dark:shadow-none lg:p-5">
              <h3 className="mb-6 text-lg font-semibold leading-7 tracking-[-0.01em] text-[#1d1d1f] dark:text-white lg:mb-4 lg:text-base lg:leading-6">Thông tin tài xế</h3>
              
              <div className="mb-6 flex items-center gap-4 lg:mb-4 lg:gap-3">
                <div className="w-14 h-14 rounded-full bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.08)] flex items-center justify-center overflow-hidden">
                  {ride.driver?.avatarUrl ? (
                    <img src={ride.driver.avatarUrl} alt={ride.driver.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-[rgba(0,0,0,0.48)]" />
                  )}
                </div>
                <div>
                  <p className="text-base font-semibold leading-6 tracking-tight text-[#1d1d1f] dark:text-white lg:text-sm lg:leading-5">{ride.driver?.fullName || 'Tài xế CoRide'}</p>
                  <p className="mt-0.5 text-[13px] leading-5 text-black/50 dark:text-white/50">Đã xác minh tài khoản</p>
                </div>
              </div>
              
              <div className="space-y-3 border-t border-black/[0.08] pt-4 dark:border-white/[0.08] lg:space-y-2 lg:pt-3">
                <div className="flex items-center justify-between text-sm leading-5">
                  <span className="text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">Đánh giá chung</span>
                  <span className="font-medium text-[#1d1d1f] dark:text-white tracking-tight">5.0 ⭐</span>
                </div>
                <div className="flex items-center justify-between text-sm leading-5">
                  <span className="text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">Kinh nghiệm</span>
                  <span className="font-medium text-[#1d1d1f] dark:text-white tracking-tight">Lái xe mới</span>
                </div>
              </div>
            </div>

            {/* QUY ĐỊNH CỦA TÀI XẾ */}
            <section
              aria-labelledby="ride-rules-title"
              className="rounded-[24px] border border-transparent bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)] dark:border-white/5 dark:bg-[#1d1d1f] dark:shadow-none lg:p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]">
                  <ShieldCheck className="h-[18px] w-[18px]" aria-hidden="true" />
                </div>
                <div>
                  <h3 id="ride-rules-title" className="text-lg font-semibold leading-7 tracking-[-0.01em] text-[#1d1d1f] dark:text-white lg:text-base lg:leading-6">
                    Quy định lên xe
                  </h3>
                  <p className="mt-0.5 text-[13px] leading-5 text-black/50 dark:text-white/50">
                    Thiết lập bởi tài xế
                  </p>
                </div>
              </div>

              <div className="mt-5 divide-y divide-black/[0.06] border-y border-black/[0.06] dark:divide-white/[0.08] dark:border-white/[0.08] lg:mt-3">
                {rideRules.map(({ label, description, allowed, icon: RuleIcon }) => (
                  <div key={label} className="flex items-center gap-3 py-4 lg:py-2.5">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${allowed ? 'bg-[#34c759]/10 text-[#248a3d] dark:text-[#30d158]' : 'bg-black/[0.04] text-black/40 dark:bg-white/[0.06] dark:text-white/40'}`}>
                      <RuleIcon className="h-[18px] w-[18px]" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-5 tracking-[-0.005em] text-[#1d1d1f] dark:text-white">{label}</p>
                      <p className="mt-0.5 text-[13px] leading-5 text-black/50 dark:text-white/50">{description}</p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold ${allowed ? 'text-[#248a3d] dark:text-[#30d158]' : 'text-black/40 dark:text-white/40'}`}>
                      {allowed ? <CircleCheck className="h-4 w-4" aria-hidden="true" /> : <CircleX className="h-4 w-4" aria-hidden="true" />}
                      {allowed ? 'Có' : 'Không'}
                    </span>
                  </div>
                ))}
              </div>

              {ride.description?.trim() && (
                <div className="mt-5 rounded-[16px] bg-[#0071e3]/[0.06] px-4 py-3.5 dark:bg-[#0071e3]/10 lg:mt-3 lg:py-3">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#0071e3]">Lưu ý từ tài xế</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-[22px] text-[#1d1d1f]/80 dark:text-white/80">
                    {ride.description}
                  </p>
                </div>
              )}
            </section>

            {/* ACTION BLOCK */}
            <div className="relative z-10 rounded-[24px] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:bg-[#1d1d1f] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:p-5">
              <div className="mb-2 py-4 text-center lg:py-2">
                <p className="text-xs font-semibold uppercase leading-4 tracking-[0.06em] text-black/45 dark:text-white/45">Giá mỗi chỗ</p>
                <div className="mt-1 flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-semibold leading-none tracking-[-0.035em] text-[#0071e3] lg:text-3xl">{ride.pricePerSeat.toLocaleString('vi-VN')}</span>
                  <span className="text-xl font-semibold leading-7 text-[#0071e3] lg:text-lg lg:leading-6">đ</span>
                </div>
              </div>
              
              <div className="mt-4 lg:mt-3">
                <BookingButton 
                  rideId={ride.id} 
                  availableSeats={ride.availableSeats} 
                  driverId={ride.driverId ?? ''}
                  currentUserId={currentUser?.id}
                  passengerDestination={passengerRoute?.destination}
                />
              </div>

              {currentUser?.id && currentUser.id !== ride.driverId && (
                <div className="mt-3">
                  <button 
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[12px] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#1d1d1f] hover:bg-[rgba(0,0,0,0.02)] dark:hover:bg-[rgba(255,255,255,0.05)] transition-all font-medium text-[14px]"
                    onClick={() => setIsChatOpen(true)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Nhắn tin cho tài xế
                  </button>
                </div>
              )}

              {ride.status === 'COMPLETED' && currentUser?.id !== ride.driverId && (
                <div className="mt-4">
                  <ReviewDialog 
                    rideId={ride.id} 
                    revieweeId={ride.driverId ?? ''} 
                    revieweeName={ride.driver?.fullName || 'Tài xế'} 
                  />
                </div>
              )}
              
              <p className="mt-5 text-center text-xs leading-[18px] text-black/45 dark:text-white/45 lg:mt-3">
                Bằng cách tham gia chuyến, bạn đã đồng ý với Điều khoản Hệ sinh thái di chuyển của CoRide.
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Cửa sổ Chat cố định ở góc màn hình */}
      {isChatOpen && ride.driverId && currentUser?.id && (
        <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-4 duration-300">
          <ChatWindow
            rideId={ride.id}
            otherUserId={ride.driverId}
            otherUserName={ride.driver?.fullName || 'Tài xế'}
            currentUserId={currentUser.id}
            onClose={() => setIsChatOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
