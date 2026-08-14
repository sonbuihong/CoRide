'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Gauge,
  Loader2,
  MapPin,
  MessageSquare,
  Navigation,
  Route,
  Star,
  Users,
  XCircle,
} from 'lucide-react';
import { SocketEvents } from '@repo/shared';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import { useSocket } from '@/components/providers/socket-provider';
import { ChatWindow } from '@/components/chat/chat-window';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const OngoingMap = dynamic(() => import('@/components/OngoingMap'), { ssr: false });

type RideStatus = 'SCHEDULED' | 'FULL' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

interface Ride {
  id: string;
  driverId: string;
  origin: string;
  originLat?: number | null;
  originLng?: number | null;
  destination: string;
  destinationLat?: number | null;
  destinationLng?: number | null;
  departureTime: string;
  availableSeats: number;
  offeredSeats?: number | null;
  pricePerSeat: number;
  distance?: number | null;
  duration?: number | null;
  status: RideStatus;
  allowRoutePickup?: boolean;
  allowSmoking?: boolean;
  allowPets?: boolean;
  allowLuggage?: boolean;
  vehicle?: {
    type: 'BIKE' | 'CAR';
    licensePlate: string;
    color?: string | null;
  } | null;
}

interface DriverBooking {
  id: string;
  rideId?: string;
  seats: number;
  totalPrice: number;
  status: BookingStatus;
  pickupAddress?: string | null;
  passengerLat?: number | null;
  passengerLng?: number | null;
  dropoffAddress?: string | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  driverArrivedAt?: string | null;
  isPickedUp: boolean;
  isDroppedOff: boolean;
  matching?: { matchScore: number; matchType: 'DIRECT' | 'NEARBY' | 'ON_ROUTE' } | null;
  passenger: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    passengerRating?: number | null;
    passengerRatingCount?: number | null;
  };
  ride: { id: string };
}

const rideStatusMeta: Record<RideStatus, { label: string; className: string }> = {
  SCHEDULED: { label: 'Đang nhận khách', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  FULL: { label: 'Đã đủ chỗ', className: 'border-violet-200 bg-violet-50 text-violet-700' },
  ONGOING: { label: 'Đang diễn ra', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  COMPLETED: { label: 'Đã hoàn thành', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Đã hủy', className: 'border-slate-200 bg-slate-50 text-slate-600' },
};

function passengerName(booking: DriverBooking) {
  return [booking.passenger.firstName, booking.passenger.lastName].filter(Boolean).join(' ') || 'Hành khách CoRide';
}

export default function DriverRideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { socket } = useSocket();
  const [ride, setRide] = useState<Ride | null>(null);
  const [bookings, setBookings] = useState<DriverBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<'start' | 'cancel' | null>(null);
  const [chatBooking, setChatBooking] = useState<DriverBooking | null>(null);

  const fetchDetail = useCallback(async () => {
    setError(null);
    try {
      const [rideResponse, bookingsResponse] = await Promise.all([
        apiClient.get(`/rides/${id}`),
        apiClient.get('/bookings/driver'),
      ]);
      const nextRide = rideResponse.data.ride ?? rideResponse.data;
      const allBookings: DriverBooking[] = bookingsResponse.data.bookings ?? bookingsResponse.data ?? [];
      setRide(nextRide);
      setBookings(allBookings.filter((booking) => (booking.rideId || booking.ride?.id) === id));
    } catch (requestError) {
      console.error('Không thể tải chi tiết chuyến:', requestError);
      setError('Không thể tải chuyến đi hoặc bạn không có quyền quản lý chuyến này.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => { void fetchDetail(); };
    const handleNotification = (notification: { type?: string }) => {
      if (notification.type === 'BOOKING_REQUEST') refresh();
    };
    socket.on(SocketEvents.NOTIFICATION_NEW, handleNotification);
    socket.on(SocketEvents.BOOKING_NEW_REQUEST, refresh);
    socket.on(SocketEvents.BOOKING_CONFIRMED, refresh);
    socket.on(SocketEvents.BOOKING_REJECTED, refresh);
    socket.on(SocketEvents.BOOKING_DRIVER_ARRIVED, refresh);
    socket.on(SocketEvents.BOOKING_PICKED_UP, refresh);
    socket.on(SocketEvents.BOOKING_COMPLETED, refresh);
    socket.on(SocketEvents.RIDE_STATUS_UPDATED, refresh);
    return () => {
      socket.off(SocketEvents.NOTIFICATION_NEW, handleNotification);
      socket.off(SocketEvents.BOOKING_NEW_REQUEST, refresh);
      socket.off(SocketEvents.BOOKING_CONFIRMED, refresh);
      socket.off(SocketEvents.BOOKING_REJECTED, refresh);
      socket.off(SocketEvents.BOOKING_DRIVER_ARRIVED, refresh);
      socket.off(SocketEvents.BOOKING_PICKED_UP, refresh);
      socket.off(SocketEvents.BOOKING_COMPLETED, refresh);
      socket.off(SocketEvents.RIDE_STATUS_UPDATED, refresh);
    };
  }, [socket, fetchDetail]);

  const confirmedBookings = useMemo(() => bookings.filter((booking) => ['CONFIRMED', 'COMPLETED'].includes(booking.status)), [bookings]);
  const pendingBookings = useMemo(() => bookings.filter((booking) => booking.status === 'PENDING'), [bookings]);
  const waypoints = useMemo(() => confirmedBookings.flatMap((booking) => {
    const stops: Array<{ id: string; lat: number; lng: number }> = [];
    if (booking.passengerLat != null && booking.passengerLng != null) stops.push({ id: `pickup-${booking.id}`, lat: booking.passengerLat, lng: booking.passengerLng });
    if (booking.dropoffLat != null && booking.dropoffLng != null) stops.push({ id: `dropoff-${booking.id}`, lat: booking.dropoffLat, lng: booking.dropoffLng });
    return stops;
  }), [confirmedBookings]);

  const handleRideAction = async (type: 'start' | 'cancel') => {
    if (!ride) return;
    const promptText = type === 'start' ? 'Bắt đầu chuyến đi ngay bây giờ?' : 'Hủy chuyến sẽ đồng thời hủy các đặt chỗ đang hoạt động. Bạn có chắc không?';
    if (!confirm(promptText)) return;
    setAction(type);
    try {
      await apiClient.patch(`/rides/${ride.id}/status`, {
        status: type === 'start' ? 'ONGOING' : 'CANCELLED',
        ...(type === 'cancel' ? { cancelReason: 'Tài xế chủ động hủy chuyến' } : {}),
      });
      toast.success(type === 'start' ? 'Chuyến đi đã bắt đầu.' : 'Đã hủy chuyến đi.');
      if (type === 'start') router.push('/ongoing');
      else await fetchDetail();
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || 'Không thể cập nhật chuyến đi.');
    } finally {
      setAction(null);
    }
  };

  if (loading || authLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#0071e3]" /></div>;
  }

  if (error || !ride || (user && ride.driverId !== user.id)) {
    return (
      <main className="container max-w-xl py-24 text-center">
        <AlertCircle className="mx-auto h-9 w-9 text-red-500" />
        <h1 className="mt-4 text-xl font-semibold">Không thể mở chuyến đi</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error || 'Bạn không có quyền quản lý chuyến đi này.'}</p>
        <Button className="mt-6" onClick={() => router.push('/my-rides')}>Về chuyến đi của tôi</Button>
      </main>
    );
  }

  const departure = new Date(ride.departureTime);
  const totalSeats = ride.offeredSeats ?? ride.availableSeats;
  const statusMeta = rideStatusMeta[ride.status];
  const hasMap = [ride.originLat, ride.originLng, ride.destinationLat, ride.destinationLng].every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate));

  return (
    <main className="min-h-screen bg-[#f5f5f7] pb-24 pt-6 text-[#1d1d1f] dark:bg-black dark:text-white sm:pt-8">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" className="-ml-3 h-10 gap-2" onClick={() => router.push('/my-rides')}><ArrowLeft className="h-4 w-4" /> Chuyến đi của tôi</Button>
          <Badge variant="outline" className={cn('h-8 px-3', statusMeta.className)}>{statusMeta.label}</Badge>
        </div>

        <header className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.035)] dark:border-white/10 dark:bg-[#1d1d1f] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0071e3]">Chi tiết chuyến</p>
          <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="relative space-y-5 pl-9">
              <span className="absolute bottom-5 left-[11px] top-5 w-px bg-black/15 dark:bg-white/20" />
              <div className="relative"><span className="absolute -left-9 top-1 h-6 w-6 rounded-full border-[6px] border-[#0071e3] bg-white dark:bg-[#1d1d1f]" /><p className="text-[11px] font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">Điểm xuất phát</p><h1 className="mt-0.5 text-base font-semibold leading-6 sm:text-lg">{ride.origin}</h1></div>
              <div className="relative"><MapPin className="absolute -left-10 top-0.5 h-7 w-7 fill-orange-500 text-orange-500" /><p className="text-[11px] font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">Điểm đến cuối</p><p className="mt-0.5 text-base font-semibold leading-6 sm:text-lg">{ride.destination}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-black/[0.025] p-3 dark:bg-white/[0.05]"><CalendarDays className="mb-2 h-4 w-4 text-[#0071e3]" /><p className="text-black/45 dark:text-white/45">Ngày đi</p><b className="mt-0.5 block">{departure.toLocaleDateString('vi-VN')}</b></div>
              <div className="rounded-xl bg-black/[0.025] p-3 dark:bg-white/[0.05]"><Clock3 className="mb-2 h-4 w-4 text-[#0071e3]" /><p className="text-black/45 dark:text-white/45">Khởi hành</p><b className="mt-0.5 block">{departure.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</b></div>
              <div className="rounded-xl bg-black/[0.025] p-3 dark:bg-white/[0.05]"><Users className="mb-2 h-4 w-4 text-[#0071e3]" /><p className="text-black/45 dark:text-white/45">Ghế còn</p><b className="mt-0.5 block">{ride.availableSeats} / {totalSeats} ghế</b></div>
              <div className="rounded-xl bg-black/[0.025] p-3 dark:bg-white/[0.05]"><Route className="mb-2 h-4 w-4 text-[#0071e3]" /><p className="text-black/45 dark:text-white/45">Giá mỗi ghế</p><b className="mt-0.5 block">{ride.pricePerSeat.toLocaleString('vi-VN')}đ</b></div>
            </div>
          </div>
        </header>

        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
          <div className="space-y-5">
            <section className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white dark:border-white/10 dark:bg-[#1d1d1f]">
              <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4 dark:border-white/10"><div><h2 className="text-base font-semibold">Bản đồ tuyến và điểm dừng</h2><p className="mt-0.5 text-xs text-black/45 dark:text-white/45">Điểm đón và trả của hành khách đã xác nhận</p></div><Navigation className="h-5 w-5 text-[#0071e3]" /></div>
              {hasMap ? (
                <div className="h-[360px] w-full">
                  <OngoingMap originLat={ride.originLat!} originLng={ride.originLng!} destLat={ride.destinationLat!} destLng={ride.destinationLng!} waypoints={waypoints} useCustomOrder />
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center px-6 text-center text-sm text-black/50 dark:text-white/50">Chuyến đi chưa có đủ tọa độ để hiển thị bản đồ.</div>
              )}
              <div className="grid grid-cols-2 gap-px bg-black/[0.06] text-xs dark:bg-white/10 sm:grid-cols-4">
                <div className="bg-white p-3 dark:bg-[#1d1d1f]"><span className="text-black/45 dark:text-white/45">Quãng đường</span><b className="mt-0.5 block">{ride.distance ? `${ride.distance.toFixed(1)} km` : '—'}</b></div>
                <div className="bg-white p-3 dark:bg-[#1d1d1f]"><span className="text-black/45 dark:text-white/45">Thời gian</span><b className="mt-0.5 block">{ride.duration ? `${Math.round(ride.duration)} phút` : '—'}</b></div>
                <div className="bg-white p-3 dark:bg-[#1d1d1f]"><span className="text-black/45 dark:text-white/45">Điểm đón</span><b className="mt-0.5 block">{confirmedBookings.length}</b></div>
                <div className="bg-white p-3 dark:bg-[#1d1d1f]"><span className="text-black/45 dark:text-white/45">Điểm trả</span><b className="mt-0.5 block">{confirmedBookings.length}</b></div>
              </div>
            </section>

            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 dark:border-white/10 dark:bg-[#1d1d1f]">
              <div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-semibold">Lộ trình điểm dừng</h2><p className="mt-0.5 text-xs text-black/45 dark:text-white/45">Theo thứ tự hiện tại của chuyến</p></div><Route className="h-5 w-5 text-[#0071e3]" /></div>
              <ol className="mt-5 space-y-0">
                <li className="relative flex gap-3 pb-5 before:absolute before:left-[13px] before:top-7 before:h-full before:w-px before:bg-black/10 dark:before:bg-white/15"><span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0071e3] text-xs font-bold text-white">A</span><div><p className="text-xs text-black/45 dark:text-white/45">Xuất phát</p><p className="mt-0.5 text-sm font-medium">{ride.origin}</p></div></li>
                {confirmedBookings.flatMap((booking, index) => [
                  <li key={`pickup-${booking.id}`} className="relative flex gap-3 pb-5 before:absolute before:left-[13px] before:top-7 before:h-full before:w-px before:bg-black/10 dark:before:bg-white/15"><span className={cn('relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold', booking.isPickedUp ? 'bg-emerald-500 text-white' : 'bg-blue-50 text-blue-700')}>{booking.isPickedUp ? '✓' : index + 1}</span><div><p className="text-xs text-black/45 dark:text-white/45">Đón {passengerName(booking)}{booking.driverArrivedAt && !booking.isPickedUp ? ' · Đã tới' : ''}</p><p className="mt-0.5 text-sm font-medium">{booking.pickupAddress || ride.origin}</p></div></li>,
                  <li key={`dropoff-${booking.id}`} className="relative flex gap-3 pb-5 before:absolute before:left-[13px] before:top-7 before:h-full before:w-px before:bg-black/10 dark:before:bg-white/15"><span className={cn('relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold', booking.isDroppedOff ? 'bg-emerald-500 text-white' : 'bg-orange-50 text-orange-700')}>{booking.isDroppedOff ? '✓' : index + 1}</span><div><p className="text-xs text-black/45 dark:text-white/45">Trả {passengerName(booking)}</p><p className="mt-0.5 text-sm font-medium">{booking.dropoffAddress || ride.destination}</p></div></li>,
                ])}
                <li className="flex gap-3"><span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">B</span><div><p className="text-xs text-black/45 dark:text-white/45">Điểm đến cuối</p><p className="mt-0.5 text-sm font-medium">{ride.destination}</p></div></li>
              </ol>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-20">
            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 dark:border-white/10 dark:bg-[#1d1d1f]">
              <div className="flex items-center justify-between"><div><h2 className="text-base font-semibold">Yêu cầu đang chờ</h2><p className="mt-0.5 text-xs text-black/45 dark:text-white/45">Sắp xếp theo độ phù hợp</p></div><Badge className="bg-amber-500 text-white hover:bg-amber-500">{pendingBookings.length}</Badge></div>
              <div className="mt-4 space-y-2">
                {pendingBookings.length === 0 ? <p className="rounded-xl bg-black/[0.025] p-4 text-center text-sm text-black/45 dark:bg-white/[0.05] dark:text-white/45">Không có yêu cầu chờ xử lý.</p> : pendingBookings.map((booking) => (
                  <Link key={booking.id} href={`/bookings/${booking.id}`} className="flex items-center gap-3 rounded-xl border border-black/[0.06] p-3 transition-colors hover:bg-black/[0.025] dark:border-white/10 dark:hover:bg-white/[0.05]">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0071e3]/10 font-semibold text-[#0071e3]">{(booking.passenger.firstName?.[0] || 'C').toUpperCase()}</div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{passengerName(booking)}</p><p className="mt-0.5 flex items-center gap-1 text-xs text-black/45 dark:text-white/45"><Gauge className="h-3.5 w-3.5" /> {booking.matching ? `${Math.round(booking.matching.matchScore)}% phù hợp` : 'Chưa đủ dữ liệu'}</p></div>
                    <ChevronRight className="h-4 w-4 text-black/35 dark:text-white/35" />
                  </Link>
                ))}
              </div>
              <Link href="/booking-requests" className="mt-3 flex min-h-10 items-center justify-center text-sm font-medium text-[#0066cc] dark:text-[#2997ff]">Xem tất cả yêu cầu</Link>
            </section>

            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 dark:border-white/10 dark:bg-[#1d1d1f]">
              <div className="flex items-center justify-between"><div><h2 className="text-base font-semibold">Hành khách</h2><p className="mt-0.5 text-xs text-black/45 dark:text-white/45">Đã xác nhận trên chuyến</p></div><Users className="h-5 w-5 text-[#0071e3]" /></div>
              <div className="mt-4 space-y-2">
                {confirmedBookings.length === 0 ? <p className="rounded-xl bg-black/[0.025] p-4 text-center text-sm text-black/45 dark:bg-white/[0.05] dark:text-white/45">Chưa có hành khách được xác nhận.</p> : confirmedBookings.map((booking) => (
                  <div key={booking.id} className="rounded-xl border border-black/[0.06] p-3 dark:border-white/10">
                    <div className="flex items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 font-semibold text-emerald-700">{(booking.passenger.firstName?.[0] || 'C').toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{passengerName(booking)}</p><p className="mt-0.5 flex items-center gap-1 text-xs text-black/45 dark:text-white/45"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {(booking.passenger.passengerRating ?? 0).toFixed(1)} · {booking.seats} ghế</p></div><CheckCircle2 className="h-4 w-4 text-emerald-500" /></div>
                    <div className="mt-3 grid grid-cols-2 gap-2"><Link href={`/bookings/${booking.id}`} className="flex min-h-9 items-center justify-center rounded-lg bg-black/[0.035] text-xs font-medium dark:bg-white/[0.07]">Chi tiết</Link><button type="button" onClick={() => setChatBooking(booking)} className="flex min-h-9 items-center justify-center gap-1 rounded-lg bg-[#0071e3]/10 text-xs font-medium text-[#0066cc] dark:text-[#2997ff]"><MessageSquare className="h-3.5 w-3.5" /> Nhắn tin</button></div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 dark:border-white/10 dark:bg-[#1d1d1f]">
              <h2 className="text-base font-semibold">Thông tin vận hành</h2>
              <div className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-3"><span className="text-black/45 dark:text-white/45">Phương tiện</span><b>{ride.vehicle ? `${ride.vehicle.type === 'CAR' ? 'Ô tô' : 'Xe máy'} · ${ride.vehicle.licensePlate}` : 'Chưa cập nhật'}</b></div><div className="flex justify-between gap-3"><span className="text-black/45 dark:text-white/45">Đón dọc đường</span><b>{ride.allowRoutePickup ? 'Cho phép' : 'Không'}</b></div><div className="flex justify-between gap-3"><span className="text-black/45 dark:text-white/45">Hành lý</span><b>{ride.allowLuggage ? 'Cho phép' : 'Hạn chế'}</b></div></div>
              {(ride.status === 'SCHEDULED' || ride.status === 'FULL') && <div className="mt-5 space-y-2"><Button className="h-11 w-full gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => void handleRideAction('start')} disabled={action !== null}>{action === 'start' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />} Bắt đầu chuyến</Button><Button variant="ghost" className="h-10 w-full gap-2 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => void handleRideAction('cancel')} disabled={action !== null}>{action === 'cancel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Hủy chuyến</Button></div>}
              {ride.status === 'ONGOING' && <Link href="/ongoing"><Button className="mt-5 h-11 w-full gap-2"><Navigation className="h-4 w-4" /> Mở chuyến đang chạy</Button></Link>}
            </section>
          </aside>
        </div>
      </div>

      {chatBooking && user && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`Trò chuyện với ${passengerName(chatBooking)}`}>
          <ChatWindow rideId={ride.id} otherUserId={chatBooking.passenger.id} otherUserName={passengerName(chatBooking)} currentUserId={user.id} onClose={() => setChatBooking(null)} />
        </div>
      )}
    </main>
  );
}
