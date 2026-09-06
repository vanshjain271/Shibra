/**
 * Coupon Model - MVP
 * 
 * Discount coupons for promotional campaigns
 * Supports percentage and fixed amount discounts
 */

const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [20, 'Coupon code cannot exceed 20 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    default: ''
  },
  // Discount type
  type: {
    type: String,
    enum: ['PERCENTAGE', 'FIXED'],
    required: true
  },
  // Discount value
  value: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value cannot be negative']
  },
  // Minimum order amount to apply coupon
  minOrderAmount: {
    type: Number,
    default: 0,
    min: [0, 'Minimum order amount cannot be negative']
  },
  // Maximum discount amount (for percentage discounts)
  maxDiscountAmount: {
    type: Number,
    default: null,
    min: [0, 'Maximum discount amount cannot be negative']
  },
  // Usage limits
  usageLimit: {
    type: Number,
    default: null, // null = unlimited
    min: [1, 'Usage limit must be at least 1']
  },
  usageCount: {
    type: Number,
    default: 0,
    min: [0, 'Usage count cannot be negative']
  },
  // Per-user limit
  perUserLimit: {
    type: Number,
    default: 1,
    min: [1, 'Per user limit must be at least 1']
  },
  // Validity period
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  // Applicable to specific products/categories
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  // User restrictions
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }], // Empty array = all users
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  // Usage tracking
  usedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usageCount: {
      type: Number,
      default: 1
    },
    lastUsedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret.usedBy;
      return ret;
    }
  }
});

// Indexes
couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ isActive: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });

/**
 * Validation: End date must be after start date
 */
couponSchema.pre('validate', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

/**
 * Instance Method: Check if coupon is valid
 */
couponSchema.methods.isValid = function() {
  const now = new Date();
  
  // Check if active
  if (!this.isActive) {
    return { valid: false, reason: 'Coupon is inactive' };
  }
  
  // Check date validity
  if (now < this.startDate) {
    return { valid: false, reason: 'Coupon not yet valid' };
  }
  
  if (now > this.endDate) {
    return { valid: false, reason: 'Coupon has expired' };
  }
  
  // Check usage limit
  if (this.usageLimit && this.usageCount >= this.usageLimit) {
    return { valid: false, reason: 'Coupon usage limit reached' };
  }
  
  return { valid: true };
};

/**
 * Instance Method: Check if user can use coupon
 */
couponSchema.methods.canUserUse = function(userId) {
  // Check if user-specific coupon
  if (this.allowedUsers.length > 0) {
    const isAllowed = this.allowedUsers.some(
      id => id.toString() === userId.toString()
    );
    
    if (!isAllowed) {
      return { canUse: false, reason: 'Coupon not applicable to this user' };
    }
  }
  
  // Check per-user limit
  const userUsage = this.usedBy.find(
    u => u.user.toString() === userId.toString()
  );
  
  if (userUsage && userUsage.usageCount >= this.perUserLimit) {
    return { canUse: false, reason: 'User usage limit reached' };
  }
  
  return { canUse: true };
};

/**
 * Instance Method: Calculate discount
 */
couponSchema.methods.calculateDiscount = function(orderAmount, items = []) {
  // Check minimum order amount
  if (orderAmount < this.minOrderAmount) {
    return {
      applicable: false,
      reason: `Minimum order amount is ₹${this.minOrderAmount}`,
      discount: 0
    };
  }
  
  // Calculate applicable amount
  let applicableAmount = orderAmount;
  
  // If specific products/categories are defined, calculate only for those
  if (this.applicableProducts.length > 0 || this.applicableCategories.length > 0) {
    applicableAmount = 0;
    
    for (const item of items) {
      const isApplicable = 
        this.applicableProducts.some(id => id.toString() === item.product.toString()) ||
        this.applicableCategories.some(id => id.toString() === item.category?.toString());
      
      if (isApplicable) {
        applicableAmount += item.total;
      }
    }
    
    if (applicableAmount === 0) {
      return {
        applicable: false,
        reason: 'No applicable items in cart',
        discount: 0
      };
    }
  }
  
  // Calculate discount
  let discount = 0;
  
  if (this.type === 'PERCENTAGE') {
    discount = (applicableAmount * this.value) / 100;
    
    // Apply max discount cap
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
  } else {
    // FIXED discount
    discount = this.value;
    
    // Don't exceed order amount
    if (discount > orderAmount) {
      discount = orderAmount;
    }
  }
  
  return {
    applicable: true,
    discount: Math.round(discount * 100) / 100,
    applicableAmount
  };
};

/**
 * Instance Method: Record usage
 */
couponSchema.methods.recordUsage = function(userId) {
  // Increment global usage count
  this.usageCount += 1;
  
  // Update user-specific usage
  const userUsage = this.usedBy.find(
    u => u.user.toString() === userId.toString()
  );
  
  if (userUsage) {
    userUsage.usageCount += 1;
    userUsage.lastUsedAt = new Date();
  } else {
    this.usedBy.push({
      user: userId,
      usageCount: 1,
      lastUsedAt: new Date()
    });
  }
};

/**
 * Static: Get active coupons
 */
couponSchema.statics.getActiveCoupons = function() {
  const now = new Date();
  
  return this.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).select('-usedBy');
};

module.exports = mongoose.model('Coupon', couponSchema);