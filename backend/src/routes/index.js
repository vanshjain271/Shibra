/**
 * Routes Index - MVP
 */

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const productRoutes = require('./product.routes');
const adminProductRoutes = require('./admin/product.routes');
const orderRoutes = require('./order.routes');
const adminOrderRoutes = require('./admin/order.routes');
const invoiceRoutes = require('./invoice.routes');
const adminInvoiceRoutes = require('./admin/invoice.routes');

module.exports = {
  authRoutes,
  userRoutes,
  productRoutes,
  adminProductRoutes,
  orderRoutes,
  adminOrderRoutes,
  invoiceRoutes,
  adminInvoiceRoutes
};