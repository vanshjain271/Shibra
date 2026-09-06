/**
 * Order Model - MVP (Razorpay Integrated)
 *
 * New Order States:
 * PENDING → PROCESSING_PAYMENT → PAID → CONFIRMED → PACKED → SHIPPED → DELIVERED
 * PENDING / PROCESSING_PAYMENT → PAYMENT_FAILED / CANCELLED
 *
 * Stock is reserved on PENDING, deducted on PAID
 * Invoice is generated on PAID
 * Order number format: ORD-YYYYMMDD-NNN
 */

const mongoose = require('mongoose');

/* -------------------- Order Item Snapshot -------------------- */
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    variantName: {
      type: String,
      default: '',
      trim: true,
    },
    sku: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    lotType: { type: String, enum: ["full", "half", "mini", "none"], default: "none" },
    selectedModel: {
      type: String,
      default: null,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    mrp: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

/* -------------------- Shipping Address Snapshot -------------------- */
const shippingAddressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      match: [/^[6-9]\d{9}$/, 'Invalid phone number'],
    },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: '' },
    landmark: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: {
      type: String,
      required: true,
      match: [/^\d{6}$/, 'Invalid pincode'],
    },
  },
  { _id: false }
);

/* -------------------- Payment Details -------------------- */
const paymentDetailsSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ['FULL_PAYMENT', 'COD_PARTIAL', 'PREPAID', 'COD', 'UPI_QR'],
      default: 'FULL_PAYMENT',
    },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    utrNumber: { type: String, default: '' },
    amountPaid: { type: Number, default: 0 },
    codAmount: { type: Number, default: 0 },
    paidAt: { type: Date, default: null },
    codCollected: { type: Boolean, default: false },
    codCollectedAt: { type: Date, default: null },
  },
  { _id: false }
);

/* -------------------- Status History -------------------- */
const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        'PENDING',
        'PROCESSING_PAYMENT',
        'PAID',
        'CONFIRMED',
        'PACKED',
        'SHIPPED',
        'DELIVERED',
        'PAYMENT_FAILED',
        'CANCELLED',
      ],
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    note: { type: String, default: '' },
  },
  { _id: false }
);

/* -------------------- Order Schema -------------------- */
const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    status: {
      type: String,
      enum: [
        'PENDING',
        'PROCESSING_PAYMENT',
        'PAID',
        'CONFIRMED',
        'PACKED',
        'SHIPPED',
        'DELIVERED',
        'PAYMENT_FAILED',
        'CANCELLED',
      ],
      default: 'PENDING',
    },

    items: {
      type: [orderItemSchema],
      validate: [(v) => v.length > 0, 'Order must have items'],
      required: true,
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    subtotal: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },

    payment: {
      type: paymentDetailsSchema,
      default: () => ({})
    },

    coupon: {
      type: {
        code: String,
        discountAmount: Number
      },
      default: null
    },

    tokenReceived: {
      type: Number,
      default: 0,
      min: 0
    },

    // Stock reservation
    stockReserved: { type: Boolean, default: false },
    stockReservedAt: { type: Date, default: null },
    stockReservationExpiry: { type: Date, default: null },

    statusHistory: { type: [statusHistorySchema], default: [] },

    courierName: { type: String, default: '', trim: true },
    trackingNumber: { type: String, default: '' },
    trackingUrl: { type: String, default: '' },

    cancelledAt: { type: Date, default: null },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancellationReason: { type: String, default: '' },

    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null,
    },
  },
  { timestamps: true }
);

/* -------------------- Indexes -------------------- */
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'payment.razorpayOrderId': 1 });
orderSchema.index({ stockReservationExpiry: 1 });

/* -------------------- State Machine -------------------- */
const VALID_TRANSITIONS = {
  PENDING: ['PROCESSING_PAYMENT', 'CONFIRMED', 'CANCELLED'],
  PROCESSING_PAYMENT: ['PAID', 'PAYMENT_FAILED', 'PENDING', 'CANCELLED'],
  PAID: ['CONFIRMED', 'PACKED'],
  CONFIRMED: ['PACKED'],
  PACKED: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
  CANCELLED: [],
};

orderSchema.statics.isValidTransition = function (from, to) {
  return VALID_TRANSITIONS[from]?.includes(to);
};

orderSchema.statics.getAllowedTransitions = function (state) {
  return VALID_TRANSITIONS[state] || [];
};

/* -------------------- Order Number Generator -------------------- */
orderSchema.statics.generateOrderNumber = async function () {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `ORD-${date}-`;

  const last = await this.findOne({ orderNumber: { $regex: `^${prefix}` } })
    .sort({ orderNumber: -1 })
    .lean();

  const seq = last ? parseInt(last.orderNumber.split('-')[2]) + 1 : 1;
  return `${prefix}${String(seq).padStart(3, '0')}`;
};

/* -------------------- Instance Helpers -------------------- */
orderSchema.methods.addStatusHistory = function (status, changedBy, note = '') {
  this.statusHistory.push({ status, changedBy, note });
};

orderSchema.methods.transitionTo = function (newStatus, changedBy, note = '') {
  if (!this.constructor.isValidTransition(this.status, newStatus)) {
    return { valid: false, message: 'Invalid state transition' };
  }

  this.status = newStatus;
  this.addStatusHistory(newStatus, changedBy, note);

  if (newStatus === 'CANCELLED') {
    this.cancelledAt = new Date();
    this.cancelledBy = changedBy;
    this.cancellationReason = note;
  }

  return { valid: true };
};

orderSchema.methods.canBuyerCancel = function () {
  return ['PENDING', 'PAYMENT_FAILED'].includes(this.status);
};

orderSchema.methods.isStockReservationExpired = function () {
  if (!this.stockReserved || !this.stockReservationExpiry) return false;
  return new Date() > this.stockReservationExpiry;
};

orderSchema.methods.reserveStock = function () {
  const timeoutMinutes = parseInt(process.env.STOCK_RESERVATION_TIMEOUT_MINUTES) || 15;

  this.stockReserved = true;
  this.stockReservedAt = new Date();
  this.stockReservationExpiry = new Date(Date.now() + timeoutMinutes * 60 * 1000);
};

orderSchema.methods.releaseStockReservation = function () {
  this.stockReserved = false;
  this.stockReservationExpiry = null;
};

module.exports = mongoose.model('Order', orderSchema);