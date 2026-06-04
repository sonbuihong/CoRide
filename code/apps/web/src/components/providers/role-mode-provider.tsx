'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

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
 */
export function RoleModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<RoleMode>('passenger');

  // Khôi phục mode từ localStorage khi mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'driver' || saved === 'passenger') {
      setModeState(saved);
    }
  }, []);

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
