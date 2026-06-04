import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'coride_auth_token';
const USER_KEY = 'coride_user_info';

export const authStorage = {
  async saveToken(token: string) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async getToken() {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  async removeToken() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  async saveUser(user: any) {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async getUser() {
    const user = await SecureStore.getItemAsync(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  async clearAll() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
