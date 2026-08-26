import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const SECURE_STORAGE_KEYS = {
  accessToken: 'coride.accessToken',
  refreshToken: 'coride.refreshToken',
  rememberAccount: 'coride.rememberAccount',
  rememberedEmail: 'coride.rememberedEmail',
} as const;

export const getAccessToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' ? localStorage.getItem(SECURE_STORAGE_KEYS.accessToken) : null;
    }
    return await SecureStore.getItemAsync(SECURE_STORAGE_KEYS.accessToken);
  } catch {
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
  } catch {
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
  } catch {
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

// --- Remember Account Persistence ---
export const getRememberedAccount = async (): Promise<{ remember: boolean; email: string }> => {
  try {
    let rememberStr: string | null = null;
    let email: string | null = null;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        rememberStr = localStorage.getItem(SECURE_STORAGE_KEYS.rememberAccount);
        email = localStorage.getItem(SECURE_STORAGE_KEYS.rememberedEmail);
      }
    } else {
      rememberStr = await SecureStore.getItemAsync(SECURE_STORAGE_KEYS.rememberAccount);
      email = await SecureStore.getItemAsync(SECURE_STORAGE_KEYS.rememberedEmail);
    }

    const remember = rememberStr === 'true';
    return {
      remember,
      email: remember && email ? email : '',
    };
  } catch {
    return { remember: false, email: '' };
  }
};

export const setRememberedAccount = async (remember: boolean, email: string): Promise<void> => {
  try {
    if (remember) {
      const trimmedEmail = email.trim();
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          localStorage.setItem(SECURE_STORAGE_KEYS.rememberAccount, 'true');
          localStorage.setItem(SECURE_STORAGE_KEYS.rememberedEmail, trimmedEmail);
        }
      } else {
        await SecureStore.setItemAsync(SECURE_STORAGE_KEYS.rememberAccount, 'true');
        await SecureStore.setItemAsync(SECURE_STORAGE_KEYS.rememberedEmail, trimmedEmail);
      }
    } else {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(SECURE_STORAGE_KEYS.rememberAccount);
          localStorage.removeItem(SECURE_STORAGE_KEYS.rememberedEmail);
        }
      } else {
        await SecureStore.deleteItemAsync(SECURE_STORAGE_KEYS.rememberAccount);
        await SecureStore.deleteItemAsync(SECURE_STORAGE_KEYS.rememberedEmail);
      }
    }
  } catch {
    // Ignore storage write error
  }
};
