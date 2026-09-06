/**
 * FCM Service - MVP
 * 
 * Firebase Cloud Messaging integration
 * Sends push notifications to mobile devices
 * 
 * Note: This implementation uses REST API directly
 * For production, consider using firebase-admin SDK
 */

const axios = require('axios');

class FCMService {
  constructor() {
    this.projectId = process.env.FIREBASE_PROJECT_ID;
    this.privateKey = process.env.FIREBASE_PRIVATE_KEY;
    this.clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    this.accessToken = null;
    this.tokenExpiry = null;
    
    if (!this.projectId || !this.privateKey || !this.clientEmail) {
      console.warn('⚠️ Firebase credentials not configured - notifications will be disabled');
    }
  }

  /**
   * Get OAuth2 access token for Firebase
   * Uses service account credentials
   */
  async getAccessToken() {
    try {
      // Return cached token if still valid
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      if (!this.privateKey || !this.clientEmail) {
        throw new Error('Firebase credentials not configured');
      }

      // For simplicity, we'll use a mock token in development
      // In production, implement proper JWT signing with Google OAuth2
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEV] Using mock FCM token');
        return 'dev-mock-token';
      }

      // TODO: Implement proper OAuth2 token generation
      // This requires jwt library and Google OAuth2 endpoints
      throw new Error('FCM token generation not implemented. Use firebase-admin SDK in production.');
      
    } catch (error) {
      console.error('FCM Get Access Token Error:', error.message);
      throw error;
    }
  }

  /**
   * Send notification to single device
   * 
   * @param {string} fcmToken - Device FCM token
   * @param {Object} notification - { title, body }
   * @param {Object} data - Additional data payload
   * @returns {Promise<Object>} { success, messageId?, error? }
   */
  async sendToDevice(fcmToken, notification, data = {}) {
    try {
      if (!this.projectId) {
        throw new Error('Firebase project ID not configured');
      }

      if (!fcmToken) {
        return {
          success: false,
          error: 'FCM token is required'
        };
      }

      // Development mode - simulate success
      if (process.env.NODE_ENV === 'development') {
        console.log('========================================');
        console.log('[DEV] FCM Notification (Simulated):');
        console.log('To:', fcmToken);
        console.log('Title:', notification.title);
        console.log('Body:', notification.body);
        console.log('Data:', data);
        console.log('========================================');
        
        return {
          success: true,
          messageId: `dev-${Date.now()}`,
          isDevelopment: true
        };
      }

      // Production mode - send via FCM API
      const accessToken = await this.getAccessToken();

      const message = {
        message: {
          token: fcmToken,
          notification: {
            title: notification.title,
            body: notification.body
          },
          data: this._convertDataToStrings(data),
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'order_updates'
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1
              }
            }
          }
        }
      };

      const response = await axios.post(
        `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`,
        message,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.name
      };
    } catch (error) {
      console.error('FCM Send To Device Error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Send notification to multiple devices
   * 
   * @param {Array<string>} fcmTokens - Array of device FCM tokens
   * @param {Object} notification - { title, body }
   * @param {Object} data - Additional data payload
   * @returns {Promise<Object>} { success, successCount, failureCount, results }
   */
  async sendToMultipleDevices(fcmTokens, notification, data = {}) {
    try {
      if (!fcmTokens || fcmTokens.length === 0) {
        return {
          success: false,
          error: 'No FCM tokens provided'
        };
      }

      const results = await Promise.all(
        fcmTokens.map(token => this.sendToDevice(token, notification, data))
      );

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      return {
        success: successCount > 0,
        successCount,
        failureCount,
        results
      };
    } catch (error) {
      console.error('FCM Send To Multiple Devices Error:', error.message);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send notification to topic
   * 
   * @param {string} topic - Topic name
   * @param {Object} notification - { title, body }
   * @param {Object} data - Additional data payload
   * @returns {Promise<Object>} { success, messageId?, error? }
   */
  async sendToTopic(topic, notification, data = {}) {
    try {
      if (!this.projectId) {
        throw new Error('Firebase project ID not configured');
      }

      // Development mode - simulate success
      if (process.env.NODE_ENV === 'development') {
        console.log('========================================');
        console.log('[DEV] FCM Topic Notification (Simulated):');
        console.log('Topic:', topic);
        console.log('Title:', notification.title);
        console.log('Body:', notification.body);
        console.log('========================================');
        
        return {
          success: true,
          messageId: `dev-topic-${Date.now()}`,
          isDevelopment: true
        };
      }

      const accessToken = await this.getAccessToken();

      const message = {
        message: {
          topic,
          notification: {
            title: notification.title,
            body: notification.body
          },
          data: this._convertDataToStrings(data)
        }
      };

      const response = await axios.post(
        `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`,
        message,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        messageId: response.data.name
      };
    } catch (error) {
      console.error('FCM Send To Topic Error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Convert data object to strings (FCM requirement)
   */
  _convertDataToStrings(data) {
    const stringData = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        stringData[key] = String(value);
      }
    }
    
    return stringData;
  }

  /**
   * Validate FCM token format
   */
  isValidToken(token) {
    if (!token || typeof token !== 'string') {
      return false;
    }
    
    // FCM tokens are typically 152+ characters
    return token.length > 100;
  }
}

module.exports = new FCMService();