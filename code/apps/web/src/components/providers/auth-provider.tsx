'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import apiClient from '@/lib/api-client';

// Kiểu dữ liệu user trả về từ API (không có password)
interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  bio: string | null;
  // Rating tách biệt theo vai trò
  driverRating: number;
  driverRatingCount: number;
  passengerRating: number;
  passengerRatingCount: number;
  // KYC tài xế
  isDriverVerified: boolean;
  role: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * AuthProvider — bọc toàn bộ app.
 * Quản lý accessToken trong localStorage và user state tập trung.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      let token = sessionStorage.getItem('accessToken');
      
      // Nếu không có accessToken trong tab này, thử dùng refreshToken từ cookie để lấy mới
      if (!token) {
        try {
          const refreshRes = await apiClient.post('/auth/refresh');
          token = refreshRes.data.accessToken;
          if (token) {
            sessionStorage.setItem('accessToken', token);
          }
        } catch (refreshErr) {
          // Không có refreshToken hợp lệ hoặc token đã hết hạn -> gọi logout để backend xoá cookie lỗi
          try {
            await apiClient.post('/auth/logout');
          } catch (e) {
            // Ignore logout error
          }
          setUser(null);
          setLoading(false);
          return;
        }
      }

      // Add timeout to prevent hanging if backend is not responding
      const res = await Promise.race([
        apiClient.get('/users/me'),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        )
      ]);
      setUser(res.data);
    } catch (error) {
      // Token hết hạn hoặc không hợp lệ — api-client interceptor đã tự refresh
      // Nếu vẫn fail → clear token và user
      console.error('Failed to refresh user:', error);
      sessionStorage.removeItem('accessToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Chạy một lần khi app khởi động để phục hồi session
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    // Lưu accessToken vào sessionStorage để api-client gắn vào header
    // sessionStorage cho phép mỗi tab có session riêng, không bị ảnh hưởng bởi tab khác
    sessionStorage.setItem('accessToken', res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      sessionStorage.removeItem('accessToken');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook để dùng auth context trong các component.
 * Throw error nếu dùng ngoài AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong AuthProvider');
  return ctx;
}
