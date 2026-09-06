/**
 * Address Controller
 * 
 * Manages user delivery addresses
 * Addresses are stored as a sub-document array in the User model
 */

const User = require('../models/User');

/**
 * @desc    Get all user addresses
 * @route   GET /api/v1/addresses
 * @access  Private
 */
exports.getAddresses = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User identification missing.'
      });
    }

    const user = await User.findById(req.user.userId).select('addresses');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      count: user.addresses.length,
      data: user.addresses
    });
  } catch (error) {
    console.error(`[GetAddresses ERROR] User: ${req.user?.userId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch addresses. Please try again.',
      debug: error.message
    });
  }
};

/**
 * @desc    Add new address
 * @route   POST /api/v1/addresses
 * @access  Private
 */
exports.addAddress = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User identification missing.'
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { name, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;

    // Create new address object
    const newAddress = {
      name,
      phone,
      addressLine1,
      addressLine2: addressLine2 || '',
      city,
      state,
      pincode
    };

    // If this is the first address or explicitly set as default
    if (user.addresses.length === 0 || isDefault) {
      // In a real app, we might need a separate isDefault field in the sub-doc
      // But the current User.js schema doesn't have it.
      // We will just push it for now.
    }

    user.addresses.push(newAddress);
    await user.save();

    // Get the newly added address (it will have an _id now)
    const addedAddress = user.addresses[user.addresses.length - 1];

    res.status(201).json({
      success: true,
      data: addedAddress
    });
  } catch (error) {
    console.error(`[AddAddress ERROR] User: ${req.user?.userId}:`, error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add address. Please try again.',
      debug: error.message
    });
  }
};

/**
 * @desc    Update address
 * @route   PATCH /api/v1/addresses/:id
 * @access  Private
 */
exports.updateAddress = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User identification missing.'
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const address = user.addresses.id(req.params.id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Update fields
    const fieldsToUpdate = ['name', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'pincode'];
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        address[field] = req.body[field];
      }
    });

    await user.save();

    res.status(200).json({
      success: true,
      data: address
    });
  } catch (error) {
    console.error(`[UpdateAddress ERROR] User: ${req.user?.userId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to update address. Please try again.',
      debug: error.message
    });
  }
};

/**
 * @desc    Delete address
 * @route   DELETE /api/v1/addresses/:id
 * @access  Private
 */
exports.deleteAddress = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User identification missing.'
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Mongoose subdocument removal
    const address = user.addresses.id(req.params.id);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    address.deleteOne();
    await user.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(`[DeleteAddress ERROR] User: ${req.user?.userId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete address. Please try again.',
      debug: error.message
    });
  }
};
