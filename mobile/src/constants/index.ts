/**
 * Centralized Constants
 * Exports all constants used in the app
 */

export * from './api';
export * from './theme';

// Storage Keys for AsyncStorage
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user_data',
  FCM_TOKEN: 'fcm_token',
  CART: 'cart_data',
  SETTINGS: 'app_settings',
};

// Common Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  TIMEOUT_ERROR: 'Request timed out. Please try again later.',
  UNAUTHORIZED: 'Session expired. Please login again.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
  VALIDATION_ERROR: 'Please check the information you entered.',
  SERVER_ERROR: 'Our servers are experiencing issues. Please try again later.',
};

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 15000,
  BASE_URL: 'https://api.shibra.in/api/v1',
};
