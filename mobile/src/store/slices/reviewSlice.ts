/**
 * Review Redux Slice
 * 
 * Manages reviews for active products
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Review } from '../../types/api.types';
import { reviewService, SubmitReviewParams } from '../../services/review.service';

interface ReviewState {
  productReviews: Review[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

const initialState: ReviewState = {
  productReviews: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
};

// ==================== ASYNC THUNKS ====================

/**
 * Fetch reviews for a specific product
 */
export const fetchProductReviews = createAsyncThunk(
  'review/fetchProductReviews',
  async (productId: string, { rejectWithValue }) => {
    try {
      const reviews = await reviewService.getProductReviews(productId);
      return reviews;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch reviews');
    }
  }
);

/**
 * Submit a product review
 */
export const submitProductReview = createAsyncThunk(
  'review/submitProductReview',
  async (data: SubmitReviewParams, { rejectWithValue }) => {
    try {
      const review = await reviewService.submitReview(data);
      return review;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to submit review');
    }
  }
);

// ==================== SLICE ====================

const reviewSlice = createSlice({
  name: 'review',
  initialState,
  reducers: {
    clearReviews: (state) => {
      state.productReviews = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch product reviews
    builder
      .addCase(fetchProductReviews.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productReviews = action.payload;
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Submit product review
    builder
      .addCase(submitProductReview.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitProductReview.fulfilled, (state, action) => {
        state.isSubmitting = false;
        // The result may not have populated user; unshift into state
        state.productReviews.unshift(action.payload);
      })
      .addCase(submitProductReview.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearReviews, clearError } = reviewSlice.actions;
export default reviewSlice.reducer;
