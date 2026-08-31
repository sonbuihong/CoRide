'use client';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Bike, Car, Check, ChevronUp, CircleHelp, Clock3, Loader2, MapPin, Navigation, Phone, ReceiptText, Share2, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { decodePolyline, getDirections } from '@/lib/goong';
import { usePassengerTrip } from './use-passenger-trip';
import { canCancelTrip, formatEta, formatPrice, formatTripDistance, getPassengerStatus } from './domain';
import { passengerTripKeys, passengerTripService } from './service';
import { useBookingDraft } from './store';
import { useAuth } from '@/components/providers/auth-provider';

const GoongMap = dynamic(() => import('@/components/goong/goong-map'), { ssr: false, loading: () => <div className="h-full bg-[#edf1eb]" /> });

export default function OngoingExperience({ tripId }: { tripId?: string | null }) {
  const { user, loading: authLoading } = useAuth();
  const client = useQueryClient();
  const draft = useBookingDraft();
  const [expanded, setExpanded] = useState(false);
  const [routeLine, setRouteLine] = useState<Array<[number, number]>>([]);
  const [recoveredTripId, setRecoveredTripId] = useState<string | null>(tripId ?? null);
  useEffect(() => {
    if (!tripId) setRecoveredTripId(sessionStorage.getItem('coride-active-trip-id'));
  }, [tripId]);
  const effectiveTripId = tripId || recoveredTripId;
  const { data: trip, isLoading, isError, refetch, driverLocation } = usePassengerTrip(effectiveTripId, !authLoading && Boolean(user));
  const id = trip?.id || effectiveTripId || '';
  const status = trip ? getPassengerStatus(trip.status) : null;
  const qr = useQuery({ queryKey: ['trip-payment-qr', id], queryFn: () => passengerTripService.paymentQr(id), enabled: Boolean(id && trip?.status === 'WAITING_PAYMENT') });
  const cancel = useMutation({ mutationFn: () => passengerTripService.cancel(id, 'Hành khách hủy chuyến'), onSuccess: (value) => { draft.reset(); client.setQueryData(passengerTripKeys.detail(id), value); toast.success('Đã hủy chuyến đi.'); }, onError: () => toast.error('Không thể hủy chuyến ở thời điểm này.') });
  const pay = useMutation({ mutationFn: () => passengerTripService.confirmPayment(id), onSuccess: async () => { await refetch(); toast.success('Thanh toán thành công.'); }, onError: () => toast.error('Không thể xác nhận thanh toán. Vui lòng thử lại.') });
  useEffect(() => {
    if (!trip) return;
    const start = driverLocation && trip.status === 'IN_PROGRESS' ? driverLocation : { lat: trip.originLat, lng: trip.originLng };
    getDirections(`${start.lat},${start.lng}`, `${trip.destLat},${trip.destLng}`, trip.vehicleType === 'BIKE' ? 'bike' : 'car').then((result) => {
      const points = result?.routes?.[0]?.overview_polyline?.points; if (points) setRouteLine(decodePolyline(points));
    });
  // Route chỉ cần tính lại khi trip/status hoặc tọa độ tài xế thay đổi.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id, trip?.status, driverLocation?.lat, driverLocation?.lng]);
  const markers = useMemo(() => trip ? [
    { position: [trip.originLng, trip.originLat] as [number, number], type: 'dot' as const, color: '#16833b' },
    { position: [trip.destLng, trip.destLat] as [number, number], type: 'pin' as const, color: '#17251b' },
    ...(driverLocation ? [{ position: [driverLocation.lng, driverLocation.lat] as [number, number], type: 'dot' as const, color: '#f3a51f' }] : []),
  ] : [], [trip, driverLocation]);
  const share = async () => { const url = window.location.href; if (navigator.share) await navigator.share({ title: 'Hành trình CoRide', url }); else { await navigator.clipboard.writeText(url); toast.success('Đã sao chép liên kết hành trình.'); } };

  if (authLoading || isLoading) return <div className="flex h-[calc(100dvh-48px)] items-center justify-center gap-3 bg-[#edf1eb] text-sm text-[#687168]"><Loader2 className="h-6 w-6 animate-spin text-[#16833b]"/>Đang khôi phục chuyến đi…</div>;
  if (!user) return <div className="flex h-[calc(100dvh-48px)] flex-col items-center justify-center bg-[#edf1eb] px-6 text-center"><ShieldCheck className="h-10 w-10 text-[#16833b]"/><h1 className="mt-4 text-2xl font-semibold text-[#17251b]">Đăng nhập để xem chuyến đi</h1><p className="mt-2 max-w-sm text-sm text-[#687168]">Phiên đăng nhập đã hết hạn hoặc chưa được khôi phục.</p><Link href="/login?callbackUrl=/ongoing" className="mt-6 flex min-h-12 items-center rounded-[12px] bg-[#16833b] px-6 font-semibold text-white">Đăng nhập</Link></div>;
  if (isError) return <div className="flex h-[calc(100dvh-48px)] flex-col items-center justify-center bg-[#edf1eb] px-6 text-center"><AlertTriangle className="h-10 w-10 text-[#9c2f24]"/><h1 className="mt-4 text-2xl font-semibold text-[#17251b]">Không tải được thông tin chuyến</h1><p className="mt-2 max-w-sm text-sm text-[#687168]">Kết nối tới máy chủ gặp sự cố. Chuyến đi của bạn chưa bị thay đổi.</p><button onClick={() => refetch()} className="mt-6 flex min-h-12 items-center rounded-[12px] bg-[#16833b] px-6 font-semibold text-white">Thử lại</button></div>;
  if (!trip || !status) return <div className="flex h-[calc(100dvh-48px)] flex-col items-center justify-center bg-[#edf1eb] px-6 text-center"><Navigation className="h-10 w-10 text-[#16833b]"/><h1 className="mt-4 text-2xl font-semibold text-[#17251b]">Bạn chưa có chuyến đang hoạt động</h1><p className="mt-2 max-w-sm text-sm text-[#687168]">Đặt một chuyến mới và CoRide sẽ tìm tài xế phù hợp gần bạn.</p><Link href="/book" className="mt-6 flex min-h-12 items-center rounded-[12px] bg-[#16833b] px-6 font-semibold text-white">Đặt chuyến ngay</Link></div>;
  const DriverIcon = trip.vehicleType === 'BIKE' ? Bike : Car;
  const terminal = trip.status === 'COMPLETED' || trip.status === 'NO_DRIVER' || trip.status === 'CANCELLED';
  return <div className="relative h-[calc(100dvh-113px)] min-h-[540px] overflow-hidden bg-[#edf1eb] lg:h-[calc(100dvh-48px)] lg:min-h-[620px]">
    <div className="absolute inset-0"><GoongMap height="100%" center={[trip.originLat, trip.originLng]} markers={markers} polylines={routeLine.length ? [{ positions: routeLine, color: '#16833b', width: 6, outlineColor: '#fff', outlineWidth: 10 }] : []}/></div>
    {!terminal && <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#33523b] shadow-[2px_5px_18px_rgba(24,45,29,.14)]"><span className={`h-2 w-2 rounded-full ${trip.status === 'MATCHING' || trip.status === 'PENDING' ? 'animate-pulse bg-[#f3a51f]' : 'bg-[#16833b]'}`}/>{trip.status === 'MATCHING' || trip.status === 'PENDING' ? 'Đang kết nối tài xế' : 'Chuyến đi đang hoạt động'}</div>}
    <section className={`absolute inset-x-0 bottom-0 z-20 flex max-h-[82dvh] flex-col rounded-t-[22px] bg-white shadow-[2px_-8px_32px_rgba(24,45,29,.18)] transition-[height] md:bottom-6 md:left-6 md:right-auto md:top-6 md:h-auto md:max-h-none md:w-[450px] md:rounded-[16px] ${expanded ? 'h-[82dvh]' : 'h-auto'}`}>
      <button onClick={() => setExpanded(!expanded)} className="flex min-h-9 w-full items-center justify-center md:hidden" aria-label={expanded ? 'Thu gọn' : 'Mở rộng'}><span className="h-1 w-10 rounded-full bg-[#d6dbd4]"/><ChevronUp className={`absolute right-5 h-4 w-4 text-[#687168] transition ${expanded ? 'rotate-180' : ''}`}/></button>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 md:px-6 md:pt-5">
        <div className="flex items-start gap-4"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${status.phase === 'ended' ? 'bg-[#fff1ef] text-[#9c2f24]' : status.phase === 'completed' ? 'bg-[#e8f5eb] text-[#16833b]' : 'bg-[#edf4ea] text-[#16833b]'}`}>{status.phase === 'completed' ? <Check className="h-6 w-6"/> : status.phase === 'ended' ? <X className="h-6 w-6"/> : status.phase === 'searching' ? <Loader2 className="h-6 w-6 animate-spin"/> : <Navigation className="h-6 w-6"/>}</div><div><h1 className="text-[25px] font-semibold leading-tight tracking-[-.03em] text-[#17251b]">{status.title}</h1><p className="mt-1 text-sm leading-5 text-[#687168]">{status.description}</p></div></div>
        {status.phase === 'searching' && <div className="mt-5"><div className="h-1.5 overflow-hidden rounded-full bg-[#e4e9e2]"><div className="h-full w-2/3 animate-pulse rounded-full bg-[#16833b]"/></div><div className="mt-4 flex items-center gap-3 rounded-[14px] bg-[#f3f6f2] p-4 text-sm text-[#4f5b51]"><ShieldCheck className="h-5 w-5 shrink-0 text-[#16833b]"/>Hệ thống mở rộng bán kính tìm kiếm từng bước để cân bằng thời gian chờ và chất lượng tài xế.</div></div>}
        {trip.driver && <div className="mt-5 flex items-center gap-4 border-y border-[#e3e7e1] py-4"><div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#e7ece5]">{trip.driver.avatarUrl ? <Image src={trip.driver.avatarUrl} alt="" width={56} height={56}/> : <DriverIcon className="h-6 w-6 text-[#33523b]"/>}</div><div className="min-w-0 flex-1"><strong className="block truncate text-[#17251b]">{trip.driver.firstName} {trip.driver.lastName}</strong><span className="text-xs text-[#687168]">{trip.driver.driverRating ? `★ ${trip.driver.driverRating.toFixed(1)}` : 'Tài xế CoRide đã xác minh'}{trip.driver.vehicle?.licensePlate ? ` · ${trip.driver.vehicle.licensePlate}` : ''}</span></div>{trip.driver.phone && <a href={`tel:${trip.driver.phone}`} aria-label="Gọi tài xế" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f5eb] text-[#16833b]"><Phone className="h-5 w-5"/></a>}<button onClick={share} aria-label="Chia sẻ hành trình" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f0f4ef] text-[#33523b]"><Share2 className="h-5 w-5"/></button></div>}
        <div className="mt-5 space-y-4"><div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#16833b]"/><div><span className="block text-[11px] font-semibold text-[#687168]">ĐIỂM ĐÓN</span><span className="text-sm leading-5 text-[#17251b]">{trip.originAddress}</span></div></div><div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#17251b]"/><div><span className="block text-[11px] font-semibold text-[#687168]">ĐIỂM ĐẾN</span><span className="text-sm leading-5 text-[#17251b]">{trip.destAddress}</span></div></div></div>
        <div className="mt-5 grid grid-cols-3 gap-2 rounded-[14px] bg-[#f3f6f2] p-4 text-center"><div><Clock3 className="mx-auto h-4 w-4 text-[#687168]"/><strong className="mt-1 block text-sm text-[#17251b]">{formatEta(trip.estimatedDuration)}</strong></div><div><Navigation className="mx-auto h-4 w-4 text-[#687168]"/><strong className="mt-1 block text-sm text-[#17251b]">{formatTripDistance(trip.estimatedDistance)}</strong></div><div><ReceiptText className="mx-auto h-4 w-4 text-[#687168]"/><strong className="mt-1 block text-sm text-[#17251b]">{formatPrice(trip.finalPrice ?? trip.estimatedPrice)}</strong></div></div>
        {trip.status === 'WAITING_PAYMENT' && <div className="mt-5 text-center">{qr.isLoading ? <div className="flex h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#16833b]"/></div> : qr.data ? <><div className="mx-auto w-fit rounded-[14px] bg-white p-2 outline outline-1 outline-[#e3e7e1]"><Image src={qr.data.qrUrl} alt="Mã QR thanh toán" width={210} height={210} unoptimized/></div><p className="mt-3 text-sm font-semibold text-[#17251b]">{formatPrice(qr.data.amount)}</p><p className="text-xs text-[#687168]">{qr.data.description}</p></> : <button onClick={() => qr.refetch()} className="text-sm text-[#9c2f24]">Không tải được QR · Thử lại</button>}</div>}
        {trip.status === 'COMPLETED' && <div className="mt-5 rounded-[14px] bg-[#e8f5eb] p-4"><div className="flex items-center gap-2 font-semibold text-[#16833b]"><Check className="h-5 w-5"/>Thanh toán thành công</div><p className="mt-2 text-sm text-[#33523b]">Mã chuyến #{trip.id.slice(0, 8).toUpperCase()} · {formatPrice(trip.finalPrice ?? trip.estimatedPrice)}</p></div>}
      </div>
      <div className="border-t border-[#e3e7e1] bg-white p-4 md:p-5">{trip.status === 'WAITING_PAYMENT' ? <button disabled={pay.isPending} onClick={() => pay.mutate()} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#16833b] font-semibold text-white disabled:opacity-50">{pay.isPending && <Loader2 className="h-5 w-5 animate-spin"/>}Tôi đã thanh toán</button> : terminal ? <Link href="/book" onClick={() => draft.reset()} className="flex min-h-12 w-full items-center justify-center rounded-[12px] bg-[#16833b] font-semibold text-white">{trip.status === 'NO_DRIVER' ? 'Thử đặt lại' : 'Đặt chuyến mới'}</Link> : canCancelTrip(trip.status) ? <button disabled={cancel.isPending} onClick={() => cancel.mutate()} className="flex min-h-12 w-full items-center justify-center rounded-[12px] bg-[#fff1ef] font-semibold text-[#9c2f24] disabled:opacity-50">{cancel.isPending ? 'Đang hủy…' : 'Hủy chuyến'}</button> : <a href="tel:19000000" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#f0f4ef] font-semibold text-[#33523b]"><CircleHelp className="h-5 w-5"/>Liên hệ hỗ trợ</a>}</div>
    </section>
  </div>;
}
