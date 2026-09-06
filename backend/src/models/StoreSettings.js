/**
 * StoreSettings Model - Store Configuration
 */

const mongoose = require('mongoose');

const storeSettingsSchema = new mongoose.Schema({
    // Store Details
    storeName: { type: String, default: 'Shibra Store' },
    storeEmail: { type: String, default: '' },
    storePhone: { type: String, default: '' },
    storeAddress: { type: String, default: '' },
    storeLogo: { type: String, default: '' },
    paymentQrCode: { type: String, default: '' },
    
    // Announcement Ticker
    tickerText: { type: String, default: '' },
    tickerEnabled: { type: Boolean, default: false },

    // Store Features (Banner items)
    storeFeatures: {
      type: [
        {
          title: { type: String, required: true },
          subtitle: { type: String, default: '' },
          iconName: { type: String, default: 'check-circle-outline' }
        }
      ],
      default: [
        { title: 'Wholesale Pricing', subtitle: 'On all products', iconName: 'thumb-up-outline' },
        { title: 'Secure Payment', subtitle: '100% safe checkout', iconName: 'shield-check-outline' }
      ]
    },


    // Checkout Settings
    roundingMode: { type: String, default: 'No Rounding' },
    showTaxInfo: { type: Boolean, default: true },
    minOrderAmount: { type: Number, default: 500 },
    cartNote: { type: String, default: '' },

    // Delivery Settings
    deliveryFee: { type: Number, default: 50 },
    freeDeliveryThreshold: { type: Number, default: 999 },
    allIndiaDelivery: { type: Boolean, default: true },
    serviceType: { type: String, enum: ['delivery', 'pickup', 'both'], default: 'delivery' },

    // Payment Settings
    codEnabled: { type: Boolean, default: true },
    advancePartialPayment: { type: Boolean, default: false },
    partialPaymentType: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
    partialPaymentPercent: { type: Number, default: 20 },
    partialPaymentFlatAmount: { type: Number, default: 100 },
    razorpayEnabled: { type: Boolean, default: false },

    // Order Settings
    autoConfirmOrders: { type: Boolean, default: false },
    orderNotes: { type: String, default: '' },

    // SEO Settings
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    metaKeywords: { type: String, default: '' },

    // Notification Settings
    smsNotifications: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },

    // Policies
    termsAndConditions: { type: String, default: '' },
    privacyPolicy: { type: String, default: '' },
    refundPolicy: { type: String, default: '' },
    returnPolicy: { type: String, default: '' },
    shippingPolicy: { type: String, default: '' },
    cancellationPolicy: { type: String, default: '' },

    // About
    aboutUs: { type: String, default: '' },

    // Invoice / Company Details
    companyLegalName: { type: String, default: 'Vijay Singh Rajput' },
    companyTradeName: { type: String, default: 'Arbuda accessories' },
    companyAddress: { type: String, default: 'Shop No. 481, 4th Floor, D Block, Hubtown Building, Gita Mandir ST Stand' },
    companyCity: { type: String, default: 'Ahmedabad' },
    companyState: { type: String, default: 'Gujarat' },
    companyPincode: { type: String, default: '380022' },
    companyPhone: { type: String, default: '9549289191' },
    companyEmail: { type: String, default: 'info@shibra.in' },
    gstin: { type: String, default: '24DGMPR6993C1ZV' },
    pan: { type: String, default: 'DGMPR6993C' },
    bankName: { type: String, default: 'Union Bank of India' },
    bankAccountNo: { type: String, default: '313305080000003' },
    bankAccountType: { type: String, default: 'Current' },
    bankIfsc: { type: String, default: 'UBIN0531332' },
    bankBranch: { type: String, default: 'Gita Mandir, Ahmedabad' },
}, {
    timestamps: true
});

// Ensure only one settings document exists
storeSettingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);
