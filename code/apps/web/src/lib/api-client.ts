import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Gửi cookie (refreshToken) kèm mỗi request
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor ───────────────────────────────────────────────────────
// Tự động gắn accessToken vào header Authorization trước mỗi request
apiClient.interceptors.request.use((config) => {
  // sessionStorage chỉ có ở client-side (Next.js SSR cần check typeof window)
  // sessionStorage cho phép mỗi tab có session riêng, không bị ảnh hưởng bởi tab khác
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Response Interceptor ──────────────────────────────────────────────────────
// Tự động làm mới accessToken khi nhận được 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Tránh vòng lặp vô tận: nếu chính endpoint /auth/refresh trả 401 → logout
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/logout')
    ) {
      originalRequest._retry = true;

      try {
        // refreshToken được gửi tự động qua cookie (withCredentials: true)
        const refreshRes = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = refreshRes.data.accessToken as string;
        sessionStorage.setItem('accessToken', newToken);

        // Retry request gốc với token mới
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        // Refresh thất bại → xóa token cũ, redirect về login
        sessionStorage.removeItem('accessToken');
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/register') {
            window.location.href = '/login';
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

