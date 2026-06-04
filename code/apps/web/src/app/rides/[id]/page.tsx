import type { Metadata } from 'next';
import RideDetailClient from '@/components/rides/ride-detail-client';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface PageProps {
  params: {
    id: string;
  };
}

// Hàm generateMetadata chạy ở Server (SSR/SSG) để tự động tạo title/description cho SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001/api';
    // Fetch thông tin chuyến đi trực tiếp từ backend
    const res = await fetch(`${baseUrl}/rides/${params.id}`, { cache: 'no-store' });
    
    if (!res.ok) {
      return {
        title: 'Không tìm thấy chuyến đi | CoRide',
      };
    }

    const ride = await res.json();
    
    return {
      title: `Chuyến đi từ ${ride.origin} đến ${ride.destination} | CoRide`,
      description: `Cùng đi chung xe từ ${ride.origin} đến ${ride.destination} vào ngày ${new Date(ride.departureTime).toLocaleDateString('vi-VN')}. Giá chỉ ${ride.pricePerSeat.toLocaleString('vi-VN')}đ. Đặt chỗ ngay trên CoRide!`,
    };
  } catch (error) {
    return {
      title: 'Chi tiết chuyến đi | CoRide',
    };
  }
}

// Server Component (không có "use client")
export default function RideDetailPage({ params }: PageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
      </div>
    }>
      {/* Component Client xử lý toàn bộ logic giao diện, map, realtime chat */}
      <RideDetailClient rideId={params.id} />
    </Suspense>
  );
}
