'use client';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarX, RefreshCw } from 'lucide-react';
import { SocketEvents } from '@repo/shared';
import { useAuth } from '@/components/providers/auth-provider';
import { useRoleMode } from '@/components/providers/role-mode-provider';
import { useSocket } from '@/components/providers/socket-provider';
import { ActivityCard } from '@/components/activity/activity-card';
import { activityService, ActivitySegment } from '@/services/activity-service';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const segments: { value: ActivitySegment; label: string }[] = [{ value: 'ACTIVE', label: 'Đang hoạt động' }, { value: 'UPCOMING', label: 'Sắp tới' }, { value: 'COMPLETED', label: 'Đã hoàn thành' }, { value: 'CANCELLED', label: 'Đã hủy' }];
export default function ActivityPage() {
  const { user } = useAuth(); const { mode } = useRoleMode(); const { socket } = useSocket(); const client = useQueryClient();
  const [segment, setSegment] = useState<ActivitySegment>('ACTIVE'); const role = mode === 'driver' ? 'DRIVER' : 'PASSENGER';
  const query = useQuery({ queryKey: ['activities', role, segment], queryFn: () => activityService.list(role, segment), enabled: !!user });
  useEffect(() => { if (!socket) return; const refresh = () => client.invalidateQueries({ queryKey: ['activities'] }); const events = [SocketEvents.TRIP_UPDATED, SocketEvents.BOOKING_NEW_REQUEST, SocketEvents.BOOKING_CONFIRMED, SocketEvents.BOOKING_REJECTED, SocketEvents.BOOKING_CANCELLED, SocketEvents.BOOKING_COMPLETED, SocketEvents.RIDE_STATUS_UPDATED]; events.forEach((event) => socket.on(event, refresh)); return () => events.forEach((event) => socket.off(event, refresh)); }, [client, socket]);
  return <main className="min-h-[calc(100dvh-3rem)] bg-background"><div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12"><header><p className="text-sm font-medium text-primary">{role === 'DRIVER' ? 'Không gian tài xế' : 'Hành trình của bạn'}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Hoạt động</h1><p className="mt-2 text-sm text-muted-foreground">Theo dõi Carpooling và Ride-Hailing trong cùng một nơi.</p></header>
  <div role="tablist" aria-label="Trạng thái hoạt động" className="mt-8 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 sm:inline-grid sm:grid-cols-4">{segments.map((item) => <button key={item.value} role="tab" aria-selected={segment === item.value} onClick={() => setSegment(item.value)} className={cn('min-h-11 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', segment === item.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{item.label}{query.data ? ` (${query.data.counts[item.value]})` : ''}</button>)}</div>
  <section className="mt-6 grid gap-4 lg:grid-cols-2">{query.isLoading ? [0,1,2,3].map(i => <div key={i} className="h-72 animate-pulse rounded-xl border bg-muted/50" />) : query.isError ? <State title="Không thể tải hoạt động" action={<Button onClick={() => query.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Thử lại</Button>} /> : !query.data?.items.length ? <State title="Chưa có chuyến trong mục này" /> : query.data.items.map(item => <ActivityCard key={`${item.source}:${item.id}`} item={item} role={role} />)}</section></div></main>;
}
function State({ title, action }: { title: string; action?: React.ReactNode }) { return <div className="col-span-full flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-8 text-center"><CalendarX className="h-9 w-9 text-muted-foreground" /><h2 className="mt-4 font-semibold">{title}</h2><p className="mt-2 text-sm text-muted-foreground">Các chuyến phù hợp sẽ tự động xuất hiện tại đây.</p>{action && <div className="mt-5">{action}</div>}</div>; }
