/**
 * User Model - MVP
 * 
 * Roles: BUYER, ADMIN
 * No approval flow in MVP
 * No wallet/referral features
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Address Sub-Schema
const addressSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^(?:\+91)?[6-9]\d{9}$/, 'Invalid phone number']
  },
  addressLine1: {
    type: String,
    required: [true, 'Address line 1 is required'],
    trim: true,
    maxlength: [200, 'Address too long']
  },
  addressLine2: {
    type: String,
    trim: true,
    maxlength: [200, 'Address too long'],
    default: ''
  },
  landmark: {
    type: String,
    trim: true,
    maxlength: [100, 'Landmark too long'],
    default: ''
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [50, 'City name too long']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [50, 'State name too long']
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    trim: true,
    match: [/^\d{6}$/, 'Invalid pincode']
  }
}, { _id: true, timestamps: true });

// OTP Sub-Schema
const otpSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  }
}, { _id: false });

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
    default: ''
  },
  phone: {
    type: String,
    sparse: true,
    trim: true,
    match: [/^(?:\+91)?[6-9]\d{9}$/, 'Invalid Indian phone number']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true, // Allow null but unique when present
    match: [/^\S+@\S+\.\S+$/, 'Invalid email address']
  },
  password: {
    type: String,
    select: false, // Only for employees
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['BUYER', 'ADMIN', 'EMPLOYEE'],
    default: 'BUYER'
  },
  // Permissions for EMPLOYEE role
  permissions: {
    type: [String],
    enum: [
      'products.view', 'products.manage',
      'orders.view', 'orders.manage',
      'invoices.view', 'invoices.manage',
      'customers.view', 'customers.manage',
      'reports.view',
      'settings.manage',
      'coupons.view', 'coupons.manage',
      'brands.view', 'brands.manage',
      'categories.view', 'categories.manage'
    ],
    default: []
  },
  // Who created this employee (for audit)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  addresses: {
    type: [addressSchema],
    default: []
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  otp: {
    type: otpSchema,
    select: false
  },
  fcmTokens: [{
    token: {
      type: String,
      required: true
    },
    device: {
      type: String,
      enum: ['android', 'ios', 'web'],
      default: 'android'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.otp;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

/**
 * Generate JWT token
 * Payload: userId, role
 * Expiry: 7 days
 */
userSchema.methods.generateAuthToken = function () {
  const payload = {
    userId: this._id,
    role: this.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * Set OTP (hashed)
 * @param {string} otp - Plain OTP
 */
userSchema.methods.setOTP = async function (otp) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(otp, salt);

  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;

  this.otp = {
    hash,
    expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
    attempts: 0
  };
};

/**
 * Verify OTP
 * @param {string} otp - Plain OTP to verify
 * @returns {Object} { valid: boolean, message: string }
 */
userSchema.methods.verifyOTP = async function (otp) {
  // Check if it's the Google Play Console review test account
  if (['9999999999', '8888888888'].includes(this.phone) && otp === '123456') {
    this.otp = undefined;
    this.lastLoginAt = new Date();
    await this.save();
    return { valid: true, message: 'OTP verified successfully.' };
  }

  if (!this.otp || !this.otp.hash) {
    return { valid: false, message: 'No OTP found. Please request a new OTP.' };
  }

  const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS) || 3;

  if (this.otp.attempts >= maxAttempts) {
    return { valid: false, message: 'Maximum attempts exceeded. Please request a new OTP.' };
  }

  if (new Date() > this.otp.expiresAt) {
    return { valid: false, message: 'OTP has expired. Please request a new OTP.' };
  }

  const isMatch = await bcrypt.compare(otp, this.otp.hash);

  if (!isMatch) {
    this.otp.attempts += 1;
    await this.save();

    const remainingAttempts = maxAttempts - this.otp.attempts;
    return {
      valid: false,
      message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
    };
  }

  // OTP is valid - clear it
  this.otp = undefined;
  this.lastLoginAt = new Date();
  await this.save();

  return { valid: true, message: 'OTP verified successfully.' };
};

/**
 * Clear OTP (after successful verification or manual invalidation)
 */
userSchema.methods.clearOTP = function () {
  this.otp = undefined;
};

/**
 * Static: Find by phone or create new user
 * @param {string} phone
 * @returns {User}
 */
userSchema.statics.findOrCreateByPhone = async function (phone) {
  let user = await this.findOne({ phone });

  if (!user) {
    user = new this({
      phone,
      role: 'BUYER'
    });
  }

  return user;
};

module.exports = mongoose.model('User', userSchema);
