/**
 * Notification Controller - MVP (Buyer)
 */

const NotificationService = require('../services/notification.service');

/**
 * @desc    Get user notifications
 * @route   GET /api/v1/notifications
 * @access  Buyer
 * @query   page, limit, unreadOnly
 */
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const result = await NotificationService.getUserNotifications(
      req.user.userId,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        unreadOnly: unreadOnly === 'true'
      }
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      notifications: result.notifications,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get Notifications Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching notifications'
    });
  }
};

/**
 * @desc    Get unread count
 * @route   GET /api/v1/notifications/unread-count
 * @access  Buyer
 */
const getUnreadCount = async (req, res) => {
  try {
    const result = await NotificationService.getUnreadCount(req.user.userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      count: result.count
    });
  } catch (error) {
    console.error('Get Unread Count Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching unread count'
    });
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/v1/notifications/:notificationId/read
 * @access  Buyer
 */
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const result = await NotificationService.markAsRead(
      notificationId,
      req.user.userId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification: result.notification
    });
  } catch (error) {
    console.error('Mark As Read Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while marking notification as read'
    });
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/v1/notifications/read-all
 * @access  Buyer
 */
const markAllAsRead = async (req, res) => {
  try {
    const result = await NotificationService.markAllAsRead(req.user.userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Mark All As Read Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while marking all notifications as read'
    });
  }
};

/**
 * @desc    Register FCM token
 * @route   POST /api/v1/notifications/register-token
 * @access  Buyer
 * @body    { token, device }
 */
const registerFCMToken = async (req, res) => {
  try {
    const { token, device = 'android' } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    const result = await NotificationService.registerFCMToken(
      req.user.userId,
      token,
      device
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Register FCM Token Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while registering FCM token'
    });
  }
};

/**
 * @desc    Unregister FCM token
 * @route   POST /api/v1/notifications/unregister-token
 * @access  Buyer
 * @body    { token }
 */
const unregisterFCMToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    const result = await NotificationService.unregisterFCMToken(
      req.user.userId,
      token
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Unregister FCM Token Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while unregistering FCM token'
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  registerFCMToken,
  unregisterFCMToken
};