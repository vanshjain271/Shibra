/**
 * Activity Log Model
 * Tracks all actions by employees and admins for audit purposes.
 */

const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        action: {
            type: String,
            enum: ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'DUPLICATE', 'LOGIN', 'EXPORT', 'OTHER'],
            required: true,
        },
        entityType: {
            type: String,
            enum: ['Order', 'Product', 'User', 'Invoice', 'Coupon', 'Category', 'Brand', 'Banner', 'Settings', 'Other'],
            required: true,
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        ip: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

// Indexes for fast queries
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ entityType: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
