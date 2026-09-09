/**
 * Shibra Backend Server - MVP
 *
 * FIXED: Added invoice routes mounting
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), override: true });

const { connectDB } = require('./config/database');
const { requestLogger, errorLogger, performanceLogger } = require('./middleware/logger.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const adminProductRoutes = require('./routes/admin/product.routes');
const cartRoutes = require('./routes/cart.routes');
const adminCartRoutes = require('./routes/admin/cart.routes');
const orderRoutes = require('./routes/order.routes');
const adminOrderRoutes = require('./routes/admin/order.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const adminInvoiceRoutes = require('./routes/admin/invoice.routes');
const adminWishlistRoutes = require('./routes/admin/wishlist.routes');
const adminProfileRoutes = require('./routes/admin/profile.routes');
const adminAnalyticsRoutes = require('./routes/admin/analytics.routes');
const notificationRoutes = require('./routes/notification.routes');
const employeeRoutes = require('./routes/employee.routes');
const adminNotificationRoutes = require('./routes/admin/notification.routes');
const adminReportRoutes = require('./routes/admin/report.routes');
const couponRoutes = require('./routes/coupon.routes');
const adminCouponRoutes = require('./routes/admin/coupon.routes');
const bannerRoutes = require('./routes/banner.routes');
const settingsRoutes = require('./routes/settings.routes');
const inquiryRoutes = require('./routes/inquiry.routes');
const adminBannerRoutes = require('./routes/admin/banner.routes');
const categoryRoutes = require('./routes/category.routes');
const adminCategoryRoutes = require('./routes/admin/category.routes');
const brandRoutes = require('./routes/brand.routes');
const adminBrandRoutes = require('./routes/admin/brand.routes');
const adminCustomerRoutes = require('./routes/admin/customer.routes');
const adminBlogRoutes = require('./routes/admin/blog.routes');
const adminSettingsRoutes = require('./routes/admin/settings.routes');
const adminBulkOrderRoutes = require('./routes/admin/bulkOrder.routes');
const adminActivityRoutes = require('./routes/admin/activity.routes');
const reviewRoutes = require('./routes/review.routes');
const adminReviewRoutes = require('./routes/admin/review.routes');
const addressRoutes = require('./routes/address.routes'); // Add this line
const publicSettingsRoutes = require('./routes/settings.routes');
const publicBlogRoutes = require('./routes/blog.routes');

// Init app
const app = express();

// Trust the first proxy (Vercel) to fix express-rate-limit ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
app.set('trust proxy', 1);

/* =========================
   Middleware
========================= */
app.use(cors({
  origin: [
    'https://admin.shibrab2b.com',
    'https://www.admin.shibrab2b.com',
    'https://www.shibrab2b.com',
    'https://shibrab2b.com',
    'https://api.shibrab2b.com',
    /\.vercel\.app$/,
    /\.amplifyapp\.com$/, // Allow Amplify deployments
    /\.cloudfront\.net$/, // Allow CloudFront temporary URLs // Allow all Vercel preview deployments
    'http://localhost:3000', // Storefront (Next.js default)
    'http://localhost:3001', // Admin panel
    'http://localhost:3002', // Storefront (custom port)
    'http://localhost:5173', // Vite admin dev
  ],
  credentials: true,
}));
app.use(helmet());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(requestLogger);
app.use(performanceLogger(2000)); // Log requests > 2 seconds

// Morgan for development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300
  })
);

/* =========================
   Routes
========================= */

// Health
app.get('/', (req, res) => {
  const os = require('os');
  res.json({
    success: true,
    message: 'Shibra API running 🚀',
    platform: 'Shibra B2B E-Commerce',
    version: '1.0.0',
    memory: {
      process: process.memoryUsage(),
      system: {
        total: Math.round(os.totalmem() / 1024 / 1024) + ' MB',
        free: Math.round(os.freemem() / 1024 / 1024) + ' MB',
        loadavg: os.loadavg()
      }
    }
  });
});

// Auth & User
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

// Products
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/admin/products', adminProductRoutes);

// Cart
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/admin/carts', adminCartRoutes);

// Orders
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/admin/orders', adminOrderRoutes);

// FIXED: Invoice routes now mounted
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/admin/invoices', adminInvoiceRoutes);
app.use('/api/v1/admin/wishlists', adminWishlistRoutes);

app.use('/api/v1/admin/profile', adminProfileRoutes);

// Analytics
app.use('/api/v1/admin/analytics', adminAnalyticsRoutes);

// Notifications
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin/notifications', adminNotificationRoutes);

// Reports
app.use('/api/v1/admin/reports', adminReportRoutes);

// Coupons & Discounts
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/admin', adminCouponRoutes);

// Categories
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/admin/categories', adminCategoryRoutes);

// Brands
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/admin/brands', adminBrandRoutes);

// Banners
app.use('/api/v1/banners', bannerRoutes);
app.use('/api/v1/admin/banners', adminBannerRoutes);

// Inquiries
app.use('/api/v1/inquiries', inquiryRoutes);

// Employees (RBAC)
app.use('/api/v1/admin/employees', employeeRoutes);

// Customers
app.use('/api/v1/admin/customers', adminCustomerRoutes);

// Blog (public + admin)
app.use('/api/v1/blogs', publicBlogRoutes);
app.use('/api/v1/admin/blog', adminBlogRoutes);

// Store Settings
app.use('/api/v1/admin/settings', adminSettingsRoutes);

// Bulk Orders
app.use('/api/v1/admin/bulk-orders', adminBulkOrderRoutes);

// Activity Logs
app.use('/api/v1/admin/activity-logs', adminActivityRoutes);

// Reviews (customer-facing)
app.use('/api/v1/reviews', reviewRoutes);

// Reviews (admin)
app.use('/api/v1/admin/reviews', adminReviewRoutes);

// Addresses (customer-facing)
app.use('/api/v1/addresses', addressRoutes);

// Settings (customer-facing)
app.use('/api/v1/settings', publicSettingsRoutes);

/* =========================
   Error Handler
========================= */
app.use(errorLogger);

app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    requestId: req.requestId
  });
});

/* =========================
   Server Start
========================= */
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

startServer();