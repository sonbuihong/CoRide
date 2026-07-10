import { create } from 'zustand';
import { AppMode } from '../services/secure-store';

interface AppState {
  isInitialized: boolean;
  setInitialized: (val: boolean) => void;
  // UI States
  isOffline: boolean;
  setOffline: (val: boolean) => void;
  
  // Dual-Mode UI State
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  resetAppMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isInitialized: false,
  setInitialized: (val) => set({ isInitialized: val }),
  
  isOffline: false,
  setOffline: (val) => set({ isOffline: val }),
  
  appMode: 'passenger', // Mặc định luôn là passenger
  setAppMode: (mode) => set({ appMode: mode }),
  resetAppMode: () => set({ appMode: 'passenger' }),
}));
