/**
 * Services Index - MVP (Complete)
 */

const SMSService = require('./sms.service');
const AuthService = require('./auth.service');
const UserService = require('./user.service');
const S3Service = require('./s3.service');
const ProductService = require('./product.service');
const CartService = require('./cart.service');
const OrderService = require('./order.service');
const InvoiceService = require('./invoice.service');
const RazorpayService = require('./razorpay.service');
const AnalyticsService = require('./analytics.service');
const FCMService = require('./fcm.service');
const NotificationService = require('./notification.service');
const ReportService = require('./report.service');
const CouponService = require('./coupon.service');
const BannerService = require('./banner.service');

module.exports = {
  SMSService,
  AuthService,
  UserService,
  S3Service,
  ProductService,
  CartService,
  OrderService,
  InvoiceService,
  RazorpayService,
  AnalyticsService,
  FCMService,
  NotificationService,
  ReportService,
  CouponService,
  BannerService
};