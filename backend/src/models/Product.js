/**
 * Product Model - MVP
 * 
 * Products with unlimited variants
 * No payment mode per product in MVP (global settings only)
 */

const mongoose = require('mongoose');

// Variant Sub-Schema
const variantSchema = new mongoose.Schema({
  sku: {
    type: String,
    trim: true
  },
  name: {
    type: String,
    trim: true,
    maxlength: [200, 'Variant name too long']
  },
  color: {
    type: String,
    trim: true,
    default: ''
  },
  // Variant attributes (e.g., { "Color": "Black", "Model": "S24" })
  attributes: {
    type: Map,
    of: String,
    default: new Map()
  },
  images: [{
    type: String
  }],
  salePrice: {
    type: Number,
    min: [0, 'Sale price cannot be negative']
  },
  mrp: {
    type: Number,
    min: [0, 'MRP cannot be negative']
  },
  costPrice: {
    type: Number,
    default: 0,
    min: [0, 'Cost price cannot be negative']
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: true, timestamps: true });

// Product Schema
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [500, 'Short description cannot exceed 500 characters'],
    default: ''
  },
  // Primary images
  images: [{
    type: String
  }],
  // Category references
  category: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'At least one category is required']
  }],
  // Brand reference
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand'
  },
  // Base SKU (used when no variants)
  sku: {
    type: String,
    trim: true
  },
  // Base pricing (used when no variants)
  salePrice: {
    type: Number,
    required: [true, 'Sale price is required'],
    min: [0, 'Sale price cannot be negative']
  },
  mrp: {
    type: Number,
    required: [true, 'MRP is required'],
    min: [0, 'MRP cannot be negative']
  },
  costPrice: {
    type: Number,
    default: 0,
    min: [0, 'Cost price cannot be negative']
  },
  // Base stock (used when no variants)
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  // HSN Code for GST
  hsnCode: {
    type: String,
    trim: true,
    default: ''
  },
  // Additional Fields from Frontend
  colour: {
    type: String,
    trim: true,
    default: ''
  },
  modal: {
    type: String,
    trim: true,
    default: ''
  },
  youtubeUrl: {
    type: String,
    trim: true,
    default: ''
  },
  // Tax rate percentage
  taxRate: {
    type: Number,
    default: 0,
    min: [0, 'Tax rate cannot be negative'],
    max: [100, 'Tax rate cannot exceed 100']
  },
  // Lot Purchasing Features
  isLot: {
    type: Boolean,
    default: false
  },
  lotDetails: {
    fullLotQuantity: { type: Number, default: 0 },
    fullLotPrice: { type: Number, default: 0 },
    allowHalfLot: { type: Boolean, default: false },
    halfLotQuantity: { type: Number, default: 0 },
    halfLotPrice: { type: Number, default: 0 },
    allowMiniLot: { type: Boolean, default: false },
    miniLotQuantity: { type: Number, default: 0 },
    miniLotPrice: { type: Number, default: 0 }
  },
  // Variants
  variants: {
    type: [variantSchema],
    default: []
  },
  hasVariants: {
    type: Boolean,
    default: false
  },
  // Minimum order quantity
  minOrderQty: {
    type: Number,
    default: 1,
    min: [1, 'Minimum order quantity must be at least 1']
  },
  // Maximum order quantity (0 = unlimited)
  maxOrderQty: {
    type: Number,
    default: 0,
    min: [0, 'Maximum order quantity cannot be negative']
  },
  // Low stock threshold for alerts
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: [0, 'Low stock threshold cannot be negative']
  },
  // Unit
  unit: {
    type: String,
    default: 'Pcs'
  },
  // Warranty
  warranty: {
    type: String,
    trim: true,
    default: ''
  },
  // Visibility
  isActive: {
    type: Boolean,
    default: true
  },
  // Sorting
  sortOrder: {
    type: Number,
    default: 0
  },
  // Search tags
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  // Homepage toggles
  homepageSections: {
    type: [String],
    default: []
  },
  // Bulk/Tiered Pricing
  bulkPricing: [{
    minQty: { type: Number, required: true },
    salePrice: { type: Number, required: true }
  }],
  // Payment Mode
  paymentMode: {
    type: String,
    enum: ['default', 'cod', 'prepaid'],
    default: 'default'
  },
  // Mobile Models for bulk ordering (e.g. Tempered Glass for 50 different phones)
  availableModels: [{
    name: { type: String, required: true },
    stock: { type: Number, default: 0, min: 0 }
  }],
  hasModels: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true
  }
});

// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ salePrice: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ sortOrder: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ 'variants.sku': 1 });

/**
 * Pre-save: Generate slug and set hasVariants
 */
productSchema.pre('save', function (next) {
  // Generate slug
  if (this.isModified('name') || !this.slug) {
    const randomStr = Math.random().toString(36).substring(2, 8);
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + randomStr;
  }

  // Handle variants parsing (if stringified from FormData)
  if (typeof this.variants === 'string') {
    try {
      this.variants = JSON.parse(this.variants);
    } catch (e) {
      console.error('Failed to parse variants string in pre-save:', e);
    }
  }

  // Handle models parsing
  if (typeof this.availableModels === 'string') {
    try {
      this.availableModels = JSON.parse(this.availableModels);
    } catch (e) {
      console.error('Failed to parse availableModels string in pre-save:', e);
    }
  }

  // Set hasModels flag
  this.hasModels = this.availableModels && this.availableModels.length > 0;

  // Set hasVariants flag
  this.hasVariants = this.variants && this.variants.length > 0;

  // Populate missing variant fields from parent
  if (this.hasVariants) {
    this.variants.forEach((variant, index) => {
      // Inherit pricing
      if (!variant.salePrice || variant.salePrice === 0) variant.salePrice = this.salePrice;
      if (!variant.mrp || variant.mrp === 0) variant.mrp = this.mrp;
      if (!variant.stock || variant.stock === 0) variant.stock = 0; 
      
      // Generate partial name if empty
      if (!variant.name) {
        variant.name = variant.color ? `${this.name} (${variant.color})` : `${this.name} - Variant ${index + 1}`;
      }

      // Auto-generate SKU if missing
      if (!variant.sku) {
        const parentSku = this.sku || this.name.substring(0, 5);
        variant.sku = `${parentSku}-V${index + 1}`;
      }
    });
  }

  next();
});

/**
 * Virtual: Discount percentage
 */
productSchema.virtual('discountPercentage').get(function () {
  if (this.mrp > 0 && this.salePrice < this.mrp) {
    return Math.round(((this.mrp - this.salePrice) / this.mrp) * 100);
  }
  return 0;
});

/**
 * Virtual: Total stock (including variants and models)
 */
productSchema.virtual('totalStock').get(function () {
  let stock = this.stock || 0;
  if (this.hasVariants && this.variants.length > 0) {
    stock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  } else if (this.hasModels && this.availableModels.length > 0) {
    stock = this.availableModels.reduce((sum, m) => sum + (m.stock || 0), 0);
  }
  return stock;
});

/**
 * Virtual: In stock status
 */
productSchema.virtual('inStock').get(function () {
  return this.totalStock > 0;
});

/**
 * Virtual: Price range (for products with variants)
 */
productSchema.virtual('priceRange').get(function () {
  if (this.hasVariants && this.variants.length > 0) {
    const prices = this.variants.filter(v => v.isActive).map(v => v.salePrice);
    if (prices.length > 0) {
      return {
        min: Math.min(...prices),
        max: Math.max(...prices)
      };
    }
  }
  return {
    min: this.salePrice,
    max: this.salePrice
  };
});

/**
 * Method: Get variant by ID
 */
productSchema.methods.getVariantById = function (variantId) {
  if (!this.hasVariants) return null;
  return this.variants.id(variantId);
};

/**
 * Method: Get variant by SKU
 */
productSchema.methods.getVariantBySku = function (sku) {
  if (!this.hasVariants) return null;
  return this.variants.find(v => v.sku === sku);
};

/**
 * Method: Check if SKU exists in variants
 */
productSchema.methods.skuExists = function (sku, excludeVariantId = null) {
  return this.variants.some(v => {
    if (excludeVariantId && v._id.toString() === excludeVariantId.toString()) {
      return false;
    }
    return v.sku === sku;
  });
};

/**
 * Static: Get active products with pagination
 */
productSchema.statics.getActiveProducts = async function (options = {}) {
  const {
    page = 1,
    limit = 20,
    categoryId,
    brandId,
    search,
    homepageSection,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const query = { isActive: true };

  if (homepageSection) {
    query.homepageSections = homepageSection;
  }

  if (categoryId) {
    query.category = { $in: [categoryId] };
  }



  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [products, total] = await Promise.all([
    this.find(query)
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    this.countDocuments(query)
  ]);

  return {
    products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

module.exports = mongoose.model('Product', productSchema);
