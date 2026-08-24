import { useCallback } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import * as SecureStore from '../services/secure-store';
import { authService } from '../services/auth.service';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { socketService } from '../services/socket.service';
import { useAppStore } from '../stores/useAppStore';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

export const useAuth = () => {
  const { status, setStatus, isLoggingOut, setLoggingOut } = useAuthStore();
  const { setAppMode, resetAppMode } = useAppStore();
  const queryClient = useQueryClient();

  // Load user data từ React Query (Dữ liệu Profile nằm ở Query Cache, không nằm ở Zustand)
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: authKeys.me(),
    queryFn: () => authService.getCurrentUser(),
    enabled: status === 'AUTHENTICATED',
    staleTime: 1000 * 60 * 5, // 5 phút
  });

  const checkAuth = useCallback(async () => {
    try {
      setStatus('BOOTING');
      const token = await SecureStore.getAccessToken();
      
      if (!token) {
        setStatus('UNAUTHENTICATED');
        return;
      }

      // Interceptor sẽ tự động xử lý refresh token nếu 401
      const currentUser = await authService.getCurrentUser();
      
      // Update query cache với dữ liệu user mới nhất
      queryClient.setQueryData(authKeys.me(), currentUser);
      
      // Khôi phục App Mode
      const savedMode = await SecureStore.getAppMode(currentUser.id);
      setAppMode(savedMode);
      
      setStatus('AUTHENTICATED');
      
      // Connect socket sau khi đã xác thực xong
      socketService.connect();
    } catch (error) {
      console.log('[Auth] Check auth failed:', error);
      // Nếu lỗi 401 và interceptor không refresh được, nó đã tự gọi SecureStore.clearAuthTokens()
      setStatus('UNAUTHENTICATED');
      socketService.disconnect();
    }
  }, [setStatus, queryClient, setAppMode]);

  const login = async (data: Parameters<typeof authService.login>[0]) => {
    try {
      const response = await authService.login(data);
      
      await SecureStore.setAccessToken(response.accessToken);
      await SecureStore.setRefreshToken(response.refreshToken);
      // Refresh token được xử lý qua Cookie (hoặc set tay nếu backend trả qua body, 
      // nhưng backend hiện tại set Cookie nên SecureStore có thể bỏ qua việc setRefreshToken)
      
      queryClient.setQueryData(authKeys.me(), response.user);
      
      // Khôi phục hoặc gán App Mode
      const savedMode = await SecureStore.getAppMode(response.user.id);
      setAppMode(savedMode);
      
      setStatus('AUTHENTICATED');
      
      socketService.connect();
      return response.user;
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: Parameters<typeof authService.register>[0]) => {
    try {
      const response = await authService.register(data);
      // Register backend CoRide KHÔNG tự động đăng nhập (không trả về token)
      // Do đó, ta chỉ return response và để UI chuyển sang trang đăng nhập
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = useCallback(async () => {
    try {
      setLoggingOut(true);
      
      try {
        await authService.logout(await SecureStore.getRefreshToken());
      } catch (e) {
        console.warn('[Auth] Logout API failed, continuing local logout...', e);
      }
      
      // 3. Disconnect socket và remove listeners
      socketService.disconnect();
      
      // 4. Cập nhật state NGAY LẬP TỨC để chặn useQuery re-fetch khi xóa cache
      setStatus('UNAUTHENTICATED');
      
      // 5. Xóa tokens và reset app mode
      await SecureStore.clearAuthTokens();
      if (user?.id) {
        await SecureStore.removeAppMode(user.id);
      }
      resetAppMode();
      
      // 6. Cancel queries và xóa private query cache
      queryClient.cancelQueries();
      queryClient.removeQueries({ queryKey: authKeys.all });
      queryClient.removeQueries({ queryKey: ['bookings'] });
      queryClient.removeQueries({ queryKey: ['active-booking'] });
      
    } finally {
      setLoggingOut(false);
    }
  }, [setLoggingOut, setStatus, queryClient, resetAppMode, user?.id]);

  return {
    user,
    status,
    isAuthenticated: status === 'AUTHENTICATED',
    isLoading: status === 'BOOTING' || isUserLoading,
    isLoggingOut,
    checkAuth,
    login,
    register,
    logout,
  };
};
