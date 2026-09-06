'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function NavigationIndicatorInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Khi pathname hoặc searchParams thay đổi -> hoàn tất chuyển trang
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Lắng nghe sự kiện click trên toàn bộ các link điều hướng nội bộ
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      // Bỏ qua các liên kết ngoài, hash, target blank, download, v.v.
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download')
      ) {
        return;
      }

      // Kiểm tra xem có phải cùng origin không
      try {
        const url = new URL(anchor.href, window.location.href);
        const currentUrl = new URL(window.location.href);

        if (url.origin === currentUrl.origin) {
          // Nếu bấm lại chính trang hiện tại thì không kích hoạt loading
          if (url.pathname === currentUrl.pathname && url.search === currentUrl.search) {
            return;
          }

          // Bắt đầu hiệu ứng loading
          setIsNavigating(true);
          setProgress(30);

          // Tăng dần progress tạo cảm giác mượt mà
          const interval = setInterval(() => {
            setProgress((prev) => {
              if (prev >= 85) {
                clearInterval(interval);
                return 85;
              }
              return prev + 15;
            });
          }, 250);

          // Timeout an toàn 10s tự tắt nếu quá trình tải bị hủy
          const safetyTimeout = setTimeout(() => {
            clearInterval(interval);
            setIsNavigating(false);
            setProgress(0);
          }, 10000);

          return () => {
            clearInterval(interval);
            clearTimeout(safetyTimeout);
          };
        }
      } catch {
        // Bỏ qua nếu url không hợp lệ
      }
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, []);

  if (!isNavigating) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Đang tải trang"
      className="pointer-events-none fixed inset-0 z-[9999] select-none"
    >
      {/* Thanh tiến trình siêu mỏng ở đỉnh màn hình */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-black/5 dark:bg-white/5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.7)] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Vòng xoay loading badge (Spinner ring) nổi ở góc dưới bên phải */}
      <div className="fixed bottom-24 md:bottom-6 right-6 flex items-center gap-2.5 rounded-full border border-emerald-500/20 bg-background/95 px-3.5 py-2 shadow-xl backdrop-blur-md transition-opacity duration-200">
        <div className="relative flex items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-600 dark:border-t-emerald-400" />
        </div>
        <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
          Đang tải trang...
        </span>
      </div>
    </div>
  );
}

export function PageLoadingIndicator() {
  return (
    <Suspense fallback={null}>
      <NavigationIndicatorInner />
    </Suspense>
  );
}

export default PageLoadingIndicator;
