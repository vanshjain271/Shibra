/**
 * GadgetHub - Database Cleanup Script
 * Clears all dummy data (Products, Orders, Customers, etc.)
 * Safely preserves ADMIN users.
 */

const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
});

const mongoose = require('mongoose');

// Import all models
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Order = require('../models/Order');
const Invoice = require('../models/invoice'); // Note: index shows lowercase/uppercase mix sometimes, but filename is invoice.js
const Cart = require('../models/Cart');
const Review = require('../models/Review');
const Banner = require('../models/Banner');
const Coupon = require('../models/Coupon');
const ActivityLog = require('../models/ActivityLog');
const BulkOrder = require('../models/BulkOrder');
const Notification = require('../models/Notification');
const Discount = require('../models/Discount');
const Blog = require('../models/Blog');

const cleanup = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected ✅');

    console.log('Starting cleanup...');

    // 1. Clear Products, Categories, Brands
    console.log('- Clearing Products...');
    await Product.deleteMany({});
    console.log('- Clearing Categories...');
    await Category.deleteMany({});
    console.log('- Clearing Brands...');
    await Brand.deleteMany({});

    // 2. Clear Sales & Financials
    console.log('- Clearing Orders...');
    await Order.deleteMany({});
    console.log('- Clearing Invoices...');
    await Invoice.deleteMany({}); // Verify this works with the uppercase/lowercase model name

    // 3. Clear User Interactions
    console.log('- Clearing Carts...');
    await Cart.deleteMany({});
    console.log('- Clearing Reviews...');
    await Review.deleteMany({});

    // 4. Clear Customers but PRESERVE Admins
    console.log('- Clearing Customer accounts (Preserving ADMINs)...');
    const result = await User.deleteMany({ role: 'BUYER' });
    console.log(`  Done: Removed ${result.deletedCount} customer accounts.`);

    // 5. Clear Marketing & Content
    console.log('- Clearing Banners...');
    await Banner.deleteMany({});
    console.log('- Clearing Coupons & Discounts...');
    await Coupon.deleteMany({});
    await Discount.deleteMany({});
    console.log('- Clearing Blogs...');
    await Blog.deleteMany({});

    // 6. Clear Logs & Notifications
    console.log('- Clearing Activity Logs...');
    await ActivityLog.deleteMany({});
    console.log('- Clearing Notifications...');
    await Notification.deleteMany({});
    console.log('- Clearing Bulk Orders...');
    await BulkOrder.deleteMany({});

    console.log('==========================================');
    console.log('✅ DATABASE CLEANED SUCCESSFULLY!');
    console.log('Your client can now start adding real data.');
    console.log('Admin accounts have been preserved.');
    console.log('==========================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
};

cleanup();
