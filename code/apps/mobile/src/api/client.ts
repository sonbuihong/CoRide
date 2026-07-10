import axios from 'axios';
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from '../services/secure-store';

import { Platform } from 'react-native';

let API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5001/api';

if (Platform.OS !== 'android') {
  API_URL = API_URL.replace('10.0.2.2', 'localhost');
}

if (!API_URL) {
  console.warn('Cảnh báo: EXPO_PUBLIC_API_URL chưa được định nghĩa trong file .env');
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Danh sách các URL không cần đính kèm token hoặc không nên thử refresh
const NO_AUTH_URLS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password'];

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Không đính kèm token cho các route auth public
    if (config.url && NO_AUTH_URLS.some(url => config.url?.includes(url))) {
      return config;
    }

    const token = await SecureStore.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Trạng thái cho luồng refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Kiểu dữ liệu mở rộng cho request để theo dõi việc retry
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    
    // Nếu request bị hủy hoặc không có response
    if (!originalRequest || !error.response) {
      return Promise.reject(error);
    }

    // Nếu lỗi là 401 Unauthorized và chưa từng retry
    if (error.response.status === 401 && !originalRequest._retry) {
      
      // Bỏ qua refresh đối với các URL auth để tránh vòng lặp
      if (originalRequest.url && NO_AUTH_URLS.some(url => originalRequest.url?.includes(url))) {
        return Promise.reject(error);
      }

      // Xử lý chống trùng lặp request refresh
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Backend yêu cầu refresh token được gửi qua HTTP-only cookie.
        // Trên Mobile, Axios sẽ tự động gửi cookie nếu nó cùng domain và OS hỗ trợ.
        // Hoặc chúng ta gửi kèm thông qua Header nếu backend hỗ trợ custom extraction.
        // Ở đây chúng ta chỉ gọi API refresh. Cookie xử lý bởi OS native network layer.
        const response = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {}, {
          // withCredentials: true, // Chỉ ý nghĩa với browser, nhưng giữ để tương thích nếu cần
        });

        const newAccessToken = response.data.accessToken;
        
        // Lưu lại token mới
        if (newAccessToken) {
          await SecureStore.setAccessToken(newAccessToken);
          
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          
          processQueue(null, newAccessToken);
          
          // Gửi lại request ban đầu với token mới
          return apiClient(originalRequest);
        } else {
          throw new Error('Không nhận được accessToken mới');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Nếu refresh thất bại, xóa toàn bộ token và đẩy user ra màn hình login
        await SecureStore.clearAuthTokens();
        
        // Disconnect socket nếu đang kết nối
        import('../services/socket.service').then(m => m.socketService.disconnect());

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Chuẩn hóa lỗi cho UI dễ parse nếu không phải 401 hoặc đã retry
    const customError = {
      message: 'Đã xảy ra lỗi không xác định',
      status: error.response?.status || 500,
      data: error.response?.data || null,
    };

    if (error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
      customError.message = (error.response.data as any).message;
    } else if (error.message) {
      customError.message = error.message;
    }

    return Promise.reject(customError);
  }
);
