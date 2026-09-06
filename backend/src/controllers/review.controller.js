/**
 * Review Controller - Admin + Customer
 */

const Review = require('../models/Review');
const Order = require('../models/Order');

/**
 * Customer: Submit a review for a product
 * POST /api/v1/reviews
 */
const submitReview = async (req, res) => {
    try {
        const { productId, rating, title, comment } = req.body;
        const userId = req.user.userId;

        if (!productId || !rating) {
            return res.status(400).json({ success: false, message: 'Product ID and rating required' });
        }

        // Check if user already reviewed this product
        const existing = await Review.findOne({ product: productId, user: userId });
        if (existing) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
        }

        // Check if user has purchased this product (verified purchase)
        const hasPurchased = await Order.findOne({
            user: userId,
            'items.product': productId,
            status: { $in: ['DELIVERED', 'SHIPPED'] },
        });

        const review = await Review.create({
            product: productId,
            user: userId,
            rating,
            title: title || '',
            comment: comment || '',
            isVerifiedPurchase: !!hasPurchased,
            status: 'PENDING',
        });

        return res.status(201).json({ success: true, message: 'Review submitted for approval', review });
    } catch (error) {
        console.error('Submit Review Error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
        }
        return res.status(500).json({ success: false, message: 'Failed to submit review' });
    }
};

/**
 * Customer: Get my reviews
 * GET /api/v1/reviews/me
 */
const getMyReviews = async (req, res) => {
    try {
        const userId = req.user.userId;
        const reviews = await Review.find({ user: userId })
            .populate('product', 'name images mrp salePrice discount')
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            reviews,
        });
    } catch (error) {
        console.error('Get My Reviews Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to get your reviews' });
    }
};

/**
 * Public: Get approved reviews for a product
 * GET /api/v1/reviews/product/:productId
 */
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const reviews = await Review.find({ product: productId, status: 'APPROVED' })
            .populate('user', 'name')
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .lean();

        const total = await Review.countDocuments({ product: productId, status: 'APPROVED' });

        // Calculate average rating
        const ratingAgg = await Review.aggregate([
            { $match: { product: new (require('mongoose').Types.ObjectId)(productId), status: 'APPROVED' } },
            { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]);

        return res.status(200).json({
            success: true,
            reviews,
            averageRating: ratingAgg[0]?.avg ? Math.round(ratingAgg[0].avg * 10) / 10 : 0,
            totalReviews: total,
            pagination: { page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
        });
    } catch (error) {
        console.error('Get Product Reviews Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to get reviews' });
    }
};

/**
 * Admin: Get all reviews with filters
 * GET /api/v1/admin/reviews
 */
const getAllReviews = async (req, res) => {
    try {
        const { page = 1, limit = 25, status, rating, search } = req.query;
        const query = {};

        if (status) query.status = status;
        if (rating) query.rating = parseInt(rating);
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { comment: { $regex: search, $options: 'i' } },
            ];
        }

        const reviews = await Review.find(query)
            .populate('user', 'name phone')
            .populate('product', 'name images')
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .lean();

        const total = await Review.countDocuments(query);

        // Stats
        const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
            Review.countDocuments({ status: 'PENDING' }),
            Review.countDocuments({ status: 'APPROVED' }),
            Review.countDocuments({ status: 'REJECTED' }),
        ]);

        return res.status(200).json({
            success: true,
            reviews,
            stats: { pending: pendingCount, approved: approvedCount, rejected: rejectedCount },
            pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
        });
    } catch (error) {
        console.error('Get All Reviews Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to get reviews' });
    }
};

/**
 * Admin: Update review status (approve/reject)
 * PUT /api/v1/admin/reviews/:reviewId
 */
const updateReviewStatus = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { status, adminReply } = req.body;

        if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const update = { status };
        if (adminReply !== undefined) update.adminReply = adminReply;

        const review = await Review.findByIdAndUpdate(reviewId, update, { new: true })
            .populate('user', 'name')
            .populate('product', 'name');

        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }

        return res.status(200).json({ success: true, message: `Review ${status.toLowerCase()}`, review });
    } catch (error) {
        console.error('Update Review Status Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update review' });
    }
};

/**
 * Admin: Delete a review
 * DELETE /api/v1/admin/reviews/:reviewId
 */
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const review = await Review.findByIdAndDelete(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: 'Review not found' });
        }
        return res.status(200).json({ success: true, message: 'Review deleted' });
    } catch (error) {
        console.error('Delete Review Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete review' });
    }
};

module.exports = {
    submitReview,
    getProductReviews,
    getAllReviews,
    updateReviewStatus,
    deleteReview,
    getMyReviews,
};
