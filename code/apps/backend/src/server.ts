import http from 'http';
import app from './app.js';
import { initSocket } from './shared/socket/socket.js';
import { connectRedis } from './shared/lib/redis.js';
import { connectRabbitMQ } from './shared/lib/rabbitmq.js';

const port = Number(process.env.PORT ?? '5001');

// Chỉ listen khi không ở môi trường test — Jest sẽ import app trực tiếp từ app.ts
if (process.env.NODE_ENV !== 'test') {
  // Bọc Express app bằng http.createServer để Socket.IO có thể bám vào
  // Socket.IO cần native HTTP server, không thể chạy trực tiếp trên Express
  const server = http.createServer(app);

  // Khởi tạo Socket.IO server và gắn vào HTTP server
  initSocket(server);

  // Kết nối Redis — chạy async, server vẫn hoạt động nếu Redis chưa sẵn sàng
  connectRedis().catch((err) => {
    console.error('[Redis] Startup connection failed:', err.message);
  });

  // Kết nối RabbitMQ (Publisher)
  connectRabbitMQ().catch((err) => {
    console.error('[RabbitMQ] Startup connection failed:', err.message);
  });

  server.listen(port, () => {
    console.log(`[server]: Running at http://localhost:${port}`);
    console.log(`[server]: Environment: ${process.env.NODE_ENV ?? 'development'}`);
  });
}

export default app;

