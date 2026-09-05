import { Router } from 'express';
import { validate } from '../../shared/middlewares/validate.middleware';
import { authenticate } from '../../shared/middlewares/auth.middleware';
import { CreateReviewSchema } from '@repo/shared';
import * as reviewsController from './reviews.controller';

const router = Router();

// Các hành khách người dùng hiện tại đã đánh giá trong một chuyến đi.
router.get('/ride/:rideId/mine', authenticate, reviewsController.getMyRideReviews);

// Xem reviews của user — public (không cần đăng nhập)
router.get('/user/:userId', reviewsController.getUserReviews);

// Gửi review — cần đăng nhập
router.post(
  '/',
  authenticate,
  validate(CreateReviewSchema),
  reviewsController.createReview
);

export default router;
