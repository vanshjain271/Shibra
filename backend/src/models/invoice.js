/**
 * Invoice Model - MVP
 * 
 * Invoice number format: INV-YYYYMMDD-XXX
 * Generated ONLY when order status becomes CONFIRMED
 */

const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variant: { type: mongoose.Schema.Types.ObjectId, default: null },
  name: { type: String, required: true, trim: true },
  variantName: { type: String, trim: true, default: '' },
  sku: { type: String, trim: true, default: '' },
  hsnCode: { type: String, trim: true, default: '' },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  mrp: { type: Number, required: true, min: 0 },
  taxableAmount: { type: Number, required: true, min: 0 },
  gstRate: { type: Number, default: 18, min: 0 },
  cgst: { type: Number, default: 0, min: 0 },
  sgst: { type: Number, default: 0, min: 0 },
  igst: { type: Number, default: 0, min: 0 },
  totalTax: { type: Number, required: true, min: 0 },
  totalWithTax: { type: Number, required: true, min: 0 }
}, { _id: true });

const addressSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  addressLine1: { type: String, required: true, trim: true },
  addressLine2: { type: String, trim: true, default: '' },
  landmark: { type: String, trim: true, default: '' },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  pincode: { type: String, required: true, trim: true }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true, required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invoiceDate: { type: Date, default: Date.now },
  billingAddress: { type: addressSchema, required: true },
  shippingAddress: { type: addressSchema, required: true },
  items: { type: [invoiceItemSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  totalCgst: { type: Number, default: 0, min: 0 },
  totalSgst: { type: Number, default: 0, min: 0 },
  totalIgst: { type: Number, default: 0, min: 0 },
  totalTax: { type: Number, required: true, min: 0 },
  grandTotal: { type: Number, required: true, min: 0 },
  isIntraState: { type: Boolean, default: true },
  pdfUrl: { type: String, default: '' },
  status: { type: String, enum: ['GENERATED', 'SENT', 'PAID'], default: 'GENERATED' }
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (doc, ret) => { delete ret.__v; return ret; } }
});

invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ order: 1 }, { unique: true });
invoiceSchema.index({ user: 1 });
invoiceSchema.index({ invoiceDate: -1 });

invoiceSchema.statics.generateInvoiceNumber = async function() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `INV-${dateStr}-`;

  const lastInvoice = await this.findOne({
    invoiceNumber: { $regex: `^${prefix}` }
  }).sort({ invoiceNumber: -1 });

  let sequence = 1;
  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2], 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(3, '0')}`;
};

invoiceSchema.statics.existsForOrder = async function(orderId) {
  const count = await this.countDocuments({ order: orderId });
  return count > 0;
};

module.exports = mongoose.model('Invoice', invoiceSchema);