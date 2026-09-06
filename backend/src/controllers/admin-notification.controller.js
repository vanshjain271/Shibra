/**
 * Admin Notification Controller - MVP
 */

const NotificationService = require('../services/notification.service');

/**
 * @desc    Send custom notification to user
 * @route   POST /api/v1/admin/notifications/send
 * @access  Admin
 * @body    { userId, title, body, data }
 */
const sendCustomNotification = async (req, res) => {
  try {
    const { userId, title, body, data = {} } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'User ID, title, and body are required'
      });
    }

    const result = await NotificationService.sendCustomNotification(
      userId,
      title,
      body,
      data
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      notification: result.notification
    });
  } catch (error) {
    console.error('Send Custom Notification Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while sending notification'
    });
  }
};

/**
 * @desc    Send abandoned cart reminder
 * @route   POST /api/v1/admin/notifications/abandoned-cart-reminder
 * @access  Admin
 * @body    { userId, itemCount, cartValue }
 */
const sendAbandonedCartReminder = async (req, res) => {
  try {
    const { userId, itemCount, cartValue } = req.body;

    if (!userId || !itemCount || !cartValue) {
      return res.status(400).json({
        success: false,
        message: 'User ID, item count, and cart value are required'
      });
    }

    const result = await NotificationService.sendAbandonedCartReminder(
      userId,
      itemCount,
      cartValue
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: 'Abandoned cart reminder sent successfully',
      notification: result.notification
    });
  } catch (error) {
    console.error('Send Abandoned Cart Reminder Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while sending reminder'
    });
  }
};

module.exports = {
  sendCustomNotification,
  sendAbandonedCartReminder
};