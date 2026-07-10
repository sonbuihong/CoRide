import { create } from 'zustand';

export type AuthStatus = 'BOOTING' | 'AUTHENTICATED' | 'UNAUTHENTICATED';

interface AuthState {
  status: AuthStatus;
  setStatus: (status: AuthStatus) => void;
  isLoggingOut: boolean;
  setLoggingOut: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'BOOTING',
  setStatus: (status) => set({ status }),
  
  isLoggingOut: false,
  setLoggingOut: (val) => set({ isLoggingOut: val }),
}));
