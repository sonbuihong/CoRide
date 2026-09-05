'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Bell, CalendarDays, CheckCircle2, ChevronRight, Info, RefreshCw, Star, XCircle } from 'lucide-react';
import { SocketEvents } from '@repo/shared';
import { Button } from '@/components/ui/button';
import { useSocket } from '@/components/providers/socket-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { cn } from '@/lib/utils';
import { getNotificationHref } from '@/lib/notification-target';
import { AppNotification, notificationService } from '@/services/notification-service';

const QUERY_KEY = ['notifications'] as const;

function NotificationIcon({ type }: { type: string }) {
  if (type === 'BOOKING_REQUEST') return <CalendarDays className="h-5 w-5" />;
  if (type.includes('ACCEPTED') || type.includes('CONFIRMED') || type.includes('COMPLETED')) return <CheckCircle2 className="h-5 w-5" />;
  if (type.includes('REJECTED') || type.includes('CANCELLED')) return <XCircle className="h-5 w-5" />;
  if (type.includes('REVIEW')) return <Star className="h-5 w-5" />;
  return <Info className="h-5 w-5" />;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const query = useQuery({ queryKey: QUERY_KEY, queryFn: notificationService.list, enabled: !!user });
  const notifications = query.data ?? [];
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const visible = useMemo(() => filter === 'unread' ? notifications.filter((item) => !item.isRead) : notifications, [filter, notifications]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login?callbackUrl=/notifications');
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!socket) return;
    const receive = (item: AppNotification & { content?: string }) => {
      const normalized = { ...item, message: item.message ?? item.content ?? '' };
      queryClient.setQueryData<AppNotification[]>(QUERY_KEY, (current = []) =>
        current.some((entry) => entry.id === normalized.id) ? current : [normalized, ...current]);
    };
    socket.on(SocketEvents.NOTIFICATION_NEW, receive);
    return () => { socket.off(SocketEvents.NOTIFICATION_NEW, receive); };
  }, [queryClient, socket]);

  const markRead = useMutation({
    mutationFn: notificationService.markRead,
    onMutate: (id) => queryClient.setQueryData<AppNotification[]>(QUERY_KEY, (current = []) =>
      current.map((item) => item.id === id ? { ...item, isRead: true } : item)),
    onError: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
  const markAll = useMutation({
    mutationFn: notificationService.markAllRead,
    onMutate: () => queryClient.setQueryData<AppNotification[]>(QUERY_KEY, (current = []) =>
      current.map((item) => ({ ...item, isRead: true }))),
    onError: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const open = (item: AppNotification) => {
    if (!item.isRead) markRead.mutate(item.id);
    const href = getNotificationHref(item);
    if (href) router.push(href);
  };

  if (authLoading || (!user && !authLoading)) return <NotificationsSkeleton />;

  return (
    <div className="min-h-[calc(100dvh-3rem)] bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Trung tâm cập nhật</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Thông báo</h1>
            <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
              {unreadCount ? `${unreadCount} thông báo chưa đọc` : 'Bạn đã cập nhật tất cả thông báo'}
            </p>
          </div>
          <Button variant="outline" className="min-h-11 gap-2 self-start" disabled={!unreadCount || markAll.isPending} onClick={() => markAll.mutate()}>
            <CheckCircle2 className="h-4 w-4" /> Đánh dấu tất cả đã đọc
          </Button>
        </header>

        <div role="tablist" aria-label="Lọc thông báo" className="mt-8 inline-flex rounded-lg bg-muted p-1">
          {(['all', 'unread'] as const).map((value) => (
            <button key={value} role="tab" aria-selected={filter === value} onClick={() => setFilter(value)}
              className={cn('min-h-10 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', filter === value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              {value === 'all' ? 'Tất cả' : `Chưa đọc${unreadCount ? ` (${unreadCount})` : ''}`}
            </button>
          ))}
        </div>

        <section className="mt-5" aria-label="Danh sách thông báo">
          {query.isLoading ? <NotificationsSkeleton compact /> : query.isError ? (
            <State icon={RefreshCw} title="Không thể tải thông báo" description="Kiểm tra kết nối rồi thử lại." action={<Button onClick={() => query.refetch()}>Thử lại</Button>} />
          ) : visible.length === 0 ? (
            <State icon={Bell} title={filter === 'unread' ? 'Bạn đã đọc hết thông báo' : 'Chưa có thông báo'} description="Các cập nhật về chuyến đi, thanh toán và tin nhắn sẽ xuất hiện tại đây." />
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card">
              {visible.map((item) => {
                const href = getNotificationHref(item);
                return <button key={item.id} onClick={() => open(item)} className={cn('flex min-h-[104px] w-full items-start gap-4 border-b p-4 text-left transition-colors last:border-b-0 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring', !item.isRead && 'bg-primary/[0.045]')}>
                  <span className={cn('mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full', item.isRead ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary')}><NotificationIcon type={item.type} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-2"><span className={cn('text-sm leading-5', !item.isRead && 'font-semibold')}>{item.title}</span>{!item.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Chưa đọc" />}</span>
                    <span className="mt-1 block text-sm leading-6 text-muted-foreground">{item.message}</span>
                    <time className="mt-2 block text-xs text-muted-foreground" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('vi-VN')}</time>
                  </span>
                  {href && <ChevronRight className="mt-3 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />}
                </button>;
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function NotificationsSkeleton({ compact = false }: { compact?: boolean }) {
  return <div className={cn('mx-auto w-full max-w-4xl px-4 sm:px-6', !compact && 'py-10')} aria-label="Đang tải thông báo" role="status">
    {!compact && <><div className="h-8 w-44 animate-pulse rounded bg-muted" /><div className="mt-3 h-4 w-56 animate-pulse rounded bg-muted" /></>}
    <div className="mt-6 space-y-2">{[0, 1, 2].map((i) => <div key={i} className="flex h-28 gap-4 rounded-xl border bg-card p-4"><div className="h-11 w-11 animate-pulse rounded-full bg-muted" /><div className="flex-1 space-y-3"><div className="h-4 w-1/3 animate-pulse rounded bg-muted" /><div className="h-4 w-4/5 animate-pulse rounded bg-muted" /><div className="h-3 w-1/4 animate-pulse rounded bg-muted" /></div></div>)}</div>
  </div>;
}

function State({ icon: Icon, title, description, action }: { icon: typeof Bell; title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted"><Icon className="h-7 w-7 text-muted-foreground" /></span><h2 className="mt-5 text-lg font-semibold">{title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}
