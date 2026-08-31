'use client';

import React, { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRideSchema, CreateRideInput } from '@repo/shared';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Car,
  Check,
  CheckCircle2,
  Cigarette,
  ClipboardCheck,
  Clock,
  Info,
  Luggage,
  type LucideIcon,
  MapPin,
  Minus,
  PawPrint,
  Plus,
  Route,
  Settings2,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { cn } from '@/lib/utils';
import { formatDuration, getDirections, reverseGeocodeStructured } from '@/lib/goong';

const MapViewer = dynamic(
  () => import('@/components/ui/map-viewer').then((module) => module.MapViewer),
  {
    ssr: false,
    loading: () => (
      <div className="h-[340px] animate-pulse rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]" />
    ),
  }
);

type WizardStep = 0 | 1 | 2 | 3;

interface Coordinates {
  lat: number;
  lng: number;
}

interface Vehicle {
  id: string;
  licensePlate: string;
  type: 'BIKE' | 'CAR';
  color?: string | null;
  imageUrl?: string | null;
}

interface ActiveRide {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  status: string;
}

interface RouteInfo {
  distanceKm: number;
  durationMinutes: number;
  durationText: string;
  routePolyline: string;
}

interface StructuredAddress {
  province?: string;
  district?: string;
  ward?: string;
  compound?: {
    province?: string;
    district?: string;
    commune?: string;
  };
}

const steps = [
  { title: 'Hành trình', description: 'Địa điểm, thời gian và xe', icon: MapPin },
  { title: 'Lộ trình', description: 'Kiểm tra tuyến đề xuất', icon: Route },
  { title: 'Thiết lập', description: 'Ghế, giá và quy định', icon: Settings2 },
  { title: 'Xác nhận', description: 'Xem lại trước khi đăng', icon: ClipboardCheck },
] as const;

const inputClass =
  'h-12 w-full rounded-xl border border-black/10 bg-white px-4 text-[15px] text-[#1d1d1f] outline-none transition-colors placeholder:text-black/35 focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/35';

const labelClass =
  'mb-2 block text-[13px] font-semibold leading-5 text-[#1d1d1f] dark:text-white';

function toDateTimeLocal(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

function Surface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-3xl border border-black/[0.07] bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#1c1c1e] dark:shadow-none sm:p-6',
        className
      )}
    >
      {children}
    </section>
  );
}

function StepIndicator({
  currentStep,
  furthestStep,
  onStepChange,
}: {
  currentStep: WizardStep;
  furthestStep: WizardStep;
  onStepChange: (step: WizardStep) => void;
}) {
  return (
    <nav aria-label="Tiến trình đăng chuyến" className="overflow-x-auto pb-1">
      <ol className="grid min-w-[620px] grid-cols-4 gap-2">
        {steps.map((item, index) => {
          const step = index as WizardStep;
          const Icon = item.icon;
          const isActive = currentStep === step;
          const isComplete = currentStep > step || furthestStep > step;
          const canNavigate = step <= furthestStep;

          return (
            <li key={item.title}>
              <button
                type="button"
                disabled={!canNavigate}
                onClick={() => canNavigate && onStepChange(step)}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'flex min-h-16 w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors',
                  isActive
                    ? 'border-[#0071e3]/30 bg-[#0071e3]/[0.07]'
                    : 'border-transparent bg-transparent',
                  canNavigate
                    ? 'cursor-pointer hover:bg-black/[0.035] dark:hover:bg-white/[0.05]'
                    : 'cursor-default opacity-45'
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                    isActive
                      ? 'bg-[#0071e3] text-white'
                      : isComplete
                        ? 'bg-[#34c759]/12 text-[#248a3d] dark:text-[#30d158]'
                        : 'bg-black/[0.05] text-black/45 dark:bg-white/[0.07] dark:text-white/45'
                  )}
                >
                  {isComplete && !isActive ? (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold leading-5 text-[#1d1d1f] dark:text-white">
                    {index + 1}. {item.title}
                  </span>
                  <span className="block truncate text-[11px] leading-4 text-black/45 dark:text-white/45">
                    {item.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function RuleToggle({
  checked,
  onChange,
  label,
  description,
  icon: Icon,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'group flex min-h-[82px] w-full items-center gap-3 rounded-xl px-2.5 py-3 text-left outline-none transition-colors',
        'hover:bg-black/[0.025] focus-visible:bg-[#0071e3]/[0.055] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0071e3]',
        'dark:hover:bg-white/[0.035] dark:focus-visible:bg-[#0a84ff]/10 motion-reduce:transition-none'
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors motion-reduce:transition-none',
          checked
            ? 'bg-[#0071e3]/10 text-[#0071e3] dark:bg-[#0a84ff]/15 dark:text-[#0a84ff]'
            : 'bg-black/[0.045] text-black/40 dark:bg-white/[0.07] dark:text-white/45'
        )}
      >
        <Icon className="h-[18px] w-[18px]" aria-hidden={true} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold leading-5 text-[#1d1d1f] dark:text-white">
          {label}
        </span>
        <span className="mt-0.5 block text-[12px] leading-[18px] text-black/50 dark:text-white/50">
          {description}
        </span>
      </span>

      <span className="ml-1 flex shrink-0 items-center gap-2.5">
        <span
          aria-hidden="true"
          className={cn(
            'hidden min-w-8 text-right text-[11px] font-semibold sm:block',
            checked ? 'text-[#0071e3] dark:text-[#0a84ff]' : 'text-black/35 dark:text-white/35'
          )}
        >
          {checked ? 'Bật' : 'Tắt'}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'relative h-[30px] w-[50px] rounded-full border transition-colors duration-200 motion-reduce:transition-none',
            checked
              ? 'border-[#0071e3] bg-[#0071e3] dark:border-[#0a84ff] dark:bg-[#0a84ff]'
              : 'border-black/[0.08] bg-[#e8e8ed] dark:border-white/10 dark:bg-white/20'
          )}
        >
          <span
            className={cn(
              'absolute left-[3px] top-[2px] flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.24)] transition-transform duration-200 motion-reduce:transition-none',
              checked && 'translate-x-5'
            )}
          >
            <Check
              className={cn(
                'h-3 w-3 text-[#0071e3] transition-opacity dark:text-[#0a84ff]',
                checked ? 'opacity-100' : 'opacity-0'
              )}
            />
          </span>
        </span>
      </span>
    </button>
  );
}

function SeatCounter({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-4 rounded-2xl border border-black/[0.08] bg-black/[0.02] p-2 dark:border-white/[0.09] dark:bg-white/[0.04]">
      <button
        type="button"
        aria-label="Giảm số ghế"
        disabled={value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#1d1d1f] shadow-sm transition-colors hover:text-[#0071e3] disabled:cursor-not-allowed disabled:opacity-35 dark:bg-white/[0.08] dark:text-white"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="min-w-20 text-center">
        <p className="text-2xl font-semibold tabular-nums text-[#1d1d1f] dark:text-white">{value}</p>
        <p className="text-[11px] text-black/45 dark:text-white/45">tối đa {max} ghế</p>
      </div>
      <button
        type="button"
        aria-label="Tăng số ghế"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#1d1d1f] shadow-sm transition-colors hover:text-[#0071e3] disabled:cursor-not-allowed disabled:opacity-35 dark:bg-white/[0.08] dark:text-white"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-5 py-3">
      <dt className="text-[13px] leading-5 text-black/50 dark:text-white/50">{label}</dt>
      <dd
        className={cn(
          'max-w-[65%] text-right text-[13px] font-semibold leading-5 text-[#1d1d1f] dark:text-white',
          accent && 'text-[#0071e3] dark:text-[#0a84ff]'
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export default function PostRidePage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasRefreshedAccess, setHasRefreshedAccess] = useState(false);
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [step, setStep] = useState<WizardStep>(0);
  const [furthestStep, setFurthestStep] = useState<WizardStep>(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [originCoords, setOriginCoords] = useState<Coordinates | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<Coordinates | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const [seatCount, setSeatCount] = useState(1);
  const [allowRoutePickup, setAllowRoutePickup] = useState(true);
  const [allowSmoking, setAllowSmoking] = useState(false);
  const [allowPets, setAllowPets] = useState(false);
  const [allowLuggage, setAllowLuggage] = useState(true);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [isEstimatingPrice, setIsEstimatingPrice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    setValue,
    trigger,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRideInput>({
    resolver: zodResolver(createRideSchema),
    mode: 'onBlur',
    defaultValues: {
      origin: '',
      destination: '',
      departureTime: toDateTimeLocal(new Date(Date.now() + 60 * 60_000)),
      availableSeats: 1,
      pricePerSeat: 0,
      description: '',
      allowRoutePickup: true,
      allowSmoking: false,
      allowPets: false,
      allowLuggage: true,
    },
  });

  const originAddress = watch('origin') || '';
  const destinationAddress = watch('destination') || '';
  const departureTime = watch('departureTime');
  const description = watch('description') || '';
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId);
  const maxSeats = selectedVehicle?.type === 'BIKE' ? 1 : 4;
  const maximumRevenue = (estimatedPrice || 0) * seatCount;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?callbackUrl=/rides/post');
      return;
    }

    let cancelled = false;
    const checkAccess = async () => {
      try {
        if (!user.isDriverVerified && !hasRefreshedAccess) {
          setHasRefreshedAccess(true);
          await refreshUser();
        }
      } finally {
        if (!cancelled) setCheckingAccess(false);
      }
    };
    checkAccess();
    return () => {
      cancelled = true;
    };
  }, [authLoading, hasRefreshedAccess, refreshUser, router, user]);

  useEffect(() => {
    if (authLoading || checkingAccess || !user) return;
    if (!user.isDriverVerified) {
      router.replace('/profile/driver-verification');
    }
  }, [authLoading, checkingAccess, router, user]);

  useEffect(() => {
    if (!user?.isDriverVerified || checkingAccess) return;
    let cancelled = false;

    const loadInitialData = async () => {
      setLoadingVehicles(true);
      try {
        const [vehicleResponse, ridesResponse] = await Promise.all([
          apiClient.get('/vehicles'),
          apiClient.get('/rides/mine'),
        ]);
        if (cancelled) return;

        const vehicleList = (vehicleResponse.data || []) as Vehicle[];
        const rideList = (ridesResponse.data?.rides || ridesResponse.data || []) as ActiveRide[];
        setVehicles(vehicleList);
        setActiveRide(
          rideList.find((ride) => ride.status === 'ONGOING') || null
        );

        const saved = localStorage.getItem('coRide_lastRideSetup');
        if (saved) {
          const setup = JSON.parse(saved) as {
            vehicleId?: string;
            seatCount?: number;
            allowRoutePickup?: boolean;
            allowSmoking?: boolean;
            allowPets?: boolean;
            allowLuggage?: boolean;
          };
          if (setup.vehicleId && vehicleList.some((vehicle) => vehicle.id === setup.vehicleId)) {
            setVehicleId(setup.vehicleId);
          }
          if (typeof setup.seatCount === 'number') setSeatCount(setup.seatCount);
          if (typeof setup.allowRoutePickup === 'boolean') setAllowRoutePickup(setup.allowRoutePickup);
          if (typeof setup.allowSmoking === 'boolean') setAllowSmoking(setup.allowSmoking);
          if (typeof setup.allowPets === 'boolean') setAllowPets(setup.allowPets);
          if (typeof setup.allowLuggage === 'boolean') setAllowLuggage(setup.allowLuggage);
        }
      } catch (loadError) {
        console.error('[PostRide] Không thể tải dữ liệu khởi tạo:', loadError);
        if (!cancelled) setStepError('Không thể tải phương tiện. Vui lòng thử tải lại trang.');
      } finally {
        if (!cancelled) setLoadingVehicles(false);
      }
    };

    loadInitialData();
    return () => {
      cancelled = true;
    };
  }, [checkingAccess, user]);

  useEffect(() => {
    if (!selectedVehicle) return;
    const limit = selectedVehicle.type === 'BIKE' ? 1 : 4;
    if (seatCount > limit) setSeatCount(limit);
  }, [seatCount, selectedVehicle]);

  useEffect(() => {
    setValue('availableSeats', seatCount, { shouldValidate: true });
  }, [seatCount, setValue]);

  useEffect(() => {
    setValue('vehicleId', vehicleId || undefined, { shouldValidate: true });
  }, [setValue, vehicleId]);

  useEffect(() => {
    setValue('allowRoutePickup', allowRoutePickup);
    setValue('allowSmoking', allowSmoking);
    setValue('allowPets', allowPets);
    setValue('allowLuggage', allowLuggage);
  }, [allowLuggage, allowPets, allowRoutePickup, allowSmoking, setValue]);

  useEffect(() => {
    if (!originCoords || !destinationCoords) {
      setRouteInfo(null);
      setRouteError(null);
      return;
    }
    if (
      originCoords.lat === destinationCoords.lat &&
      originCoords.lng === destinationCoords.lng
    ) {
      setRouteInfo(null);
      setRouteError('Điểm đi và điểm đến không được trùng nhau.');
      return;
    }

    let cancelled = false;
    setIsCalculatingRoute(true);
    setRouteError(null);
    getDirections(
      originCoords.lat + ',' + originCoords.lng,
      destinationCoords.lat + ',' + destinationCoords.lng
    )
      .then((data) => {
        if (cancelled) return;
        const route = data?.routes?.[0];
        const leg = route?.legs?.[0];
        if (!route || !leg) {
          setRouteInfo(null);
          setRouteError('Không tìm thấy tuyến đường phù hợp giữa hai địa điểm.');
          return;
        }
        const routePoints = route.overview_polyline?.points;
        setRouteInfo({
          distanceKm: Math.round(leg.distance.value / 100) / 10,
          durationMinutes: Math.max(1, Math.round(leg.duration.value / 60)),
          durationText: formatDuration(leg.duration.value),
          routePolyline:
            typeof routePoints === 'string'
              ? routePoints
              : JSON.stringify({ coordinates: routePoints || [] }),
        });
      })
      .catch((directionsError) => {
        if (cancelled) return;
        console.error('[PostRide] Không thể tính tuyến:', directionsError);
        setRouteInfo(null);
        setRouteError('Không thể tải lộ trình lúc này. Vui lòng kiểm tra lại địa điểm.');
      })
      .finally(() => {
        if (!cancelled) setIsCalculatingRoute(false);
      });

    return () => {
      cancelled = true;
    };
  }, [destinationCoords, originCoords]);

  useEffect(() => {
    if (!originCoords || !destinationCoords || !selectedVehicle || !routeInfo) {
      setEstimatedPrice(null);
      setPriceError(null);
      setValue('pricePerSeat', 0);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsEstimatingPrice(true);
      setPriceError(null);
      try {
        const response = await apiClient.get('/pricing/carpool-estimate', {
          params: {
            originLat: originCoords.lat,
            originLng: originCoords.lng,
            destLat: destinationCoords.lat,
            destLng: destinationCoords.lng,
            vehicleType: selectedVehicle.type,
            offeredSeats: seatCount,
          },
          signal: controller.signal,
        });
        const price = Number(response.data?.data?.estimatedPrice);
        if (!Number.isFinite(price) || price <= 0) {
          throw new Error('INVALID_PRICE');
        }
        setEstimatedPrice(price);
        setValue('pricePerSeat', price, { shouldValidate: true });
      } catch (estimateError) {
        if ((estimateError as { code?: string }).code === 'ERR_CANCELED') return;
        const message = (estimateError as {
          response?: { data?: { message?: string } };
        }).response?.data?.message;
        setEstimatedPrice(null);
        setValue('pricePerSeat', 0);
        setPriceError(message || 'Chưa thể tính giá đề xuất cho chuyến đi này.');
      } finally {
        setIsEstimatingPrice(false);
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [destinationCoords, originCoords, routeInfo, seatCount, selectedVehicle, setValue]);

  const handleAddressSelect = useCallback(
    async (
      field: 'origin' | 'destination',
      address: string,
      lat?: number,
      lng?: number,
      structured?: StructuredAddress
    ) => {
      const isOrigin = field === 'origin';
      setValue(field, address, { shouldDirty: true });
      setStepError(null);

      if (lat == null || lng == null) {
        if (isOrigin) setOriginCoords(null);
        else setDestinationCoords(null);
        return;
      }

      const coordinates = { lat, lng };
      if (isOrigin) {
        setOriginCoords(coordinates);
        setValue('originLat', lat);
        setValue('originLng', lng);
      } else {
        setDestinationCoords(coordinates);
        setValue('destinationLat', lat);
        setValue('destinationLng', lng);
      }

      let province = structured?.province || structured?.compound?.province;
      let district = structured?.district || structured?.compound?.district;
      let ward = structured?.ward || structured?.compound?.commune;
      if (!province) {
        try {
          const result = await reverseGeocodeStructured(lat, lng);
          province = result?.province;
          district = result?.district;
          ward = result?.ward;
        } catch {
          // Địa chỉ hiển thị vẫn hợp lệ; fallback bên dưới đảm bảo schema có tỉnh/thành.
        }
      }
      if (!province) {
        const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
        province = parts.at(-1) || 'Không xác định';
      }

      if (isOrigin) {
        setValue('originProvince', province, { shouldValidate: true });
        setValue('originDistrict', district);
        setValue('originWard', ward);
      } else {
        setValue('destProvince', province, { shouldValidate: true });
        setValue('destDistrict', district);
        setValue('destWard', ward);
      }
    },
    [setValue]
  );

  const validateJourneyStep = async () => {
    setStepError(null);
    if (!originAddress.trim() || !originCoords) {
      setStepError('Vui lòng chọn điểm đi từ danh sách gợi ý để xác định chính xác vị trí.');
      return false;
    }
    if (!destinationAddress.trim() || !destinationCoords) {
      setStepError('Vui lòng chọn điểm đến từ danh sách gợi ý để xác định chính xác vị trí.');
      return false;
    }
    if (!vehicleId) {
      setStepError('Vui lòng chọn phương tiện sử dụng cho chuyến đi.');
      return false;
    }
    if (!departureTime || new Date(departureTime).getTime() <= Date.now()) {
      setStepError('Thời gian khởi hành phải ở tương lai.');
      return false;
    }
    return trigger(['originProvince', 'destProvince', 'departureTime', 'vehicleId']);
  };

  const handleNext = async () => {
    setStepError(null);
    if (step === 0 && !(await validateJourneyStep())) return;
    if (step === 1 && (!routeInfo || routeError || isCalculatingRoute)) {
      setStepError('Cần có lộ trình hợp lệ trước khi tiếp tục.');
      return;
    }
    if (step === 2 && (!estimatedPrice || priceError || isEstimatingPrice)) {
      setStepError('Hệ thống cần tính được giá đề xuất trước khi xem lại chuyến.');
      return;
    }
    const nextStep = Math.min(3, step + 1) as WizardStep;
    setStep(nextStep);
    setFurthestStep((current) => Math.max(current, nextStep) as WizardStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStepError(null);
    setStep(Math.max(0, step - 1) as WizardStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data: CreateRideInput) => {
    if (!routeInfo || !originCoords || !destinationCoords || !estimatedPrice || !vehicleId) {
      setSubmitError('Thông tin chuyến chưa đầy đủ. Vui lòng kiểm tra lại các bước trước.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload: CreateRideInput = {
        ...data,
        origin: originAddress,
        originLat: originCoords.lat,
        originLng: originCoords.lng,
        destination: destinationAddress,
        destinationLat: destinationCoords.lat,
        destinationLng: destinationCoords.lng,
        departureTime: new Date(data.departureTime).toISOString(),
        vehicleId,
        availableSeats: seatCount,
        pricePerSeat: estimatedPrice,
        allowRoutePickup,
        allowSmoking,
        allowPets,
        allowLuggage,
        distance: routeInfo.distanceKm,
        duration: routeInfo.durationMinutes,
        routePolyline: routeInfo.routePolyline,
      };
      const response = await apiClient.post('/rides', payload);
      localStorage.setItem(
        'coRide_lastRideSetup',
        JSON.stringify({
          vehicleId,
          seatCount,
          allowRoutePickup,
          allowSmoking,
          allowPets,
          allowLuggage,
        })
      );
      const createdRideId = response.data?.ride?.id;
      router.push(createdRideId ? '/rides/' + createdRideId : '/my-rides');
    } catch (submitRequestError) {
      const message = (submitRequestError as {
        response?: { data?: { message?: string } };
      }).response?.data?.message;
      setSubmitError(message || 'Không thể đăng chuyến lúc này. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || checkingAccess || !user || !user.isDriverVerified) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#f5f5f7] dark:bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#0071e3]/20 border-t-[#0071e3]" />
          <p className="text-sm text-black/50 dark:text-white/50">Đang kiểm tra tài khoản tài xế...</p>
        </div>
      </div>
    );
  }

  if (activeRide) {
    return (
      <main className="min-h-screen bg-[#f5f5f7] px-4 py-12 dark:bg-black">
        <Surface className="mx-auto max-w-xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ff9f0a]/12 text-[#c93400] dark:text-[#ff9f0a]">
            <Clock className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
            Bạn đang có một chuyến hoạt động
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/55 dark:text-white/55">
            Hoàn thành hoặc hủy chuyến hiện tại trước khi đăng thêm chuyến mới.
          </p>
          <div className="mt-6 rounded-2xl bg-black/[0.025] p-4 text-left dark:bg-white/[0.05]">
            <p className="text-sm font-semibold text-[#1d1d1f] dark:text-white">{activeRide.origin}</p>
            <div className="my-2 h-5 w-px bg-black/15 dark:bg-white/20" />
            <p className="text-sm font-semibold text-[#1d1d1f] dark:text-white">{activeRide.destination}</p>
            <p className="mt-3 text-xs text-black/45 dark:text-white/45">
              {new Date(activeRide.departureTime).toLocaleString('vi-VN')}
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href={'/rides/' + activeRide.id}
              className="flex h-12 items-center justify-center rounded-xl bg-[#0071e3] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0077ed]"
            >
              Xem chuyến hiện tại
            </Link>
            <Link
              href="/my-rides"
              className="flex h-12 items-center justify-center rounded-xl border border-black/10 px-4 text-sm font-semibold text-[#1d1d1f] transition-colors hover:bg-black/[0.03] dark:border-white/10 dark:text-white dark:hover:bg-white/[0.05]"
            >
              Quản lý chuyến
            </Link>
          </div>
        </Surface>
      </main>
    );
  }

  const renderJourneyStep = () => (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
      <Surface>
        <div className="mb-6">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0071e3]">
            Bước 1
          </span>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
            Thông tin hành trình
          </h2>
          <p className="mt-1 text-sm leading-6 text-black/50 dark:text-white/50">
            Chọn địa điểm chính xác để hệ thống tính tuyến và ghép hành khách phù hợp.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className={labelClass}>Điểm đi <span className="text-[#d93025]">*</span></label>
            <AddressAutocomplete
              defaultValue={originAddress}
              placeholder="Nhập điểm xuất phát"
              inputClassName="h-12 border border-black/10 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/15 dark:border-white/10"
              onAddressSelect={(address, lat, lng, structured) =>
                handleAddressSelect('origin', address, lat, lng, structured as StructuredAddress)
              }
            />
          </div>

          <div className="flex items-center gap-3 pl-5" aria-hidden="true">
            <span className="h-5 w-px border-l border-dashed border-black/20 dark:border-white/20" />
            <span className="text-[11px] text-black/35 dark:text-white/35">Tuyến di chuyển</span>
          </div>

          <div>
            <label className={labelClass}>Điểm đến <span className="text-[#d93025]">*</span></label>
            <AddressAutocomplete
              defaultValue={destinationAddress}
              placeholder="Nhập điểm đến"
              inputClassName="h-12 border border-black/10 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/15 dark:border-white/10"
              onAddressSelect={(address, lat, lng, structured) =>
                handleAddressSelect('destination', address, lat, lng, structured as StructuredAddress)
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="departureTime" className={labelClass}>
                Ngày và giờ khởi hành <span className="text-[#d93025]">*</span>
              </label>
              <input
                id="departureTime"
                type="datetime-local"
                min={toDateTimeLocal(new Date(Date.now() + 5 * 60_000))}
                className={inputClass}
                {...register('departureTime')}
              />
              {errors.departureTime && (
                <p className="mt-1.5 text-xs text-[#d93025]">{errors.departureTime.message}</p>
              )}
            </div>
            <div className="rounded-2xl bg-[#0071e3]/[0.055] p-4">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#0071e3]" />
                <div>
                  <p className="text-xs font-semibold text-[#0071e3]">Gợi ý thời gian</p>
                  <p className="mt-1 text-xs leading-5 text-black/50 dark:text-white/50">
                    Đăng trước ít nhất 30 phút để có thêm cơ hội tìm được hành khách phù hợp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Surface>

      <Surface>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#1d1d1f] dark:text-white">Phương tiện</h2>
            <p className="text-xs text-black/45 dark:text-white/45">Bắt buộc để tính giá và số ghế</p>
          </div>
        </div>

        {loadingVehicles ? (
          <div className="space-y-3">
            {[0, 1].map((item) => (
              <div key={item} className="h-[76px] animate-pulse rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 p-5 text-center dark:border-white/15">
            <Car className="mx-auto h-6 w-6 text-black/35 dark:text-white/35" />
            <p className="mt-3 text-sm font-semibold text-[#1d1d1f] dark:text-white">Chưa có phương tiện</p>
            <p className="mt-1 text-xs leading-5 text-black/45 dark:text-white/45">
              Thêm và xác minh phương tiện trước khi đăng chuyến.
            </p>
            <Link href="/profile" className="mt-4 inline-flex text-sm font-semibold text-[#0071e3] hover:underline">
              Thêm phương tiện
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map((vehicle) => {
              const selected = vehicleId === vehicle.id;
              return (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => {
                    setVehicleId(vehicle.id);
                    setStepError(null);
                  }}
                  className={cn(
                    'flex min-h-[72px] w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors',
                    selected
                      ? 'border-[#0071e3] bg-[#0071e3]/[0.06]'
                      : 'border-black/[0.08] hover:border-black/20 dark:border-white/[0.09] dark:hover:border-white/20'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      selected
                        ? 'bg-[#0071e3] text-white'
                        : 'bg-black/[0.04] text-black/45 dark:bg-white/[0.07] dark:text-white/45'
                    )}
                  >
                    <Car className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[#1d1d1f] dark:text-white">
                      {vehicle.licensePlate}
                    </span>
                    <span className="block text-xs text-black/45 dark:text-white/45">
                      {vehicle.type === 'CAR' ? 'Ô tô · tối đa 4 ghế' : 'Xe máy · 1 ghế'}
                      {vehicle.color ? ' · ' + vehicle.color : ''}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border',
                      selected ? 'border-[#0071e3] bg-[#0071e3] text-white' : 'border-black/20 dark:border-white/25'
                    )}
                  >
                    {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Surface>
    </div>
  );

  const renderRouteStep = () => (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.55fr)]">
      <Surface className="overflow-hidden p-2 sm:p-2">
        <div className="px-4 pb-3 pt-3 sm:px-5">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0071e3]">Bước 2</span>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
            Xác nhận lộ trình
          </h2>
        </div>
        <div className="overflow-hidden rounded-[20px]">
          {originCoords && destinationCoords ? (
            <MapViewer origin={originCoords} destination={destinationCoords} className="h-[360px] sm:h-[430px]" />
          ) : (
            <div className="flex h-[360px] items-center justify-center bg-black/[0.03] dark:bg-white/[0.04]">
              <p className="text-sm text-black/45 dark:text-white/45">Chưa có dữ liệu bản đồ</p>
            </div>
          )}
        </div>
      </Surface>

      <div className="space-y-5">
        <Surface>
          <h3 className="text-base font-semibold text-[#1d1d1f] dark:text-white">Tuyến đã chọn</h3>
          <div className="mt-5 flex gap-4">
            <div className="flex flex-col items-center">
              <span className="mt-1 h-3 w-3 rounded-full border-[3px] border-[#0071e3] bg-white dark:bg-[#1c1c1e]" />
              <span className="my-1 h-16 w-px bg-gradient-to-b from-[#0071e3] to-[#ff3b30]" />
              <MapPin className="h-4 w-4 text-[#ff3b30]" />
            </div>
            <div className="min-w-0 flex-1 space-y-7">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40 dark:text-white/40">Điểm đi</p>
                <p className="mt-1 text-sm font-semibold leading-5 text-[#1d1d1f] dark:text-white">{originAddress}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40 dark:text-white/40">Điểm đến</p>
                <p className="mt-1 text-sm font-semibold leading-5 text-[#1d1d1f] dark:text-white">{destinationAddress}</p>
              </div>
            </div>
          </div>
        </Surface>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#0071e3]/15 bg-[#0071e3]/[0.055] p-4">
            <Route className="h-4 w-4 text-[#0071e3]" />
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-black/40 dark:text-white/40">Khoảng cách</p>
            <p className="mt-1 text-lg font-semibold text-[#0071e3]">
              {isCalculatingRoute ? '...' : routeInfo ? routeInfo.distanceKm + ' km' : '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-[#ff9f0a]/15 bg-[#ff9f0a]/[0.07] p-4">
            <Clock className="h-4 w-4 text-[#c93400] dark:text-[#ff9f0a]" />
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-black/40 dark:text-white/40">Thời gian</p>
            <p className="mt-1 text-lg font-semibold text-[#c93400] dark:text-[#ff9f0a]">
              {isCalculatingRoute ? '...' : routeInfo?.durationText || '—'}
            </p>
          </div>
        </div>

        {isCalculatingRoute && (
          <div className="flex items-center gap-3 rounded-2xl bg-black/[0.03] p-4 dark:bg-white/[0.05]">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0071e3]/20 border-t-[#0071e3]" />
            <p className="text-sm text-black/55 dark:text-white/55">Đang lấy tuyến đường tối ưu...</p>
          </div>
        )}
        {routeError && (
          <div className="flex items-start gap-3 rounded-2xl bg-[#d93025]/[0.07] p-4 text-[#b42318] dark:text-[#ff6961]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-sm leading-5">{routeError}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSettingsStep = () => {
    const rules = [
      {
        label: 'Đón khách dọc đường',
        description: allowRoutePickup
          ? 'Cho phép ghép khách có điểm đón/trả gần tuyến'
          : 'Chỉ ưu tiên khách có hành trình gần trùng khớp',
        icon: Route,
        value: allowRoutePickup,
        onChange: setAllowRoutePickup,
      },
      {
        label: 'Hút thuốc',
        description: allowSmoking ? 'Cho phép hút thuốc trên xe' : 'Không hút thuốc trên xe',
        icon: Cigarette,
        value: allowSmoking,
        onChange: setAllowSmoking,
      },
      {
        label: 'Mang thú cưng',
        description: allowPets ? 'Cho phép mang thú cưng' : 'Không mang thú cưng',
        icon: PawPrint,
        value: allowPets,
        onChange: setAllowPets,
      },
      {
        label: 'Hành lý cồng kềnh',
        description: allowLuggage ? 'Có thể mang hành lý lớn' : 'Chỉ mang hành lý nhỏ',
        icon: Luggage,
        value: allowLuggage,
        onChange: setAllowLuggage,
      },
    ];

    return (
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          <Surface>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0071e3]">Bước 3</span>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
              Thiết lập chuyến
            </h2>
            <p className="mt-1 text-sm leading-6 text-black/50 dark:text-white/50">
              Chọn số ghế và xem mức đóng góp được hệ thống đề xuất.
            </p>

            <div className="mt-6">
              <label className={labelClass}>Số ghế còn trống</label>
              <SeatCounter value={seatCount} max={maxSeats} onChange={setSeatCount} />
            </div>

            <div className="mt-6 border-t border-black/[0.07] pt-5 dark:border-white/[0.08]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={labelClass}>Giá đề xuất mỗi ghế</p>
                  <p className="text-xs leading-5 text-black/45 dark:text-white/45">
                    Backend tính theo tuyến, loại xe và số ghế mở bán.
                  </p>
                </div>
                <Sparkles className="h-5 w-5 shrink-0 text-[#0071e3]" />
              </div>
              <div
                className={cn(
                  'mt-3 flex min-h-20 items-center justify-between rounded-2xl border px-5',
                  priceError
                    ? 'border-[#d93025]/25 bg-[#d93025]/[0.05]'
                    : 'border-[#34c759]/20 bg-[#34c759]/[0.055]'
                )}
              >
                {isEstimatingPrice ? (
                  <span className="flex items-center gap-2 text-sm text-black/50 dark:text-white/50">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0071e3]/20 border-t-[#0071e3]" />
                    Đang tính giá...
                  </span>
                ) : estimatedPrice ? (
                  <>
                    <span className="text-2xl font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
                      {formatCurrency(estimatedPrice)}
                    </span>
                    <span className="text-xs text-black/45 dark:text-white/45">/ ghế</span>
                  </>
                ) : (
                  <span className="text-sm text-black/45 dark:text-white/45">Chưa có giá đề xuất</span>
                )}
              </div>
              {priceError && <p className="mt-2 text-xs text-[#d93025]">{priceError}</p>}
              {estimatedPrice && (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-[#0071e3]/[0.055] px-4 py-3">
                  <span className="text-xs text-black/50 dark:text-white/50">Tổng đóng góp tối đa</span>
                  <span className="text-sm font-semibold text-[#0071e3]">{formatCurrency(maximumRevenue)}</span>
                </div>
              )}
            </div>
          </Surface>

          <Surface>
            <label htmlFor="description" className={labelClass}>Ghi chú cho hành khách</label>
            <textarea
              id="description"
              rows={4}
              maxLength={1000}
              placeholder="Ví dụ: Có thể đón gần Nguyễn Trãi, vui lòng có mặt trước 5 phút..."
              className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm leading-6 text-[#1d1d1f] outline-none transition-colors placeholder:text-black/35 focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:placeholder:text-white/35"
              {...register('description')}
            />
            <div className="mt-2 flex justify-between gap-4">
              <p className="text-xs text-black/40 dark:text-white/40">Không bắt buộc</p>
              <p className="text-xs tabular-nums text-black/40 dark:text-white/40">{description.length}/1000</p>
            </div>
          </Surface>
        </div>

        <Surface>
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1d1d1f] dark:text-white">Quy định lên xe</h2>
              <p className="mt-0.5 text-xs leading-5 text-black/45 dark:text-white/45">
                Hành khách sẽ thấy các lựa chọn này trước khi đặt chỗ.
              </p>
            </div>
          </div>
          <div className="divide-y divide-black/[0.07] border-y border-black/[0.07] dark:divide-white/[0.08] dark:border-white/[0.08]">
            {rules.map((rule) => {
              return (
                <RuleToggle
                  key={rule.label}
                  checked={rule.value}
                  onChange={rule.onChange}
                  label={rule.label}
                  description={rule.description}
                  icon={rule.icon}
                />
              );
            })}
          </div>
          <div className="mt-5 rounded-2xl bg-[#0071e3]/[0.055] p-4">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0071e3]" />
              <p className="text-xs leading-5 text-black/55 dark:text-white/55">
                Khi bật đón dọc đường, thuật toán có thể đề xuất khách gần tuyến nếu cùng chiều và không làm vòng quá ngưỡng cho phép.
              </p>
            </div>
          </div>
        </Surface>
      </div>
    );
  };

  const renderConfirmationStep = () => (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(290px,0.75fr)]">
      <div className="space-y-5">
        <Surface>
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0071e3]">Bước 4</span>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#1d1d1f] dark:text-white">
            Xem lại chuyến đi
          </h2>
          <p className="mt-1 text-sm leading-6 text-black/50 dark:text-white/50">
            Kiểm tra lần cuối trước khi chuyến được mở nhận yêu cầu đặt chỗ.
          </p>

          <div className="mt-6 flex gap-4 rounded-2xl bg-black/[0.025] p-4 dark:bg-white/[0.045]">
            <div className="flex flex-col items-center">
              <span className="mt-1 h-3 w-3 rounded-full border-[3px] border-[#0071e3] bg-white dark:bg-[#1c1c1e]" />
              <span className="my-1 h-16 w-px bg-gradient-to-b from-[#0071e3] to-[#ff3b30]" />
              <MapPin className="h-4 w-4 text-[#ff3b30]" />
            </div>
            <div className="min-w-0 flex-1 space-y-7">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40 dark:text-white/40">Điểm đi</p>
                <p className="mt-1 text-sm font-semibold leading-5 text-[#1d1d1f] dark:text-white">{originAddress}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-black/40 dark:text-white/40">Điểm đến</p>
                <p className="mt-1 text-sm font-semibold leading-5 text-[#1d1d1f] dark:text-white">{destinationAddress}</p>
              </div>
            </div>
            <button type="button" onClick={() => setStep(0)} className="h-10 px-2 text-xs font-semibold text-[#0071e3] hover:underline">
              Sửa
            </button>
          </div>

          <dl className="mt-5 divide-y divide-black/[0.07] dark:divide-white/[0.08]">
            <SummaryRow label="Khởi hành" value={departureTime ? new Date(departureTime).toLocaleString('vi-VN') : '—'} />
            <SummaryRow
              label="Phương tiện"
              value={selectedVehicle ? (selectedVehicle.type === 'CAR' ? 'Ô tô · ' : 'Xe máy · ') + selectedVehicle.licensePlate : '—'}
            />
            <SummaryRow label="Khoảng cách" value={routeInfo ? routeInfo.distanceKm + ' km' : '—'} />
            <SummaryRow label="Thời gian dự kiến" value={routeInfo?.durationText || '—'} />
            <SummaryRow label="Số ghế" value={seatCount + ' ghế'} />
            <SummaryRow label="Giá mỗi ghế" value={estimatedPrice ? formatCurrency(estimatedPrice) : '—'} accent />
            <SummaryRow label="Đón khách dọc đường" value={allowRoutePickup ? 'Cho phép' : 'Không'} />
          </dl>
        </Surface>

        {description.trim() && (
          <Surface>
            <h3 className="text-sm font-semibold text-[#1d1d1f] dark:text-white">Ghi chú cho hành khách</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-black/60 dark:text-white/60">{description}</p>
          </Surface>
        )}
      </div>

      <div className="space-y-5">
        <Surface>
          <WalletCards className="h-5 w-5 text-[#0071e3]" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.06em] text-black/40 dark:text-white/40">
            Tổng đóng góp tối đa
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-[#0071e3]">
            {formatCurrency(maximumRevenue)}
          </p>
          <p className="mt-2 text-xs leading-5 text-black/45 dark:text-white/45">
            {seatCount} ghế × {estimatedPrice ? formatCurrency(estimatedPrice) : '—'}. Đây là số tiền tham khảo khi chuyến đủ chỗ.
          </p>
        </Surface>

        <Surface>
          <h3 className="text-sm font-semibold text-[#1d1d1f] dark:text-white">Quy định chuyến</h3>
          <ul className="mt-4 space-y-3 text-xs leading-5 text-black/55 dark:text-white/55">
            {[
              allowSmoking ? 'Cho phép hút thuốc' : 'Không hút thuốc',
              allowPets ? 'Cho phép mang thú cưng' : 'Không mang thú cưng',
              allowLuggage ? 'Cho phép hành lý cồng kềnh' : 'Chỉ mang hành lý nhỏ',
            ].map((rule) => (
              <li key={rule} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#34c759]" />
                {rule}
              </li>
            ))}
          </ul>
        </Surface>

        <div className="rounded-2xl border border-[#34c759]/20 bg-[#34c759]/[0.055] p-4">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#248a3d] dark:text-[#30d158]" />
            <div>
              <p className="text-sm font-semibold text-[#1d1d1f] dark:text-white">Sẵn sàng đăng chuyến</p>
              <p className="mt-1 text-xs leading-5 text-black/50 dark:text-white/50">
                Sau khi đăng, chuyến sẽ ở trạng thái mở nhận yêu cầu và xuất hiện trong kết quả ghép chuyến.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#f5f5f7] pb-32 pt-7 font-sans dark:bg-black sm:pt-9">
      <div className="mx-auto w-full max-w-[1040px] px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#0071e3] transition-colors hover:text-[#005ea6]"
        >
          <ArrowLeft className="h-4 w-4" />
          Hủy đăng chuyến
        </Link>

        <header className="mb-6 mt-3">
          <h1 className="text-3xl font-semibold tracking-[-0.025em] text-[#1d1d1f] dark:text-white sm:text-[34px]">
            Đăng chuyến đi
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-black/50 dark:text-white/50">
            Hoàn thành 4 bước để mở chuyến và tìm hành khách cùng đường.
          </p>
        </header>

        <div className="mb-5 rounded-3xl border border-black/[0.06] bg-white p-2 dark:border-white/[0.08] dark:bg-[#1c1c1e]">
          <StepIndicator currentStep={step} furthestStep={furthestStep} onStepChange={setStep} />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (step === 3) handleSubmit(onSubmit)();
          }}
        >
          <div key={step} className="animate-in fade-in slide-in-from-bottom-2 duration-200">
            {step === 0 && renderJourneyStep()}
            {step === 1 && renderRouteStep()}
            {step === 2 && renderSettingsStep()}
            {step === 3 && renderConfirmationStep()}
          </div>

          {(stepError || submitError) && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-2xl border border-[#d93025]/15 bg-[#d93025]/[0.07] p-4 text-[#b42318] dark:text-[#ff6961]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-sm leading-5">{submitError || stepError}</p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-black/[0.06] bg-white/90 p-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#1c1c1e]/90">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 0 || isSubmitting}
              className="flex h-12 min-w-28 items-center justify-center gap-2 rounded-xl border border-black/10 px-4 text-sm font-semibold text-[#1d1d1f] transition-colors hover:bg-black/[0.035] disabled:cursor-not-allowed disabled:opacity-35 dark:border-white/10 dark:text-white dark:hover:bg-white/[0.05]"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </button>

            <div className="hidden text-center sm:block">
              <p className="text-xs font-semibold text-[#1d1d1f] dark:text-white">
                Bước {step + 1} / {steps.length}
              </p>
              <p className="text-[11px] text-black/40 dark:text-white/40">{steps[step].title}</p>
            </div>

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isCalculatingRoute || isSubmitting}
                className="flex h-12 min-w-32 items-center justify-center gap-2 rounded-xl bg-[#0071e3] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:opacity-55"
              >
                Tiếp tục
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !estimatedPrice}
                className="flex h-12 min-w-36 items-center justify-center gap-2 rounded-xl bg-[#0071e3] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang đăng...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Đăng chuyến
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}
