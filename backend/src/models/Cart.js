/**
 * Cart Model - MVP
 * 
 * Cart management with abandoned cart detection
 * Cart persists across sessions/devices
 * Linked to user account
 */

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  lotType: { type: String, enum: ["full", "half", "mini", "none"], default: "none" },
  selectedModel: { type: String, default: null },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  }
}, { _id: true, timestamps: true });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: {
    type: [cartItemSchema],
    default: []
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  isAbandoned: {
    type: Boolean,
    default: false
  },
  abandonedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
cartSchema.index({ user: 1 }, { unique: true });
cartSchema.index({ lastModified: 1 });
cartSchema.index({ isAbandoned: 1 });
cartSchema.index({ abandonedAt: 1 });

/**
 * Virtual: Item count
 */
cartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

/**
 * Pre-save: Update lastModified
 */
cartSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.lastModified = new Date();
  }
  next();
});

/**
 * Instance Method: Add item to cart
 */
cartSchema.methods.addItem = function(productId, variantId, quantity, lotType = 'none', selectedModel = null) {
  const variantIdStr = variantId ? variantId.toString() : null;
  
  // Check if item already exists
  const existingItem = this.items.find(item => {
    const itemProductId = item.product.toString();
    const itemVariantId = item.variant ? item.variant.toString() : null;
    const itemLotType = item.lotType || 'none';
    const itemSelectedModel = item.selectedModel || null;
    
    return itemProductId === productId.toString() && 
           itemVariantId === variantIdStr && 
           itemLotType === lotType && 
           itemSelectedModel === selectedModel;
  });

  if (existingItem) {
    // Update quantity
    existingItem.quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      product: productId,
      variant: variantId,
      quantity,
      lotType,
      selectedModel
    });
  }

  this.isAbandoned = false;
  this.abandonedAt = null;
};

/**
 * Instance Method: Update item quantity
 */
cartSchema.methods.updateItemQuantity = function(itemId, quantity) {
  const item = this.items.id(itemId);
  
  if (!item) {
    return { success: false, message: 'Item not found in cart' };
  }

  if (quantity <= 0) {
    return { success: false, message: 'Quantity must be positive' };
  }

  item.quantity = quantity;
  this.isAbandoned = false;
  this.abandonedAt = null;
  
  return { success: true };
};

/**
 * Instance Method: Remove item from cart
 */
cartSchema.methods.removeItem = function(itemId) {
  const item = this.items.id(itemId);
  
  if (!item) {
    return { success: false, message: 'Item not found in cart' };
  }

  item.deleteOne();
  this.isAbandoned = false;
  this.abandonedAt = null;
  
  return { success: true };
};

/**
 * Instance Method: Clear cart
 */
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.isAbandoned = false;
  this.abandonedAt = null;
};

/**
 * Instance Method: Check if abandoned
 */
cartSchema.methods.checkIfAbandoned = function() {
  if (this.items.length === 0) {
    return false;
  }

  const abandonmentThresholdHours = 24; // Configurable
  const thresholdTime = new Date(Date.now() - abandonmentThresholdHours * 60 * 60 * 1000);
  
  return this.lastModified < thresholdTime;
};

/**
 * Instance Method: Mark as abandoned
 */
cartSchema.methods.markAsAbandoned = function() {
  if (!this.isAbandoned && this.items.length > 0) {
    this.isAbandoned = true;
    this.abandonedAt = new Date();
  }
};

/**
 * Static: Find abandoned carts
 */
cartSchema.statics.findAbandonedCarts = async function(thresholdHours = 24, timeframe = 'all') {
  const thresholdTime = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);
  
  let startDate = new Date(0); // all time
  const today = new Date();
  
  switch (timeframe) {
      case 'today':
          startDate = new Date(today);
          startDate.setHours(0, 0, 0, 0);
          break;
      case 'week':
          startDate = new Date(today);
          const day = startDate.getDay();
          const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
          startDate.setDate(diff);
          startDate.setHours(0, 0, 0, 0);
          break;
      case 'month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          break;
      case '6months':
          startDate = new Date(today);
          startDate.setMonth(startDate.getMonth() - 6);
          startDate.setHours(0, 0, 0, 0);
          break;
      case 'all':
          startDate = new Date(0);
          break;
      default:
          startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return this.find({
    'items.0': { $exists: true }, // Has items
    lastModified: { $lt: thresholdTime, $gte: startDate }
  }).populate('user', 'name phone');
};

/**
 * Static: Get cart by user ID or create new
 */
cartSchema.statics.findOrCreateByUser = async function(userId) {
  let cart = await this.findOne({ user: userId });
  
  if (!cart) {
    cart = new this({ user: userId });
    await cart.save();
  }
  
  return cart;
};

module.exports = mongoose.model('Cart', cartSchema);