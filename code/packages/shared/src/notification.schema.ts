import { z } from 'zod';

export const NotificationResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  title: z.string(),
  content: z.string(),
  type: z.string(),
  isRead: z.boolean(),
  createdAt: z.date().or(z.string().datetime()),
});

export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;
