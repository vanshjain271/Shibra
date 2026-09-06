/**
 * Auth Routes - MVP
 * 
 * POST /auth/send-otp   - Public
 * POST /auth/verify-otp - Public
 */

const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/auth.controller');
const { authValidation } = require('../middleware/validation.middleware');

/**
 * @route   POST /api/v1/auth/send-otp
 * @desc    Send OTP to phone number
 * @access  Public
 */
router.post('/send-otp', authValidation.sendOTP, AuthController.sendOTP);

router.post('/verify-otp', authValidation.verifyOTP, AuthController.verifyOTP);

/**
 * @route   POST /api/v1/auth/firebase-login
 * @desc    Verify Firebase ID Token and issue JWT
 * @access  Public
 */
router.post('/firebase-login', AuthController.firebaseLogin);

/**
 * @route   POST /api/v1/auth/employee/login
 * @desc    Employee login with email/password
 * @access  Public
 */
const employeeController = require('../controllers/employee.controller');
router.post('/employee/login', employeeController.employeeLogin);

module.exports = router;
