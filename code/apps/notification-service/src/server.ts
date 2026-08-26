import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import amqp from 'amqplib';
import { PrismaClient } from '@repo/database';

const app = express();
const server = http.createServer(app);

// CORS được xử lý tại API Gateway
app.use(express.json());

const PORT = Number(process.env.PORT ?? '5201');
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const prisma = new PrismaClient();

// /health phải đặt TRƯỚC notificationRoutes để không bị chặn bởi authenticate middleware
// WHY: Express khớp route theo thứ tự khai báo — đặt sau sẽ bị router chặn trước
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service' });
});

import notificationRoutes from './routes';
app.use('/', notificationRoutes);

// Redis Emitter (thay vì tự host Socket.io, ta push event qua Redis để Backend Monolith gửi cho Client)
import { createClient } from 'redis';
import { Emitter } from '@socket.io/redis-emitter';

const redisClient = createClient({ url: REDIS_URL });
redisClient.on('error', (err) => {
  // Bắt lỗi kết nối Redis để tránh unhandled error spam khi Redis chưa khởi động
});
redisClient.connect().catch((err) => console.error('[Notification Redis] Connection failed:', err.message));
const ioEmitter = new Emitter(redisClient);

// RabbitMQ Connection and Consumer
async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    
    const queue = 'notification_events';
    await channel.assertQueue(queue, { durable: true });
    
    console.log(`🐰 Connected to RabbitMQ. Listening for messages in ${queue}...`);

    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        try {
          const data = JSON.parse(msg.content.toString());
          console.log('Received notification event:', data);

          // 1. Lưu vào Database
          const notification = await prisma.notification.create({
            data: {
              userId: data.userId,
              title: data.title,
              content: data.content,
              type: data.type,
            },
          });

          // 2. Push qua Socket.io (thông qua Redis Adapter của Backend)
          // Lưu ý: Backend dùng room mang tên userId (chứ không phải user_${userId})
          ioEmitter.to(data.userId).emit('notification:new', notification);
          
          channel.ack(msg);
        } catch (err) {
          console.error('Error processing notification event:', err);
          // NACK nếu có lỗi parse hoặc DB để queue lại
          channel.nack(msg);
        }
      }
    });
  } catch (error: any) {
    console.warn(`[Notification RabbitMQ] Chưa kết nối được tới RabbitMQ (${error?.code || error?.message || error}). Sẽ thử lại sau 10 giây...`);
    // Retry connection
    setTimeout(connectRabbitMQ, 10000);
  }
}

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🔔 Notification Service is running on port ${PORT}`);
  await connectRabbitMQ();
});
