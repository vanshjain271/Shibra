/**
 * Review Model
 * Stores product reviews submitted by customers.
 */

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    title: {
        type: String,
        maxlength: 200,
        default: '',
    },
    comment: {
        type: String,
        maxlength: 2000,
        default: '',
    },
    images: [{
        type: String,
    }],
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING',
        index: true,
    },
    adminReply: {
        type: String,
        maxlength: 1000,
        default: '',
    },
    isVerifiedPurchase: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Prevent duplicate reviews from the same user for the same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
