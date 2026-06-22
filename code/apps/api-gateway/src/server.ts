import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5001;
const MONOLITH_URL = process.env.MONOLITH_URL || 'http://127.0.0.1:5002';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://127.0.0.1:5003';

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(morgan('dev'));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'API Gateway is running' });
});

// Proxy rules for Microservices
// 1. Notification Service
app.use(
  '/api/notifications',
  createProxyMiddleware({
    target: NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
  })
);


// 2. Fallback to Monolith
app.use(
  '/',
  createProxyMiddleware({
    target: MONOLITH_URL,
    changeOrigin: true,
    ws: true, // In case there are other WS connections to monolith
  })
);

app.listen(PORT, () => {
  console.log(`🚀 API Gateway is running on http://localhost:${PORT}`);
  console.log(`➡️  Routing /api/notifications to Notification Service at ${NOTIFICATION_SERVICE_URL}`);
  console.log(`➡️  Routing all other traffic to Monolith at ${MONOLITH_URL}`);
});
