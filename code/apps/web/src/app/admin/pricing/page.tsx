'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bike, Car, Loader2, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type VehicleType = 'BIKE' | 'CAR';
interface PricingConfig {
  id?: string;
  vehicleType: VehicleType;
  baseFare: number;
  pricePerKm: number;
  pricePerMinute: number;
  baseDistance: number;
  minFare: number;
  isActive: boolean;
  fuelPrice: number;
  fuelConsumption: number;
  vehicleOverheadRatio: number;
  minimumDriverShare: number;
  driverPriceAdjustment: number;
  roundingUnit: number;
  maxDetourKm: number;
  maxDetourRatio: number;
}

const queryKey = ['admin', 'pricing-configs'] as const;

export default function AdminPricingPage() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey,
    enabled: user?.role === 'ADMIN',
    queryFn: async () => {
      const response = await apiClient.get('/pricing/configs');
      return (response.data?.data ?? []) as PricingConfig[];
    },
  });
  const save = useMutation({
    mutationFn: async (config: PricingConfig) => {
      const { id: _id, ...payload } = config;
      const response = await apiClient.put('/pricing/configs', payload);
      return response.data?.data as PricingConfig;
    },
    onSuccess: () => {
      toast.success('Đã lưu cấu hình giá');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => toast.error('Không thể lưu cấu hình giá. Vui lòng kiểm tra dữ liệu.'),
  });

  if (loading || query.isLoading) return <PricingSkeleton />;
  if (user?.role !== 'ADMIN') return <AdminState title="Bạn không có quyền truy cập" description="Trang cấu hình giá chỉ dành cho quản trị viên." />;
  if (query.isError) return <AdminState title="Không thể tải cấu hình giá" description="Kiểm tra kết nối với backend rồi thử lại." action={<Button onClick={() => query.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Thử lại</Button>} />;

  return (
    <main className="min-h-[calc(100dvh-3rem)] bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <header className="max-w-3xl">
          <p className="text-sm font-medium text-primary">Quản trị vận hành</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Cấu hình giá</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Thiết lập giá Ride-Hailing và các giới hạn chia sẻ chi phí Carpooling. Thay đổi được lưu trực tiếp qua Pricing API.</p>
        </header>
        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          {(['BIKE', 'CAR'] as VehicleType[]).map((type) => {
            const config = query.data?.find((item) => item.vehicleType === type);
            return config ? <PricingEditor key={type} initial={config} saving={save.isPending && save.variables?.vehicleType === type} onSave={(value) => save.mutate(value)} /> : <MissingConfig key={type} type={type} />;
          })}
        </div>
        <section className="mt-6 rounded-xl border bg-card p-5 sm:p-6">
          <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div><h2 className="font-semibold">Phạm vi cấu hình</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Backend hiện hỗ trợ giá mở cửa, giá/km, giá/phút, giá tối thiểu, chi phí nhiên liệu, mức chia sẻ tối thiểu của tài xế và ngưỡng lệch tuyến. Cancellation fee chưa có trong data model nên không hiển thị tùy chọn lưu giả.</p></div></div>
        </section>
      </div>
    </main>
  );
}

function PricingEditor({ initial, saving, onSave }: { initial: PricingConfig; saving: boolean; onSave: (value: PricingConfig) => void }) {
  const [value, setValue] = useState(initial);
  useEffect(() => setValue(initial), [initial]);
  const setNumber = (key: keyof PricingConfig, input: string) => setValue((current) => ({ ...current, [key]: Number(input) }));
  const Icon = value.vehicleType === 'BIKE' ? Bike : Car;
  const title = value.vehicleType === 'BIKE' ? 'Xe máy' : 'Ô tô';
  return <form className="rounded-xl border bg-card" onSubmit={(event) => { event.preventDefault(); onSave(value); }}>
    <div className="flex items-center justify-between border-b p-5 sm:p-6"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><div><h2 className="font-semibold">{title}</h2><p className="text-sm text-muted-foreground">Ride-Hailing & Carpooling</p></div></div><Switch checked={value.isActive} onCheckedChange={(checked) => setValue((current) => ({ ...current, isActive: checked }))} aria-label={`Bật cấu hình ${title}`} /></div>
    <div className="space-y-7 p-5 sm:p-6">
      <FieldGroup title="Ride-Hailing" description="Công thức giá theo quãng đường và thời gian.">
        <NumberField label="Giá mở cửa" value={value.baseFare} suffix="đ" onChange={(v) => setNumber('baseFare', v)} />
        <NumberField label="Giá mỗi km" value={value.pricePerKm} suffix="đ/km" onChange={(v) => setNumber('pricePerKm', v)} />
        <NumberField label="Giá mỗi phút" value={value.pricePerMinute} suffix="đ/phút" onChange={(v) => setNumber('pricePerMinute', v)} />
        <NumberField label="Giá tối thiểu" value={value.minFare} suffix="đ" onChange={(v) => setNumber('minFare', v)} />
      </FieldGroup>
      <FieldGroup title="Carpooling" description="Giới hạn chia sẻ chi phí và độ lệch tuyến.">
        <NumberField label="Giá nhiên liệu" value={value.fuelPrice} suffix="đ/lít" onChange={(v) => setNumber('fuelPrice', v)} />
        <NumberField label="Tiêu hao nhiên liệu" value={value.fuelConsumption} suffix="l/100km" step="0.1" onChange={(v) => setNumber('fuelConsumption', v)} />
        <NumberField label="Lệch tuyến tối đa" value={value.maxDetourKm} suffix="km" step="0.1" onChange={(v) => setNumber('maxDetourKm', v)} />
        <NumberField label="Tỷ lệ lệch tối đa" value={Math.round(value.maxDetourRatio * 100)} suffix="%" onChange={(v) => setValue((current) => ({ ...current, maxDetourRatio: Number(v) / 100 }))} />
      </FieldGroup>
      <Button className="min-h-11 w-full sm:w-auto" type="submit" disabled={saving || Object.values(value).some((item) => typeof item === 'number' && (!Number.isFinite(item) || item < 0))}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Lưu cấu hình {title.toLowerCase()}</Button>
    </div>
  </form>;
}

function FieldGroup({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <fieldset><legend className="font-medium">{title}</legend><p className="mt-1 text-sm text-muted-foreground">{description}</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div></fieldset>;
}
function NumberField({ label, value, suffix, step = '1', onChange }: { label: string; value: number; suffix: string; step?: string; onChange: (value: string) => void }) {
  const id = label.toLowerCase().replace(/\s/g, '-');
  return <div><Label htmlFor={id}>{label}</Label><div className="relative mt-2"><Input id={id} type="number" min="0" step={step} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 pr-20 tabular-nums" /><span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">{suffix}</span></div></div>;
}
function MissingConfig({ type }: { type: VehicleType }) { return <div className="rounded-xl border border-dashed bg-card p-8"><h2 className="font-semibold">Chưa có cấu hình {type === 'BIKE' ? 'xe máy' : 'ô tô'}</h2><p className="mt-2 text-sm text-muted-foreground">Backend chưa có bản ghi cho loại xe này. Dùng seed/config backend trước khi chỉnh sửa.</p></div>; }
function PricingSkeleton() { return <div className="mx-auto max-w-6xl px-4 py-10"><div className="h-9 w-56 animate-pulse rounded bg-muted" /><div className="mt-8 grid gap-6 xl:grid-cols-2">{[0, 1].map((i) => <div key={i} className="h-[540px] animate-pulse rounded-xl border bg-muted/50" />)}</div></div>; }
function AdminState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) { return <div className="mx-auto flex min-h-[70dvh] max-w-lg flex-col items-center justify-center px-6 text-center"><h1 className="text-2xl font-semibold">{title}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>{action && <div className="mt-5">{action}</div>}</div>; }
