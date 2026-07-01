'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Nếu chưa đăng nhập và không ở trang login/register thì redirect
    if (!accessToken && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
      router.push('/login');
    } else {
      setIsChecking(false);
    }
  }, [accessToken, pathname, router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
