'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRideSchema, CreateRideInput } from '@repo/shared';
import apiClient from '../../../lib/api-client';
import {
  Loader2, ArrowLeft, MapPin, Calendar, Users, DollarSign,
  Car, ChevronDown, Info, Check, Clock
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AddressAutocomplete } from '../../../components/ui/address-autocomplete';
import { useAuth } from '@/components/providers/auth-provider';
import { getDirections, formatDuration, reverseGeocodeStructured } from '../../../lib/goong';
import RideRouteMap from '@/components/rides/ride-route-map';

// Dynamic import: Goong Maps chỉ chạy trên client (không tương thích SSR)
const MapViewer = dynamic(
  () => import('@/components/ui/map-viewer').then((m) => m.MapViewer),
  { ssr: false, loading: () => <div className="h-[220px] rounded-[14px] bg-[rgba(0,0,0,0.03)] animate-pulse" /> }
);

// ============================================================
// DESIGN TOKENS — tất cả style tập trung tại đây
// ============================================================
const cls = {
  input: 'h-[52px] w-full rounded-[12px] bg-[#fafafc] border border-[rgba(0,0,0,0.08)] px-4 text-[16px] text-[#1d1d1f] outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 dark:bg-[rgba(255,255,255,0.06)] dark:text-white dark:border-[rgba(255,255,255,0.08)] dark:focus:border-[#0a84ff] placeholder:text-[rgba(0,0,0,0.3)] dark:placeholder:text-[rgba(255,255,255,0.3)]',
  label: 'text-[13px] font-semibold text-[rgba(0,0,0,0.6)] dark:text-[rgba(255,255,255,0.6)] mb-1.5 flex items-center gap-1.5',
  card: 'bg-white dark:bg-[#1c1c1e] rounded-[20px] border border-[rgba(0,0,0,0.07)] dark:border-[rgba(255,255,255,0.07)] shadow-[0_1px_6px_rgba(0,0,0,0.06)]',
  sectionTitle: 'text-[15px] font-semibold text-[#1d1d1f] dark:text-white',
  badge: 'text-[11px] font-medium px-2 py-0.5 rounded-full bg-[rgba(0,0,0,0.05)] dark:bg-[rgba(255,255,255,0.08)] text-[rgba(0,0,0,0.5)] dark:text-[rgba(255,255,255,0.5)]',
};

// ============================================================
// TYPE DEFINITIONS
// ============================================================
interface Vehicle {
  id: string;
  licensePlate: string;
  type: 'BIKE' | 'CAR';
  color?: string | null;
}

interface ActivePassenger {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  seats: number;
}

interface ActiveRide {
  id: string;
  origin: string;
  destination: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  departureTime: string;
  pricePerSeat: number;
  status: string;
}

// ============================================================
// ACCORDION COMPONENT — collapsible section thông minh
// ============================================================
function Accordion({
  title,
  badge,
  preview,
  children,
  defaultOpen = false,
}: {
  title: string;
  badge?: string;
  preview?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`${cls.card} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={cls.sectionTitle}>{title}</span>
          {badge && <span className={cls.badge}>{badge}</span>}
        </div>
        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
          {!open && preview && (
            <span className="text-[12px] text-[rgba(0,0,0,0.45)] dark:text-[rgba(255,255,255,0.45)] max-w-[140px] truncate">
              {preview}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-[rgba(0,0,0,0.35)] dark:text-[rgba(255,255,255,0.35)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? (contentRef.current?.scrollHeight ?? 1000) + 'px' : '0px' }}
      >
        <div className="px-5 pb-5 border-t border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)] pt-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TOGGLE SWITCH — tái sử dụng
// ============================================================
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative flex items-center cursor-pointer flex-shrink-0 ml-4">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className="w-10 h-[22px] bg-[rgba(0,0,0,0.15)] dark:bg-[rgba(255,255,255,0.15)] rounded-full peer transition-colors peer-checked:bg-[#34c759] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:after:translate-x-[18px]" />
    </label>
  );
}

// ============================================================
// SEAT COUNTER — nút [-] [+]
// ============================================================
function SeatCounter({ value, onChange, min = 1, max = 7 }: {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-10 h-10 rounded-full border border-[rgba(0,0,0,0.15)] dark:border-[rgba(255,255,255,0.15)] flex items-center justify-center text-[20px] text-[#1d1d1f] dark:text-white transition-all hover:border-[#0071e3] hover:text-[#0071e3] disabled:opacity-25 disabled:cursor-not-allowed select-none"
      >−</button>
      <span className="text-[26px] font-semibold text-[#1d1d1f] dark:text-white w-8 text-center tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-10 h-10 rounded-full border border-[rgba(0,0,0,0.15)] dark:border-[rgba(255,255,255,0.15)] flex items-center justify-center text-[20px] text-[#1d1d1f] dark:text-white transition-all hover:border-[#0071e3] hover:text-[#0071e3] disabled:opacity-25 disabled:cursor-not-allowed select-none"
      >+</button>
      <span className="text-[14px] text-[rgba(0,0,0,0.45)] dark:text-[rgba(255,255,255,0.45)] ml-1">ghế trống</span>
    </div>
  );
}

// ============================================================
// VEHICLE CARD ITEM — chọn xe dạng card
// ============================================================
function VehicleCard({ vehicle, selected, onClick }: { vehicle: Vehicle; selected: boolean; onClick: () => void }) {
  const typeLabel = vehicle.type === 'CAR' ? 'Ô tô' : 'Xe máy';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between p-3.5 rounded-[12px] border text-left transition-all ${
        selected
          ? 'border-[#0071e3] bg-[#0071e3]/[0.05] dark:bg-[#0071e3]/10'
          : 'border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] hover:border-[rgba(0,0,0,0.18)] dark:hover:border-[rgba(255,255,255,0.2)]'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${selected ? 'bg-[#0071e3]' : 'bg-[rgba(0,0,0,0.06)] dark:bg-[rgba(255,255,255,0.08)]'}`}>
          <Car className={`h-4 w-4 ${selected ? 'text-white' : 'text-[rgba(0,0,0,0.45)] dark:text-[rgba(255,255,255,0.45)]'}`} />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-[#1d1d1f] dark:text-white">{vehicle.licensePlate}</p>
          <p className="text-[12px] text-[rgba(0,0,0,0.45)] dark:text-[rgba(255,255,255,0.45)]">
            {typeLabel}{vehicle.color ? ` · ${vehicle.color}` : ''}
          </p>
        </div>
      </div>
      {selected && <Check className="h-4 w-4 text-[#0071e3] flex-shrink-0" />}
    </button>
  );
}

// ============================================================
// FORMAT CURRENCY
// ============================================================
function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================
export default function PostRidePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tọa độ điểm đón/đến để tính route
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationText: string; durationMinutes: number } | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Thời gian khởi hành
  const [isScheduled, setIsScheduled] = useState(false);
  const [isFlexibleTime, setIsFlexibleTime] = useState(false);

  // Quy định
  const [allowSmoking, setAllowSmoking] = useState(false);
  const [allowPets, setAllowPets] = useState(false);
  const [allowLuggage, setAllowLuggage] = useState(false);

  // Số ghế
  const [seatCount, setSeatCount] = useState(1);

  // Vehicle
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<string>('');
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Giá do hệ thống tính toán từ API /pricing/estimate
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [isEstimatingPrice, setIsEstimatingPrice] = useState(false);
  const [priceEstimateError, setPriceEstimateError] = useState<string | null>(null);

  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [hasRefreshed, setHasRefreshed] = useState(false);
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [activePassengers, setActivePassengers] = useState<ActivePassenger[]>([]);
  const [loadingActiveRide, setLoadingActiveRide] = useState(true);

  // ============================================================
  // Auth Guard + KYC Guard
  // ============================================================
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?callbackUrl=/rides/post');
      return;
    }
    const verifyDriverStatus = async () => {
      if (!user.isDriverVerified && !hasRefreshed) {
        setHasRefreshed(true);
        try { await refreshUser(); } catch (err) {
          console.error('Lỗi khi đồng bộ trạng thái tài xế:', err);
        }
      }
      setCheckingVerification(false);
    };
    verifyDriverStatus();
  }, [user, user?.id, refreshUser, router, authLoading, hasRefreshed]);

  useEffect(() => {
    if (authLoading || checkingVerification) return;
    if (user && !user.isDriverVerified) {
      router.replace('/profile/driver-verification');
    }
  }, [user, authLoading, checkingVerification, router]);

  // ============================================================
  // Kiểm tra chuyến đang hoạt động
  // ============================================================
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
        const confirmedActiveBooking = driverBookings.find(
          (b: { status: string; ride: { status: string } }) =>
            b.status === 'CONFIRMED' && (b.ride.status === 'SCHEDULED' || b.ride.status === 'ONGOING')
        );
        if (confirmedActiveBooking) {
          setActiveRide(confirmedActiveBooking.ride);
          const passengers = driverBookings
            .filter((b: { status: string; ride: { id: string } }) =>
              b.ride.id === confirmedActiveBooking.ride.id && b.status === 'CONFIRMED'
            )
            .map((b: { passenger: { id: string; firstName: string; lastName: string; phone?: string; avatarUrl?: string }; seats: number }) => ({
              id: b.passenger.id,
              firstName: b.passenger.firstName,
              lastName: b.passenger.lastName,
              phone: b.passenger.phone,
              avatarUrl: b.passenger.avatarUrl,
              seats: b.seats,
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

  // ============================================================
  // Fetch danh sách xe của tài xế
  // ============================================================
  const fetchMyVehicles = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingVehicles(true);
      const res = await apiClient.get('/vehicles');
      setVehicles(res.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách xe:', err);
    } finally {
      setLoadingVehicles(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.isDriverVerified && !checkingVerification) {
      fetchMyVehicles();
    }
  }, [user, checkingVerification, fetchMyVehicles]);

  // ============================================================
  // React Hook Form
  // ============================================================
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateRideInput>({
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
      allowSmoking: false,
      allowPets: false,
      allowLuggage: true,
      vehicleId: undefined,
    },
  });

  useEffect(() => {
    setValue('availableSeats', seatCount, { shouldValidate: false });
  }, [seatCount, setValue]);

  // ============================================================
  // Tự động tính route khi có đủ 2 điểm
  // ============================================================
  useEffect(() => {
    if (!originCoords || !destinationCoords) { setRouteInfo(null); return; }
    if (originCoords.lat === destinationCoords.lat && originCoords.lng === destinationCoords.lng) {
      setRouteInfo(null);
      return;
    }
    setIsCalculatingRoute(true);
    getDirections(`${originCoords.lat},${originCoords.lng}`, `${destinationCoords.lat},${destinationCoords.lng}`)
      .then((data) => {
        if (!data?.routes?.length) { setRouteInfo(null); return; }
        const leg = data.routes[0].legs?.[0];
        if (leg) {
          setRouteInfo({
            distanceKm: Math.round(leg.distance.value / 100) / 10,
            durationText: formatDuration(leg.duration.value),
            durationMinutes: Math.round(leg.duration.value / 60),
          });
        }
      })
      .catch((err: unknown) => console.error('[PostRide] Lỗi tính route:', err))
      .finally(() => setIsCalculatingRoute(false));
  }, [originCoords, destinationCoords]);

  // ============================================================
  // Tự động lấy giá từ API /pricing/estimate
  // Điều kiện B: cần đủ tọa độ VÀ đã chọn phương tiện (vehicleId)
  // ============================================================
  useEffect(() => {
    // Nếu thiếu bất kỳ điều kiện nào → reset giá, xoá lỗi cũ
    if (!originCoords || !destinationCoords || !vehicleId) {
      setEstimatedPrice(null);
      setPriceEstimateError(null);
      setValue('pricePerSeat', 0);
      return;
    }

    // Nếu điểm đón và điểm đến trùng nhau
    if (originCoords.lat === destinationCoords.lat && originCoords.lng === destinationCoords.lng) {
      setEstimatedPrice(null);
      setPriceEstimateError('Điểm đón và điểm đến không được trùng nhau');
      setValue('pricePerSeat', 0);
      return;
    }

    // Tìm loại xe từ danh sách đã load để truyền đúng vehicleType cho API
    const vehicleType = vehicles.find((v) => v.id === vehicleId)?.type ?? 'BIKE';

    // AbortController: hủy request cũ nếu effect re-run trước khi response về
    // Đảm bảo UI luôn hiển thị kết quả của request cuối cùng (tránh race condition)
    const controller = new AbortController();

    // Debounce 600ms: chờ user dừng thay đổi rồi mới gọi API
    // Tránh spam request khi kéo ghim bản đồ hoặc đổi phương tiện liên tục
    const debounceTimer = setTimeout(async () => {
      setIsEstimatingPrice(true);
      setPriceEstimateError(null);

      try {
        const res = await apiClient.get('/pricing/estimate', {
          params: {
            originLat: originCoords.lat,
            originLng: originCoords.lng,
            destLat: destinationCoords.lat,
            destLng: destinationCoords.lng,
            vehicleType,
          },
          signal: controller.signal,
        });

        const price: number = res.data.data.estimatedPrice;
        setEstimatedPrice(price);
        // Đồng bộ giá vào form để schema validation & payload submit hoạt động đúng
        setValue('pricePerSeat', price);
      } catch (err: unknown) {
        // Bỏ qua lỗi ERR_CANCELED — do AbortController chủ động hủy, không phải lỗi thực
        if ((err as { code?: string }).code === 'ERR_CANCELED') return;

        console.error('[PostRide] Lỗi lấy giá tự động:', err);
        setPriceEstimateError(
          ((err as { response?: { data?: { message?: string } } }).response)?.data?.message ||
          'Hệ thống chưa cấu hình giá cho loại xe này. Vui lòng liên hệ admin.'
        );
        setEstimatedPrice(null);
      } finally {
        setIsEstimatingPrice(false);
      }
    }, 600);

    // Cleanup: hủy debounce timer VÀ abort request khi dependencies thay đổi trước khi timer kích hoạt
    return () => {
      clearTimeout(debounceTimer);
      controller.abort();
    };
  }, [originCoords, destinationCoords, vehicleId, vehicles, setValue]);

  // ============================================================
  // Tải cấu hình chuyến đi gần nhất từ localStorage
  // ============================================================
  useEffect(() => {
    try {
      const saved = localStorage.getItem('coRide_lastRideSetup');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.allowSmoking === 'boolean') setAllowSmoking(parsed.allowSmoking);
        if (typeof parsed.allowPets === 'boolean') setAllowPets(parsed.allowPets);
        if (typeof parsed.allowLuggage === 'boolean') setAllowLuggage(parsed.allowLuggage);
        if (typeof parsed.seatCount === 'number') setSeatCount(parsed.seatCount);
        // Không cache pricePerSeat — giá phụ thuộc lộ trình & loại xe, phải lấy lại từ API
        if (typeof parsed.vehicleId === 'string' && parsed.vehicleId) setVehicleId(parsed.vehicleId);
        if (typeof parsed.description === 'string' && parsed.description) setValue('description', parsed.description);
      }
    } catch (e) {
      console.error('Lỗi khi tải cấu hình chuyến đi trước đó:', e);
    }
  }, [setValue]);

  // ============================================================
  // Submit Handler
  // ============================================================
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isScheduled) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5);
      setValue('departureTime', now.toISOString());
    }
    handleSubmit(onSubmit)(e);
  };

  const onSubmit = async (data: CreateRideInput) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...data,
        allowSmoking,
        allowPets,
        allowLuggage,
        vehicleId: vehicleId || undefined,
        ...(routeInfo && {
          distance: routeInfo.distanceKm,
          duration: routeInfo.durationMinutes,
        }),
      };

      // Lưu lại setup chuyến đi cho lần sau
      try {
        localStorage.setItem('coRide_lastRideSetup', JSON.stringify({
          allowSmoking,
          allowPets,
          allowLuggage,
          seatCount,
          vehicleId,
          description: data.description || '',
        }));
      } catch (e) {
        console.error('Lỗi khi lưu cấu hình chuyến đi:', e);
      }

      await apiClient.post('/rides', payload);
      router.push('/my-rides');
    } catch (err: unknown) {
      console.error('Lỗi khi đăng chuyến đi:', err);
      setError(
        ((err as { response?: { data?: { message?: string } } }).response)?.data?.message ||
          'Có lỗi xảy ra khi đăng chuyến đi. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Loading / KYC guard screen
  // ============================================================
  if (authLoading || checkingVerification || loadingActiveRide || !user || !user.isDriverVerified) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f5f7] dark:bg-black">
        <Loader2 className="h-9 w-9 animate-spin text-[#0071e3]" />
      </div>
    );
  }

  // ============================================================
  // Active ride view — tài xế đang có chuyến đặt
  // ============================================================
  if (activeRide) {
    const hasMapData =
      activeRide.originLat != null && activeRide.originLng != null &&
      activeRide.destinationLat != null && activeRide.destinationLng != null;
    const origin = hasMapData ? { lat: activeRide.originLat as number, lng: activeRide.originLng as number } : null;
    const destination = hasMapData ? { lat: activeRide.destinationLat as number, lng: activeRide.destinationLng as number } : null;

    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-black pt-10 pb-20 transition-colors">
        <div className="container max-w-[680px] mx-auto px-4 space-y-5">
          <div className="text-center mb-6">
            <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white mb-1">
              Chuyến đi đang hoạt động
            </h1>
            <p className="text-[14px] text-[rgba(0,0,0,0.5)] dark:text-[rgba(255,255,255,0.5)]">
              Hoàn thành chuyến này trước khi đăng thêm chuyến mới
            </p>
          </div>

          <div className={`${cls.card} overflow-hidden`}>
            <div className="p-4 pl-5">
              <h3 className="text-[14px] font-semibold text-[#1d1d1f] dark:text-white mb-3">Bản đồ dẫn đường</h3>
            </div>
            <div className="rounded-b-[20px] overflow-hidden">
              {hasMapData && origin && destination ? (
                <RideRouteMap origin={origin} destination={destination} />
              ) : (
                <div className="h-[180px] flex items-center justify-center text-[13px] text-[rgba(0,0,0,0.35)] bg-[rgba(0,0,0,0.02)]">
                  Chuyến đi này không có dữ liệu bản đồ
                </div>
              )}
            </div>
          </div>

          <div className={`${cls.card} p-5 space-y-3`}>
            <h3 className="text-[14px] font-semibold text-[#1d1d1f] dark:text-white">Thông tin hành trình</h3>
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              {[
                { label: 'Điểm đón', value: activeRide.origin },
                { label: 'Điểm đến', value: activeRide.destination },
                { label: 'Khởi hành', value: new Date(activeRide.departureTime).toLocaleString('vi-VN') },
                { label: 'Giá/ghế', value: <span className="text-[#0071e3] font-semibold">{activeRide.pricePerSeat.toLocaleString('vi-VN')}đ</span> },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[rgba(0,0,0,0.45)] dark:text-[rgba(255,255,255,0.45)]">{label}</p>
                  <p className="font-medium text-[#1d1d1f] dark:text-white mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {activePassengers.length > 0 && (
            <div className={`${cls.card} p-5`}>
              <h3 className="text-[14px] font-semibold text-[#1d1d1f] dark:text-white mb-3">
                Hành khách ({activePassengers.length})
              </h3>
              <div className="space-y-3">
                {activePassengers.map((pass) => (
                  <div key={pass.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[rgba(0,0,0,0.06)] dark:bg-[rgba(255,255,255,0.08)] flex items-center justify-center overflow-hidden flex-shrink-0">
                        {pass.avatarUrl
                          ? <Image src={pass.avatarUrl} alt={pass.firstName} width={36} height={36} className="w-full h-full object-cover" />
                          : <span className="text-[12px] font-semibold text-[rgba(0,0,0,0.45)]">{pass.firstName[0]}</span>
                        }
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-[#1d1d1f] dark:text-white">{pass.firstName} {pass.lastName}</p>
                        <p className="text-[12px] text-[rgba(0,0,0,0.4)] dark:text-[rgba(255,255,255,0.4)]">{pass.phone || 'Chưa cập nhật SĐT'}</p>
                      </div>
                    </div>
                    <span className="text-[12px] font-medium text-[#0071e3] bg-[#0071e3]/[0.08] px-2.5 py-1 rounded-full">
                      {pass.seats} ghế
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // DERIVED VALUES
  // ============================================================
  const maxRevenue = (estimatedPrice ?? 0) * seatCount;
  const selectedVehicle = vehicles.find(v => v.id === vehicleId);

  // Preview text cho accordion header khi đóng
  const vehiclePreview = selectedVehicle
    ? `${selectedVehicle.type === 'CAR' ? 'Ô tô' : 'Xe máy'} · ${selectedVehicle.licensePlate}`
    : 'Chưa chọn xe';

  const rulesPreview = [
    allowLuggage ? 'Hành lý OK' : null,
    allowPets ? 'Thú cưng OK' : null,
    !allowSmoking ? 'Không hút thuốc' : null,
  ].filter(Boolean).join('  ·  ');

  // ============================================================
  // MAIN FORM VIEW — Layout 2 cột
  // ============================================================
  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black pt-10 pb-24">
      <div className="container max-w-[1100px] mx-auto px-4">

        {/* Back link */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-[13px] font-medium text-[#0071e3] hover:text-[#005ea6] transition-colors group">
            <ArrowLeft className="mr-1 h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Hủy đăng chuyến
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[32px] md:text-[40px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white leading-tight">
            Đăng chuyến đi
          </h1>
          <p className="text-[15px] text-[rgba(0,0,0,0.5)] dark:text-[rgba(255,255,255,0.5)] mt-1">
            Điền thông tin bên dưới để tìm hành khách cùng chuyến.
          </p>
        </div>

        {/* 2-column layout */}
        <form onSubmit={handleFormSubmit} className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ===== LEFT: MAIN INFO ===== */}
          <div className="w-full lg:flex-1 min-w-0 space-y-3">
            <div className="space-y-3">

              {/* ─── CARD 1: Lộ trình (BẮT BUỘC, luôn mở) ─── */}
              <div className={`${cls.card} p-5 space-y-4`}>
                <div className="flex items-center justify-between">
                  <h2 className={cls.sectionTitle}>Lộ trình</h2>
                  {routeInfo && !isCalculatingRoute && (
                    <span className="text-[12px] text-[#34c759] font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      {routeInfo.distanceKm} km · {routeInfo.durationText}
                    </span>
                  )}
                  {isCalculatingRoute && (
                    <span className="text-[12px] text-[rgba(0,0,0,0.4)] flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Đang tính...
                    </span>
                  )}
                </div>

                {/* Điểm đón */}
                <div className="space-y-1.5">
                  <label className={cls.label}>
                    <MapPin className="h-3.5 w-3.5 text-[#0071e3]" />
                    Điểm đón <span className="text-[#d93025]">*</span>
                  </label>
                  <AddressAutocomplete
                    placeholder="Nhập địa chỉ đón..."
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
                            const data = await reverseGeocodeStructured(lat, lng);
                            if (data) { prov = data.province; dist = data.district; ward = data.ward; }
                          } catch { /* bỏ qua lỗi reverse geocode */ }
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
                    <p className="text-[12px] text-[#d93025]">{errors.originProvince.message}</p>
                  )}
                </div>

                {/* Điểm đến */}
                <div className="space-y-1.5">
                  <label className={cls.label}>
                    <MapPin className="h-3.5 w-3.5 text-[#ff3b30]" />
                    Điểm đến <span className="text-[#d93025]">*</span>
                  </label>
                  <AddressAutocomplete
                    placeholder="Nhập địa chỉ đến..."
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
                            const data = await reverseGeocodeStructured(lat, lng);
                            if (data) { prov = data.province; dist = data.district; ward = data.ward; }
                          } catch { /* bỏ qua lỗi reverse geocode */ }
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
                    <p className="text-[12px] text-[#d93025]">{errors.destProvince.message}</p>
                  )}
                </div>

                {/* Map preview — chỉ hiện khi có tọa độ */}
                {(originCoords || destinationCoords) && (
                  <div className="rounded-[12px] overflow-hidden">
                    <MapViewer origin={originCoords ?? undefined} destination={destinationCoords ?? undefined} className="h-[200px]" />
                  </div>
                )}
              </div>

              {/* ─── CARD 2: Thời gian + Ghế + Giá (BẮT BUỘC, luôn mở) ─── */}
              <div className={`${cls.card} p-5 space-y-5`}>
                <h2 className={cls.sectionTitle}>Thời gian & Giá vé</h2>

                {/* Toggle: Khởi hành ngay / Lên lịch */}
                <div className="flex items-center justify-between bg-[#f5f5f7] dark:bg-[rgba(255,255,255,0.04)] rounded-[12px] px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-[#0071e3]" />
                    <div>
                      <p className="text-[14px] font-medium text-[#1d1d1f] dark:text-white">
                        {isScheduled ? 'Đã lên lịch' : 'Khởi hành ngay'}
                      </p>
                      <p className="text-[12px] text-[rgba(0,0,0,0.45)] dark:text-[rgba(255,255,255,0.45)]">
                        {isScheduled ? 'Chọn ngày giờ cụ thể bên dưới' : 'Xuất phát trong ~5 phút'}
                      </p>
                    </div>
                  </div>
                  <Toggle
                    checked={isScheduled}
                    onChange={(v) => {
                      setIsScheduled(v);
                      if (!v) setValue('departureTime', '');
                    }}
                  />
                </div>

                {/* Datetime picker — chỉ hiện khi bật lịch */}
                {isScheduled && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-1 fade-in duration-200">
                    <label htmlFor="departureTime" className={cls.label}>
                      <Calendar className="h-3.5 w-3.5 text-[rgba(0,0,0,0.4)] dark:text-[rgba(255,255,255,0.4)]" />
                      Ngày &amp; giờ khởi hành
                    </label>
                    <input
                      id="departureTime"
                      type="datetime-local"
                      className={cls.input}
                      {...register('departureTime')}
                      disabled={loading}
                      min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                    />
                    {errors.departureTime && (
                      <p className="text-[12px] text-[#d93025]">{errors.departureTime.message}</p>
                    )}
                    {/* Checkbox linh hoạt */}
                    <label className="flex items-center gap-2 cursor-pointer mt-2 select-none">
                      <div className="relative flex-shrink-0">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isFlexibleTime}
                          onChange={(e) => setIsFlexibleTime(e.target.checked)}
                        />
                        <div className="w-4 h-4 border border-[rgba(0,0,0,0.2)] dark:border-[rgba(255,255,255,0.2)] rounded peer-checked:bg-[#0071e3] peer-checked:border-[#0071e3] transition-all flex items-center justify-center">
                          {isFlexibleTime && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </div>
                      <span className="text-[13px] text-[rgba(0,0,0,0.6)] dark:text-[rgba(255,255,255,0.6)]">
                        Linh hoạt <strong>±15 phút</strong>
                      </span>
                    </label>
                  </div>
                )}

                {/* Separator */}
                <div className="h-px bg-[rgba(0,0,0,0.05)] dark:bg-[rgba(255,255,255,0.05)]" />

                {/* Số ghế */}
                <div className="space-y-2">
                  <label className={cls.label}>
                    <Users className="h-3.5 w-3.5 text-[rgba(0,0,0,0.4)] dark:text-[rgba(255,255,255,0.4)]" />
                    Số chỗ trống
                  </label>
                  <SeatCounter value={seatCount} onChange={setSeatCount} />
                </div>

                {/* Giá mỗi ghế — do hệ thống tự động tính dựa trên lộ trình + phương tiện */}
                <div className="space-y-1.5">
                  <label className={cls.label}>
                    <DollarSign className="h-3.5 w-3.5 text-[rgba(0,0,0,0.4)] dark:text-[rgba(255,255,255,0.4)]" />
                    Giá mỗi chỗ (VNĐ)
                  </label>

                  {/* Read-only card — màu viền thay đổi theo trạng thái */}
                  <div className={`min-h-[52px] w-full rounded-[12px] border flex items-center justify-between px-4 py-3 transition-all ${
                    priceEstimateError
                      ? 'border-[#d93025]/40 bg-[#d93025]/[0.04] dark:bg-[#d93025]/[0.06]'
                      : estimatedPrice
                      ? 'border-[#34c759]/50 bg-[#34c759]/[0.04] dark:bg-[#34c759]/[0.06]'
                      : 'border-[rgba(0,0,0,0.08)] bg-[#fafafc] dark:bg-[rgba(255,255,255,0.04)] dark:border-[rgba(255,255,255,0.08)]'
                  }`}>
                    {isEstimatingPrice ? (
                      <span className="flex items-center gap-2 text-[14px] text-[rgba(0,0,0,0.4)] dark:text-[rgba(255,255,255,0.4)]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tính giá...
                      </span>
                    ) : estimatedPrice ? (
                      <span className="text-[22px] font-bold text-[#1d1d1f] dark:text-white tabular-nums">
                        {formatVND(estimatedPrice)}
                      </span>
                    ) : !vehicleId ? (
                      <span className="text-[13px] text-[rgba(0,0,0,0.35)] dark:text-[rgba(255,255,255,0.35)]">
                        Vui lòng chọn đầy đủ thông tin để hệ thống tính giá
                      </span>
                    ) : (
                      <span className="text-[13px] text-[rgba(0,0,0,0.35)] dark:text-[rgba(255,255,255,0.35)]">
                        Nhập lộ trình để xem giá
                      </span>
                    )}
                  </div>

                  {priceEstimateError && (
                    <p className="text-[12px] text-[#d93025]">{priceEstimateError}</p>
                  )}

                  {/* Doanh thu tối đa — chỉ hiển thị khi có giá hợp lệ */}
                  {estimatedPrice && estimatedPrice > 0 && (
                    <p className="text-[12px] text-[rgba(0,0,0,0.45)] dark:text-[rgba(255,255,255,0.45)]">
                      Doanh thu tối đa:{' '}
                      <span className="font-semibold text-[#0071e3]">{formatVND(maxRevenue)}</span>
                      {' '}({seatCount} ghế)
                    </p>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-3.5 rounded-[12px] bg-[#d93025]/[0.08] text-[#d93025] text-[13px] font-medium">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                id="submit-ride-btn"
                disabled={loading || isEstimatingPrice || !estimatedPrice || !!priceEstimateError}
                className="w-full h-[52px] rounded-[14px] bg-[#0071e3] text-white text-[16px] font-semibold tracking-tight transition-all hover:bg-[#0077ED] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed mt-4"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang gửi...
                  </span>
                ) : (
                  'Xuất bản chuyến đi'
                )}
              </button>
            </div>
          </div>

          {/* ===== RIGHT: OPTIONS & PREVIEW ===== */}
          <div className="w-full lg:w-[320px] flex-shrink-0 space-y-4">

            {/* Map card — chỉ hiện trên desktop (lg+), mobile dùng map preview inline trong form */}
            {(originCoords || destinationCoords) && (
              <div className={`hidden lg:block ${cls.card} overflow-hidden`}>
                <div className="p-4 pb-2">
                  <p className="text-[13px] font-semibold text-[#1d1d1f] dark:text-white">Bản đồ lộ trình</p>
                </div>
                <MapViewer origin={originCoords ?? undefined} destination={destinationCoords ?? undefined} className="h-[180px]" />
              </div>
            )}

            {/* Summary card */}
            <div className={`${cls.card} p-4 space-y-3`}>
              <p className="text-[13px] font-semibold text-[#1d1d1f] dark:text-white">Tóm tắt chuyến đi</p>

              {routeInfo ? (
                <div className="space-y-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-[rgba(0,0,0,0.45)] dark:text-[rgba(255,255,255,0.45)]">Khoảng cách</span>
                    <span className="font-semibold text-[#1d1d1f] dark:text-white">{routeInfo.distanceKm} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[rgba(0,0,0,0.45)] dark:text-[rgba(255,255,255,0.45)]">Thời gian</span>
                    <span className="font-semibold text-[#1d1d1f] dark:text-white">{routeInfo.durationText}</span>
                  </div>
                </div>
              ) : (
                <p className="text-[12px] text-[rgba(0,0,0,0.35)] dark:text-[rgba(255,255,255,0.35)]">
                  Nhập điểm đón &amp; điểm đến để xem lộ trình
                </p>
              )}

              <div className="h-px bg-[rgba(0,0,0,0.05)] dark:bg-[rgba(255,255,255,0.05)]" />

              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-[rgba(0,0,0,0.45)] dark:text-[rgba(255,255,255,0.45)]">Số ghế</span>
                  <span className="font-semibold text-[#1d1d1f] dark:text-white">{seatCount} ghế</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[rgba(0,0,0,0.45)] dark:text-[rgba(255,255,255,0.45)]">Giá tiền</span>
                  <span className="font-semibold text-[#1d1d1f] dark:text-white">
                    {isEstimatingPrice ? '...' : estimatedPrice ? formatVND(estimatedPrice) : '—'}
                  </span>
                </div>
                {estimatedPrice && estimatedPrice > 0 && (
                  <div className="flex justify-between pt-1 border-t border-[rgba(0,0,0,0.05)] dark:border-[rgba(255,255,255,0.05)]">
                    <span className="text-[rgba(0,0,0,0.45)] dark:text-[rgba(255,255,255,0.45)]">Doanh thu tối đa</span>
                    <span className="font-bold text-[#0071e3]">{formatVND(maxRevenue)}</span>
                  </div>
                )}
              </div>

              <div className="h-px bg-[rgba(0,0,0,0.05)] dark:bg-[rgba(255,255,255,0.05)]" />

              {/* Rules summary */}
              <div className="space-y-1.5 text-[12px]">
                {[
                  { label: 'Hút thuốc', ok: allowSmoking },
                  { label: 'Thú cưng', ok: allowPets },
                  { label: 'Hành lý lớn', ok: allowLuggage },
                ].map(({ label, ok }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[rgba(0,0,0,0.45)] dark:text-[rgba(255,255,255,0.45)]">{label}</span>
                    <span className={`font-medium ${ok ? 'text-[#34c759]' : 'text-[rgba(0,0,0,0.3)] dark:text-[rgba(255,255,255,0.3)]'}`}>
                      {ok ? 'Cho phép' : 'Không'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* ─── ACCORDION 1: Phương tiện (tùy chọn) ─── */}
            <Accordion
              title="Phương tiện"
              badge="Tùy chọn"
              preview={vehiclePreview}
            >
              {loadingVehicles ? (
                <div className="flex items-center gap-2 text-[13px] text-[rgba(0,0,0,0.4)] py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
                </div>
              ) : vehicles.length === 0 ? (
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[rgba(0,0,0,0.45)] dark:text-[rgba(255,255,255,0.45)]">Bạn chưa đăng ký xe nào</span>
                  <Link href="/profile" className="text-[#0071e3] font-medium hover:underline">Thêm xe</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Option: không chọn xe */}
                  <button
                    type="button"
                    onClick={() => setVehicleId('')}
                    className={`w-full flex items-center gap-3 p-3 rounded-[12px] border text-left text-[13px] transition-all ${
                      !vehicleId
                        ? 'border-[rgba(0,0,0,0.15)] bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.04)]'
                        : 'border-transparent'
                    }`}
                  >
                    <span className="text-[rgba(0,0,0,0.45)] dark:text-[rgba(255,255,255,0.45)]">Không chọn xe cụ thể</span>
                    {!vehicleId && <Check className="h-3.5 w-3.5 text-[rgba(0,0,0,0.35)] ml-auto" />}
                  </button>
                  {vehicles.map((v) => (
                    <VehicleCard
                      key={v.id}
                      vehicle={v}
                      selected={vehicleId === v.id}
                      onClick={() => setVehicleId(v.id)}
                    />
                  ))}
                </div>
              )}
            </Accordion>

            {/* ─── ACCORDION 2: Quy định xe (tùy chọn) ─── */}
            <Accordion
              title="Quy định xe"
              badge="Tùy chọn"
              preview={rulesPreview || 'Chưa đặt quy định'}
            >
              <div className="space-y-1 divide-y divide-[rgba(0,0,0,0.05)] dark:divide-[rgba(255,255,255,0.05)]">
                {[
                  { label: 'Hút thuốc', description: allowSmoking ? 'Cho phép hút thuốc trên xe' : 'Không cho phép hút thuốc', value: allowSmoking, onChange: setAllowSmoking },
                  { label: 'Mang thú cưng', description: allowPets ? 'Cho phép mang thú cưng' : 'Không cho phép mang thú cưng', value: allowPets, onChange: setAllowPets },
                  { label: 'Hành lý cồng kềnh', description: allowLuggage ? 'Cho phép mang hành lý lớn' : 'Chỉ mang hành lý nhỏ', value: allowLuggage, onChange: setAllowLuggage },
                ].map(({ label, description, value, onChange }) => (
                  <label key={label} className="flex items-center justify-between py-3 cursor-pointer group">
                    <div>
                      <p className="text-[14px] font-medium text-[#1d1d1f] dark:text-white group-hover:text-[#0071e3] transition-colors">{label}</p>
                      <p className="text-[12px] text-[rgba(0,0,0,0.45)] dark:text-[rgba(255,255,255,0.45)]">{description}</p>
                    </div>
                    <div className="relative flex items-center justify-center mr-1">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                      />
                      <div className="w-[22px] h-[22px] rounded-[6px] border-[1.5px] border-[rgba(0,0,0,0.25)] dark:border-[rgba(255,255,255,0.25)] peer-checked:bg-[#0071e3] peer-checked:border-[#0071e3] transition-all flex items-center justify-center">
                        <Check className={`w-3.5 h-3.5 text-white transition-transform duration-200 ${value ? 'scale-100' : 'scale-0'}`} strokeWidth={3} />
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </Accordion>

            {/* ─── ACCORDION 3: Mô tả thêm (tùy chọn) ─── */}
            <Accordion
              title="Ghi chú thêm"
              badge="Tùy chọn"
              preview="Thêm thông tin cho hành khách"
            >
              <div className="space-y-1.5">
                <label htmlFor="description" className={cls.label}>
                  <Info className="h-3.5 w-3.5 text-[rgba(0,0,0,0.35)] dark:text-[rgba(255,255,255,0.35)]" />
                  Mô tả
                </label>
                <textarea
                  id="description"
                  className="flex min-h-[100px] w-full rounded-[12px] bg-[#fafafc] border border-[rgba(0,0,0,0.08)] px-4 py-3 text-[15px] text-[#1d1d1f] outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20 dark:bg-[rgba(255,255,255,0.06)] dark:text-white dark:border-[rgba(255,255,255,0.08)] placeholder:text-[rgba(0,0,0,0.3)] dark:placeholder:text-[rgba(255,255,255,0.3)] resize-none"
                  placeholder="Ví dụ: Xuất phát đúng giờ. Ưu tiên sinh viên. Không hút thuốc trên xe..."
                  {...register('description')}
                  disabled={loading}
                />
                {errors.description && (
                  <p className="text-[12px] text-[#d93025]">{errors.description.message}</p>
                )}
              </div>
            </Accordion>


          </div>

        </form>
      </div>
    </div>
  );
}
