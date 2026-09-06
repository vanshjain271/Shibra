/**
 * Activity Logging Service
 * Provides a simple utility to log employee/admin actions.
 */

const ActivityLog = require('../models/ActivityLog');

/**
 * Log an activity
 * @param {Object} params
 * @param {string} params.userId - ID of the user performing the action
 * @param {string} params.action - CREATE | UPDATE | DELETE | STATUS_CHANGE | DUPLICATE | LOGIN | EXPORT | OTHER
 * @param {string} params.entityType - Order | Product | User | Invoice | etc.
 * @param {string} [params.entityId] - ID of the affected entity
 * @param {string} params.description - Human-readable summary
 * @param {Object} [params.details] - Additional metadata / change details
 * @param {string} [params.ip] - IP address of the request
 */
const logActivity = async ({ userId, action, entityType, entityId, description, details, ip }) => {
    try {
        await ActivityLog.create({
            user: userId,
            action,
            entityType,
            entityId: entityId || null,
            description,
            details: details || null,
            ip: ip || '',
        });
    } catch (error) {
        // Never let logging failures break the main flow
        console.error('Activity Log Error:', error.message);
    }
};

/**
 * Get activity logs with filtering and pagination
 */
const getLogs = async (filters = {}, options = {}) => {
    const { userId, action, entityType, search, dateFrom, dateTo } = filters;
    const { page = 1, limit = 50 } = options;

    const query = {};

    if (userId) query.user = userId;
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;

    if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            query.createdAt.$lte = to;
        }
    }

    if (search) {
        query.description = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
        ActivityLog.find(query)
            .populate('user', 'name phone role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean(),
        ActivityLog.countDocuments(query),
    ]);

    return {
        success: true,
        logs,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
        },
    };
};

module.exports = { logActivity, getLogs };
