import { z } from 'zod';

export const NotificationResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  title: z.string(),
  content: z.string(),
  type: z.string(),
  isRead: z.boolean(),
  createdAt: z.date().or(z.string().datetime()),
  deletedAt: z.date().or(z.string().datetime()).nullable().optional(),
  targetType: z.enum(['BOOKING', 'RIDE', 'TRIP']).nullable().optional(),
  targetId: z.string().nullable().optional(),
});

export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;
