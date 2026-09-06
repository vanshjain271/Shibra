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

async function cleanupDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully for cleaning.');

    // 1. Delete all transactional data
    const ordersDeleted = await Order.deleteMany({});
    console.log(`- Deleted ${ordersDeleted.deletedCount} Orders.`);

    const invoicesDeleted = await Invoice.deleteMany({});
    console.log(`- Deleted ${invoicesDeleted.deletedCount} Invoices.`);

    const bulkOrdersDeleted = await BulkOrder.deleteMany({});
    console.log(`- Deleted ${bulkOrdersDeleted.deletedCount} BulkOrders.`);

    const cartsDeleted = await Cart.deleteMany({});
    console.log(`- Deleted ${cartsDeleted.deletedCount} Carts.`);

    const notificationsDeleted = await Notification.deleteMany({});
    console.log(`- Deleted ${notificationsDeleted.deletedCount} Notifications.`);

    const logsDeleted = await ActivityLog.deleteMany({});
    console.log(`- Deleted ${logsDeleted.deletedCount} Activity Logs.`);

    const inquiriesDeleted = await Inquiry.deleteMany({});
    console.log(`- Deleted ${inquiriesDeleted.deletedCount} Inquiries.`);

    const reviewsDeleted = await Review.deleteMany({});
    console.log(`- Deleted ${reviewsDeleted.deletedCount} Reviews.`);

    // 2. Delete only DUMMY Products (keeping real ones like BARBIE CASE, 2 IN ONE MAGSAFE, etc.)
    const dummyProductsDeleted = await Product.deleteMany({
      $or: [
        { name: { $regex: /\(Dummy\)/i } },
        { sku: { $regex: /^DUMMY-SKU-/i } }
      ]
    });
    console.log(`- Deleted ${dummyProductsDeleted.deletedCount} Dummy Products.`);

    // 3. Delete only DUMMY Users
    const dummyUsersDeleted = await User.deleteMany({
      $or: [
        { name: { $regex: /Dummy/i } },
        { phone: { $in: ['9999999991', '9999999992', '9999999993', '9876543210'] } }
      ]
    });
    console.log(`- Deleted ${dummyUsersDeleted.deletedCount} Dummy Users.`);

    // Note: Banners, Coupons, Categories, and Brands are left alone so the admin panel structure remains functional,
    // and real products don't lose their categories/brands.

    console.log('\nDatabase cleanup completed successfully.');

  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    await mongoose.disconnect();
  }
}

cleanupDb();
