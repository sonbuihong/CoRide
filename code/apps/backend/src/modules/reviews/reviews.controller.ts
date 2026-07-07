import { Request, Response } from 'express';
import { ReviewsService } from './reviews.service';
import { asyncHandler } from '../../shared/utils/asyncHandler';

export const createReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const review = await ReviewsService.createReview(req.user!.id, req.body);
  res.status(201).json({ message: 'Đã gửi đánh giá thành công', review });
});

export const getUserReviews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const reviews = await ReviewsService.getUserReviews((req.params.userId as string));
  res.json({ reviews });
});
