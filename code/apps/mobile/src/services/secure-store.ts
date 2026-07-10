import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const SECURE_STORAGE_KEYS = {
  accessToken: 'coride.accessToken',
  refreshToken: 'coride.refreshToken',
} as const;

export const getAccessToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' ? localStorage.getItem(SECURE_STORAGE_KEYS.accessToken) : null;
    }
    return await SecureStore.getItemAsync(SECURE_STORAGE_KEYS.accessToken);
  } catch (error) {
    return null;
  }
};

export const setAccessToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') localStorage.setItem(SECURE_STORAGE_KEYS.accessToken, token);
    return;
  }
  await SecureStore.setItemAsync(SECURE_STORAGE_KEYS.accessToken, token);
};

export const removeAccessToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') localStorage.removeItem(SECURE_STORAGE_KEYS.accessToken);
    return;
  }
  await SecureStore.deleteItemAsync(SECURE_STORAGE_KEYS.accessToken);
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' ? localStorage.getItem(SECURE_STORAGE_KEYS.refreshToken) : null;
    }
    return await SecureStore.getItemAsync(SECURE_STORAGE_KEYS.refreshToken);
  } catch (error) {
    return null;
  }
};

export const setRefreshToken = async (token: string): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') localStorage.setItem(SECURE_STORAGE_KEYS.refreshToken, token);
    return;
  }
  await SecureStore.setItemAsync(SECURE_STORAGE_KEYS.refreshToken, token);
};

export const removeRefreshToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') localStorage.removeItem(SECURE_STORAGE_KEYS.refreshToken);
    return;
  }
  await SecureStore.deleteItemAsync(SECURE_STORAGE_KEYS.refreshToken);
};

export const clearAuthTokens = async (): Promise<void> => {
  await Promise.all([
    removeAccessToken(),
    removeRefreshToken(),
  ]);
};

// --- App Mode Persistence ---
export type AppMode = 'passenger' | 'driver';

const getAppModeKey = (userId: string) => `coride.appMode.${userId}`;

export const getAppMode = async (userId: string): Promise<AppMode> => {
  try {
    const key = getAppModeKey(userId);
    let value: string | null = null;
    
    if (Platform.OS === 'web') {
      value = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    } else {
      value = await SecureStore.getItemAsync(key);
    }
    
    if (value === 'driver') return 'driver';
    return 'passenger'; // passenger is always default
  } catch (error) {
    return 'passenger';
  }
};

export const setAppMode = async (userId: string, mode: AppMode): Promise<void> => {
  const key = getAppModeKey(userId);
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') localStorage.setItem(key, mode);
    return;
  }
  await SecureStore.setItemAsync(key, mode);
};

export const removeAppMode = async (userId: string): Promise<void> => {
  const key = getAppModeKey(userId);
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
};
