'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Car,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Gauge,
  Hash,
  Loader2,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  Route,
  ShieldAlert,
  Star,
  Timer,
  UserRound,
  Users,
  XCircle,
} from 'lucide-react';
import { SocketEvents } from '@repo/shared';
import { useBookingDetail, useCancelBooking } from '@/hooks/useBookings';
import { useAuth } from '@/components/providers/auth-provider';
import { useSocket } from '@/components/providers/socket-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import RideRouteMap from '@/components/rides/ride-route-map';
import { ChatWindow } from '@/components/chat/chat-window';
import { PaymentSimulatorDialog } from '@/components/booking/payment-simulator-dialog';
import { ReviewDialog } from '@/components/rides/review-dialog';
import { ReportDialog } from '@/components/report-dialog';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
type RideStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'FULL';

interface Person {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  driverRating?: number | null;
  driverRatingCount?: number | null;
  passengerRating?: number | null;
  passengerRatingCount?: number | null;
}

interface BookingDetail {
  id: string;
  rideId: string;
  passengerId: string;
  seats: number;
  totalPrice: number;
  priceBreakdown?: {
    pricingPolicy?: 'FIXED_PER_SEAT';
    offeredSeats?: number;
    costShareSeats?: number;
    totalCostShares?: number;
  } | null;
  sharedDistanceKm?: number | null;
  detourKm?: number | null;
  status: BookingStatus;
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  passengerLat?: number | null;
  passengerLng?: number | null;
  pickupAddress?: string | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  dropoffAddress?: string | null;
  isPickedUp: boolean;
  isDroppedOff: boolean;
  driverArrivedAt?: string | null;
  pickedUpAt?: string | null;
  droppedOffAt?: string | null;
  additionalTimeMinutes?: number | null;
  matching?: {
    matchType: 'DIRECT' | 'NEARBY' | 'ON_ROUTE';
    matchScore: number;
    pickupDistanceKm: number;
    dropoffDistanceKm: number;
    detourKm: number;
    detourRatio: number;
    routeOverlap: number;
    expectedPickupTime?: string | null;
  } | null;
  cancelReason?: string | null;
  passenger: Person;
  ride: {
    id: string;
    driverId: string;
    origin: string;
    originLat?: number | null;
    originLng?: number | null;
    destination: string;
    destinationLat?: number | null;
    destinationLng?: number | null;
    departureTime: string;
    pricePerSeat: number;
    offeredSeats?: number;
    distance?: number | null;
    duration?: number | null;
    status: RideStatus;
    currentDriverLat?: number | null;
    currentDriverLng?: number | null;
    driver: Person;
    vehicle?: {
      id: string;
      type: 'BIKE' | 'CAR';
      color?: string | null;
      licensePlate: string;
      imageUrl?: string | null;
    } | null;
  };
}

type FlowState = 'pending' | 'confirmed' | 'arriving' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';

const getPersonName = (person: Person) =>
  [person.firstName, person.lastName].filter(Boolean).join(' ') || 'Người dùng CoRide';

function getFlowState(booking: BookingDetail): FlowState {
  if (booking.status === 'REJECTED') return 'rejected';
  if (booking.status === 'CANCELLED' || booking.ride.status === 'CANCELLED') return 'cancelled';
  if (booking.status === 'COMPLETED' || booking.ride.status === 'COMPLETED' || booking.isDroppedOff) return 'completed';
  if (booking.status === 'PENDING') return 'pending';
  if (booking.ride.status === 'ONGOING' && booking.isPickedUp) return 'in_progress';
  if (booking.driverArrivedAt) return 'waiting';
  if (booking.ride.status === 'ONGOING') return 'arriving';
  return 'confirmed';
}

const statusConfig: Record<FlowState, {
  label: string;
  description: string;
  icon: typeof Clock3;
  badgeClass: string;
  panelClass: string;
}> = {
  pending: {
    label: 'Đang chờ tài xế xác nhận',
    description: 'Yêu cầu đã được gửi. CoRide sẽ cập nhật ngay khi tài xế phản hồi.',
    icon: Clock3,
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
    panelClass: 'border-amber-200 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/10',
  },
  confirmed: {
    label: 'Đặt chỗ đã được xác nhận',
    description: 'Tài xế đã chấp nhận yêu cầu. Hãy có mặt tại điểm đón đúng giờ.',
    icon: CheckCircle2,
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
    panelClass: 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/10',
  },
  arriving: {
    label: 'Tài xế đang đến điểm đón',
    description: 'Bạn có thể theo dõi chuyến và nhắn tin cho tài xế nếu cần hỗ trợ.',
    icon: Navigation,
    badgeClass: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300',
    panelClass: 'border-cyan-200 bg-cyan-50/70 dark:border-cyan-500/20 dark:bg-cyan-500/10',
  },
  waiting: {
    label: 'Tài xế đã tới điểm đón',
    description: 'Tài xế đang chờ tại điểm đón. Hãy kiểm tra biển số xe và lên xe an toàn.',
    icon: MapPin,
    badgeClass: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300',
    panelClass: 'border-violet-200 bg-violet-50/70 dark:border-violet-500/20 dark:bg-violet-500/10',
  },
  in_progress: {
    label: 'Chuyến đi đang diễn ra',
    description: 'Bạn đã được đón và đang di chuyển tới điểm trả khách.',
    icon: Route,
    badgeClass: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300',
    panelClass: 'border-blue-200 bg-blue-50/70 dark:border-blue-500/20 dark:bg-blue-500/10',
  },
  completed: {
    label: 'Chuyến đi đã hoàn thành',
    description: 'Cảm ơn bạn đã đồng hành cùng CoRide.',
    icon: CheckCircle2,
    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
    panelClass: 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/10',
  },
  cancelled: {
    label: 'Đặt chỗ đã bị hủy',
    description: 'Yêu cầu này không còn hiệu lực.',
    icon: XCircle,
    badgeClass: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300',
    panelClass: 'border-red-200 bg-red-50/70 dark:border-red-500/20 dark:bg-red-500/10',
  },
  rejected: {
    label: 'Tài xế đã từ chối yêu cầu',
    description: 'Bạn có thể quay lại danh sách để tìm chuyến phù hợp khác.',
    icon: XCircle,
    badgeClass: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300',
    panelClass: 'border-red-200 bg-red-50/70 dark:border-red-500/20 dark:bg-red-500/10',
  },
};

const flowSteps = ['Đã gửi yêu cầu', 'Tài xế xác nhận', 'Đang di chuyển', 'Hoàn thành'];

function getActiveStep(state: FlowState) {
  if (state === 'pending') return 0;
  if (state === 'confirmed' || state === 'arriving' || state === 'waiting') return 1;
  if (state === 'in_progress') return 2;
  if (state === 'completed') return 3;
  return 0;
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { socket } = useSocket();
  const { data, isLoading, error, refetch } = useBookingDetail(id);
  const { mutate: cancelBooking, isPending: isCancelling } = useCancelBooking();
  const [showChat, setShowChat] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [processingAction, setProcessingAction] = useState<'CONFIRMED' | 'REJECTED' | null>(null);

  const booking = data as BookingDetail | undefined;

  useEffect(() => {
    if (!socket || !booking) return;
    const refresh = () => { void refetch(); };

    socket.on(SocketEvents.BOOKING_CONFIRMED, refresh);
    socket.on(SocketEvents.BOOKING_REJECTED, refresh);
    socket.on(SocketEvents.BOOKING_DRIVER_ARRIVED, refresh);
    socket.on(SocketEvents.BOOKING_PICKED_UP, refresh);
    socket.on(SocketEvents.BOOKING_COMPLETED, refresh);
    socket.on(SocketEvents.RIDE_STATUS_UPDATED, refresh);

    return () => {
      socket.off(SocketEvents.BOOKING_CONFIRMED, refresh);
      socket.off(SocketEvents.BOOKING_REJECTED, refresh);
      socket.off(SocketEvents.BOOKING_DRIVER_ARRIVED, refresh);
      socket.off(SocketEvents.BOOKING_PICKED_UP, refresh);
      socket.off(SocketEvents.BOOKING_COMPLETED, refresh);
      socket.off(SocketEvents.RIDE_STATUS_UPDATED, refresh);
    };
  }, [socket, booking, refetch]);

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Đang tải chi tiết đặt chỗ...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container max-w-xl py-20 text-center">
        <AlertCircle className="mx-auto mb-4 h-10 w-10 text-destructive" />
        <h1 className="text-xl font-semibold">Không thể tải đặt chỗ</h1>
        <p className="mt-2 text-sm text-muted-foreground">Đặt chỗ không tồn tại hoặc bạn không có quyền xem.</p>
        <Button className="mt-6" onClick={() => router.push('/my-bookings')}>Về chuyến đi của tôi</Button>
      </div>
    );
  }

  const isPassenger = user?.id === booking.passengerId;
  const isDriver = user?.id === booking.ride.driverId;
  const backHref = isDriver ? '/booking-requests' : '/my-bookings';
  const contact = isPassenger ? booking.ride.driver : booking.passenger;
  const contactName = getPersonName(contact);
  const state = getFlowState(booking);
  const config = statusConfig[state];
  const StatusIcon = config.icon;
  const activeStep = getActiveStep(state);
  const isTerminated = state === 'cancelled' || state === 'rejected';
  const isCompleted = state === 'completed';
  const canCancel = isPassenger &&
    (booking.status === 'PENDING' || booking.status === 'CONFIRMED') &&
    booking.ride.status === 'SCHEDULED';
  const canChat = booking.status === 'CONFIRMED' &&
    (booking.ride.status === 'SCHEDULED' || booking.ride.status === 'ONGOING');
  const canTrack = booking.status === 'CONFIRMED' &&
    (booking.ride.status === 'SCHEDULED' || booking.ride.status === 'ONGOING');
  const canPay = isPassenger && isCompleted && booking.paymentStatus === 'UNPAID';
  const canReview = isPassenger && isCompleted && booking.paymentStatus === 'PAID';
  const canHandleRequest = isDriver && booking.status === 'PENDING' && booking.ride.status === 'SCHEDULED';
  const pickupAddress = booking.pickupAddress || booking.ride.origin;
  const dropoffAddress = booking.dropoffAddress || booking.ride.destination;
  const driverName = getPersonName(booking.ride.driver);
  const departure = new Date(booking.ride.departureTime);
  const pricePerSeat = booking.totalPrice / Math.max(booking.seats, 1);
  const hasMap = [
    booking.ride.originLat,
    booking.ride.originLng,
    booking.ride.destinationLat,
    booking.ride.destinationLng,
  ].every((value) => typeof value === 'number' && Number.isFinite(value));

  const handleCancel = () => {
    if (!confirm('Bạn có chắc chắn muốn hủy đặt chỗ này?')) return;
    cancelBooking(
      { id: booking.id, cancelReason: 'Hành khách chủ động hủy đặt chỗ' },
      { onSuccess: () => { void refetch(); } }
    );
  };

  const handleRequest = async (status: 'CONFIRMED' | 'REJECTED') => {
    const verb = status === 'CONFIRMED' ? 'chấp nhận' : 'từ chối';
    if (!confirm(`Bạn có chắc muốn ${verb} yêu cầu đặt chỗ này?`)) return;

    setProcessingAction(status);
    try {
      await apiClient.patch(`/bookings/${booking.id}/status`, { status });
      toast.success(status === 'CONFIRMED' ? 'Đã chấp nhận hành khách.' : 'Đã từ chối yêu cầu.');
      await refetch();
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || `Không thể ${verb} yêu cầu.`);
    } finally {
      setProcessingAction(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50/70 pb-24 dark:bg-black">
      <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" className="-ml-3 min-h-10 gap-2" onClick={() => router.push(backHref)}>
            <ArrowLeft className="h-4 w-4" /> {isDriver ? 'Yêu cầu đặt chỗ' : 'Chuyến đi của tôi'}
          </Button>
          <Badge variant="outline" className={cn('h-8 gap-2 px-3 text-xs font-semibold', config.badgeClass)}>
            <StatusIcon className="h-4 w-4" /> {config.label}
          </Badge>
        </div>

        <section className={cn('mb-6 rounded-3xl border p-5 sm:p-7', config.panelClass)} aria-live="polite">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-white/10">
                <StatusIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Booking #{booking.id.slice(0, 8).toUpperCase()}</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{config.label}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{config.description}</p>
              </div>
            </div>
            {booking.paymentStatus === 'PAID' && (
              <Badge className="h-8 gap-1.5 bg-emerald-600 px-3 text-white hover:bg-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Đã thanh toán
              </Badge>
            )}
          </div>

          {!isTerminated && (
            <ol className="mt-7 grid grid-cols-4" aria-label="Tiến trình chuyến đi">
              {flowSteps.map((step, index) => {
                const isDone = index <= activeStep;
                return (
                  <li key={step} className="relative flex flex-col items-center text-center">
                    {index > 0 && <span className={cn('absolute right-1/2 top-4 h-0.5 w-full', index <= activeStep ? 'bg-emerald-500' : 'bg-border')} />}
                    <span className={cn('relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background', isDone ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border text-muted-foreground')}>
                      {index < activeStep ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
                    </span>
                    <span className={cn('mt-2 hidden text-xs font-medium sm:block', isDone ? 'text-foreground' : 'text-muted-foreground')}>{step}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
              <CardHeader className="border-b bg-muted/30 p-5 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg"><Route className="h-5 w-5 text-primary" /> Hành trình</CardTitle>
              </CardHeader>
              <CardContent className="p-5 sm:p-6">
                <div className="relative space-y-6 pl-9">
                  <span className="absolute bottom-5 left-[11px] top-5 w-0.5 bg-border" />
                  <div className="relative">
                    <span className="absolute -left-9 top-1 h-6 w-6 rounded-full border-[6px] border-primary bg-background" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Điểm đón</p>
                    <p className="mt-1 font-semibold leading-6">{pickupAddress}</p>
                  </div>
                  <div className="relative">
                    <MapPin className="absolute -left-10 top-0.5 h-7 w-7 fill-orange-500 text-orange-500" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Điểm đến</p>
                    <p className="mt-1 font-semibold leading-6">{dropoffAddress}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 border-t pt-5 sm:grid-cols-3">
                  <div className="flex min-h-12 items-center gap-3 rounded-xl bg-muted/40 px-3">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <div><p className="text-[11px] text-muted-foreground">Ngày đi</p><p className="text-sm font-semibold">{departure.toLocaleDateString('vi-VN')}</p></div>
                  </div>
                  <div className="flex min-h-12 items-center gap-3 rounded-xl bg-muted/40 px-3">
                    <Clock3 className="h-4 w-4 text-primary" />
                    <div><p className="text-[11px] text-muted-foreground">Khởi hành</p><p className="text-sm font-semibold">{departure.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p></div>
                  </div>
                  <div className="flex min-h-12 items-center gap-3 rounded-xl bg-muted/40 px-3">
                    <Users className="h-4 w-4 text-primary" />
                    <div><p className="text-[11px] text-muted-foreground">Số ghế</p><p className="text-sm font-semibold">{booking.seats} ghế</p></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {hasMap && (
              <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
                <CardHeader className="border-b p-5 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-lg"><MapPin className="h-5 w-5 text-primary" /> Tuyến đường trên bản đồ</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                  <RideRouteMap
                    origin={{ lat: booking.ride.originLat!, lng: booking.ride.originLng! }}
                    destination={{ lat: booking.ride.destinationLat!, lng: booking.ride.destinationLng! }}
                    passengerOrigin={booking.passengerLat != null && booking.passengerLng != null ? { lat: booking.passengerLat, lng: booking.passengerLng } : null}
                    passengerDestination={booking.dropoffLat != null && booking.dropoffLng != null ? { lat: booking.dropoffLat, lng: booking.dropoffLng } : null}
                    driverLocation={
                      booking.ride.currentDriverLat != null && booking.ride.currentDriverLng != null
                        ? { lat: booking.ride.currentDriverLat, lng: booking.ride.currentDriverLng }
                        : (booking.ride.status === 'ONGOING' && booking.ride.originLat != null && booking.ride.originLng != null
                            ? { lat: booking.ride.originLat, lng: booking.ride.originLng }
                            : null)
                    }
                  />
                </CardContent>
              </Card>
            )}

            {isDriver && (
              <Card className="rounded-2xl border-border/70 shadow-sm">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Gauge className="h-5 w-5 text-primary" /> Mức độ phù hợp với tuyến đường
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-1">
                  {booking.matching ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-xl bg-primary/10 p-3">
                        <p className="text-xs text-muted-foreground">Điểm phù hợp</p>
                        <p className="mt-1 text-xl font-semibold text-primary">{Math.round(booking.matching.matchScore)}%</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{booking.matching.matchType === 'DIRECT' ? 'Trùng điểm đầu và cuối' : booking.matching.matchType === 'NEARBY' ? 'Gần tuyến chính' : 'Đón dọc đường'}</p>
                      </div>
                      <div className="rounded-xl bg-muted/45 p-3">
                        <p className="text-xs text-muted-foreground">Khoảng cách đón / trả</p>
                        <p className="mt-1 text-sm font-semibold">{booking.matching.pickupDistanceKm.toFixed(1)} km / {booking.matching.dropoffDistanceKm.toFixed(1)} km</p>
                      </div>
                      <div className="rounded-xl bg-muted/45 p-3">
                        <p className="text-xs text-muted-foreground">Phát sinh dự kiến</p>
                        <p className="mt-1 text-sm font-semibold">+{booking.matching.detourKm.toFixed(1)} km · +{Math.round(booking.additionalTimeMinutes ?? 0)} phút</p>
                      </div>
                      <div className="rounded-xl bg-muted/45 p-3 sm:col-span-2 lg:col-span-3">
                        <div className="flex items-center justify-between gap-4 text-xs">
                          <span className="text-muted-foreground">Độ trùng tuyến</span>
                          <span className="font-semibold">{Math.round(booking.matching.routeOverlap)}%</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, booking.matching.routeOverlap))}%` }} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl bg-muted/45 p-4 text-sm text-muted-foreground">
                      <Timer className="h-4 w-4 shrink-0" /> Chưa đủ dữ liệu tọa độ để tính mức độ phù hợp chính xác.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="rounded-3xl border-border/70 shadow-sm">
              <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-3">
                <CardTitle className="flex items-center gap-2 text-lg"><UserRound className="h-5 w-5 text-primary" /> {isPassenger ? 'Tài xế và phương tiện' : 'Thông tin hành khách'}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-5 p-5 pt-2 sm:p-6 sm:pt-2 md:grid-cols-2">
                <div className="flex items-center gap-4 rounded-2xl bg-muted/35 p-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                    {(contact.firstName?.[0] || 'C').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{contactName}</p>
                    {isPassenger && (
                      <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span>{(booking.ride.driver.driverRating ?? 0).toFixed(1)}</span>
                        <span>({booking.ride.driver.driverRatingCount ?? 0} đánh giá)</span>
                      </div>
                    )}
                    {contact.phone && <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {contact.phone}</p>}
                  </div>
                </div>

                {isPassenger && (
                  <div className="flex items-center gap-4 rounded-2xl bg-muted/35 p-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"><Car className="h-7 w-7" /></div>
                    <div>
                      <p className="font-semibold">{booking.ride.vehicle?.type === 'CAR' ? 'Ô tô chia sẻ' : booking.ride.vehicle?.type === 'BIKE' ? 'Xe máy chia sẻ' : 'Phương tiện chưa cập nhật'}</p>
                      {booking.ride.vehicle?.color && <p className="mt-0.5 text-sm text-muted-foreground">Màu {booking.ride.vehicle.color}</p>}
                      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold"><Hash className="h-3.5 w-3.5" /> {booking.ride.vehicle?.licensePlate || 'Chưa có biển số'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {booking.cancelReason && (
              <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-destructive">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div><p className="font-semibold">Lý do hủy</p><p className="mt-1 text-sm">{booking.cancelReason}</p></div>
              </div>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <Card className="rounded-3xl border-border/70 shadow-sm">
              <CardHeader className="p-5 pb-2"><CardTitle className="flex items-center gap-2 text-lg"><CreditCard className="h-5 w-5 text-primary" /> Thanh toán</CardTitle></CardHeader>
              <CardContent className="space-y-3 p-5 pt-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Đơn giá</span><span>{pricePerSeat.toLocaleString('vi-VN')}đ / ghế</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Số ghế</span><span>{booking.seats}</span></div>
                {booking.priceBreakdown?.totalCostShares && (
                  <p className="rounded-xl bg-muted/55 p-3 text-xs leading-5 text-muted-foreground">
                    {booking.priceBreakdown.costShareSeats ?? booking.priceBreakdown.offeredSeats ?? booking.ride.offeredSeats ?? 1} ghế khách + 1 tài xế = chia {booking.priceBreakdown.totalCostShares} phần. Đang mở bán {booking.priceBreakdown.offeredSeats ?? booking.ride.offeredSeats ?? 1} ghế. Giá booking này đã được chốt khi đặt.
                  </p>
                )}
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Phương thức</span><span>{booking.paymentStatus === 'PAID' ? 'QR mô phỏng' : 'Chưa thanh toán'}</span></div>
                <div className="flex items-end justify-between border-t pt-4"><span className="font-semibold">Tổng thanh toán</span><span className="text-2xl font-bold text-primary">{booking.totalPrice.toLocaleString('vi-VN')}đ</span></div>
                <Badge variant="outline" className={cn('mt-1 h-7 w-full justify-center', booking.paymentStatus === 'PAID' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700')}>
                  {booking.paymentStatus === 'PAID' ? 'Đã thanh toán' : booking.paymentStatus === 'REFUNDED' ? 'Đã hoàn tiền' : 'Chưa thanh toán'}
                </Badge>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/70 shadow-sm">
              <CardHeader className="p-5 pb-3"><CardTitle className="text-lg">Thao tác</CardTitle></CardHeader>
              <CardContent className="space-y-3 p-5 pt-1">
                {canHandleRequest && (
                  <>
                    <Button className="min-h-11 w-full gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => void handleRequest('CONFIRMED')} disabled={processingAction !== null}>
                      {processingAction === 'CONFIRMED' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Chấp nhận yêu cầu
                    </Button>
                    <Button variant="outline" className="min-h-11 w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => void handleRequest('REJECTED')} disabled={processingAction !== null}>
                      {processingAction === 'REJECTED' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Từ chối yêu cầu
                    </Button>
                  </>
                )}
                {canTrack && (
                  <Link href="/ongoing" className="block">
                    <Button className="min-h-12 w-full gap-2"><Navigation className="h-4 w-4" /> Theo dõi chuyến</Button>
                  </Link>
                )}
                {canChat && (
                  <Button variant="outline" className="min-h-12 w-full gap-2" onClick={() => setShowChat(true)}>
                    <MessageSquare className="h-4 w-4" /> Nhắn tin {isPassenger ? 'tài xế' : 'hành khách'}
                  </Button>
                )}
                {canPay && (
                  <Button className="min-h-12 w-full gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowPayment(true)}>
                    <CreditCard className="h-4 w-4" /> Thanh toán chuyến đi
                  </Button>
                )}
                {canReview && (
                  <ReviewDialog rideId={booking.rideId} revieweeId={booking.ride.driver.id} revieweeName={driverName} />
                )}
                {canCancel && (
                  <Button variant="destructive" className="min-h-12 w-full gap-2" onClick={handleCancel} disabled={isCancelling}>
                    {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    {booking.status === 'PENDING' ? 'Hủy yêu cầu' : 'Hủy đặt chỗ'}
                  </Button>
                )}
                {isPassenger && (state === 'arriving' || state === 'in_progress') && (
                  <Button variant="ghost" className="min-h-11 w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setShowReport(true)}>
                    <ShieldAlert className="h-4 w-4" /> Báo cáo sự cố
                  </Button>
                )}
                {isTerminated && (
                  <Link href="/rides" className="block"><Button className="min-h-12 w-full">Tìm chuyến khác</Button></Link>
                )}
                {!canHandleRequest && !canTrack && !canChat && !canPay && !canReview && !canCancel && !isTerminated && (
                  <div className="rounded-xl bg-muted/50 p-3 text-center text-sm text-muted-foreground">Chưa có thao tác nào cho trạng thái này.</div>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      <PaymentSimulatorDialog
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        bookingId={booking.id}
        onPaymentSuccess={() => { void refetch(); }}
      />

      {showChat && user && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`Trò chuyện với ${contactName}`}>
          <ChatWindow
            rideId={booking.ride.id}
            otherUserId={contact.id}
            otherUserName={contactName}
            currentUserId={user.id}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}

      {isPassenger && (
        <ReportDialog
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          reportedId={booking.ride.driver.id}
          rideId={booking.ride.id}
          reportedName={driverName}
        />
      )}
    </main>
  );
}
