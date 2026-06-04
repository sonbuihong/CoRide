'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRideSchema, CreateRideInput } from '@repo/shared';
import apiClient from '../../../lib/api-client';
import { Loader2, ArrowLeft, MapPin, Calendar, Users, DollarSign, Info, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AddressAutocomplete } from '../../../components/ui/address-autocomplete';
import { useAuth } from '@/components/providers/auth-provider';
import { getDirections, formatDuration } from '../../../lib/goong';
import RideRouteMap from '@/components/rides/ride-route-map';

// Dynamic import: Goong Maps chỉ chạy trên client (không tương thích SSR)
const MapViewer = dynamic(
  () => import('@/components/ui/map-viewer').then((m) => m.MapViewer),
  { ssr: false, loading: () => <div className="h-[260px] rounded-[16px] bg-[rgba(0,0,0,0.03)] animate-pulse" /> }
);

// ==========================================
// THIẾT KẾ APPLE: Utilities CSS
// ==========================================
const appleInputClass = 
  "h-[52px] w-full rounded-[11px] bg-[#fafafc] border-[3px] border-[rgba(0,0,0,0.04)] px-4 text-[17px] text-[#1d1d1f] transition-all hover:border-[rgba(0,0,0,0.08)] focus-visible:ring-0 focus-visible:border-transparent focus-visible:outline-none focus:outline-[2px] focus:outline-[#0071e3] focus:outline-offset-1 dark:bg-[rgba(255,255,255,0.05)] dark:text-white dark:border-[rgba(255,255,255,0.05)]";

const appleLabelClass = 
  "text-[14px] font-semibold text-[#1d1d1f] tracking-[-0.22px] mb-1.5 flex items-center dark:text-white";

const appleButtonClass = 
  "h-[52px] w-full rounded-[8px] bg-[#0071e3] text-white text-[17px] font-normal tracking-[-0.37px] transition-colors hover:bg-[#0077ED] active:bg-[#0062C3]";

export default function PostRidePage() {
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  // State lưu toạ độ đã chọn để hiển thị bản đồ và tính route
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationText: string; durationMinutes: number } | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [checkingVerification, setCheckingVerification] = useState(true);

  const [activeRide, setActiveRide] = useState<any>(null);
  const [activePassengers, setActivePassengers] = useState<any[]>([]);
  const [loadingActiveRide, setLoadingActiveRide] = useState(true);

  // ==========================================
  // Auth Guard + KYC Guard (client-side)
  // Middleware có thể cho qua client navigation → cần guard ở đây
  // ==========================================
  useEffect(() => {
    if (authLoading) return; // Chờ auth-provider resolve xong

    if (!user) {
      router.replace('/login?callbackUrl=/rides/post');
      return;
    }

    const verifyDriverStatus = async () => {
      // Nếu client thấy chưa được xác thực tài xế, thử gọi refreshUser để kiểm tra lại
      if (!user.isDriverVerified) {
        try {
          await refreshUser();
        } catch (err) {
          console.error('Lỗi khi đồng bộ trạng thái tài xế:', err);
        }
      }
      setCheckingVerification(false);
    };

    verifyDriverStatus();
  }, [authLoading, user?.id, refreshUser, router]);

  useEffect(() => {
    if (authLoading || checkingVerification) return;

    if (user && !user.isDriverVerified) {
      router.replace('/profile/driver-verification');
    }
  }, [user, authLoading, checkingVerification, router]);

  useEffect(() => {
    if (authLoading || !user || !user.isDriverVerified) {
      setLoadingActiveRide(false);
      return;
    }

    const fetchActiveRide = async () => {
      try {
        setLoadingActiveRide(true);
        const res = await apiClient.get('/bookings/driver');
        const driverBookings = res.data.data || [];
        
        // Tìm đặt chỗ được xác nhận (CONFIRMED) của chuyến đi chưa hoàn thành (SCHEDULED hoặc ONGOING)
        const confirmedActiveBooking = driverBookings.find((b: any) => 
          b.status === 'CONFIRMED' && 
          (b.ride.status === 'SCHEDULED' || b.ride.status === 'ONGOING')
        );

        if (confirmedActiveBooking) {
          setActiveRide(confirmedActiveBooking.ride);
          
          // Gom tất cả hành khách CONFIRMED của chuyến đi này
          const passengers = driverBookings
            .filter((b: any) => b.ride.id === confirmedActiveBooking.ride.id && b.status === 'CONFIRMED')
            .map((b: any) => ({
              id: b.passenger.id,
              firstName: b.passenger.firstName,
              lastName: b.passenger.lastName,
              phone: b.passenger.phone,
              avatarUrl: b.passenger.avatarUrl,
              seats: b.seats
            }));
          setActivePassengers(passengers);
        }
      } catch (err) {
        console.error('Lỗi khi kiểm tra chuyến đi đang hoạt động:', err);
      } finally {
        setLoadingActiveRide(false);
      }
    };

    fetchActiveRide();
  }, [user, authLoading]);


  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateRideInput>({
    resolver: zodResolver(createRideSchema),
    defaultValues: {
      origin: '',
      originLat: undefined,
      originLng: undefined,
      destination: '',
      destinationLat: undefined,
      destinationLng: undefined,
      departureTime: '',
      availableSeats: 1,
      pricePerSeat: 0,
      description: '',
    },
  });

  // Tự động gọi Goong Directions khi có đủ 2 điểm toạ độ để tính distance + duration
  useEffect(() => {
    if (!originCoords || !destinationCoords) {
      setRouteInfo(null);
      return;
    }
    setIsCalculatingRoute(true);
    const originStr = `${originCoords.lat},${originCoords.lng}`;
    const destStr = `${destinationCoords.lat},${destinationCoords.lng}`;
    getDirections(originStr, destStr)
      .then((data) => {
        if (!data || !data.routes || data.routes.length === 0) {
          setRouteInfo(null);
          return;
        }
        const route = data.routes[0];
        if (route.legs && route.legs.length > 0) {
          const leg = route.legs[0];
          const distanceKm = leg.distance.value / 1000; // Convert meters to km
          const durationSeconds = leg.duration.value;
          setRouteInfo({
            distanceKm: Math.round(distanceKm * 10) / 10, // Round to 1 decimal
            durationText: formatDuration(durationSeconds),
            // Lưu số nguyên để gửi lên API (bằng phút)
            durationMinutes: Math.round(durationSeconds / 60),
          });
        }
      })
      .catch((err: unknown) => console.error('[PostRide] Lỗi tính route:', err))
      .finally(() => setIsCalculatingRoute(false));
  }, [originCoords, destinationCoords]);

  const onSubmit = async (data: CreateRideInput) => {
    setLoading(true);
    setError(null);
    try {
      // Merge distance/duration từ Goong Directions (không có trong Zod schema nên không dùng setValue)
      const payload = {
        ...data,
        ...(routeInfo && {
          distance: routeInfo.distanceKm,
          duration: routeInfo.durationMinutes,
        }),
      };
      await apiClient.post('/rides', payload);
      router.push('/my-rides');
    } catch (err: unknown) {
      console.error('Lỗi khi đăng chuyến đi:', err);
      setError(
        ((err as { response?: { data?: { message?: string } } }).response)?.data?.message || 'Có lỗi xảy ra khi đăng chuyến đi. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Chờ auth resolve + guard check xong mới render form
  // Tránh flash nội dung form trước khi redirect
  if (authLoading || checkingVerification || loadingActiveRide || !user || !user.isDriverVerified) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f5f7] dark:bg-black">
        <Loader2 className="h-10 w-10 animate-spin text-[#0071e3]" />
      </div>
    );
  }

  if (activeRide) {
    const hasMapData =
      activeRide.originLat !== undefined && activeRide.originLat !== null &&
      activeRide.originLng !== undefined && activeRide.originLng !== null &&
      activeRide.destinationLat !== undefined && activeRide.destinationLat !== null &&
      activeRide.destinationLng !== undefined && activeRide.destinationLng !== null;

    const origin = hasMapData
      ? { lat: activeRide.originLat as number, lng: activeRide.originLng as number }
      : null;
    const destination = hasMapData
      ? { lat: activeRide.destinationLat as number, lng: activeRide.destinationLng as number }
      : null;

    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-black pt-12 pb-24 transition-colors duration-300">
        <div className="container max-w-[720px] mx-auto px-4 space-y-8 animate-in fade-in duration-500">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-[32px] md:text-[40px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white mb-2 leading-tight">
              Lộ trình chuyến đi đang hoạt động
            </h1>
            <p className="text-[15px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
              Bạn đang có chuyến đi đã được đặt thành công. Vui lòng hoàn thành chuyến này trước khi đăng thêm chuyến mới.
            </p>
          </div>

          <div className="space-y-6">
            {/* Map Block */}
            <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-2 overflow-hidden border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)] shadow-sm">
              <div className="p-4 pl-6 pb-2">
                <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white">
                  Bản đồ dẫn đường
                </h3>
              </div>
              <div className="rounded-[20px] overflow-hidden">
                {hasMapData && origin && destination ? (
                  <RideRouteMap origin={origin} destination={destination} />
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-[14px] text-[rgba(0,0,0,0.4)] dark:text-[rgba(255,255,255,0.4)] bg-[rgba(0,0,0,0.02)] rounded-[20px]">
                    Chuyến đi này không có dữ liệu tọa độ bản đồ.
                  </div>
                )}
              </div>
            </div>

            {/* Journey Details */}
            <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-6 border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)] shadow-sm space-y-4">
              <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800">
                Thông tin hành trình
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[14px]">
                <div>
                  <span className="text-gray-400">Điểm đón:</span>
                  <p className="font-semibold text-[#1d1d1f] dark:text-white mt-0.5">{activeRide.origin}</p>
                </div>
                <div>
                  <span className="text-gray-400">Điểm đến:</span>
                  <p className="font-semibold text-[#1d1d1f] dark:text-white mt-0.5">{activeRide.destination}</p>
                </div>
                <div>
                  <span className="text-gray-400">Thời gian khởi hành:</span>
                  <p className="font-semibold text-[#1d1d1f] dark:text-white mt-0.5">
                    {new Date(activeRide.departureTime).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Chi phí mỗi ghế:</span>
                  <p className="font-semibold text-[#0071e3] mt-0.5">
                    {activeRide.pricePerSeat.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>
            </div>

            {/* Passenger List */}
            <div className="bg-white dark:bg-[#1d1d1f] rounded-[24px] p-6 border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)] shadow-sm space-y-4">
              <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800">
                Danh sách hành khách đã xác nhận ({activePassengers.length} người)
              </h3>
              <div className="space-y-4">
                {activePassengers.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Chưa có hành khách nào đặt chỗ.</p>
                ) : (
                  activePassengers.map((pass) => (
                    <div key={pass.id} className="flex items-center justify-between pb-3 last:pb-0 last:border-b-0 border-b border-gray-55 dark:border-gray-850">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                          {pass.avatarUrl ? (
                            <img src={pass.avatarUrl} alt={pass.firstName} className="w-full h-full object-cover" />
                          ) : (
                            <User className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[#1d1d1f] dark:text-white text-[14px]">
                            {pass.firstName} {pass.lastName}
                          </p>
                          <p className="text-[12px] text-gray-400">{pass.phone || 'Chưa cập nhật SĐT'}</p>
                        </div>
                      </div>
                      <div className="bg-[#0071e3]/10 text-[#0071e3] px-3 py-1 rounded-full text-[12px] font-medium">
                        Đặt {pass.seats} ghế
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black pt-12 pb-24">
      <div className="container max-w-[680px] mx-auto px-4">
        
        {/* Navigation */}
        <div className="mb-10">
          <Link href="/">
            <button className="flex items-center text-[14px] font-medium text-[#0071e3] transition-colors hover:text-[#005ea6] group">
              <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Hủy đăng chuyến
            </button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-[40px] md:text-[56px] font-semibold tracking-[-0.28px] leading-[1.07] text-[#1d1d1f] dark:text-white mb-2">
            Đăng chuyến đi
          </h1>
          <p className="text-[17px] tracking-[-0.37px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
            Hàng ngàn người chung tuyến đường đang chờ bạn.
          </p>
        </div>

        {/* Form Container */}
        <div className="w-full">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Origin & Destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label htmlFor="origin" className={appleLabelClass}>
                  <MapPin className="mr-1.5 h-4 w-4 text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)]" />
                  Điểm đón
                </label>
                <AddressAutocomplete
                  placeholder="Nhập điểm đón..."
                  onAddressSelect={async (address, lat, lng, structured) => {
                    setValue('origin', address, { shouldValidate: true });
                    let prov = structured?.province;
                    let dist = structured?.district;
                    let ward = structured?.ward;
                    
                    if (lat && lng) {
                      setValue('originLat', lat);
                      setValue('originLng', lng);
                      setOriginCoords({ lat, lng });
                      
                      if (!prov) {
                        try {
                          const { reverseGeocodeStructured } = await import('@/lib/goong');
                          const data = await reverseGeocodeStructured(lat, lng);
                          if (data) {
                            prov = data.province;
                            dist = data.district;
                            ward = data.ward;
                          }
                        } catch {}
                      }
                    } else {
                      setOriginCoords(null);
                    }
                    
                    if (!prov) {
                      const parts = address.split(',').map(p => p.trim());
                      prov = parts[parts.length - 1] || 'Không xác định';
                    }
                    
                    setValue('originProvince', prov);
                    setValue('originDistrict', dist);
                    setValue('originWard', ward);
                    setValue('originHouseNumber', '');
                    setValue('originStreet', '');
                  }}
                />
                {errors.originProvince && (
                  <p className="text-[12px] text-[#d93025] mt-1 ml-1">{errors.originProvince.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="destination" className={appleLabelClass}>
                  <MapPin className="mr-1.5 h-4 w-4 text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)]" />
                  Điểm đến
                </label>
                <AddressAutocomplete
                  placeholder="Nhập điểm đến..."
                  onAddressSelect={async (address, lat, lng, structured) => {
                    setValue('destination', address, { shouldValidate: true });
                    let prov = structured?.province;
                    let dist = structured?.district;
                    let ward = structured?.ward;
                    
                    if (lat && lng) {
                      setValue('destinationLat', lat);
                      setValue('destinationLng', lng);
                      setDestinationCoords({ lat, lng });
                      
                      if (!prov) {
                        try {
                          const { reverseGeocodeStructured } = await import('@/lib/goong');
                          const data = await reverseGeocodeStructured(lat, lng);
                          if (data) {
                            prov = data.province;
                            dist = data.district;
                            ward = data.ward;
                          }
                        } catch {}
                      }
                    } else {
                      setDestinationCoords(null);
                    }
                    
                    if (!prov) {
                      const parts = address.split(',').map(p => p.trim());
                      prov = parts[parts.length - 1] || 'Không xác định';
                    }
                    
                    setValue('destProvince', prov);
                    setValue('destDistrict', dist);
                    setValue('destWard', ward);
                    setValue('destHouseNumber', '');
                    setValue('destStreet', '');
                  }}
                />
                {errors.destProvince && (
                  <p className="text-[12px] text-[#d93025] mt-1 ml-1">{errors.destProvince.message}</p>
                )}
              </div>
            </div>

            {/* Bản đồ preview Goong Maps + thông tin route Goong Directions */}
            {(originCoords || destinationCoords) && (
              <div className="space-y-2">
                {routeInfo && (
                  <div className="flex items-center gap-6 px-1 text-[13px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)]">
                    <span>Khoảng cách: <strong className="text-[#0071e3]">{routeInfo.distanceKm} km</strong></span>
                    <span>Thời gian: <strong className="text-[#0071e3]">{routeInfo.durationText}</strong></span>
                  </div>
                )}
                {isCalculatingRoute && (
                  <div className="flex items-center gap-2 px-1 text-[13px] text-[rgba(0,0,0,0.4)] dark:text-[rgba(255,255,255,0.4)]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Đang tính tuyến đường...
                  </div>
                )}
                <MapViewer
                  origin={originCoords ?? undefined}
                  destination={destinationCoords ?? undefined}
                  className="h-[260px]"
                />
              </div>
            )}

            {/* Departure Time */}
            <div className="space-y-1">
              <label htmlFor="departureTime" className={appleLabelClass}>
                <Calendar className="mr-1.5 h-4 w-4 text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)]" />
                Thời gian khởi hành
              </label>
              <input
                id="departureTime"
                type="datetime-local"
                className={appleInputClass}
                {...register('departureTime')}
                disabled={loading}
              />
              {errors.departureTime && (
                <p className="text-[12px] text-[#d93025] mt-1 ml-1">{errors.departureTime.message}</p>
              )}
            </div>

            {/* Seats & Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label htmlFor="availableSeats" className={appleLabelClass}>
                  <Users className="mr-1.5 h-4 w-4 text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)]" />
                  Số chỗ trống
                </label>
                <input
                  id="availableSeats"
                  type="number"
                  min="1"
                  className={appleInputClass}
                  {...register('availableSeats')}
                  disabled={loading}
                />
                {errors.availableSeats && (
                  <p className="text-[12px] text-[#d93025] mt-1 ml-1">{errors.availableSeats.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="pricePerSeat" className={appleLabelClass}>
                  <DollarSign className="mr-1.5 h-4 w-4 text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)]" />
                  Giá mỗi chỗ (VNĐ)
                </label>
                <input
                  id="pricePerSeat"
                  type="number"
                  min="0"
                  step="1000"
                  className={appleInputClass}
                  {...register('pricePerSeat')}
                  disabled={loading}
                />
                {errors.pricePerSeat && (
                  <p className="text-[12px] text-[#d93025] mt-1 ml-1">{errors.pricePerSeat.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label htmlFor="description" className={appleLabelClass}>
                <Info className="mr-1.5 h-4 w-4 text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)]" />
                Mô tả thêm (Tùy chọn)
              </label>
              <textarea
                id="description"
                className="flex min-h-[120px] w-full rounded-[11px] bg-[#fafafc] border-[3px] border-[rgba(0,0,0,0.04)] px-4 py-3 text-[17px] text-[#1d1d1f] transition-all hover:border-[rgba(0,0,0,0.08)] focus-visible:ring-0 focus-visible:border-transparent focus-visible:outline-none focus:outline-[2px] focus:outline-[#0071e3] focus:outline-offset-1 disabled:opacity-50 dark:bg-[rgba(255,255,255,0.05)] dark:text-white dark:border-[rgba(255,255,255,0.05)]"
                placeholder="Ví dụ: Chỉ đón khách trên dọc trục đường QL5..."
                {...register('description')}
                disabled={loading}
              />
              {errors.description && (
                <p className="text-[12px] text-[#d93025] mt-1 ml-1">{errors.description.message}</p>
              )}
            </div>

            {error && (
              <div className="bg-destructive/10 p-3 rounded-[11px] text-[#d93025] text-[14px] font-medium text-center tracking-tight">
                {error}
              </div>
            )}

            <div className="pt-6">
              <button type="submit" className={appleButtonClass} disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Đang gửi thông tin...
                  </span>
                ) : (
                  'Xuất bản chuyến đi'
                )}
              </button>
            </div>
            
          </form>
        </div>

      </div>
    </div>
  );
}
