'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';

// Hai chế độ vai trò: hành khách hoặc tài xế
type RoleMode = 'passenger' | 'driver';

interface RoleModeContextValue {
  mode: RoleMode;
  setMode: (mode: RoleMode) => void;
} 

const RoleModeContext = createContext<RoleModeContextValue | null>(null);

const STORAGE_KEY = 'coride-role-mode';

/**
 * RoleModeProvider — quản lý chế độ vai trò hiện tại (Passenger/Driver).
 * Lưu trạng thái vào localStorage để giữ giữa các lần reload.
 * Tự động đồng bộ chế độ theo URL nếu chuyển bằng back/forward hoặc nhập link.
 */
export function RoleModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<RoleMode>('passenger');
  const pathname = usePathname();

  // Khôi phục mode từ localStorage khi mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'driver' || saved === 'passenger') {
      setModeState(saved);
    }
  }, []);

  // Đồng bộ mode với đường dẫn hiện tại (nếu user gõ URL hoặc back/forward)
  useEffect(() => {
    if (!pathname) return;

    const driverRoutes = ['/driver', '/rides/post', '/my-rides', '/booking-requests'];
    const passengerRoutes = ['/rides', '/my-bookings', '/ride-hailing'];

    if (driverRoutes.some((route) => pathname.startsWith(route))) {
      setModeState((prev) => {
        if (prev !== 'driver') {
          localStorage.setItem(STORAGE_KEY, 'driver');
          return 'driver';
        }
        return prev;
      });
    } else if (passengerRoutes.some((route) => pathname.startsWith(route))) {
      setModeState((prev) => {
        if (prev !== 'passenger') {
          localStorage.setItem(STORAGE_KEY, 'passenger');
          return 'passenger';
        }
        return prev;
      });
    }
  }, [pathname]);

  const setMode = useCallback((newMode: RoleMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  return (
    <RoleModeContext.Provider value={{ mode, setMode }}>
      {children}
    </RoleModeContext.Provider>
  );
}

/**
 * Hook để dùng role mode context.
 * Throw error nếu dùng ngoài RoleModeProvider.
 */
export function useRoleMode(): RoleModeContextValue {
  const ctx = useContext(RoleModeContext);
  if (!ctx) throw new Error('useRoleMode phải được dùng bên trong RoleModeProvider');
  return ctx;
}
