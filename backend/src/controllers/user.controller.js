/**
 * User Controller - MVP
 * 
 * STRICT RULES:
 * - No DB calls
 * - Only input validation + service calls
 * - Role checks handled by middleware
 */

const UserService = require('../services/user.service');

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/users/me
 * @access  Buyer, Admin
 */
const getProfile = async (req, res) => {
  try {
    const result = await UserService.getProfile(req.user.userId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    
    return res.status(200).json({
      success: true,
      user: result.user
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching profile'
    });
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/v1/users/me
 * @access  Buyer, Admin
 * @body    { name?, addresses? }
 */
const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, addresses } = req.body;
    
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (addresses !== undefined) updates.addresses = addresses;
    
    const result = await UserService.updateProfile(req.user.userId, updates);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(200).json({
      success: true,
      message: result.message,
      user: result.user
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({
        success: false,
        message: `This ${field} is already registered with another account.`
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while updating profile'
    });
  }
};

/**
 * @desc    Update or add FCM token
 * @route   POST /api/v1/users/fcm-token
 * @access  Buyer, Admin
 */
const updateFCMToken = async (req, res) => {
  try {
    const { token, device } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required' });
    }

    const result = await UserService.updateFCMToken(req.user.userId, token, device);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Update FCM Token Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Remove FCM token
 * @route   DELETE /api/v1/users/fcm-token
 * @access  Buyer, Admin
 */
const removeFCMToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required' });
    }

    const result = await UserService.removeFCMToken(req.user.userId, token);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Remove FCM Token Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getWishlist = async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user.userId).populate('wishlist');
    return res.status(200).json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    console.error('Get Wishlist Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await require('../models/User').findById(req.user.userId);
    const index = user.wishlist.findIndex(id => id.toString() === productId.toString());
    if (index === -1) {
      user.wishlist.push(productId);
    } else {
      user.wishlist.splice(index, 1);
    }
    await user.save();
    return res.status(200).json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    console.error('Toggle Wishlist Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateFCMToken,
  removeFCMToken,
  getWishlist,
  toggleWishlist
};
