/**
 * Admin Cart Controller - MVP
 * 
 * Abandoned cart monitoring
 */

const CartService = require('../services/cart.service');

/**
 * @desc    Get abandoned carts
 * @route   GET /api/v1/admin/carts/abandoned
 * @access  Admin
 * @query   thresholdHours (default: 24)
 */
const getAbandonedCarts = async (req, res) => {
  try {
    const { thresholdHours = 2, timeframe = 'all' } = req.query;

    const result = await CartService.getAbandonedCarts(parseInt(thresholdHours), timeframe);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      carts: result.carts,
      count: result.carts.length
    });
  } catch (error) {
    console.error('Get Abandoned Carts Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching abandoned carts'
    });
  }
};

module.exports = {
  getAbandonedCarts
};