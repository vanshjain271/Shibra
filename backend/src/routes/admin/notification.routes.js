/**
 * Admin Notification Routes - MVP
 */

const express = require('express');
const router = express.Router();
const AdminNotificationController = require('../../controllers/admin-notification.controller');
const auth = require('../../middleware/auth.middleware');

// Send notifications
router.post('/send', auth.adminOnly, AdminNotificationController.sendCustomNotification);
router.post('/abandoned-cart-reminder', auth.adminOnly, AdminNotificationController.sendAbandonedCartReminder);

module.exports = router;