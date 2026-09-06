const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// Import models
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Category = require('../src/models/Category');
const Brand = require('../src/models/Brand');
const Order = require('../src/models/Order');
const Invoice = require('../src/models/invoice');
const BulkOrder = require('../src/models/BulkOrder');
const Cart = require('../src/models/Cart');
const Notification = require('../src/models/Notification');
const ActivityLog = require('../src/models/ActivityLog');
const Inquiry = require('../src/models/Inquiry');
const Review = require('../src/models/Review');
const Coupon = require('../src/models/Coupon');
const Banner = require('../src/models/Banner');

async function countDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully.');
    
    const counts = {
      Users: await User.countDocuments(),
      Products: await Product.countDocuments(),
      Categories: await Category.countDocuments(),
      Brands: await Brand.countDocuments(),
      Orders: await Order.countDocuments(),
      Invoices: await Invoice.countDocuments(),
      BulkOrders: await BulkOrder.countDocuments(),
      Carts: await Cart.countDocuments(),
      Notifications: await Notification.countDocuments(),
      ActivityLogs: await ActivityLog.countDocuments(),
      Inquiries: await Inquiry.countDocuments(),
      Reviews: await Review.countDocuments(),
      Coupons: await Coupon.countDocuments(),
      Banners: await Banner.countDocuments()
    };
    
    console.log('\n--- CURRENT DATABASE COUNTS ---');
    console.table(counts);
    console.log('--------------------------------\n');
    
  } catch (error) {
    console.error('Error counting DB documents:', error);
  } finally {
    await mongoose.disconnect();
  }
}

countDb();
