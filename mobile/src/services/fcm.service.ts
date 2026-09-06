/**
 * FCM Notification Service
 * Handles Firebase Cloud Messaging for push notifications
 */

import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import { apiClient } from './api.service';

class FCMService {
  /**
   * Request notification permissions
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true; // No permission needed for Android < 13
      }

      // iOS
      const authStatus = await messaging().requestPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  /**
   * Get FCM token
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.error('Get FCM token error:', error);
      return null;
    }
  }

  /**
   * Register FCM token with backend
   */
  async registerToken(token: string): Promise<boolean> {
    try {
      await apiClient.post('/notifications/register-token', {
        token,
        device: Platform.OS === 'ios' ? 'ios' : 'android',
      });
      return true;
    } catch (error) {
      console.log('Register token error (ignoring):', error);
      return false;
    }
  }

  /**
   * Initialize FCM
   * Call this on app startup after user login
   */
  async initialize(): Promise<void> {
    try {
      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('Notification permission denied');
        return;
      }

      // Get token
      const token = await this.getToken();
      if (!token) {
        console.log('Failed to get FCM token');
        return;
      }

      // Register token with backend (Silent)
      this.registerToken(token).catch(() => {});

      // Subscribe to global broadcasts
      messaging().subscribeToTopic('all_users').catch((err) => console.log('Topic sub error:', err));
      
      // Listen for token refresh (Silent)
      messaging().onTokenRefresh((newToken) => {
        this.registerToken(newToken).catch(() => {});
      });
    } catch (error) {
      console.error('FCM initialization error:', error);
    }
  }

  /**
   * Handle foreground notifications
   * Returns unsubscribe function
   */
  onMessageReceived(handler: (message: any) => void): () => void {
    return messaging().onMessage(handler);
  }

  /**
   * Handle background/quit state notification press
   */
  async getInitialNotification(): Promise<any | null> {
    try {
      const message = await messaging().getInitialNotification();
      return message;
    } catch (error) {
      console.error('Get initial notification error:', error);
      return null;
    }
  }

  /**
   * Handle notification press when app is in background
   */
  onNotificationOpenedApp(handler: (message: any) => void): () => void {
    return messaging().onNotificationOpenedApp(handler);
  }

  /**
   * Set badge count (iOS only)
   */
  async setBadgeCount(count: number): Promise<void> {
    if (Platform.OS === 'ios') {
      try {
        // Note: Firebase Messaging does not have a setBadge API.
        // Use @notifee/react-native setBadgeCount() or expo-notifications for badge management.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (messaging() as any).setBadge?.(count);
      } catch (error) {
        console.error('Set badge error:', error);
      }
    }
  }
}

export const fcmService = new FCMService();
