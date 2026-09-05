'use client';

import { Suspense, useCallback, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CarFront, ListChecks, Plus } from 'lucide-react';
import OngoingExperience from '@/features/passenger-trip/ongoing-experience';
import { useAuth } from '@/components/providers/auth-provider';
import { useRoleMode } from '@/components/providers/role-mode-provider';
import apiClient from '@/lib/api-client';
import CarpoolOngoingExperience, { type ActiveCarpoolData } from './carpool-ongoing-experience';

function OngoingContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const tripId = searchParams.get('tripId');
  const { user, loading: authLoading } = useAuth();
  const { mode } = useRoleMode();
  const [leavingOngoing, setLeavingOngoing] = useState(false);
  const activeCarpool = useQuery({
    queryKey: ['active-carpool', user?.id],
    queryFn: async () => {
      const response = await apiClient.get('/bookings/active', { params: { role: 'driver' } });
      return (response.data.activeBooking ?? null) as ActiveCarpoolData | null;
    },
    enabled: !tripId && !authLoading && Boolean(user),
    refetchInterval: leavingOngoing ? false : 15_000,
    retry: 1,
  });

  const handleCompleted = useCallback(() => {
    setLeavingOngoing(true);
    void queryClient.cancelQueries({ queryKey: ['active-carpool', user?.id] });
  }, [queryClient, user?.id]);

  if (!tripId && (authLoading || activeCarpool.isLoading)) {
    return (
      <main aria-label="Đang tải chuyến đang hoạt động" aria-busy="true" className="grid h-[calc(100dvh-48px)] min-h-[560px] overflow-hidden bg-[#eef4f2] lg:grid-cols-[minmax(0,1fr)_460px] dark:bg-[#07110f]">
        <div className="hidden animate-pulse bg-[linear-gradient(135deg,#d9e7e3_0%,#edf5f2_50%,#dcebe7_100%)] motion-reduce:animate-none lg:block dark:bg-[linear-gradient(135deg,#10211e_0%,#18312c_50%,#10211e_100%)]" />
        <section className="h-full animate-pulse space-y-5 bg-white p-6 motion-reduce:animate-none dark:bg-[#10211e]">
          <div className="h-8 w-32 rounded-full bg-[#dfebe7] dark:bg-[#29443e]" />
          <div className="h-7 w-56 rounded-lg bg-[#d4e4df] dark:bg-[#29443e]" />
          <div className="space-y-3"><div className="h-4 w-5/6 rounded bg-[#e5efec] dark:bg-[#213a35]" /><div className="h-4 w-4/6 rounded bg-[#e5efec] dark:bg-[#213a35]" /></div>
          <div className="h-24 rounded-2xl bg-[#edf5f2] dark:bg-[#172e29]" />
          <div className="h-20 rounded-2xl bg-[#edf5f2] dark:bg-[#172e29]" />
          <span className="sr-only">Đang tìm chuyến đang hoạt động…</span>
        </section>
      </main>
    );
  }

  if (!tripId && activeCarpool.isError) {
    return (
      <main className="flex h-[calc(100dvh-48px)] min-h-[560px] items-center justify-center bg-[#eef4f2] px-5 dark:bg-[#07110f]">
        <section role="alert" className="w-full max-w-md rounded-3xl border border-[#cde3dd] bg-white p-7 text-center shadow-[0_16px_50px_rgba(14,54,47,0.12)] dark:border-[#29443e] dark:bg-[#10211e]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-400/10 dark:text-red-300"><AlertCircle className="h-6 w-6" /></div>
          <h1 className="mt-4 text-xl font-bold text-[#123c35] dark:text-white">Không thể tải chuyến đang chạy</h1>
          <p className="mt-2 text-sm leading-6 text-[#5c7771] dark:text-[#9bbab3]">Kết nối có thể đang gián đoạn. Dữ liệu chuyến của bạn vẫn được giữ nguyên.</p>
          <button type="button" onClick={() => void activeCarpool.refetch()} className="mt-5 min-h-11 w-full cursor-pointer rounded-xl bg-[#0f766e] px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#0b5f59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2">Thử lại</button>
        </section>
      </main>
    );
  }

  const carpool = activeCarpool.data;
  if (carpool?.ride?.status === 'ONGOING') {
    return <CarpoolOngoingExperience data={carpool} onRefresh={() => { void activeCarpool.refetch(); }} onCompleted={handleCompleted} />;
  }

  if (!tripId && user && mode === 'driver') {
    return (
      <main className="flex min-h-[calc(100dvh-48px)] items-center justify-center bg-[#eef4f2] px-5 py-12 dark:bg-[#07110f]">
        <section className="w-full max-w-lg rounded-2xl bg-white p-7 text-center shadow-[0_16px_50px_rgba(14,54,47,0.12)] dark:bg-[#10211e] sm:p-9">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dff3ed] text-[#0f766e] dark:bg-emerald-400/10 dark:text-emerald-300">
            <CarFront className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-[-0.02em] text-[#123c35] dark:text-white">Không có chuyến đang chạy</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#5c7771] dark:text-[#9bbab3]">Các chuyến đã đăng và lịch sử hoàn thành vẫn có trong Chuyến của tôi. Bạn cũng có thể đăng một hành trình mới.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/my-rides" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#bcd8d1] px-4 text-sm font-semibold text-[#315b53] transition-colors hover:bg-[#eaf5f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2 dark:border-[#36534c] dark:text-[#b6d8d0] dark:hover:bg-white/5">
              <ListChecks className="h-4 w-4" /> Chuyến của tôi
            </Link>
            <Link href="/rides/post" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0f766e] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0b5f59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] focus-visible:ring-offset-2">
              <Plus className="h-4 w-4" /> Đăng chuyến mới
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return <OngoingExperience tripId={tripId} />;
}

export default function OngoingPage() {
  return <Suspense fallback={<div className="h-[calc(100dvh-48px)] bg-[#edf1eb]" />}><OngoingContent /></Suspense>;
}
