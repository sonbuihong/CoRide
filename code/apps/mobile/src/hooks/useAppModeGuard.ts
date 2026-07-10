import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from './useAuth';
import { getDriverEligibility } from '../utils/mode-checker';
import { useAppStore } from '../stores/useAppStore';
import * as SecureStore from '../services/secure-store';

export function useAppModeGuard() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { appMode, resetAppMode } = useAppStore();
  const [isGuardLoading, setIsGuardLoading] = useState(true);

  useEffect(() => {
    // 1. Chờ auth hydrate & user query
    if (isAuthLoading) return;

    if (!isAuthenticated || !user) {
      router.replace('/(auth)/login');
      return;
    }

    // 2. Kiểm tra driver eligibility
    const { eligible } = getDriverEligibility(user);
    
    // Nếu không đủ điều kiện (chưa đăng ký, đang chờ, bị từ chối, mâu thuẫn)
    if (!eligible) {
      // 3. Reset state an toàn
      resetAppMode();
      SecureStore.removeAppMode(user.id).catch(console.error);
      
      // Chuyển hướng về tab hành khách (tránh back loop)
      router.replace('/(passenger-tabs)' as any);
    } else {
      // Cho phép render Driver UI
      setIsGuardLoading(false);
    }
  }, [user, isAuthenticated, isAuthLoading, appMode, router, resetAppMode]);

  return { isGuardLoading };
}
