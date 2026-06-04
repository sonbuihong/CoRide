import axios from 'axios';
import { authStorage } from './auth-storage';

// Lấy IP từ máy chủ Backend (localhost trên emulator thường là 10.0.2.2 cho Android)
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await authStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  async login(credentials: any) {
    const response = await api.post('/auth/login', credentials);
    const { token, user } = response.data;
    await authStorage.saveToken(token);
    await authStorage.saveUser(user);
    return response.data;
  },

  async register(data: any) {
    const response = await api.post('/auth/register', data);
    const { token, user } = response.data;
    await authStorage.saveToken(token);
    await authStorage.saveUser(user);
    return response.data;
  },

  async logout() {
    await authStorage.clearAll();
  },

  async getCurrentUser() {
    return await authStorage.getUser();
  },
};
