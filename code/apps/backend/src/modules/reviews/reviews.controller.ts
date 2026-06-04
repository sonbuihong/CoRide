import { Request, Response, NextFunction } from 'express';
import { ReviewsService } from './reviews.service';

export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const review = await ReviewsService.createReview(req.user!.id, req.body);
    res.status(201).json({ message: 'Đã gửi đánh giá thành công', review });
  } catch (error) {
    next(error);
  }
};

export const getUserReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reviews = await ReviewsService.getUserReviews((req.params.userId as string));
    res.json({ reviews });
  } catch (error) {
    next(error);
  }
};
