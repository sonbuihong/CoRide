import { z } from 'zod';

export const CreateReviewSchema = z.object({
  rideId: z.string().uuid("ID chuyến đi không hợp lệ").optional(),
  tripRequestId: z.string().uuid("ID chuyến đặt xe không hợp lệ").optional(),
  revieweeId: z.string().uuid("ID người được đánh giá không hợp lệ"),
  rating: z.number().int().min(1, "Đánh giá tối thiểu là 1 sao").max(5, "Đánh giá tối đa là 5 sao"),
  comment: z.string().max(500, "Bình luận không được vượt quá 500 ký tự").optional().or(z.literal('')),
}).refine(
  (value) => Number(Boolean(value.rideId)) + Number(Boolean(value.tripRequestId)) === 1,
  { message: 'Phải chọn đúng một chuyến đi để đánh giá' },
);

export const ReviewResponseSchema = z.object({
  id: z.string().uuid(),
  rideId: z.string().uuid().nullable(),
  tripRequestId: z.string().uuid().nullable(),
  reviewerId: z.string().uuid(),
  revieweeId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  createdAt: z.date().or(z.string().datetime()),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type ReviewResponse = z.infer<typeof ReviewResponseSchema>;
