/**
 * Models Index - MVP (Complete)
 */

const User = require('./User');
const Brand = require('./Brand');
const Category = require('./Category');
const Product = require('./Product');
const Cart = require('./Cart');
const Order = require('./Order');
const Invoice = require('./invoice');
const Notification = require('./Notification');
const Coupon = require('./Coupon');
const Discount = require('./Discount');
const Banner = require('./Banner');
const Config = require('./Config');

module.exports = {
  User,
  Brand,
  Category,
  Product,
  Cart,
  Order,
  Invoice,
  Notification,
  Coupon,
  Discount,
  Banner,
  Config
};