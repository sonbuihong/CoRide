'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
  RefreshCw,
  Route,
  Users,
} from 'lucide-react';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type RideStatus = 'SCHEDULED' | 'FULL' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
type RideTab = 'open' | 'ongoing' | 'completed' | 'cancelled';

interface Ride {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  availableSeats: number;
  offeredSeats?: number | null;
  pricePerSeat: number;
  distance?: number | null;
  duration?: number | null;
  status: RideStatus;
  vehicle?: {
    type: 'BIKE' | 'CAR';
    licensePlate: string;
    color?: string | null;
  } | null;
}

interface DriverBooking {
  id: string;
  rideId?: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  ride: { id: string };
}

const tabs: Array<{ id: RideTab; label: string; statuses: RideStatus[] }> = [
  { id: 'open', label: 'Đang mở', statuses: ['SCHEDULED', 'FULL'] },
  { id: 'ongoing', label: 'Đang diễn ra', statuses: ['ONGOING'] },
  { id: 'completed', label: 'Hoàn thành', statuses: ['COMPLETED'] },
  { id: 'cancelled', label: 'Đã hủy', statuses: ['CANCELLED'] },
];

const statusMeta: Record<RideStatus, { label: string; className: string }> = {
  SCHEDULED: { label: 'Đang nhận khách', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  FULL: { label: 'Đã đủ chỗ', className: 'border-violet-200 bg-violet-50 text-violet-700' },
  ONGOING: { label: 'Đang diễn ra', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  COMPLETED: { label: 'Đã hoàn thành', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  CANCELLED: { label: 'Đã hủy', className: 'border-slate-200 bg-slate-50 text-slate-600' },
};

export default function MyRidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [bookings, setBookings] = useState<DriverBooking[]>([]);
  const [activeTab, setActiveTab] = useState<RideTab>('open');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const userResponse = await apiClient.get('/users/me');
      const userId = userResponse.data.id;
      const [ridesResponse, bookingsResponse] = await Promise.all([
        apiClient.get('/rides', { params: { driverId: userId } }),
        apiClient.get('/bookings/driver'),
      ]);
      setRides(ridesResponse.data.rides ?? ridesResponse.data ?? []);
      setBookings(bookingsResponse.data.bookings ?? bookingsResponse.data ?? []);
    } catch (requestError) {
      console.error('Không thể tải chuyến lái:', requestError);
      setError('Không thể tải danh sách chuyến đi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const counts = useMemo(() => Object.fromEntries(tabs.map((tab) => [
    tab.id,
    rides.filter((ride) => tab.statuses.includes(ride.status)).length,
  ])) as Record<RideTab, number>, [rides]);

  const bookingCounts = useMemo(() => bookings.reduce<Record<string, { pending: number; confirmed: number }>>((accumulator, booking) => {
    const rideId = booking.rideId || booking.ride?.id;
    if (!rideId) return accumulator;
    accumulator[rideId] ??= { pending: 0, confirmed: 0 };
    if (booking.status === 'PENDING') accumulator[rideId].pending += 1;
    if (booking.status === 'CONFIRMED') accumulator[rideId].confirmed += 1;
    return accumulator;
  }, {}), [bookings]);

  const activeStatuses = tabs.find((tab) => tab.id === activeTab)?.statuses ?? [];
  const visibleRides = rides
    .filter((ride) => activeStatuses.includes(ride.status))
    .sort((left, right) => new Date(left.departureTime).getTime() - new Date(right.departureTime).getTime());

  return (
    <main className="min-h-screen bg-[#f5f5f7] pb-24 pt-8 text-[#1d1d1f] dark:bg-black dark:text-white sm:pt-10">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <header className="flex flex-col gap-5 border-b border-black/10 pb-6 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0071e3]">Không gian tài xế</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.025em] sm:text-[34px]">Chuyến đi của tôi</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-black/55 dark:text-white/55">Theo dõi yêu cầu, hành khách và từng điểm dừng từ một nơi duy nhất.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" aria-label="Làm mới" onClick={() => { setLoading(true); void fetchData(); }}><RefreshCw className="h-4 w-4" /></Button>
            <Link href="/rides/post"><Button className="h-10 gap-2 rounded-full bg-[#0071e3] px-5 hover:bg-[#0077ed]"><Plus className="h-4 w-4" /> Đăng chuyến mới</Button></Link>
          </div>
        </header>

        <nav className="mt-6 flex gap-1 overflow-x-auto rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.08]" aria-label="Lọc chuyến đi">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex min-h-10 min-w-fit flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-medium transition-colors',
                activeTab === tab.id ? 'bg-white text-[#1d1d1f] shadow-sm dark:bg-[#2c2c2e] dark:text-white' : 'text-black/55 hover:text-black dark:text-white/55 dark:hover:text-white'
              )}
            >
              {tab.label}<span className="rounded-full bg-black/[0.06] px-1.5 py-0.5 text-[11px] dark:bg-white/10">{counts[tab.id]}</span>
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="grid gap-4 py-8">
            {[0, 1, 2].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl bg-white dark:bg-[#1d1d1f]" />)}
          </div>
        ) : error ? (
          <section className="mt-8 rounded-2xl border border-red-200 bg-white p-10 text-center dark:border-red-500/30 dark:bg-[#1d1d1f]">
            <AlertCircle className="mx-auto h-7 w-7 text-red-500" />
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
            <Button variant="outline" className="mt-4 rounded-full" onClick={() => { setLoading(true); void fetchData(); }}>Thử lại</Button>
          </section>
        ) : visibleRides.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-12 text-center dark:border-white/10 dark:bg-[#1d1d1f]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]"><Car className="h-6 w-6" /></div>
            <h2 className="mt-4 text-base font-semibold">Chưa có chuyến trong mục này</h2>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-black/50 dark:text-white/50">{activeTab === 'open' ? 'Tạo chuyến mới để bắt đầu nhận yêu cầu từ hành khách phù hợp.' : 'Các chuyến có trạng thái tương ứng sẽ xuất hiện tại đây.'}</p>
            {activeTab === 'open' && <Link href="/rides/post"><Button className="mt-5 h-10 rounded-full bg-[#0071e3] px-5">Đăng chuyến mới</Button></Link>}
          </section>
        ) : (
          <section className="mt-6 space-y-4">
            {visibleRides.map((ride) => {
              const departure = new Date(ride.departureTime);
              const totalSeats = ride.offeredSeats ?? ride.availableSeats;
              const occupiedSeats = Math.max(0, totalSeats - ride.availableSeats);
              const countsForRide = bookingCounts[ride.id] ?? { pending: 0, confirmed: 0 };
              const meta = statusMeta[ride.status];
              return (
                <article key={ride.id} className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.035)] dark:border-white/10 dark:bg-[#1d1d1f]">
                  <div className="p-5 md:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn('text-[11px]', meta.className)}>{meta.label}</Badge>
                        {countsForRide.pending > 0 && <Badge className="bg-amber-500 text-white hover:bg-amber-500">{countsForRide.pending} yêu cầu mới</Badge>}
                      </div>
                      <span className="text-xs font-medium text-black/45 dark:text-white/45">#{ride.id.slice(0, 8).toUpperCase()}</span>
                    </div>

                    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
                      <div className="relative space-y-4 pl-8">
                        <span className="absolute bottom-4 left-[9px] top-4 w-px bg-black/15 dark:bg-white/20" />
                        <div className="relative">
                          <span className="absolute -left-8 top-1.5 h-4 w-4 rounded-full border-[4px] border-[#0071e3] bg-white dark:bg-[#1d1d1f]" />
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">Điểm đi</p>
                          <h2 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-5">{ride.origin}</h2>
                        </div>
                        <div className="relative">
                          <MapPin className="absolute -left-[34px] top-0.5 h-5 w-5 fill-orange-500 text-orange-500" />
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">Điểm đến</p>
                          <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-5">{ride.destination}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs lg:grid-cols-1">
                        <div className="flex items-center gap-2 rounded-xl bg-black/[0.025] px-3 py-2.5 dark:bg-white/[0.05]"><CalendarDays className="h-4 w-4 text-[#0071e3]" /><span>{departure.toLocaleDateString('vi-VN')}</span></div>
                        <div className="flex items-center gap-2 rounded-xl bg-black/[0.025] px-3 py-2.5 dark:bg-white/[0.05]"><Clock3 className="h-4 w-4 text-[#0071e3]" /><span>{departure.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span></div>
                        <div className="flex items-center gap-2 rounded-xl bg-black/[0.025] px-3 py-2.5 dark:bg-white/[0.05]"><Users className="h-4 w-4 text-[#0071e3]" /><span>{occupiedSeats}/{totalSeats} ghế đã đặt</span></div>
                        <div className="flex items-center gap-2 rounded-xl bg-black/[0.025] px-3 py-2.5 dark:bg-white/[0.05]"><Route className="h-4 w-4 text-[#0071e3]" /><span>{ride.distance ? `${ride.distance.toFixed(0)} km` : 'Đang tính tuyến'}</span></div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-4 text-sm dark:border-white/10">
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-black/50 dark:text-white/50">
                        <span><b className="text-[#1d1d1f] dark:text-white">{countsForRide.confirmed}</b> hành khách xác nhận</span>
                        <span><b className="text-[#1d1d1f] dark:text-white">{ride.pricePerSeat.toLocaleString('vi-VN')}đ</b> / ghế</span>
                        {ride.vehicle && <span><Car className="mr-1 inline h-3.5 w-3.5" />{ride.vehicle.licensePlate}</span>}
                      </div>
                      <Link href={`/my-rides/${ride.id}`} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 font-medium text-[#0066cc] hover:bg-[#0071e3]/8 dark:text-[#2997ff]">
                        Quản lý chuyến <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  {ride.status === 'ONGOING' && (
                    <Link href="/ongoing" className="flex min-h-11 items-center justify-center gap-2 border-t border-black/[0.06] bg-amber-50 px-5 text-sm font-semibold text-amber-800 hover:bg-amber-100 dark:border-white/10 dark:bg-amber-500/10 dark:text-amber-300">
                      Mở chuyến đang chạy <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                  {ride.status === 'COMPLETED' && (
                    <div className="flex min-h-10 items-center justify-center gap-2 border-t border-black/[0.06] bg-emerald-50 px-5 text-xs font-medium text-emerald-700 dark:border-white/10 dark:bg-emerald-500/10 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Chuyến đi đã được lưu vào lịch sử</div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
