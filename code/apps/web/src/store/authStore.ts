import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  isDriverVerified: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null,
  
  setAuth: (user, accessToken, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
    set({ user, accessToken });
  },
  
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    set({ user: null, accessToken: null });
    
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
}));
