'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Gauge,
  Loader2,
  MapPin,
  RefreshCw,
  Route,
  Star,
  Timer,
  Users,
  X,
} from 'lucide-react';
import { SocketEvents } from '@repo/shared';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { useSocket } from '@/components/providers/socket-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type RequestStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
type RequestTab = 'pending' | 'confirmed' | 'history';

interface BookingRequest {
  id: string;
  rideId: string;
  seats: number;
  totalPrice: number;
  status: RequestStatus;
  pickupAddress?: string | null;
  dropoffAddress?: string | null;
  detourKm?: number | null;
  additionalTimeMinutes?: number | null;
  passenger: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    passengerRating?: number | null;
    passengerRatingCount?: number | null;
  };
  ride: {
    id: string;
    origin: string;
    destination: string;
    departureTime: string;
    status: string;
  };
  matching?: {
    matchType: 'DIRECT' | 'NEARBY' | 'ON_ROUTE';
    matchScore: number;
    detourKm: number;
    routeOverlap: number;
  } | null;
}

const tabs: Array<{ id: RequestTab; label: string }> = [
  { id: 'pending', label: 'Chờ xử lý' },
  { id: 'confirmed', label: 'Đã xác nhận' },
  { id: 'history', label: 'Lịch sử' },
];

function fullName(request: BookingRequest) {
  return [request.passenger.firstName, request.passenger.lastName].filter(Boolean).join(' ') || 'Hành khách CoRide';
}

function statusLabel(status: RequestStatus) {
  if (status === 'PENDING') return 'Chờ xử lý';
  if (status === 'CONFIRMED') return 'Đã xác nhận';
  if (status === 'COMPLETED') return 'Đã hoàn thành';
  if (status === 'REJECTED') return 'Đã từ chối';
  return 'Đã hủy';
}

function statusClass(status: RequestStatus) {
  if (status === 'PENDING') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'CONFIRMED') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'COMPLETED') return 'border-blue-200 bg-blue-50 text-blue-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

export default function BookingRequestsPage() {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [activeTab, setActiveTab] = useState<RequestTab>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<{ id: string; status: 'CONFIRMED' | 'REJECTED' } | null>(null);
  const { socket } = useSocket();

  const fetchRequests = useCallback(async () => {
    setError(null);
    try {
      const response = await apiClient.get('/bookings/driver');
      setRequests(response.data.bookings ?? response.data ?? []);
    } catch (requestError) {
      console.error('Không thể tải yêu cầu đặt chỗ:', requestError);
      setError('Không thể tải danh sách yêu cầu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => { void fetchRequests(); };
    const handleNotification = (notification: { type?: string }) => {
      if (notification.type === 'BOOKING_REQUEST') refresh();
    };

    socket.on(SocketEvents.NOTIFICATION_NEW, handleNotification);
    socket.on(SocketEvents.BOOKING_NEW_REQUEST, refresh);
    socket.on(SocketEvents.BOOKING_CONFIRMED, refresh);
    socket.on(SocketEvents.BOOKING_REJECTED, refresh);

    return () => {
      socket.off(SocketEvents.NOTIFICATION_NEW, handleNotification);
      socket.off(SocketEvents.BOOKING_NEW_REQUEST, refresh);
      socket.off(SocketEvents.BOOKING_CONFIRMED, refresh);
      socket.off(SocketEvents.BOOKING_REJECTED, refresh);
    };
  }, [socket, fetchRequests]);

  const counts = useMemo(() => ({
    pending: requests.filter((request) => request.status === 'PENDING').length,
    confirmed: requests.filter((request) => request.status === 'CONFIRMED').length,
    history: requests.filter((request) => ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(request.status)).length,
  }), [requests]);

  const visibleRequests = useMemo(() => requests.filter((request) => {
    if (activeTab === 'pending') return request.status === 'PENDING';
    if (activeTab === 'confirmed') return request.status === 'CONFIRMED';
    return ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(request.status);
  }), [requests, activeTab]);

  const handleUpdateStatus = async (request: BookingRequest, status: 'CONFIRMED' | 'REJECTED') => {
    const verb = status === 'CONFIRMED' ? 'chấp nhận' : 'từ chối';
    if (!confirm(`Bạn có chắc muốn ${verb} yêu cầu của ${fullName(request)}?`)) return;

    setProcessing({ id: request.id, status });
    try {
      await apiClient.patch(`/bookings/${request.id}/status`, { status });
      toast.success(status === 'CONFIRMED' ? 'Đã xác nhận hành khách.' : 'Đã từ chối yêu cầu.');
      await fetchRequests();
    } catch (requestError: unknown) {
      const message = (requestError as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || `Không thể ${verb} yêu cầu.`);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f5f7] pb-24 pt-8 text-[#1d1d1f] dark:bg-black dark:text-white sm:pt-10">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <header className="flex flex-col gap-4 border-b border-black/10 pb-6 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0071e3]">Trung tâm tài xế</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.025em] sm:text-[34px]">Yêu cầu đặt chỗ</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55 dark:text-white/55">Ưu tiên những hành khách có tuyến đường phù hợp, sau đó xem bản đồ chi tiết trước khi quyết định.</p>
          </div>
          <Button variant="outline" className="h-10 self-start gap-2 rounded-full sm:self-auto" onClick={() => { setLoading(true); void fetchRequests(); }}>
            <RefreshCw className="h-4 w-4" /> Làm mới
          </Button>
        </header>

        <nav className="mt-6 flex gap-1 overflow-x-auto rounded-xl bg-black/[0.04] p-1 dark:bg-white/[0.08]" aria-label="Lọc yêu cầu đặt chỗ">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex min-h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-medium transition-colors',
                activeTab === tab.id ? 'bg-white text-[#1d1d1f] shadow-sm dark:bg-[#2c2c2e] dark:text-white' : 'text-black/55 hover:text-black dark:text-white/55 dark:hover:text-white'
              )}
            >
              {tab.label}
              <span className="rounded-full bg-black/[0.06] px-1.5 py-0.5 text-[11px] dark:bg-white/10">{counts[tab.id]}</span>
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="grid gap-4 py-8" aria-label="Đang tải yêu cầu">
            {[0, 1, 2].map((item) => <div key={item} className="h-52 animate-pulse rounded-2xl bg-white dark:bg-[#1d1d1f]" />)}
          </div>
        ) : error ? (
          <section className="mt-8 rounded-2xl border border-red-200 bg-white p-8 text-center dark:border-red-500/30 dark:bg-[#1d1d1f]">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <Button variant="outline" className="mt-4 rounded-full" onClick={() => { setLoading(true); void fetchRequests(); }}>Thử lại</Button>
          </section>
        ) : visibleRequests.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-black/[0.06] bg-white p-10 text-center dark:border-white/10 dark:bg-[#1d1d1f]">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#0071e3]/10 text-[#0071e3]"><Users className="h-5 w-5" /></div>
            <h2 className="mt-4 text-base font-semibold">Chưa có yêu cầu trong mục này</h2>
            <p className="mt-1 text-sm text-black/50 dark:text-white/50">Yêu cầu mới sẽ tự động xuất hiện khi hành khách gửi đặt chỗ.</p>
          </section>
        ) : (
          <section className="mt-6 space-y-4" aria-live="polite">
            {visibleRequests.map((request) => {
              const departure = new Date(request.ride.departureTime);
              const isBusy = processing?.id === request.id;
              return (
                <article key={request.id} className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.035)] dark:border-white/10 dark:bg-[#1d1d1f]">
                  <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_220px] md:p-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0071e3]/10 font-semibold text-[#0071e3]">
                          {(request.passenger.firstName?.[0] || 'C').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h2 className="truncate text-base font-semibold">{fullName(request)}</h2>
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-black/50 dark:text-white/50">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {(request.passenger.passengerRating ?? 0).toFixed(1)} · {request.passenger.passengerRatingCount ?? 0} đánh giá
                          </div>
                        </div>
                        <Badge variant="outline" className={cn('ml-auto text-[11px]', statusClass(request.status))}>{statusLabel(request.status)}</Badge>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-black/[0.025] p-3 dark:bg-white/[0.05]">
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-black/45 dark:text-white/45"><MapPin className="h-3.5 w-3.5 text-[#0071e3]" /> Điểm đón</p>
                          <p className="mt-1 line-clamp-2 text-sm font-medium leading-5">{request.pickupAddress || request.ride.origin}</p>
                        </div>
                        <div className="rounded-xl bg-black/[0.025] p-3 dark:bg-white/[0.05]">
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-black/45 dark:text-white/45"><ArrowRight className="h-3.5 w-3.5 text-orange-500" /> Điểm trả</p>
                          <p className="mt-1 line-clamp-2 text-sm font-medium leading-5">{request.dropoffAddress || request.ride.destination}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-black/55 dark:text-white/55">
                        <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {departure.toLocaleDateString('vi-VN')}</span>
                        <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> {departure.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {request.seats} ghế</span>
                        <span className="font-semibold text-[#1d1d1f] dark:text-white">{request.totalPrice.toLocaleString('vi-VN')}đ</span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-xl border border-black/[0.06] p-4 dark:border-white/10">
                      {request.matching ? (
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div><p className="text-xs text-black/45 dark:text-white/45">Độ phù hợp</p><p className="mt-0.5 text-2xl font-semibold text-[#0071e3]">{Math.round(request.matching.matchScore)}%</p></div>
                            <Gauge className="h-5 w-5 text-[#0071e3]" />
                          </div>
                          <div className="mt-3 space-y-2 text-xs text-black/55 dark:text-white/55">
                            <p className="flex items-center justify-between gap-3"><span className="flex items-center gap-1"><Route className="h-3.5 w-3.5" /> Đi vòng</span><b className="text-[#1d1d1f] dark:text-white">+{(request.detourKm ?? request.matching.detourKm).toFixed(1)} km</b></p>
                            <p className="flex items-center justify-between gap-3"><span className="flex items-center gap-1"><Timer className="h-3.5 w-3.5" /> Thời gian</span><b className="text-[#1d1d1f] dark:text-white">+{Math.round(request.additionalTimeMinutes ?? 0)} phút</b></p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-black/50 dark:text-white/50"><Gauge className="h-4 w-4" /> Chưa đủ dữ liệu ghép tuyến</div>
                      )}

                      <Link href={`/bookings/${request.id}`} className="mt-4 inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border border-black/10 px-3 text-sm font-medium hover:bg-black/[0.03] dark:border-white/15 dark:hover:bg-white/[0.06]">
                        Xem chi tiết <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  {request.status === 'PENDING' && (
                    <div className="flex flex-col gap-2 border-t border-black/[0.06] bg-black/[0.015] px-5 py-3 dark:border-white/10 dark:bg-white/[0.025] sm:flex-row sm:justify-end md:px-6">
                      <Button variant="ghost" className="h-10 gap-2 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => void handleUpdateStatus(request, 'REJECTED')} disabled={isBusy}>
                        {isBusy && processing?.status === 'REJECTED' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Từ chối
                      </Button>
                      <Button className="h-10 gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={() => void handleUpdateStatus(request, 'CONFIRMED')} disabled={isBusy}>
                        {isBusy && processing?.status === 'CONFIRMED' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Chấp nhận
                      </Button>
                    </div>
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
