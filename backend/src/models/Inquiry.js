const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // User might not be logged in
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONTACTED', 'CONVERTED', 'CLOSED'],
    default: 'PENDING'
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Inquiry', inquirySchema);
