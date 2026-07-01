import rateLimit from 'express-rate-limit';

// Giới hạn số lần request login (5 lần / 1 phút) để chống brute-force
export const loginRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 5, // Giới hạn 5 requests trong 1 windowMs cho mỗi IP
  message: {
    success: false,
    error: 'Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 1 phút.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
