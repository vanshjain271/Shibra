/**
 * Auth Middleware - MVP
 * 
 * - JWT verification
 * - Role-based access control
 * - Attaches req.user
 * 
 * No role logic inside controllers - all handled here
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT token and attach user to request
 * Required for all protected routes
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated.'
      });
    }
    
    // Attach user to request
    req.user = {
      userId: user._id,
      phone: user.phone,
      role: user.role,
      name: user.name,
      permissions: user.permissions || []
    };
    
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    
    // Check for DB connection errors specifically
    if (error.name === 'MongoServerSelectionError' || error.name === 'MongoNetworkError' || error.message.includes('getaddrinfo')) {
      return res.status(503).json({
        success: false,
        message: 'Database connection failed. Please contact the administrator.',
        error: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
};

/**
 * Authorize specific roles
 * Must be used after authenticate middleware
 * 
 * @param {...string} allowedRoles - Roles that can access the route
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.'
      });
    }
    
    next();
  };
};

/**
 * Buyer only access
 */
const buyerOnly = [authenticate, authorize('BUYER')];

/**
 * Admin only access
 */
const adminOnly = [authenticate, authorize('ADMIN')];

/**
 * Buyer or Admin access
 */
const buyerOrAdmin = [authenticate, authorize('BUYER', 'ADMIN')];

module.exports = {
  authenticate,
  authorize,
  buyerOnly,
  adminOnly,
  buyerOrAdmin
};
