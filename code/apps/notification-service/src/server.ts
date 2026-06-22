import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import amqp from 'amqplib';
import { PrismaClient } from '@repo/database';

dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS được xử lý tại API Gateway
app.use(express.json());

import notificationRoutes from './routes';
app.use('/', notificationRoutes);

const PORT = process.env.PORT || 5003;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const prisma = new PrismaClient();

app.get('/health', (req, res) => {
  res.json({ status: 'Notification Service is running' });
});

// Redis Emitter (thay vì tự host Socket.io, ta push event qua Redis để Backend Monolith gửi cho Client)
import { createClient } from 'redis';
import { Emitter } from '@socket.io/redis-emitter';

const redisClient = createClient({ url: REDIS_URL });
redisClient.connect().catch((err) => console.error('[Notification Redis] Error:', err));
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
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    // Retry connection
    setTimeout(connectRabbitMQ, 5000);
  }
}

server.listen(PORT, async () => {
  console.log(`🔔 Notification Service is running on port ${PORT}`);
  await connectRabbitMQ();
});
