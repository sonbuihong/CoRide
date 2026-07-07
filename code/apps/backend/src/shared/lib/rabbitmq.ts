import amqp from 'amqplib';

let channel: amqp.Channel | null = null;

export const isRabbitMQConnected = (): boolean => channel !== null;

export const connectRabbitMQ = async () => {
  try {
    const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    console.log('🐰 Connected to RabbitMQ (Publisher)');
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    console.warn('[RabbitMQ] Server sẽ chạy ở chế độ degraded (notifications qua fallback)');
  }
};

/**
 * Publish an event to a RabbitMQ queue.
 * Throws if the channel is not initialized so callers can handle the failure
 * (e.g. fall back to alternative notification delivery).
 */
export const publishEvent = async (queue: string, data: any): Promise<void> => {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized — message not published');
  }
  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
    persistent: true,
  });
};
