/**
 * Admin Review Routes
 */
const express = require('express');
const router = express.Router();
const ReviewController = require('../../controllers/review.controller');
const auth = require('../../middleware/auth.middleware');

// Get all reviews with filters
router.get('/', auth.adminOnly, ReviewController.getAllReviews);

// Update review status (approve/reject)
router.put('/:reviewId', auth.adminOnly, ReviewController.updateReviewStatus);

// Delete a review
router.delete('/:reviewId', auth.adminOnly, ReviewController.deleteReview);

module.exports = router;
