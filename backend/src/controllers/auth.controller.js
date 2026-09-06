/**
 * Auth Controller - MVP
 * 
 * STRICT RULES:
 * - No DB calls
 * - No OTP generation logic
 * - No SMS calls
 * - Only input validation + service calls
 */

const AuthService = require('../services/auth.service');

/**
 * @desc    Send OTP to phone number
 * @route   POST /api/v1/auth/send-otp
 * @access  Public
 */
const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    
    const result = await AuthService.sendOTP(phone);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    // Build response
    const response = {
      success: true,
      message: result.message,
      isNewUser: result.isNewUser
    };
    
    // Include OTP in development mode
    if (result.devOtp) {
      response.devOtp = result.devOtp;
    }
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Send OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while sending OTP'
    });
  }
};

/**
 * @desc    Verify OTP and issue JWT
 * @route   POST /api/v1/auth/verify-otp
 * @access  Public
 */
const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    const result = await AuthService.verifyOTP(phone, otp);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(200).json({
      success: true,
      message: result.message,
      token: result.token,
      isNewUser: result.isNewUser,
      user: result.user
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while verifying OTP'
    });
  }
};

/**
 * @desc    Verify Firebase ID Token and issue JWT
 * @route   POST /api/v1/auth/firebase-login
 * @access  Public
 */
const firebaseLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Firebase ID Token is required'
      });
    }

    const result = await AuthService.firebaseLogin(idToken);
    
    if (!result.success) {
      return res.status(401).json(result);
    }
    
    return res.status(200).json({
      success: true,
      message: result.message,
      token: result.token,
      isNewUser: result.isNewUser,
      user: result.user
    });
  } catch (error) {
    console.error('Firebase Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during Firebase login'
    });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  firebaseLogin
};
