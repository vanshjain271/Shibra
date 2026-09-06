/**
 * Notification Service
 * Handles sending push notifications via Firebase Cloud Messaging (FCM)
 */

const firebaseAdmin = require('../utils/firebase');
const User = require('../models/User');

class NotificationService {
    /**
     * Send a notification to a specific user
     * 
     * @param {string} userId - ID of the recipient user
     * @param {Object} notification - Notification object { title, body, data }
     * @returns {Promise<Object>} status
     */
    async sendToUser(userId, { title, body, data = {} }) {
        try {
            const user = await User.findById(userId).select('fcmTokens');
            
            if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
                console.log(`User ${userId} has no FCM tokens`);
                return { success: false, message: 'User has no FCM tokens' };
            }

            if (!firebaseAdmin) {
                console.error('Firebase Admin not initialized');
                return { success: false, message: 'Firebase not configured' };
            }

            const message = {
                notification: { title, body },
                data: data,
                tokens: user.fcmTokens.map(t => t.token)
            };

            const response = await firebaseAdmin.messaging().sendMulticast(message);
            
            // Cleanup invalid tokens
            if (response.failureCount > 0) {
                const invalidTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        const errorCode = resp.error.code;
                        if (errorCode === 'messaging/registration-token-not-registered' ||
                            errorCode === 'messaging/invalid-registration-token') {
                            invalidTokens.push(user.fcmTokens[idx]);
                        }
                    }
                });

                if (invalidTokens.length > 0) {
                    await User.findByIdAndUpdate(userId, {
                        $pull: { fcmTokens: { $in: invalidTokens } }
                    });
                }
            }

            return { 
                success: true, 
                successCount: response.successCount, 
                failureCount: response.failureCount 
            };
        } catch (error) {
            console.error('Send Notification Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send notification to all users (Broadcast)
     * 
     * @param {Object} notification - { title, body, data, topic }
     */
    async broadcast({ title, body, data = {}, topic = 'all_users' }) {
        try {
            if (!firebaseAdmin) return { success: false };

            const message = {
                notification: { title, body },
                data: data,
                topic: topic
            };

            const response = await firebaseAdmin.messaging().send(message);
            return { success: true, messageId: response };
        } catch (error) {
            console.error('Broadcast Notification Error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send notification for order status updates
     * 
     * @param {string} userId - Recipient
     * @param {Object} order - Order object
     * @param {string} status - New status
     */
    async sendOrderStatusNotification(userId, order, status) {
        const title = 'Order Status Updated';
        let body = `Your order ${order.orderNumber} is now ${status.toLowerCase()}.`;

        // Custom messages for specific statuses
        if (status === 'CONFIRMED') {
            body = `Great news! Your order ${order.orderNumber} has been confirmed.`;
        } else if (status === 'SHIPPED') {
            body = `Your order ${order.orderNumber} has been shipped! tracking details will be available soon.`;
        } else if (status === 'DELIVERED') {
            body = `Your order ${order.orderNumber} has been delivered. Enjoy your purchase!`;
        }

        // 1. Send Push Notification
        this.sendToUser(userId.toString(), {
            title,
            body,
            data: {
                orderId: order._id.toString(),
                status: status,
                type: 'ORDER_UPDATE'
            }
        });

        // 2. Send SMS and WhatsApp
        try {
            const User = require('../models/User');
            const user = await User.findById(userId).select('phone');
            if (user && user.phone) {
                const SMSService = require('./sms.service');
                const WhatsAppService = require('./whatsapp.service');
                
                await SMSService.sendOrderStatusUpdate(user.phone, order.orderNumber, status);
                await WhatsAppService.sendOrderStatusUpdate(user.phone, order);
            }
        } catch (error) {
            console.error('Error sending SMS/WhatsApp status update:', error);
        }

        return { success: true };
    }

    /**
     * Register or update FCM token for a user
     */
    async registerFCMToken(userId, token, deviceType = 'android') {
        try {
            await User.findByIdAndUpdate(userId, {
                $addToSet: { fcmTokens: { token, deviceType, lastUsed: new Date() } }
            });
            return { success: true };
        } catch (error) {
            console.error('Register FCM Token Error:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new NotificationService();