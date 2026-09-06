/**
 * Coupon Routes - MVP (Buyer)
 */

const express = require('express');
const router = express.Router();
const CouponController = require('../controllers/coupon.controller');
const auth = require('../middleware/auth.middleware');

router.get('/', auth.authenticate, CouponController.getActiveCoupons);
router.post('/validate', auth.authenticate, CouponController.validateCoupon);

module.exports = router;