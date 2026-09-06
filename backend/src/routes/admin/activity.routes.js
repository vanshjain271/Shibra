/**
 * Admin Activity Log Routes
 */

const express = require('express');
const router = express.Router();
const { adminOnly } = require('../../middleware/auth.middleware');
const { getLogs } = require('../../services/activity.service');

/**
 * @route   GET /api/v1/admin/activity-logs
 * @desc    Get activity logs with filtering & pagination
 * @access  Admin
 */
router.get('/', adminOnly, async (req, res) => {
    try {
        const { page, limit, userId, action, entityType, search, dateFrom, dateTo } = req.query;

        const result = await getLogs(
            { userId, action, entityType, search, dateFrom, dateTo },
            { page, limit }
        );

        return res.status(200).json(result);
    } catch (error) {
        console.error('Get Activity Logs Error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching activity logs',
        });
    }
});

module.exports = router;
