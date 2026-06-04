import { create } from 'zustand';
import { authService } from '../services/auth.service';

interface AuthState {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: any) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  checkAuth: async () => {
    try {
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: !!user, isLoading: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthenticated: false });
  },
}));
