'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { SearchForm } from '@/components/rides/search-form';
import { RideCard, Ride } from '@/components/rides/ride-card';
import { SearchRideInput } from '@repo/shared';
import { Loader2, Car, AlertCircle } from 'lucide-react';

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRides = async (filters: SearchRideInput) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/rides', { params: filters });
      setRides(response.data.rides ?? []);
    } catch (err: unknown) {
      console.error('Lỗi khi tìm kiếm chuyến đi:', err);
      setError('Đã xảy ra lỗi khi tải danh sách chuyến đi. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const origin = searchParams.get('origin') || '';
    const destination = searchParams.get('destination') || '';
    const date = searchParams.get('date') || '';
    
    fetchRides({ origin, destination, date });
  }, [searchParams]);

  const handleSearch = (filters: SearchRideInput) => {
    const params = new URLSearchParams();
    if (filters.origin) params.set('origin', filters.origin);
    if (filters.destination) params.set('destination', filters.destination);
    if (filters.date) params.set('date', filters.date);
    
    router.push(`/rides/search?${params.toString()}`);
  };

  const initialValues = {
    origin: searchParams.get('origin') || '',
    destination: searchParams.get('destination') || '',
    date: searchParams.get('date') || '',
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-black pt-12 pb-24">
      <div className="container px-4 md:px-6 mx-auto max-w-[980px] space-y-12">
        
        {/* Header Section */}
        <div className="text-center space-y-3">
          <h1 className="text-[40px] md:text-[56px] font-semibold tracking-[-0.28px] leading-[1.07] text-[#1d1d1f] dark:text-white">
            Tìm chuyến đi.
          </h1>
          <p className="text-[17px] md:text-[21px] tracking-[-0.37px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] max-w-[600px] mx-auto">
            Hàng ngàn chuyến đi thân thiện đang chờ bạn.
          </p>
        </div>

        {/* Search Block */}
        <div className="relative z-20">
          <SearchForm onSearch={handleSearch} initialValues={initialValues} />
        </div>

        {/* Results Section */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[21px] font-semibold tracking-[-0.23px] text-[#1d1d1f] dark:text-white">
              {loading ? 'Đang tải dữ liệu...' : `Kết quả: ${rides.length} chuyến`}
            </h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
              <p className="text-[14px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] tracking-[-0.12px]">Đang quét hệ thống...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-[#1d1d1f]/50 backdrop-blur rounded-[24px] text-[#d93025] space-y-4 border border-[#d93025]/10">
              <AlertCircle className="h-10 w-10 opacity-80" />
              <p className="text-[17px] font-medium tracking-tight text-center max-w-[400px]">{error}</p>
              <button 
                onClick={() => fetchRides(initialValues)}
                className="mt-2 text-[#0066cc] dark:text-[#2997ff] text-[14px] hover:underline"
              >
                Thử lại
              </button>
            </div>
          ) : rides.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {rides.map((ride) => (
                <RideCard key={ride.id} ride={ride} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-white/50 dark:bg-[#1d1d1f]/50 backdrop-blur rounded-[24px] space-y-5 border border-transparent">
              <div className="h-16 w-16 bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.08)] rounded-full flex items-center justify-center">
                <Car className="h-8 w-8 text-[rgba(0,0,0,0.32)] dark:text-[rgba(255,255,255,0.32)]" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-[21px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight">Không tìm thấy chuyến đi</p>
                <p className="text-[14px] text-[rgba(0,0,0,0.56)] dark:text-[rgba(255,255,255,0.56)] max-w-xs mx-auto tracking-[-0.12px] leading-relaxed">
                  Hãy thử thay đổi điểm đến hoặc ngày đi để có nhiều sự lựa chọn hơn.
                </p>
              </div>
              <button 
                onClick={() => handleSearch({ origin: '', destination: '', date: '' })}
                className="bg-[#1d1d1f] dark:bg-white text-white dark:text-black hover:bg-black dark:hover:bg-[#f5f5f7] px-6 py-2.5 rounded-[980px] text-[14px] font-medium tracking-[-0.12px] transition-colors mt-2"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f5f7] flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
