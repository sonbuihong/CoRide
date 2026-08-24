import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import http from 'http';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import morgan from 'morgan';

const app = express();

const PORT = process.env.PORT || 5001;
const MONOLITH_URL = process.env.MONOLITH_URL || 'http://127.0.0.1:5101';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://127.0.0.1:5201';

// Middleware
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:8082' // Đề phòng Expo mở port 8082
    ],
    credentials: true,
  })
);
app.use(morgan('dev'));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'API Gateway is running' });
});

// Xử lý Chrome DevTools probe request để tránh lỗi 404 & CSP trên Console
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(204).end();
});

// Proxy rules for Microservices
// 1. Notification Service
app.use(
  '/api/notifications',
  createProxyMiddleware({
    target: NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        console.error(`[API Gateway Error] Proxy to Notification Service failed (${req.method} ${req.url}):`, err.message);
        if (!res.headersSent) {
          (res as any).status(502).json({ message: 'Bad Gateway: Notification Service không phản hồi' });
        }
      },
    },
  })
);

// 2. Socket.IO path — cần proxy riêng với WS support đúng cách
const socketProxy = createProxyMiddleware({
  target: MONOLITH_URL,
  changeOrigin: true,
  ws: true,
  on: {
    error: (err) => {
      console.error('[API Gateway Error] Socket Proxy error:', err.message);
    },
  },
});
app.use('/socket.io', socketProxy);

// 3. Fallback to Monolith cho tất cả HTTP requests còn lại
app.use(
  '/',
  createProxyMiddleware({
    target: MONOLITH_URL,
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        console.error(`[API Gateway Error] Proxy to Monolith failed (${req.method} ${req.url}):`, err.message);
        if (!res.headersSent) {
          (res as any).status(502).json({ message: 'Bad Gateway: Backend Monolith không phản hồi', error: err.message });
        }
      },
    },
  })
);

// Dùng http.createServer thay vì app.listen để có thể attach WS upgrade listener
// app.listen() trả về http.Server nhưng không expose để socketProxy.upgrade có thể dùng
const server = http.createServer(app);

// Attach WebSocket upgrade handler cho Socket.IO path
// Đây là bước bắt buộc — nếu không, WS upgrade request sẽ bị trả 404
server.on('upgrade', (req, socket, head) => {
  if (req.url?.startsWith('/socket.io')) {
    (socketProxy as any).upgrade(req, socket, head);
  } else {
    socket.destroy();
  }
});

server.listen(PORT, () => {
  console.log(`API Gateway is running on http://localhost:${PORT}`);
  console.log(`Routing /socket.io to Monolith with WebSocket support at ${MONOLITH_URL}`);
  console.log(`Routing /api/notifications to Notification Service at ${NOTIFICATION_SERVICE_URL}`);
  console.log(`Routing all other traffic to Monolith at ${MONOLITH_URL}`);
});
