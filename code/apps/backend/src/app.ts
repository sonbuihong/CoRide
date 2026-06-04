import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec, swaggerUiOptions } from './config/swagger';
import path from 'path';
import fs from 'fs';

// Modules
import authRouter from './modules/auth/auth.router';
import usersRouter from './modules/users/users.router';
import ridesRouter from './modules/rides/rides.router';
import bookingsRouter from './modules/bookings/bookings.router';
import notificationsRouter from './modules/notifications/notifications.router';
import reviewsRouter from './modules/reviews/reviews.router';
import { chatRouter } from './modules/chat/chat.router';
import paymentsRouter from './modules/payments/payments.router';
import adminRouter from './modules/admin/admin.router';
import goongRouter from './modules/goong/goong.router';

// Global error handler — PHẢI import cuối cùng
import { errorHandler } from './shared/errors/errorHandler';

dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

const app = express();

// ─── Swagger UI — đặt TRƯỚC helmet() để tránh bị chặn bởi Content-Security-Policy
// Chỉ bật ở development — production không cần expose API docs
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  console.log('[docs]: Swagger UI → http://localhost:5001/api/docs');
}

// ─── CORS — PHẢI đặt TRƯỚC rate limiter ───────────────────────────────────────
// Lý do: khi rate limiter trả 429, response phải đã có CORS header
// nếu không browser sẽ báo CORS error thay vì 429, rất khó debug.
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true, // Cho phép cookie được gửi kèm request (cần cho refresh token)
  })
);

// ─── Security Middlewares ──────────────────────────────────────────────────────
app.use(helmet());

// Rate limiting — chống brute-force và DDoS cơ bản
// Development: 300 req/15 phút. Production nên giảm xuống 60-100.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút',
});
app.use('/api/', apiLimiter);

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Tự động tạo và phục vụ thư mục static uploads
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/rides', ridesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/goong', goongRouter);

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Phải đặt CUỐI CÙNG — Express nhận diện error middleware qua 4 tham số (err, req, res, next)
app.use(errorHandler);

export default app;

