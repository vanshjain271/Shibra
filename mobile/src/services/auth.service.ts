/**
 * Auth Service - Authentication API calls
 */

import apiClient from './api.service';
import { AuthResponse, User } from '../types/api.types';

export interface SendOTPRequest {
  phone: string;
}

export interface VerifyOTPRequest {
  phone: string;
  otp: string;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
  isNewUser: boolean;
  devOtp?: string; // Only in development
}

import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

class AuthService {
  private lastConfirmation: FirebaseAuthTypes.ConfirmationResult | null = null;

  /**
   * Send OTP to phone number using Firebase
   */
  async sendOTP(phone: string): Promise<{ success: boolean }> {
    try {
      // Add country code if missing
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      console.log('[Auth] Attempting signInWithPhoneNumber with:', formattedPhone);
      this.lastConfirmation = await auth().signInWithPhoneNumber(formattedPhone);
      console.log('[Auth] signInWithPhoneNumber SUCCESS');
      return { success: true };
    } catch (error: any) {
      console.error('=== FIREBASE AUTH ERROR ===');
      console.error('Code:', error?.code);
      console.error('Message:', error?.message);
      console.error('Native Code:', error?.nativeErrorCode);
      console.error('Native Message:', error?.nativeErrorMessage);
      console.error('Full error:', JSON.stringify(error, null, 2));
      console.error('==========================');
      throw error;
    }
  }

  /**
   * Verify Firebase OTP and get token
   */
  async verifyFirebaseOTP(otp: string): Promise<AuthResponse> {
    try {
      let idToken;
      
      if (!this.lastConfirmation) {
        throw new Error('No active verification session');
      }

      try {
        const userCredential = await this.lastConfirmation.confirm(otp);
        if (userCredential) {
          idToken = await userCredential.user.getIdToken();
        }
      } catch (confirmError: any) {
        // Handle Android automatic background verification
        const currentUser = auth().currentUser;
        const isSessionExpired = 
          confirmError.code === 'auth/session-expired' || 
          confirmError.message?.includes('session-expired') ||
          confirmError.message?.includes('expired');

        if (currentUser && isSessionExpired) {
          console.log('Android auto-verified the SMS in the background. Proceeding with active session.');
          idToken = await currentUser.getIdToken();
        } else {
          throw confirmError;
        }
      }

      if (!idToken) {
        throw new Error('Invalid OTP verification state');
      }
      
      // Send token to backend
      const response = await apiClient.post<AuthResponse>('/auth/firebase-login', {
        idToken,
      });

      return response;
    } catch (error: any) {
      console.error('Firebase Verify OTP Error:', error);
      
      // Log specific error codes for debugging
      if (error.code) {
        console.log('Firebase Error Code:', error.code);
      }
      
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<{ success: boolean; user: User }> {
    const response = await apiClient.get<{ success: boolean; user: User }>('/users/me');
    return response;
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: {
    name?: string;
    addresses?: any[];
  }): Promise<{ success: boolean; message: string; user: User }> {
    const response = await apiClient.put<{
      success: boolean;
      message: string;
      user: User;
    }>('/users/me', updates);
    return response;
  }
}

export const authService = new AuthService();
export default authService;
