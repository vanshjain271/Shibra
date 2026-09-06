/**
 * Discount Model - MVP
 * 
 * Product-level discounts (different from coupons)
 * Applied automatically to products without code
 */

const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Discount name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
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
  // Applicable to
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  brands: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
  }],
  // Validity period
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  // Priority (higher number = higher priority)
  priority: {
    type: Number,
    default: 0
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
discountSchema.index({ isActive: 1 });
discountSchema.index({ startDate: 1, endDate: 1 });
discountSchema.index({ products: 1 });
discountSchema.index({ categories: 1 });
discountSchema.index({ priority: -1 });

/**
 * Validation: End date must be after start date
 */
discountSchema.pre('validate', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

/**
 * Instance Method: Check if discount is valid
 */
discountSchema.methods.isValid = function() {
  const now = new Date();
  
  if (!this.isActive) {
    return false;
  }
  
  if (now < this.startDate || now > this.endDate) {
    return false;
  }
  
  return true;
};

/**
 * Instance Method: Calculate discount for price
 */
discountSchema.methods.calculateDiscount = function(price) {
  if (!this.isValid()) {
    return 0;
  }
  
  if (this.type === 'PERCENTAGE') {
    return (price * this.value) / 100;
  } else {
    return this.value;
  }
};

/**
 * Static: Get active discounts for product
 */
discountSchema.statics.getActiveDiscountsForProduct = async function(productId, categoryId, brandId) {
  const now = new Date();
  
  const query = {
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { products: productId },
      { categories: categoryId },
      { brands: brandId }
    ]
  };
  
  return this.find(query).sort({ priority: -1, value: -1 });
};

module.exports = mongoose.model('Discount', discountSchema);