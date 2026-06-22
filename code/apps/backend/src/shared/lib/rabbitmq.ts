import amqp from 'amqplib';

let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
  try {
    const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    console.log('🐰 Connected to RabbitMQ (Publisher)');
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
  }
};

export const publishEvent = async (queue: string, data: any) => {
  if (!channel) {
    console.error('RabbitMQ channel not initialized');
    return;
  }
  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
    persistent: true,
  });
};
