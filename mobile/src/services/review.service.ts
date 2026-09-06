/**
 * Review Service
 * 
 * Handles product reviews and ratings
 */

import { apiClient } from './api.service';
import { Review } from '../types/api.types';

export interface SubmitReviewParams {
  productId: string;
  rating: number;
  comment: string;
  images?: string[];
}

class ReviewService {
  /**
   * Get reviews for a product
   */
  async getProductReviews(productId: string): Promise<Review[]> {
    const response = await apiClient.get<any>(`/reviews/product/${productId}`);
    // Backend may wrap in data.reviews or return array directly
    return response.reviews ?? response.data?.reviews ?? response.data ?? [];
  }

  /**
   * Submit a product review
   */
  async submitReview(data: SubmitReviewParams): Promise<Review> {
    const response = await apiClient.post<any>('/reviews', data);
    return response.review ?? response.data?.review ?? response.data;
  }
}

export const reviewService = new ReviewService();
