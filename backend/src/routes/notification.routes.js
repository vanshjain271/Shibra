/**
 * Notification Routes - MVP (Buyer)
 */

const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification.controller');
const auth = require('../middleware/auth.middleware');

// Get notifications
router.get('/', auth.authenticate, NotificationController.getNotifications);
router.get('/unread-count', auth.authenticate, NotificationController.getUnreadCount);

// Mark as read
router.put('/:notificationId/read', auth.authenticate, NotificationController.markAsRead);
router.put('/read-all', auth.authenticate, NotificationController.markAllAsRead);

// FCM token management
router.post('/register-token', auth.authenticate, NotificationController.registerFCMToken);
router.post('/unregister-token', auth.authenticate, NotificationController.unregisterFCMToken);

module.exports = router;