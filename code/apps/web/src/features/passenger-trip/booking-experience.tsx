'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bike, Car, Check, LocateFixed, Loader2, MapPin, Navigation, Route, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import GoongAutocomplete from '@/components/goong/goong-autocomplete';
import { decodePolyline, getDirections, reverseGeocodeDetailed } from '@/lib/goong';
import { useBookingDraft } from './store';
import { formatEta, formatPrice, formatTripDistance, type Coordinates, type TripEstimate, type VehicleType } from './domain';
import { passengerTripService } from './service';

const GoongMap = dynamic(() => import('@/components/goong/goong-map'), { ssr: false, loading: () => <div className="h-full bg-[#eef1ec]" /> });

function LocationField({ label, value, placeholder, onSelect }: { label: string; value?: string; placeholder: string; onSelect: (address: string, coordinates: Coordinates) => void }) {
  return <div className="relative pl-8"><MapPin className="absolute left-0 top-4 h-4 w-4 text-[#16833b]"/><span className="absolute left-8 top-2 z-10 text-[11px] font-semibold text-[#5f675f]">{label}</span><GoongAutocomplete defaultValue={value} placeholder={placeholder} onSelect={onSelect} variant="bare" inputClassName="h-14 w-full border-0 border-b border-[#dfe4dc] bg-transparent pt-5 text-[15px] outline-none focus:border-[#16833b]" /></div>;
}

export default function BookingExperience() {
  const router = useRouter();
  const draft = useBookingDraft();
  const patchDraft = draft.patch;
  const [routeLine, setRouteLine] = useState<Array<[number, number]>>([]);
  const [pinCenter, setPinCenter] = useState<Coordinates | null>(draft.pickup);
  const [resolvingPin, setResolvingPin] = useState(false);
  const canEstimate = Boolean(draft.pickup && draft.destination);
  const estimateQuery = useQuery({ queryKey: ['trip-estimates', draft.pickup, draft.destination], queryFn: () => passengerTripService.estimateAll(draft), enabled: draft.step === 'estimate' && canEstimate, retry: 1 });
  const estimates = useMemo(() => {
    const raw = estimateQuery.data;
    if (Array.isArray(raw)) return raw;
    return raw ? Object.entries(raw).map(([vehicleType, value]) => ({ ...(value as TripEstimate), vehicleType: vehicleType as VehicleType })) : [];
  }, [estimateQuery.data]);
  const selected = estimates.find((item) => item.vehicleType === draft.vehicleType);
  const createTrip = useMutation({ mutationFn: () => passengerTripService.create(draft), onSuccess: (trip) => { sessionStorage.setItem('coride-active-trip-id', trip.id); draft.reset(); router.push(`/ongoing?tripId=${trip.id}`); }, onError: () => toast.error('Không thể đặt xe. Vui lòng kiểm tra thông tin và thử lại.') });

  useEffect(() => {
    if (draft.step !== 'estimate' || !draft.pickup || !draft.destination) return;
    getDirections(`${draft.pickup.lat},${draft.pickup.lng}`, `${draft.destination.lat},${draft.destination.lng}`, draft.vehicleType === 'BIKE' ? 'bike' : 'car').then((result) => {
      const points = result?.routes?.[0]?.overview_polyline?.points;
      if (points) setRouteLine(decodePolyline(points));
    });
  }, [draft.step, draft.pickup, draft.destination, draft.vehicleType]);

  const locate = () => navigator.geolocation?.getCurrentPosition(({ coords }) => {
    const point = { lat: coords.latitude, lng: coords.longitude }; setPinCenter(point);
    reverseGeocodeDetailed(point.lat, point.lng).then((result) => result && draft.patch({ pickup: { ...point, address: result.address } }));
  }, () => toast.error('Không thể lấy vị trí hiện tại. Hãy bật quyền định vị.'));
  const updatePin = useCallback((center: Coordinates) => {
    setPinCenter(center); setResolvingPin(true);
    reverseGeocodeDetailed(center.lat, center.lng).then((result) => { if (result) patchDraft({ pickup: { ...center, address: result.address } }); }).finally(() => setResolvingPin(false));
  }, [patchDraft]);

  const showRoute = draft.step === 'estimate' && draft.pickup && draft.destination;
  const center = showRoute ? [draft.pickup!.lat, draft.pickup!.lng] as [number, number] : [pinCenter?.lat ?? 21.0285, pinCenter?.lng ?? 105.8542] as [number, number];
  return <div className="relative h-[calc(100dvh-48px)] min-h-[620px] overflow-hidden bg-[#edf1eb]">
    <div className="absolute inset-0"><GoongMap height="100%" center={center} zoom={16} onMoveEnd={draft.step === 'pickup' ? updatePin : undefined} markers={showRoute ? [{ position: [draft.pickup!.lng, draft.pickup!.lat], type: 'dot', color: '#16833b' }, { position: [draft.destination!.lng, draft.destination!.lat], type: 'pin', color: '#17251b' }] : []} polylines={routeLine.length ? [{ positions: routeLine, color: '#16833b', width: 6, outlineColor: '#fff', outlineWidth: 10 }] : []}/></div>
    {draft.step === 'pickup' && <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full"><MapPin className="h-11 w-11 fill-[#16833b] text-white drop-shadow-lg"/></div>}
    <button onClick={locate} aria-label="Dùng vị trí hiện tại" className="absolute right-4 top-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#17251b] shadow-[2px_5px_20px_rgba(24,45,29,.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#16833b]"><LocateFixed className="h-5 w-5"/></button>
    <section className="absolute inset-x-0 bottom-0 z-20 flex max-h-[66dvh] flex-col rounded-t-[22px] bg-white shadow-[2px_-8px_32px_rgba(24,45,29,.16)] md:bottom-6 md:left-6 md:right-auto md:top-6 md:max-h-none md:w-[440px] md:rounded-[16px]">
      <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-[#d6dbd4] md:hidden" />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-4 md:px-6">
        <div className="mb-5 flex items-start gap-3">{draft.step !== 'places' && <button onClick={() => draft.patch({ step: draft.step === 'estimate' ? 'pickup' : 'places' })} aria-label="Quay lại" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f0f4ef]"><ArrowLeft className="h-5 w-5"/></button>}<div><h1 className="text-[26px] font-semibold leading-tight tracking-[-.03em] text-[#17251b]">{draft.step === 'places' ? 'Bạn muốn đi đâu?' : draft.step === 'pickup' ? 'Xác nhận điểm đón' : 'Chọn chuyến phù hợp'}</h1><p className="mt-1 text-sm leading-5 text-[#687168]">{draft.step === 'pickup' ? 'Kéo bản đồ để đặt ghim đúng vị trí bạn đang đứng.' : draft.step === 'estimate' ? 'Giá đã gồm toàn bộ quãng đường dự kiến.' : 'Đặt xe đi ngay, tài xế sẽ đến đón bạn.'}</p></div></div>
        {draft.step === 'places' && <div className="space-y-1"><LocationField label="Điểm đón" value={draft.pickup?.address} placeholder="Vị trí hiện tại hoặc địa chỉ" onSelect={(address, coordinates) => draft.patch({ pickup: { address, ...coordinates } })}/><LocationField label="Điểm đến" value={draft.destination?.address} placeholder="Bạn muốn đến đâu?" onSelect={(address, coordinates) => draft.patch({ destination: { address, ...coordinates } })}/><button onClick={locate} className="mt-3 flex min-h-11 items-center gap-3 text-sm font-semibold text-[#16833b]"><Navigation className="h-4 w-4"/>Dùng vị trí hiện tại</button></div>}
        {draft.step === 'pickup' && <div className="rounded-[14px] bg-[#f0f4ef] p-4"><p className="text-xs font-semibold text-[#687168]">ĐIỂM ĐÓN</p><p className="mt-1 text-[15px] font-medium leading-5 text-[#17251b]">{resolvingPin ? 'Đang xác định địa chỉ…' : draft.pickup?.address || 'Di chuyển bản đồ để chọn vị trí'}</p></div>}
        {draft.step === 'estimate' && <div className="space-y-3">{estimateQuery.isLoading ? <div className="flex h-36 items-center justify-center gap-3 text-sm text-[#687168]"><Loader2 className="h-5 w-5 animate-spin"/>Đang tính giá và thời gian…</div> : estimateQuery.isError ? <button onClick={() => estimateQuery.refetch()} className="min-h-14 w-full rounded-[14px] bg-[#fff1ef] px-4 text-left text-sm text-[#9c2f24]">Không tải được giá. Nhấn để thử lại.</button> : estimates.map((item) => { const active = item.vehicleType === draft.vehicleType; const Icon = item.vehicleType === 'BIKE' ? Bike : Car; return <button key={item.vehicleType} onClick={() => draft.patch({ vehicleType: item.vehicleType as VehicleType })} className={`flex min-h-[76px] w-full items-center gap-4 rounded-[14px] px-4 text-left transition ${active ? 'bg-[#e8f5eb] outline outline-2 outline-[#16833b]' : 'bg-[#f4f6f3]'}`}><Icon className="h-7 w-7 text-[#17251b]"/><div className="flex-1"><div className="flex items-center gap-2 font-semibold text-[#17251b]">{item.vehicleType === 'BIKE' ? 'CoRide Bike' : 'CoRide Car'}{active && <Check className="h-4 w-4 text-[#16833b]"/>}</div><div className="mt-1 text-xs text-[#687168]">{formatEta(item.estimatedDuration)} · {formatTripDistance(item.estimatedDistance)}</div></div><strong className="tabular-nums text-[#17251b]">{formatPrice(item.estimatedPrice)}</strong></button>})}<div className="flex items-center gap-3 py-2 text-xs text-[#687168]"><ShieldCheck className="h-4 w-4 text-[#16833b]"/>Tài xế được xác minh · Giá minh bạch</div></div>}
      </div>
      <div className="border-t border-[#e3e7e1] bg-white p-4 md:p-5"><button disabled={(draft.step === 'places' && !canEstimate) || (draft.step === 'pickup' && (!draft.pickup || resolvingPin)) || (draft.step === 'estimate' && (!selected || createTrip.isPending))} onClick={() => draft.step === 'places' ? draft.patch({ step: 'pickup' }) : draft.step === 'pickup' ? draft.patch({ step: 'estimate' }) : createTrip.mutate()} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#16833b] px-5 font-semibold text-white transition hover:bg-[#116c30] disabled:cursor-not-allowed disabled:opacity-45">{createTrip.isPending ? <Loader2 className="h-5 w-5 animate-spin"/> : draft.step === 'estimate' ? <Route className="h-5 w-5"/> : null}{draft.step === 'places' ? 'Tiếp tục' : draft.step === 'pickup' ? 'Xác nhận điểm đón' : `Đặt ${draft.vehicleType === 'BIKE' ? 'xe máy' : 'ô tô'} · ${formatPrice(selected?.estimatedPrice)}`}</button></div>
    </section>
  </div>;
}
