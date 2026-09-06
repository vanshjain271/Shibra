/**
 * Admin Coupon Controller - MVP
 */

const CouponService = require('../services/coupon.service');

/**
 * @desc    List all coupons
 * @route   GET /api/v1/admin/coupons
 * @access  Admin
 */
const listCoupons = async (req, res) => {
  try {
    const result = await CouponService.listAllCoupons();

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      coupons: result.coupons
    });
  } catch (error) {
    console.error('List Coupons Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while listing coupons'
    });
  }
};

/**
 * @desc    Create coupon
 * @route   POST /api/v1/admin/coupons
 * @access  Admin
 */
const createCoupon = async (req, res) => {
  try {
    const result = await CouponService.createCoupon(req.body, req.user.userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json({
      success: true,
      message: result.message,
      coupon: result.coupon
    });
  } catch (error) {
    console.error('Create Coupon Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating coupon'
    });
  }
};

/**
 * @desc    Update coupon
 * @route   PUT /api/v1/admin/coupons/:couponId
 * @access  Admin
 */
const updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;

    const result = await CouponService.updateCoupon(couponId, req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      coupon: result.coupon
    });
  } catch (error) {
    console.error('Update Coupon Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating coupon'
    });
  }
};

/**
 * @desc    Delete coupon
 * @route   DELETE /api/v1/admin/coupons/:couponId
 * @access  Admin
 */
const deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;

    const result = await CouponService.deleteCoupon(couponId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Delete Coupon Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while deleting coupon'
    });
  }
};

/**
 * @desc    List all discounts
 * @route   GET /api/v1/admin/discounts
 * @access  Admin
 */
const listDiscounts = async (req, res) => {
  try {
    const result = await CouponService.listAllDiscounts();

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      discounts: result.discounts
    });
  } catch (error) {
    console.error('List Discounts Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while listing discounts'
    });
  }
};

/**
 * @desc    Create discount
 * @route   POST /api/v1/admin/discounts
 * @access  Admin
 */
const createDiscount = async (req, res) => {
  try {
    const result = await CouponService.createDiscount(req.body, req.user.userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json({
      success: true,
      message: result.message,
      discount: result.discount
    });
  } catch (error) {
    console.error('Create Discount Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating discount'
    });
  }
};

module.exports = {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  listDiscounts,
  createDiscount
};