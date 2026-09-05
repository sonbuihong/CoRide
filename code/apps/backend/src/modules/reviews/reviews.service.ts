import { extendedPrisma as prisma, ReviewType } from '@repo/database';
import type { CreateReviewInput } from '@repo/shared';

import { AppError } from '../../shared/errors/AppError';
import { NotificationsService } from '../notifications/notifications.service';

const isPrismaUniqueError = (error: unknown): boolean => (
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
);

export class ReviewsService {
  static async getMyRideReviewedUserIds(reviewerId: string, rideId: string) {
    const reviews = await prisma.review.findMany({
      where: { reviewerId, rideId },
      select: { revieweeId: true },
    });

    return [...new Set(reviews.map((review) => review.revieweeId))];
  }

  static async createReview(reviewerId: string, data: CreateReviewInput) {
    const { rideId, tripRequestId, revieweeId, rating, comment } = data;
    if (reviewerId === revieweeId) {
      throw new AppError('Bạn không thể tự đánh giá chính mình', 400);
    }

    let reviewType: ReviewType;
    let notificationTarget: { type: 'RIDE' | 'TRIP'; id: string };

    if (tripRequestId) {
      const trip = await prisma.tripRequest.findUnique({ where: { id: tripRequestId } });
      if (!trip) throw new AppError('Không tìm thấy chuyến đặt xe', 404);
      if (trip.status !== 'COMPLETED') {
        throw new AppError('Chỉ có thể đánh giá sau khi chuyến đi kết thúc', 400);
      }
      const reviewerIsPassenger = trip.passengerId === reviewerId;
      const reviewerIsDriver = trip.driverId === reviewerId;
      if (!reviewerIsPassenger && !reviewerIsDriver) {
        throw new AppError('Bạn không có quyền đánh giá chuyến đi này', 403);
      }
      const expectedRevieweeId = reviewerIsPassenger ? trip.driverId : trip.passengerId;
      if (!expectedRevieweeId || revieweeId !== expectedRevieweeId) {
        throw new AppError('Người được đánh giá không thuộc chuyến đi này', 403);
      }
      reviewType = reviewerIsPassenger ? ReviewType.DRIVER : ReviewType.PASSENGER;
      notificationTarget = { type: 'TRIP', id: tripRequestId };
    } else if (rideId) {
      const ride = await prisma.ride.findUnique({ where: { id: rideId } });
      if (!ride) throw new AppError('Không tìm thấy chuyến đi', 404);
      if (ride.status !== 'COMPLETED') {
        throw new AppError('Chỉ có thể đánh giá sau khi chuyến đi kết thúc', 400);
      }

      const reviewerIsDriver = ride.driverId === reviewerId;
      const passengerBooking = await prisma.booking.findFirst({
        where: {
          rideId,
          passengerId: reviewerId,
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
      });
      if (!reviewerIsDriver && !passengerBooking) {
        throw new AppError('Bạn không có quyền đánh giá chuyến đi này', 403);
      }
      if (!reviewerIsDriver && revieweeId !== ride.driverId) {
        throw new AppError('Hành khách chỉ có thể đánh giá tài xế của chuyến đi', 403);
      }
      if (reviewerIsDriver) {
        const reviewedPassenger = await prisma.booking.findFirst({
          where: {
            rideId,
            passengerId: revieweeId,
            status: { in: ['CONFIRMED', 'COMPLETED'] },
          },
        });
        if (!reviewedPassenger) {
          throw new AppError('Tài xế chỉ có thể đánh giá hành khách của chuyến đi', 403);
        }
      }
      reviewType = reviewerIsDriver ? ReviewType.PASSENGER : ReviewType.DRIVER;
      notificationTarget = { type: 'RIDE', id: rideId };
    } else {
      throw new AppError('Thiếu chuyến đi cần đánh giá', 400);
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        reviewerId,
        revieweeId,
        ...(tripRequestId ? { tripRequestId } : { rideId }),
      },
      select: { id: true },
    });
    if (existingReview) {
      throw new AppError(
        'Bạn đã gửi đánh giá cho người này trong chuyến đi rồi',
        409,
        true,
        'REVIEW_ALREADY_EXISTS',
      );
    }

    try {
      const review = await prisma.review.create({
        data: {
          rideId: rideId ?? null,
          tripRequestId: tripRequestId ?? null,
          reviewerId,
          revieweeId,
          rating,
          comment: comment?.trim() || null,
          type: reviewType,
        },
        include: {
          reviewer: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
      });

      void NotificationsService.createNotification(
        revieweeId,
        'Bạn nhận được đánh giá mới',
        `${review.reviewer.firstName ?? 'Một người dùng'} đã gửi đánh giá ${rating} sao`,
        'NEW_REVIEW',
        notificationTarget,
      ).catch((error) => console.error('[Notification Error]:', error));
      return review;
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        throw new AppError(
          'Bạn đã gửi đánh giá cho người này trong chuyến đi rồi',
          409,
          true,
          'REVIEW_ALREADY_EXISTS',
        );
      }
      throw error;
    }
  }

  static async getUserReviews(userId: string) {
    return prisma.review.findMany({
      where: { revieweeId: userId },
      include: {
        reviewer: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
