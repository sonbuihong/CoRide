'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { BookForm } from './book-form';
import { RideCard, Ride } from '@/components/rides/ride-card';
import { SearchRideInput } from '@repo/shared';
import { Loader2, Car, AlertCircle, CalendarCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// THIẾT KẾ: Trang đặt chuyến riêng biệt
// Phân biệt với trang "Tìm chuyến" bằng:
// - Hero gradient màu tím/indigo (đặc trưng booking)
// - CTA nhấn mạnh hành động "Đặt chỗ ngay"
// - Hiển thị badge số chỗ trống trực quan hơn
// ==========================================

function BookContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialValues: SearchRideInput = {
    origin: searchParams.get('origin') || '',
    destination: searchParams.get('destination') || '',
    date: searchParams.get('date') || '',
  };

  const fetchRides = async (filters: SearchRideInput) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const response = await apiClient.get('/rides', { params: filters });
      setRides(response.data.rides ?? []);
    } catch (err: unknown) {
      console.error('Lỗi khi tìm kiếm chuyến để đặt:', err);
      setError('Đã xảy ra lỗi khi tải danh sách chuyến đi. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Tự động tìm nếu URL có query params (ví dụ người dùng quay lại trang)
  useEffect(() => {
    const hasParams = initialValues.origin || initialValues.destination || initialValues.date;
    if (hasParams) {
      fetchRides(initialValues);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (filters: SearchRideInput) => {
    // Cập nhật URL để URL có thể share/bookmark được
    const params = new URLSearchParams();
    if (filters.origin) params.set('origin', filters.origin);
    if (filters.destination) params.set('destination', filters.destination);
    if (filters.date) params.set('date', filters.date);
    router.replace(`/book?${params.toString()}`, { scroll: false });

    fetchRides(filters);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black">

      {/* Hero Section — gradient riêng để phân biệt với trang Tìm chuyến */}
      <div className="bg-gradient-to-br from-[#4f46e5] via-[#7c3aed] to-[#6d28d9] pt-16 pb-20 px-4">
        <div className="container max-w-[980px] mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-[980px] mb-2">
            <CalendarCheck className="h-3.5 w-3.5 text-white/80" />
            <span className="text-white/80 text-[12px] font-medium tracking-wide uppercase">
              Đặt chuyến đi
            </span>
          </div>
          <h1 className="text-[40px] md:text-[56px] font-semibold tracking-[-0.28px] leading-[1.07] text-white">
            Đặt chuyến đi.
          </h1>
          <p className="text-[17px] md:text-[21px] tracking-[-0.37px] text-white/70 max-w-[500px] mx-auto">
            Chọn chuyến phù hợp và đặt chỗ ngay — nhanh, an toàn, tiết kiệm.
          </p>

          {/* Search Form — nổi lên trên hero */}
          <div className="mt-8 relative z-10 text-left">
            <BookForm onSearch={handleSearch} initialValues={initialValues} />
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="container max-w-[980px] mx-auto px-4 pb-24 -mt-6">

        {/* Trạng thái ban đầu — chưa tìm kiếm */}
        {!hasSearched && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Chọn điểm đi & đến',
                description: 'Nhập địa chỉ xuất phát và điểm đến, hoặc dùng GPS tự động.',
                step: '1',
              },
              {
                title: 'Chọn chuyến phù hợp',
                description: 'Xem danh sách chuyến với tài xế đã xác minh, giá cả rõ ràng.',
                step: '2',
              },
              {
                title: 'Đặt chỗ & lên đường',
                description: 'Xác nhận đặt chỗ, chờ tài xế duyệt và theo dõi chuyến đi.',
                step: '3',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white dark:bg-[#1d1d1f] rounded-[20px] p-6 border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)] shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
              >
                <div className="h-9 w-9 rounded-full bg-[#7c3aed]/10 flex items-center justify-center mb-4">
                  <span className="text-[14px] font-bold text-[#7c3aed]">{item.step}</span>
                </div>
                <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight mb-1.5">
                  {item.title}
                </h3>
                <p className="text-[14px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] leading-relaxed tracking-[-0.12px]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 mt-6">
            <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
            <p className="text-[14px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] tracking-[-0.12px]">
              Đang tìm chuyến phù hợp...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 bg-white/60 dark:bg-[#1d1d1f]/60 backdrop-blur rounded-[24px] text-[#d93025] space-y-4 border border-[#d93025]/10 mt-6">
            <AlertCircle className="h-10 w-10 opacity-80" />
            <p className="text-[17px] font-medium tracking-tight text-center max-w-[400px]">{error}</p>
            <button
              onClick={() => fetchRides(initialValues)}
              className="mt-2 text-[#7c3aed] text-[14px] hover:underline font-medium"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Kết quả có chuyến */}
        {!loading && !error && hasSearched && rides.length > 0 && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[21px] font-semibold tracking-[-0.23px] text-[#1d1d1f] dark:text-white">
                {rides.length} chuyến phù hợp
              </h2>
              <span className="text-[13px] text-[rgba(0,0,0,0.48)] dark:text-[rgba(255,255,255,0.48)]">
                Nhấp vào chuyến để xem chi tiết và đặt chỗ
              </span>
            </div>
            <div className="grid grid-cols-1 gap-5">
              {rides.map((ride) => (
                <RideCard key={ride.id} ride={ride} />
              ))}
            </div>
          </div>
        )}

        {/* Không tìm thấy chuyến */}
        {!loading && !error && hasSearched && rides.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-[#1d1d1f] rounded-[24px] space-y-5 mt-6 border border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.05)]">
            <div className="h-16 w-16 bg-[#7c3aed]/08 rounded-full flex items-center justify-center">
              <Car className="h-8 w-8 text-[#7c3aed]/50" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-[21px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight">
                Không tìm thấy chuyến đi
              </p>
              <p className="text-[14px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] max-w-xs mx-auto tracking-[-0.12px] leading-relaxed">
                Hãy thử thay đổi điểm đến hoặc ngày đi. Hoặc xem tất cả chuyến hiện có.
              </p>
            </div>
            <Link href="/rides/search">
              <button className="flex items-center gap-2 bg-[#7c3aed] text-white hover:bg-[#6d28d9] px-6 py-2.5 rounded-[980px] text-[14px] font-medium tracking-[-0.12px] transition-colors mt-2">
                Xem tất cả chuyến đi
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f5f7] dark:bg-black flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#7c3aed]" />
        </div>
      }
    >
      <BookContent />
    </Suspense>
  );
}
