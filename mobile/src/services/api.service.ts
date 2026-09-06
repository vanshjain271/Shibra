/**
 * API Client - Axios Configuration with Interceptors
 * Version 5.2 - Silent Firebase Build
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_CONFIG, STORAGE_KEYS, ERROR_MESSAGES } from '@constants';
import { ApiResponse } from '../types/api.types';

// Get API base URL from environment
// For local testing: Use your computer's IP address (Android) or localhost (iOS)
const getApiBaseUrl = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Config = require('react-native-config').default;
    if (Config?.API_BASE_URL) return Config.API_BASE_URL as string;
  } catch (e) {
    console.log('Config not available, using default URL');
  }

  // Production API URL
  return 'https://api.shibra.in/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];
  private unauthorizedCallback: (() => void) | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000, // Increased to 15s for better stability
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getAuthToken();

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request in development
        if (__DEV__) {
          console.log('📤 API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            data: config.data,
          });
        }

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log response in development
        if (__DEV__) {
          console.log('📥 API Response:', {
            status: response.status,
            url: response.config.url,
            data: response.data,
          });
        }

        return response;
      },
      async (error: AxiosError) => {
        return this.handleResponseError(error);
      }
    );
  }

  private async handleResponseError(error: AxiosError): Promise<never> {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Network error
    if (!error.response) {
      if (error.message === 'Network Error') {
        throw {
          success: false,
          message: ERROR_MESSAGES.NETWORK_ERROR,
          code: 'NETWORK_ERROR',
        };
      }
      if (error.code === 'ECONNABORTED') {
        throw {
          success: false,
          message: ERROR_MESSAGES.TIMEOUT_ERROR,
          code: 'TIMEOUT_ERROR',
        };
      }
      throw {
        success: false,
        message: ERROR_MESSAGES.UNKNOWN_ERROR,
        code: 'UNKNOWN_ERROR',
      };
    }

    const status = error.response.status;
    const responseData = error.response.data as any;

    // Log error in development (but don't show red screen for 400/401/500 on known non-critical routes)
    if (__DEV__) {
      const url = originalRequest.url || '';
      const isNonCritical =
        url.includes('/reviews') ||
        url.includes('/banners') ||
        url.includes('/notifications/register-token') ||
        url.includes('/addresses') ||
        url.includes('/orders') ||
        url.includes('/cart');
      if (status === 401 || status === 400 || (status >= 500 && isNonCritical)) {
        console.log(`ℹ️ [API] ${status} ${url}: Silent Mode Ignored`);
      } else if (status >= 500) {
        console.warn(`⚠️ [API] ${status} ${url}: ${responseData?.message}`);
      } else {
        console.error('❌ API Error:', { status, url, message: responseData?.message || error.message });
      }
    }

    // Handle 401 Unauthorized
    // Any 401 status indicates the token has expired or is invalid. Force a logout.
    if (status === 401 && !originalRequest._retry) {
      await this.handleUnauthorized();
      throw {
        success: false,
        message: responseData?.message || ERROR_MESSAGES.UNAUTHORIZED,
        code: 'UNAUTHORIZED',
        status: 401,
      };
    }

    // Handle 400 Bad Request - Validation errors
    if (status === 400) {
      throw {
        success: false,
        message: responseData?.message || ERROR_MESSAGES.VALIDATION_ERROR,
        errors: responseData?.errors || [],
        code: 'VALIDATION_ERROR',
        status: 400,
      };
    }

    // Handle 500 Server Error
    if (status >= 500) {
      throw {
        success: false,
        message: ERROR_MESSAGES.SERVER_ERROR,
        code: 'SERVER_ERROR',
        status,
      };
    }

    // Other errors
    throw {
      success: false,
      message: responseData?.message || ERROR_MESSAGES.UNKNOWN_ERROR,
      code: 'API_ERROR',
      status,
    };
  }

  public onUnauthorized(callback: () => void): void {
    this.unauthorizedCallback = callback;
  }

  private async handleUnauthorized(): Promise<void> {
    // Clear auth data
    await AsyncStorage.multiRemove([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.USER]);

    // Emit logout event to Redux callback listener
    if (this.unauthorizedCallback) {
      this.unauthorizedCallback();
    }
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // ==================== PUBLIC METHODS ====================

  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  // Upload file with multipart/form-data
  public async uploadFile<T = any>(
    url: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<T> {
    const response = await this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  }

  // Download file
  public async downloadFile(url: string, onDownloadProgress?: (progressEvent: any) => void): Promise<Blob> {
    const response = await this.client.get(url, {
      responseType: 'blob',
      onDownloadProgress,
    });
    return response.data;
  }

  // Get base URL
  public getBaseURL(): string {
    return API_BASE_URL;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export default
export default apiClient;
