const mockTripFindUnique = jest.fn();
const mockReviewFindFirst = jest.fn();
const mockReviewCreate = jest.fn();
const mockCreateNotification = jest.fn();

jest.mock('@repo/database', () => ({
  ReviewType: { DRIVER: 'DRIVER', PASSENGER: 'PASSENGER' },
  extendedPrisma: {
    tripRequest: { findUnique: mockTripFindUnique },
    ride: { findUnique: jest.fn() },
    booking: { findFirst: jest.fn() },
    review: {
      findFirst: mockReviewFindFirst,
      findMany: jest.fn(),
      create: mockReviewCreate,
    },
  },
}));

jest.mock('../notifications/notifications.service', () => ({
  NotificationsService: { createNotification: mockCreateNotification },
}));

import { ReviewsService } from './reviews.service';

describe('Ride-Hailing reviews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateNotification.mockResolvedValue({});
    mockTripFindUnique.mockResolvedValue({
      id: 'trip-1',
      status: 'COMPLETED',
      passengerId: 'passenger-1',
      driverId: 'driver-1',
    });
  });

  it('allows the trip passenger to rate only the assigned driver', async () => {
    mockReviewFindFirst.mockResolvedValue(null);
    mockReviewCreate.mockResolvedValue({
      id: 'review-1',
      tripRequestId: 'trip-1',
      reviewerId: 'passenger-1',
      revieweeId: 'driver-1',
      rating: 5,
      type: 'DRIVER',
      reviewer: { firstName: 'An' },
    });

    await expect(ReviewsService.createReview('passenger-1', {
      tripRequestId: 'trip-1',
      revieweeId: 'driver-1',
      rating: 5,
      comment: 'Tốt',
    })).resolves.toMatchObject({ id: 'review-1' });
    expect(mockReviewCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        rideId: null,
        tripRequestId: 'trip-1',
        reviewerId: 'passenger-1',
        revieweeId: 'driver-1',
        type: 'DRIVER',
      }),
    }));
  });

  it('rejects duplicate ratings before writing', async () => {
    mockReviewFindFirst.mockResolvedValue({ id: 'review-existing' });

    await expect(ReviewsService.createReview('passenger-1', {
      tripRequestId: 'trip-1',
      revieweeId: 'driver-1',
      rating: 4,
    })).rejects.toMatchObject({
      statusCode: 409,
      code: 'REVIEW_ALREADY_EXISTS',
    });
    expect(mockReviewCreate).not.toHaveBeenCalled();
  });

  it('rejects a reviewee who is not part of the trip', async () => {
    await expect(ReviewsService.createReview('passenger-1', {
      tripRequestId: 'trip-1',
      revieweeId: 'driver-other',
      rating: 5,
    })).rejects.toMatchObject({ statusCode: 403 });
    expect(mockReviewCreate).not.toHaveBeenCalled();
  });
});
