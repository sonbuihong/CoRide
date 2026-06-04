import { extendedPrisma as prisma } from '@repo/database';
import { ReviewType } from '@repo/database';
import { CreateReviewInput } from '@repo/shared';
import { AppError } from '../../shared/errors/AppError';
import { NotificationsService } from '../notifications/notifications.service';

export class ReviewsService {
  static async createReview(reviewerId: string, data: CreateReviewInput) {
    const { rideId, revieweeId, rating, comment } = data;

    // 1. Không được tự đánh giá chính mình
    if (reviewerId === revieweeId) {
      throw new AppError('Bạn không thể tự đánh giá chính mình', 400);
    }

    // 2. Chuyến đi phải tồn tại và đã COMPLETED
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new AppError('Không tìm thấy chuyến đi', 404);
    if (ride.status !== 'COMPLETED') {
      throw new AppError('Chỉ có thể đánh giá sau khi chuyến đi kết thúc', 400);
    }

    // 3. Kiểm tra người đánh giá có tham gia chuyến đi không
    const isDriver = ride.driverId === reviewerId;
    const isConfirmedPassenger = await prisma.booking.findFirst({
      where: { rideId, passengerId: reviewerId, status: 'CONFIRMED' },
    });

    if (!isDriver && !isConfirmedPassenger) {
      throw new AppError('Bạn không có quyền đánh giá chuyến đi này', 403);
    }

    // 4. Kiểm tra chưa đánh giá người này trong chuyến đi này
    const existingReview = await prisma.review.findFirst({
      where: { rideId, reviewerId, revieweeId },
    });

    if (existingReview) {
      throw new AppError(
        'Bạn đã gửi đánh giá cho người này trong chuyến đi này rồi',
        400
      );
    }

    // 5. Tự động xác định ReviewType dựa trên vai trò reviewer
    // Nếu reviewer là driver → đánh giá hành khách (PASSENGER)
    // Nếu reviewer là passenger → đánh giá tài xế (DRIVER)
    const reviewType: ReviewType = isDriver
      ? ReviewType.PASSENGER
      : ReviewType.DRIVER;

    // 6. Tạo review — Prisma Extension tự cập nhật rating tương ứng
    const review = await prisma.review.create({
      data: {
        rideId,
        reviewerId,
        revieweeId,
        rating,
        comment: comment ?? null,
        type: reviewType,
      },
      include: {
        reviewer: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });

    // 6. Thông báo người được đánh giá
    NotificationsService.createNotification(
      revieweeId,
      'Bạn nhận được đánh giá mới',
      `${review.reviewer.firstName} đã gửi cho bạn đánh giá ${rating} sao`,
      'NEW_REVIEW'
    ).catch((err) => console.error('[Notification Error]:', err));

    return review;
  }

  static async getUserReviews(userId: string) {
    return prisma.review.findMany({
      where: { revieweeId: userId },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
