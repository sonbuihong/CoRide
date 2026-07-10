import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'coride_auth_token';
const USER_KEY = 'coride_user_info';

export const authStorage = {
  async saveToken(token: string) {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async getToken() {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  async removeToken() {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  async saveUser(user: any) {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') localStorage.setItem(USER_KEY, JSON.stringify(user));
      return;
    }
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async getUser() {
    if (Platform.OS === 'web') {
      const webUser = typeof window !== 'undefined' ? localStorage.getItem(USER_KEY) : null;
      return webUser ? JSON.parse(webUser) : null;
    }
    const user = await SecureStore.getItemAsync(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  async clearAll() {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
