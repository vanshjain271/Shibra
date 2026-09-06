/**
 * Config Model - MVP
 * 
 * System configuration and settings
 * Singleton pattern - only one config document
 */

const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  // WhatsApp Configuration
  whatsappNumber: {
    type: String,
    default: '',
    match: [/^[6-9]\d{9}$/, 'Invalid WhatsApp number']
  },
  whatsappEnabled: {
    type: Boolean,
    default: false
  },
  // General Settings
  storeName: {
    type: String,
    default: 'Shibra Store'
  },
  storeEmail: {
    type: String,
    default: ''
  },
  storePhone: {
    type: String,
    default: ''
  },
  // Low Stock Alert Threshold
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  // Abandoned Cart Threshold (hours)
  abandonedCartThreshold: {
    type: Number,
    default: 24
  },
  // COD Settings
  codEnabled: {
    type: Boolean,
    default: true
  },
  codPartialPaymentPercentage: {
    type: Number,
    default: 30,
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100']
  },
  // Stock Reservation
  stockReservationTimeout: {
    type: Number,
    default: 15 // minutes
  },
  // Maintenance Mode
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    default: 'We are currently under maintenance. Please check back later.'
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

/**
 * Static: Get or create config
 */
configSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  
  if (!config) {
    config = new this();
    await config.save();
  }
  
  return config;
};

/**
 * Static: Update config
 */
configSchema.statics.updateConfig = async function(updates) {
  let config = await this.getConfig();
  
  Object.assign(config, updates);
  await config.save();
  
  return config;
};

module.exports = mongoose.model('Config', configSchema);