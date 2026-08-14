import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/components/providers/auth-provider';

export function useActiveRideLock() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Không check trên trang admin hoặc auth
    if (pathname.startsWith('/admin') || pathname.startsWith('/login') || pathname.startsWith('/register')) {
      return;
    }

    const checkActiveRide = async () => {
      try {
        const response = await apiClient.get('/bookings/active');
        const activeRide = response.data.activeBooking;

        if (activeRide) {
          // Nếu có chuyến đi, ép buộc chuyển sang trang /ongoing
          if (pathname !== '/ongoing') {
            router.replace('/ongoing');
          }
        } else {
          // Nếu không có chuyến đi mà đang ở trang /ongoing, đẩy ra trang chủ
          if (pathname === '/ongoing') {
            router.replace('/rides');
          }
        }
      } catch (error) {
        console.error('Error checking active ride:', error);
      }
    };

    checkActiveRide();
  }, [user, pathname, router]);
}
