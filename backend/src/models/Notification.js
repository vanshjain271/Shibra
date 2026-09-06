/**
 * Notification Model - MVP
 * 
 * Track sent notifications for audit and delivery status
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'ORDER_STATUS_UPDATE',
      'PAYMENT_SUCCESS',
      'PAYMENT_FAILED',
      'ORDER_SHIPPED',
      'ORDER_DELIVERED',
      'LOW_STOCK',
      'ABANDONED_CART',
      'CUSTOM'
    ],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  body: {
    type: String,
    required: true,
    maxlength: 500
  },
  data: {
    type: Map,
    of: String,
    default: new Map()
  },
  // Related entities
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  // Delivery status
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'FAILED', 'DELIVERED'],
    default: 'PENDING'
  },
  sentAt: {
    type: Date,
    default: null
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  failureReason: {
    type: String,
    default: ''
  },
  // FCM details
  fcmTokensUsed: [{
    type: String
  }],
  fcmMessageId: {
    type: String,
    default: ''
  },
  // Read status
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
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
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ order: 1 });
notificationSchema.index({ read: 1 });

/**
 * Instance Method: Mark as sent
 */
notificationSchema.methods.markAsSent = function(fcmMessageId) {
  this.status = 'SENT';
  this.sentAt = new Date();
  this.fcmMessageId = fcmMessageId || '';
};

/**
 * Instance Method: Mark as delivered
 */
notificationSchema.methods.markAsDelivered = function() {
  this.status = 'DELIVERED';
  this.deliveredAt = new Date();
};

/**
 * Instance Method: Mark as failed
 */
notificationSchema.methods.markAsFailed = function(reason) {
  this.status = 'FAILED';
  this.failureReason = reason;
};

/**
 * Instance Method: Mark as read
 */
notificationSchema.methods.markAsRead = function() {
  if (!this.read) {
    this.read = true;
    this.readAt = new Date();
  }
};

/**
 * Static: Get unread count for user
 */
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ user: userId, read: false });
};

/**
 * Static: Get user notifications with pagination
 */
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  const { page = 1, limit = 20, unreadOnly = false } = options;

  const query = { user: userId };
  if (unreadOnly) {
    query.read = false;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [notifications, total] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('order', 'orderNumber status')
      .populate('product', 'name')
      .lean(),
    this.countDocuments(query)
  ]);

  return {
    notifications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

module.exports = mongoose.model('Notification', notificationSchema);