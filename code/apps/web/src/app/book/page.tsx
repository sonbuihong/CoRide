import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import BookClient from './book-client';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Đặt chuyến đi | CoRide',
  description: 'Đặt chuyến đi nhanh chóng, an toàn và tiết kiệm cùng CoRide. Tìm chuyến phù hợp và đặt chỗ ngay hôm nay.',
};

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f5f7] dark:bg-black flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0071e3]" />
        </div>
      }
    >
      <BookClient />
    </Suspense>
  );
}
