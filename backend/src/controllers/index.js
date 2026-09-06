/**
 * Controllers Index - MVP
 */

const AuthController = require('./auth.controller');
const UserController = require('./user.controller');
const ProductController = require('./product.controller');
const AdminProductController = require('./admin-product.controller');
const OrderController = require('./order.controller');
const AdminOrderController = require('./admin-order.controller');
const InvoiceController = require('./invoice.controller');

module.exports = {
  AuthController,
  UserController,
  ProductController,
  AdminProductController,
  OrderController,
  AdminOrderController,
  InvoiceController
};