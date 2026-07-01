import http from 'http';
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

// 2. Socket.IO path — cần proxy riêng với WS support đúng cách
// Socket.IO dùng path /socket.io/ cho cả polling và WebSocket upgrade
// http-proxy-middleware cần http.Server (không phải Express app) để handle WS upgrade
const socketProxy = createProxyMiddleware({
  target: MONOLITH_URL,
  changeOrigin: true,
  ws: true,
});
app.use('/socket.io', socketProxy);

// 3. Fallback to Monolith cho tất cả HTTP requests còn lại
app.use(
  '/',
  createProxyMiddleware({
    target: MONOLITH_URL,
    changeOrigin: true,
    // Không bật ws ở đây — đã xử lý riêng ở rule Socket.IO trên
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
