'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bell, CalendarClock, Car, CheckCircle2, Clock3, Gauge, Loader2, MapPin, Radio, Route, Users, Wallet, XCircle } from 'lucide-react';
import { SocketEvents } from '@repo/shared';
import { toast } from 'sonner';
import { useSocket } from '@/components/providers/socket-provider';
import apiClient from '@/lib/api-client';
import { shouldAcceptLiveLocation, type LiveLocation } from '@/lib/driver-route-lifecycle';
import DriverView from './driver-view';
import PassengerView from './passenger-view';

const OngoingMap = dynamic(() => import('@/components/OngoingMap'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-gray-50"><Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" /></div>,
});

interface BookingStop {
  id: string;
  status: string;
  isPickedUp?: boolean;
  isDroppedOff?: boolean;
  passengerLat?: number | null;
  passengerLng?: number | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  seats?: number;
  totalPrice?: number | null;
  price?: number | null;
}

export interface ActiveCarpoolData {
  userRole: 'DRIVER' | 'PASSENGER';
  ride: {
    id: string;
    status: string;
    origin?: string;
    destination?: string;
    departureTime?: string;
    availableSeats?: number;
    offeredSeats?: number;
    pricePerSeat?: number;
    distance?: number | null;
    duration?: number | null;
    allowRoutePickup?: boolean;
    routePickupSharingEnabled?: boolean;
    vehicle?: { type?: 'BIKE' | 'CAR'; licensePlate?: string; color?: string | null } | null;
    originLat?: number | null;
    originLng?: number | null;
    destinationLat?: number | null;
    destinationLng?: number | null;
    bookings?: BookingStop[];
  };
  [key: string]: unknown;
}

export default function CarpoolOngoingExperience({
  data,
  onRefresh,
  onCompleted,
}: {
  data: ActiveCarpoolData;
  onRefresh: () => void | Promise<unknown>;
  onCompleted: (rideId: string) => void;
}) {
  const { socket, isConnected } = useSocket();
  const [expanded, setExpanded] = useState(false);
  const [driverLocation, setDriverLocation] = useState<LiveLocation | null>(null);
  const [sharingPending, setSharingPending] = useState(false);
  const [sharingEnabled, setSharingEnabled] = useState(Boolean(data.ride.routePickupSharingEnabled));
  const [sharingError, setSharingError] = useState<string | null>(null);
  const lastLocationSentAt = useRef(0);
  const remoteLocationReceivedAt = useRef(0);
  const locationSessionStartedAt = useRef(Date.now());
  const latestDriverLocationRef = useRef<LiveLocation | null>(null);
  const ride = data.ride;

  const commitDriverLocation = useCallback((candidate: LiveLocation) => {
    if (!shouldAcceptLiveLocation(latestDriverLocationRef.current, candidate)) return false;
    latestDriverLocationRef.current = candidate;
    setDriverLocation(candidate);
    return true;
  }, []);

  useEffect(() => {
    setSharingEnabled(Boolean(ride.routePickupSharingEnabled));
  }, [ride.routePickupSharingEnabled]);

  const summary = useMemo(() => {
    const result = { pending: 0, confirmed: 0, passengers: 0, bookedSeats: 0, earnings: 0, remainingStops: 0 };
    for (const booking of ride.bookings ?? []) {
      if (booking.status === 'PENDING') result.pending += 1;
      if (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') {
        result.confirmed += 1;
        result.passengers += 1;
        result.bookedSeats += booking.seats ?? 1;
        result.earnings += booking.totalPrice ?? booking.price ?? 0;
      }
      if (booking.status === 'CONFIRMED' && !booking.isDroppedOff) result.remainingStops += 1;
    }
    return result;
  }, [ride.bookings]);

  const waypoints = useMemo(() => {
    if (data.userRole !== 'DRIVER') return [];
    return (ride.bookings ?? [])
      .filter((booking) => booking.status === 'CONFIRMED' && !booking.isDroppedOff)
      .map((booking) => booking.isPickedUp
        ? { id: booking.id, lat: booking.dropoffLat, lng: booking.dropoffLng }
        : { id: booking.id, lat: booking.passengerLat, lng: booking.passengerLng })
      .filter((point): point is { id: string; lat: number; lng: number } => point.lat != null && point.lng != null);
  }, [data.userRole, ride.bookings]);

  useEffect(() => {
    if (!socket) return;
    socket.emit(SocketEvents.RIDE_JOIN_ROOM, ride.id);
    socket.emit(SocketEvents.TRIP_JOIN_ROOM, ride.id);

    const refresh = (payload?: { rideId?: string }) => {
      if (!payload?.rideId || payload.rideId === ride.id) void onRefresh();
    };
    const updateLocation = (payload: { rideId?: string; tripId?: string; latitude: number; longitude: number; accuracy?: number; updatedAt?: string }) => {
      if ((payload.rideId ?? payload.tripId) === ride.id) {
        const accepted = commitDriverLocation({
          lat: payload.latitude,
          lng: payload.longitude,
          accuracy: payload.accuracy,
          timestamp: payload.updatedAt ? Date.parse(payload.updatedAt) : Date.now(),
        });
        if (accepted) remoteLocationReceivedAt.current = Date.now();
      }
    };
    socket.on(SocketEvents.RIDE_STATUS_UPDATED, refresh);
    socket.on(SocketEvents.RIDE_UPDATED, refresh);
    socket.on(SocketEvents.BOOKING_NEW_REQUEST, refresh);
    socket.on(SocketEvents.BOOKING_CONFIRMED, refresh);
    socket.on(SocketEvents.BOOKING_PICKED_UP, refresh);
    socket.on(SocketEvents.BOOKING_COMPLETED, refresh);
    socket.on(SocketEvents.TRIP_LOCATION_UPDATED, updateLocation);
    socket.on(SocketEvents.DRIVER_LOCATION, updateLocation);

    return () => {
      socket.emit(SocketEvents.RIDE_LEAVE_ROOM, ride.id);
      socket.emit(SocketEvents.TRIP_LEAVE_ROOM, ride.id);
      socket.off(SocketEvents.RIDE_STATUS_UPDATED, refresh);
      socket.off(SocketEvents.RIDE_UPDATED, refresh);
      socket.off(SocketEvents.BOOKING_NEW_REQUEST, refresh);
      socket.off(SocketEvents.BOOKING_CONFIRMED, refresh);
      socket.off(SocketEvents.BOOKING_PICKED_UP, refresh);
      socket.off(SocketEvents.BOOKING_COMPLETED, refresh);
      socket.off(SocketEvents.TRIP_LOCATION_UPDATED, updateLocation);
      socket.off(SocketEvents.DRIVER_LOCATION, updateLocation);
    };
  }, [commitDriverLocation, onRefresh, ride.id, socket]);

  useEffect(() => {
    if (data.userRole !== 'DRIVER' || !isConnected || !socket || !('geolocation' in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      ({ coords, timestamp }) => {
        const location: LiveLocation = {
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
          timestamp,
        };
        const now = Date.now();
        const hasFreshRemoteLocation = now - remoteLocationReceivedAt.current < 15_000;
        const waitingForRemoteDevice = now - locationSessionStartedAt.current < 10_000;
        if (hasFreshRemoteLocation || waitingForRemoteDevice) return;
        if (!commitDriverLocation(location)) return;
        if (now - lastLocationSentAt.current < 5_000) return;
        lastLocationSentAt.current = now;
        socket.emit(SocketEvents.DRIVER_UPDATE_LOCATION, {
          tripId: ride.id,
          latitude: location.lat,
          longitude: location.lng,
          heading: coords.heading ?? undefined,
          speed: coords.speed ?? undefined,
          accuracy: coords.accuracy,
        });
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [commitDriverLocation, data.userRole, isConnected, ride.id, socket]);

  const hasMapCoordinates =
    ride.originLat != null && ride.originLng != null &&
    ride.destinationLat != null && ride.destinationLng != null;

  const totalSeats = ride.offeredSeats ?? ((ride.availableSeats ?? 0) + summary.bookedSeats);
  const departure = ride.departureTime ? new Date(ride.departureTime) : null;
  const getCurrentLocation = () => new Promise<LiveLocation>((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Trình duyệt không hỗ trợ định vị.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords, timestamp }) => resolve({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy, timestamp }),
      () => reject(new Error('Hãy cấp quyền vị trí để tiếp tục nhận khách dọc đường.')),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    );
  });

  const toggleRoutePickupSharing = async () => {
    if (sharingPending || data.userRole !== 'DRIVER') return;
    const previousEnabled = sharingEnabled;
    const enabled = !previousEnabled;
    if (enabled && !ride.allowRoutePickup) return;
    setSharingError(null);
    setSharingEnabled(enabled);
    setSharingPending(true);
    try {
      let location = driverLocation;
      if (enabled && !location) {
        location = await getCurrentLocation();
        commitDriverLocation(location);
        socket?.emit(SocketEvents.DRIVER_UPDATE_LOCATION, {
          tripId: ride.id,
          latitude: location.lat,
          longitude: location.lng,
        });
      }
      const response = await apiClient.patch(`/rides/${ride.id}/route-pickup-sharing`, { enabled });
      const persistedEnabled = response.data?.ride?.routePickupSharingEnabled;
      setSharingEnabled(typeof persistedEnabled === 'boolean' ? persistedEnabled : enabled);
      toast.success(enabled ? 'Đang nhận thêm khách phù hợp dọc đường.' : 'Đã dừng nhận thêm khách dọc đường.');
      void Promise.resolve(onRefresh()).catch(() => undefined);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } }; message?: string }).response?.data?.message
        ?? (error as { message?: string }).message
        ?? 'Không thể cập nhật trạng thái nhận khách.';
      setSharingEnabled(previousEnabled);
      setSharingError(message);
      toast.error(message);
    } finally {
      setSharingPending(false);
    }
  };

  return (
    <main className="relative grid h-[calc(100dvh-48px)] min-h-[560px] w-full overflow-hidden bg-[#eef4f2] lg:grid-cols-[minmax(0,1fr)_460px] dark:bg-[#07110f]">
      <div className="absolute inset-0 z-0 lg:relative lg:inset-auto" onClick={() => setExpanded(false)}>
        {hasMapCoordinates ? (
          <OngoingMap
            originLat={ride.originLat!}
            originLng={ride.originLng!}
            destLat={ride.destinationLat!}
            destLng={ride.destinationLng!}
            waypoints={waypoints}
            driverLocation={driverLocation}
            vehicle={ride.vehicle?.type === 'BIKE' ? 'bike' : 'car'}
          />
        ) : (
          <div role="alert" className="flex h-full items-center justify-center px-6 text-center text-sm text-gray-600">
            Chuyến đi chưa có đủ tọa độ để hiển thị bản đồ.
          </div>
        )}
        <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-semibold text-[#134e4a] shadow-[0_6px_20px_rgba(15,118,110,0.16)] dark:bg-[#10211e]/95 dark:text-[#99f6e4]">
          <span className={`h-2 w-2 rounded-full ${driverLocation ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {driverLocation ? 'GPS đang cập nhật' : 'Đang chờ vị trí GPS'}
        </div>
      </div>

      <section className={`absolute inset-x-0 bottom-0 z-20 flex flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_-12px_40px_rgba(14,54,47,0.18)] transition-[height] duration-200 motion-reduce:transition-none dark:bg-[#10211e] lg:static lg:inset-auto lg:h-full lg:max-h-none lg:rounded-none lg:border-l lg:border-[#d8e5e1] lg:shadow-none dark:lg:border-[#24413b] ${expanded ? 'h-[92dvh]' : 'h-[72dvh]'}`}>
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-label={expanded ? 'Thu gọn bảng điều hành' : 'Mở rộng bảng điều hành'}
          aria-expanded={expanded}
          className="flex min-h-11 w-full shrink-0 cursor-pointer items-center justify-center rounded-t-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0f766e] lg:hidden"
        >
          <span className="h-1.5 w-12 rounded-full bg-gray-300" />
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
        {data.userRole === 'DRIVER' && (
          <header className="border-b border-[#dfe9e6] px-5 pb-3 dark:border-[#29443e] sm:px-6 lg:pt-4">
            <div className="flex items-center justify-between gap-3">
              <Link href="/my-rides" className="flex min-h-10 items-center gap-2 rounded-xl pr-3 text-sm font-semibold text-[#315b53] transition-colors hover:bg-[#e7f3ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:text-[#b6d8d0] dark:hover:bg-white/5">
                <ArrowLeft className="h-4 w-4" /> Chuyến của tôi
              </Link>
              <span className="inline-flex min-h-8 items-center gap-2 rounded-full bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                <Radio className="h-3.5 w-3.5" /> Đang di chuyển
              </span>
            </div>

            <div className="mt-2">
              <p className="text-xs font-medium text-[#5c7771] dark:text-[#8fb3aa]">Mã chuyến #{ride.id.slice(0, 8).toUpperCase()}</p>
              <h1 className="mt-0.5 text-lg font-bold tracking-[-0.02em] text-[#123c35] dark:text-white">Điều hành chuyến đi</h1>
              <div className="mt-2 grid grid-cols-[20px_minmax(0,1fr)] gap-x-2 gap-y-1.5 text-sm">
                <span className="mt-1 h-2.5 w-2.5 rounded-full border-2 border-[#0f766e]" />
                <p className="line-clamp-2 font-medium text-[#173f38] dark:text-[#e5f4f0]">{ride.origin || 'Điểm xuất phát'}</p>
                <MapPin className="h-4 w-4 fill-[#0369a1] text-[#0369a1]" />
                <p className="line-clamp-2 font-medium text-[#173f38] dark:text-[#e5f4f0]">{ride.destination || 'Điểm đến'}</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 divide-x divide-[#dfe9e6] rounded-2xl bg-[#f1f8f6] px-1 py-2.5 dark:divide-[#29443e] dark:bg-[#0b1917]">
              <div className="px-2 text-center"><CalendarClock className="mx-auto h-4 w-4 text-[#0f766e]" /><b className="mt-1 block text-xs tabular-nums text-[#123c35] dark:text-white">{departure ? departure.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}</b><span className="mt-0.5 block text-xs text-[#5c7771] dark:text-[#8fb3aa]">Khởi hành</span></div>
              <div className="px-2 text-center"><Gauge className="mx-auto h-4 w-4 text-[#0f766e]" /><b className="mt-1 block text-xs tabular-nums text-[#123c35] dark:text-white">{ride.distance ? `${ride.distance.toFixed(1)} km` : '—'}</b><span className="mt-0.5 block text-xs text-[#5c7771] dark:text-[#8fb3aa]">Quãng đường</span></div>
              <div className="px-2 text-center"><Users className="mx-auto h-4 w-4 text-[#0f766e]" /><b className="mt-1 block text-xs tabular-nums text-[#123c35] dark:text-white">{summary.bookedSeats}/{totalSeats}</b><span className="mt-0.5 block text-xs text-[#5c7771] dark:text-[#8fb3aa]">Ghế đã đặt</span></div>
              <div className="px-2 text-center"><Wallet className="mx-auto h-4 w-4 text-[#0f766e]" /><b className="mt-1 block text-xs tabular-nums text-[#123c35] dark:text-white">{summary.earnings.toLocaleString('vi-VN')}đ</b><span className="mt-0.5 block text-xs text-[#5c7771] dark:text-[#8fb3aa]">Doanh thu</span></div>
            </div>

            <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-[#4b6963] dark:text-[#a7c6bf]">
              <div className="flex min-w-0 items-center gap-2"><Clock3 className="h-4 w-4 shrink-0 text-[#0f766e]" /><dt className="sr-only">Thời lượng</dt><dd>{ride.duration ? `Khoảng ${Math.round(ride.duration)} phút` : 'Chưa có thời lượng'}</dd></div>
              <div className="flex min-w-0 items-center gap-2"><Route className="h-4 w-4 shrink-0 text-[#0f766e]" /><dt className="sr-only">Điểm dừng</dt><dd>{summary.remainingStops} điểm dừng còn lại</dd></div>
              <div className="flex min-w-0 items-center gap-2"><Bell className="h-4 w-4 shrink-0 text-[#0f766e]" /><dt className="sr-only">Yêu cầu mới</dt><dd>{summary.pending} yêu cầu mới</dd></div>
              <div className="flex min-w-0 items-center gap-2"><Car className="h-4 w-4 shrink-0 text-[#0f766e]" /><dt className="sr-only">Phương tiện</dt><dd className="truncate">{ride.vehicle?.licensePlate || 'Chưa có biển số'}</dd></div>
            </dl>

            <div className={`mt-3 rounded-2xl border p-3 transition-colors duration-200 ${sharingError ? 'border-red-300 bg-red-50/60 dark:border-red-400/40 dark:bg-red-400/5' : 'border-[#cde3dd] bg-white dark:border-[#29443e] dark:bg-[#142824]'}`}>
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${sharingEnabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300' : 'bg-[#edf3f1] text-[#5c7771] dark:bg-white/5 dark:text-[#9bbab3]'}`}>
                  <Route className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[#123c35] dark:text-white">Nhận khách dọc đường</p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${sharingEnabled ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-300'}`}>
                      {sharingEnabled ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      {sharingEnabled ? 'Đang bật' : 'Đang tắt'}
                    </span>
                  </div>
                  <p id="route-pickup-sharing-help" className="mt-1 text-xs leading-5 text-[#5c7771] dark:text-[#9bbab3]">
                    {sharingEnabled
                      ? 'Hành khách gần tuyến có thể tìm và gửi yêu cầu đặt chỗ.'
                      : ride.allowRoutePickup
                        ? 'Chuyến đang ẩn khỏi kết quả tìm khách dọc đường.'
                        : 'Chuyến này không cho phép đón khách dọc đường.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={sharingEnabled}
                aria-busy={sharingPending}
                aria-describedby={sharingError ? 'route-pickup-sharing-error' : 'route-pickup-sharing-help'}
                aria-label={`${sharingEnabled ? 'Tắt' : 'Bật'} nhận khách dọc đường`}
                disabled={sharingPending || (!ride.allowRoutePickup && !sharingEnabled)}
                onClick={() => void toggleRoutePickupSharing()}
                className="mt-2.5 flex min-h-12 w-full cursor-pointer touch-manipulation items-center justify-between gap-3 rounded-xl border border-[#bcd8d1] bg-[#f5faf8] px-3.5 text-left transition-colors duration-200 hover:border-[#0f766e] hover:bg-[#eaf5f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none dark:border-[#36534c] dark:bg-[#0d1d1a] dark:hover:border-emerald-500/60 dark:hover:bg-[#122824]"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#173f38] dark:text-[#e5f4f0]">
                  {sharingPending && <Loader2 className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" />}
                  {sharingPending ? 'Đang lưu thay đổi…' : sharingEnabled ? 'Tắt nhận thêm khách' : 'Bật nhận thêm khách'}
                </span>
                <span aria-hidden="true" className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200 motion-reduce:transition-none ${sharingEnabled ? 'bg-[#0f766e]' : 'bg-[#a9bbb6]'}`}>
                  <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none ${sharingEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                </span>
              </button>

              {sharingError && <p id="route-pickup-sharing-error" role="alert" className="mt-2 text-xs font-medium leading-5 text-red-700 dark:text-red-300">{sharingError} Hãy kiểm tra kết nối rồi thử lại.</p>}
            </div>
          </header>
        )}
        <div className="flex flex-col">
          {data.userRole === 'DRIVER' ? (
            <DriverView data={data} onRefresh={onRefresh} onCompleted={onCompleted} isExpanded={expanded} onExpand={() => setExpanded(true)} showHeader={false} />
          ) : (
            <PassengerView data={data} onRefresh={onRefresh} isExpanded={expanded} onExpand={() => setExpanded(true)} />
          )}
        </div>
        </div>
      </section>
    </main>
  );
}
