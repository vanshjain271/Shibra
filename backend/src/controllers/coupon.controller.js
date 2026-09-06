/**
 * Coupon Controller - MVP (Buyer)
 */

const CouponService = require('../services/coupon.service');

/**
 * @desc    Get active coupons
 * @route   GET /api/v1/coupons
 * @access  Buyer
 */
const getActiveCoupons = async (req, res) => {
  try {
    const result = await CouponService.getActiveCoupons(req.user.userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      coupons: result.coupons
    });
  } catch (error) {
    console.error('Get Active Coupons Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching coupons'
    });
  }
};

/**
 * @desc    Validate coupon
 * @route   POST /api/v1/coupons/validate
 * @access  Buyer
 * @body    { code, cartItems, cartTotal }
 */
const validateCoupon = async (req, res) => {
  try {
    const { code, cartItems, cartTotal } = req.body;

    if (!code || !cartTotal) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code and cart total are required'
      });
    }

    const result = await CouponService.validateCoupon(
      code,
      req.user.userId,
      cartItems || [],
      cartTotal
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Validate Coupon Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while validating coupon'
    });
  }
};

module.exports = {
  getActiveCoupons,
  validateCoupon
};