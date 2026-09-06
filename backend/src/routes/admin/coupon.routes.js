/**
 * Admin Coupon & Discount Routes - MVP
 */

const express = require('express');
const router = express.Router();
const AdminCouponController = require('../../controllers/admin-coupon.controller');
const auth = require('../../middleware/auth.middleware');

// Coupon management
router.get('/coupons', auth.adminOnly, AdminCouponController.listCoupons);
router.post('/coupons', auth.adminOnly, AdminCouponController.createCoupon);
router.put('/coupons/:couponId', auth.adminOnly, AdminCouponController.updateCoupon);
router.delete('/coupons/:couponId', auth.adminOnly, AdminCouponController.deleteCoupon);

// Discount management
router.get('/discounts', auth.adminOnly, AdminCouponController.listDiscounts);
router.post('/discounts', auth.adminOnly, AdminCouponController.createDiscount);

module.exports = router;