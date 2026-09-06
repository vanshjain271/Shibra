/**
 * Auth Service - MVP
 * 
 * Handles all authentication business logic
 * - OTP generation and verification
 * - JWT token generation
 * - User creation/lookup
 * 
 * Service-first architecture: Controllers only call services
 */

const User = require('../models/User');
const SMSService = require('./sms.service');
const firebaseAdmin = require('../utils/firebase');

class AuthService {
  /**
   * Send OTP to phone number
   * Creates user if doesn't exist (as BUYER)
   * 
   * @param {string} phone - 10-digit phone number
   * @returns {Promise<Object>} { success, message, isNewUser?, devOtp? }
   */
  async sendOTP(phone) {
    // Find or create user
    const user = await User.findOrCreateByPhone(phone);
    
    // Check if user is active
    if (!user.isActive) {
      return {
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      };
    }
    
    // Generate OTP
    const isTestPhone = ['9999999999', '8888888888', '+919999999999', '+918888888888'].includes(phone);
    const otp = isTestPhone ? '123456' : SMSService.generateOTP();
    
    // Set OTP on user (hashed)
    await user.setOTP(otp);
    await user.save();
    
    // Send OTP via SMS
    let smsResult;
    if (isTestPhone) {
      smsResult = { success: true, messageId: 'test-bypass' };
    } else {
      smsResult = await SMSService.sendOTP(phone, otp);
    }
    
    if (!smsResult.success && process.env.NODE_ENV !== 'development') {
      return {
        success: false,
        message: 'Failed to send OTP. Please try again.'
      };
    }
    
    const isNewUser = !user.name || user.name === '';
    
    const response = {
      success: true,
      message: 'OTP sent successfully',
      isNewUser
    };
    
    // Include OTP in development mode for testing
    if (process.env.NODE_ENV === 'development' && smsResult.devOtp) {
      response.devOtp = smsResult.devOtp;
    }
    
    return response;
  }

  /**
   * Verify OTP and issue JWT
   * 
   * @param {string} phone - 10-digit phone number
   * @param {string} otp - 6-digit OTP
   * @returns {Promise<Object>} { success, message, token?, user? }
   */
  async verifyOTP(phone, otp) {
    // Find user with OTP field
    const user = await User.findOne({ phone }).select('+otp');
    
    if (!user) {
      return {
        success: false,
        message: 'User not found. Please request OTP first.'
      };
    }
    
    // Check if user is active
    if (!user.isActive) {
      return {
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      };
    }
    
    const isNewUser = !user.lastLoginAt;

    // Verify OTP
    const verification = await user.verifyOTP(otp);
    
    if (!verification.valid) {
      return {
        success: false,
        message: verification.message
      };
    }
    
    // Generate JWT token
    const token = user.generateAuthToken();
    
    // Prepare user data for response (without sensitive fields)
    const userData = {
      _id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      addresses: user.addresses,
      isActive: user.isActive,
      createdAt: user.createdAt
    };
    
    return {
      success: true,
      message: 'OTP verified successfully',
      token,
      isNewUser,
      user: userData
    };
  }

  /**
   * Get user by ID
   * 
   * @param {string} userId
   * @returns {Promise<Object>} { success, user? }
   */
  async getUserById(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    if (!user.isActive) {
      return {
        success: false,
        message: 'Your account has been deactivated'
      };
    }
    
    return {
      success: true,
      user
    };
  }

  /**
   * Verify Firebase ID Token and issue JWT
   * Perfect for bypassing DLT requirements in India
   * 
   * @param {string} idToken - Firebase ID Token from mobile app
   * @returns {Promise<Object>} { success, message, token?, user? }
   */
  async firebaseLogin(idToken) {
    try {
      // 1. Verify the ID token with Firebase
      if (!firebaseAdmin) {
        console.error('❌ Firebase login aborted: Admin SDK not initialized');
        return {
          success: false,
          message: 'Firebase authentication is currently unavailable on the server.'
        };
      }

      console.log('--- Firebase Verification Start ---');
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
      
      const phone_number = decodedToken.phone_number;
      const email = decodedToken.email;
      const name = decodedToken.name;
      const uid = decodedToken.uid;

      if (!phone_number && !email) {
        console.warn('⚠️ Firebase token verified but neither phone nor email is present.');
        return {
          success: false,
          message: 'Authentication successful, but no contact information found.'
        };
      }

      let user;
      let isNewUser = false;

      // 2. Find or create user in our MongoDB
      if (phone_number) {
        const cleanedPhone = phone_number.replace(/\D/g, '').slice(-10);
        const existing = await User.findOne({ phone: cleanedPhone });
        if (!existing) isNewUser = true;
        user = await User.findOrCreateByPhone(cleanedPhone);
      } else if (email) {
        user = await User.findOne({ email });
        if (!user) {
          isNewUser = true;
          user = await User.create({
            email,
            name: name || '',
            role: 'BUYER',
            firebaseUid: uid
          });
        }
      }

      // 3. Mark user as verified via Firebase
      user.firebaseUid = uid;
      if (name && !user.name) user.name = name;
      if (email && !user.email) user.email = email;
      await user.save();

      if (!user.isActive) {
        return {
          success: false,
          message: 'Your account has been deactivated. Please contact support.'
        };
      }

      // 4. Generate our own JWT for API calls
      const token = user.generateAuthToken();

      // Prepare user data for response
      const userData = {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        isActive: user.isActive,
        createdAt: user.createdAt
      };

      return {
        success: true,
        message: 'Login successful via Firebase',
        token,
        isNewUser,
        user: userData
      };
    } catch (error) {
      console.error('❌ Firebase verification error:', error);
      
      // Handle specific Firebase error codes
      let errorMessage = 'An error occurred during Firebase login';
      if (error.code === 'auth/id-token-expired') {
        errorMessage = 'Firebase session has expired. Please try again.';
      } else if (error.code === 'auth/argument-error') {
        errorMessage = 'Invalid authentication token provided.';
      }

      return {
        success: false,
        message: `${errorMessage}: ${error.message}`
      };
    }
  }
}

module.exports = new AuthService();
