import type { CreateReviewInput, ReviewResponse } from '@repo/shared';
import { apiClient } from '../api/client';

export const reviewService = {
  async createReview(input: CreateReviewInput): Promise<ReviewResponse> {
    const response = await apiClient.post('/reviews', input);
    return response.data.review;
  },
  async getUserReviews(userId: string): Promise<ReviewResponse[]> {
    const response = await apiClient.get(`/reviews/user/${userId}`);
    return response.data.reviews;
  },
};
