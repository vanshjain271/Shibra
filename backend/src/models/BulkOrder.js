/**
 * Bulk Order Model - Admin-only special price orders
 */

const mongoose = require('mongoose');

const bulkOrderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: String,
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    regularPrice: {
        type: Number,
        required: true
    },
    specialPrice: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    }
});

const bulkOrderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true
    },
    customerName: {
        type: String,
        required: true
    },
    customerPhone: {
        type: String,
        required: true
    },
    customerEmail: String,
    customerAddress: {
        type: String,
        required: true
    },
    items: [bulkOrderItemSchema],
    subtotal: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    deliveryFee: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
        default: 'PENDING'
    },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PARTIAL', 'PAID'],
        default: 'PENDING'
    },
    paymentMode: {
        type: String,
        enum: ['COD', 'BANK_TRANSFER', 'UPI', 'ADVANCE_PAYMENT'],
        default: 'COD'
    },
    advanceAmount: {
        type: Number,
        default: 0
    },
    notes: String,
    internalNotes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    trackingNumber: String,
    expectedDelivery: Date
}, {
    timestamps: true
});

// Generate order number
bulkOrderSchema.pre('save', async function (next) {
    if (this.isNew && !this.orderNumber) {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const count = await this.constructor.countDocuments() + 1;
        this.orderNumber = `BULK-${dateStr}-${count.toString().padStart(3, '0')}`;
    }
    next();
});

// Indexes
bulkOrderSchema.index({ orderNumber: 1 }, { unique: true });
bulkOrderSchema.index({ status: 1, createdAt: -1 });
bulkOrderSchema.index({ customerPhone: 1 });

module.exports = mongoose.model('BulkOrder', bulkOrderSchema);
