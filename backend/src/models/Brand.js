/**
 * Brand Model - MVP
 * 
 * Product brands (Samsung, Apple, Mi, etc.)
 */

const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Brand name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  image: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
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
brandSchema.index({ name: 1 }, { unique: true });
brandSchema.index({ slug: 1 }, { unique: true });
brandSchema.index({ isActive: 1 });
brandSchema.index({ sortOrder: 1 });

/**
 * Pre-save: Generate slug from name
 */
brandSchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

/**
 * Static: Get all active brands
 */
brandSchema.statics.getActiveBrands = function() {
  return this.find({ isActive: true }).sort('sortOrder name');
};

module.exports = mongoose.model('Brand', brandSchema);
