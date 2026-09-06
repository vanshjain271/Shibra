/**
 * Banner Model - MVP
 * 
 * Promotional banners for home screen and product pages
 */

const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Banner title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    default: ''
  },
  image: {
    type: String,
    required: [true, 'Banner image is required']
  },
  // Link/Action
  linkType: {
    type: String,
    enum: ['PRODUCT', 'CATEGORY', 'URL', 'NONE'],
    default: 'NONE'
  },
  linkTarget: {
    type: String,
    default: ''
  }, // Product ID, Category ID, or external URL
  // Placement
  placement: {
    type: String,
    enum: ['HOME_TOP', 'HOME_MIDDLE', 'HOME_BOTTOM', 'PRODUCT_PAGE', 'CART_PAGE'],
    default: 'HOME_TOP'
  },
  // Display order
  sortOrder: {
    type: Number,
    default: 0
  },
  // Validity period
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null // null = no expiry
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  // Analytics
  viewCount: {
    type: Number,
    default: 0
  },
  clickCount: {
    type: Number,
    default: 0
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
bannerSchema.index({ isActive: 1, placement: 1, sortOrder: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });

/**
 * Instance Method: Check if banner is valid
 */
bannerSchema.methods.isValid = function() {
  const now = new Date();
  
  if (!this.isActive) {
    return false;
  }
  
  if (this.startDate && now < this.startDate) {
    return false;
  }
  
  if (this.endDate && now > this.endDate) {
    return false;
  }
  
  return true;
};

/**
 * Instance Method: Increment view count
 */
bannerSchema.methods.incrementViews = function() {
  this.viewCount += 1;
};

/**
 * Instance Method: Increment click count
 */
bannerSchema.methods.incrementClicks = function() {
  this.clickCount += 1;
};

/**
 * Static: Get active banners by placement
 */
bannerSchema.statics.getActiveBanners = async function(placement) {
  const now = new Date();
  
  const query = {
    isActive: true,
    startDate: { $lte: now },
    $or: [
      { endDate: null },
      { endDate: { $gte: now } }
    ]
  };
  
  if (placement) {
    query.placement = placement;
  }
  
  return this.find(query).sort('sortOrder').lean();
};

module.exports = mongoose.model('Banner', bannerSchema);