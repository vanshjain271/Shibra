/**
 * Analytics Controller - MVP (Admin)
 */

const AnalyticsService = require('../services/analytics.service');

/**
 * @desc    Get dashboard overview
 * @route   GET /api/v1/admin/analytics/dashboard
 * @access  Admin
 */
const getDashboardOverview = async (req, res) => {
  try {
    const result = await AnalyticsService.getDashboardOverview();

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      overview: result.overview
    });
  } catch (error) {
    console.error('Get Dashboard Overview Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching dashboard overview'
    });
  }
};

/**
 * @desc    Get sales analytics
 * @route   GET /api/v1/admin/analytics/sales
 * @access  Admin
 * @query   period (last30days|last12months|thisMonth|lastMonth|custom), startDate, endDate
 */
const getSalesAnalytics = async (req, res) => {
  try {
    const { period = 'last30days', startDate, endDate } = req.query;

    const result = await AnalyticsService.getSalesAnalytics(
      period,
      startDate,
      endDate
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      analytics: result.analytics
    });
  } catch (error) {
    console.error('Get Sales Analytics Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching sales analytics'
    });
  }
};

/**
 * @desc    Get user analytics
 * @route   GET /api/v1/admin/analytics/users
 * @access  Admin
 * @query   period, startDate, endDate
 */
const getUserAnalytics = async (req, res) => {
  try {
    const { period = 'last30days', startDate, endDate } = req.query;

    const result = await AnalyticsService.getUserAnalytics(
      period,
      startDate,
      endDate
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      analytics: result.analytics
    });
  } catch (error) {
    console.error('Get User Analytics Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching user analytics'
    });
  }
};

/**
 * @desc    Get abandoned cart analytics
 * @route   GET /api/v1/admin/analytics/abandoned-carts
 * @access  Admin
 * @query   thresholdHours (default: 24)
 */
const getAbandonedCartAnalytics = async (req, res) => {
  try {
    const { thresholdHours = 24 } = req.query;

    const result = await AnalyticsService.getAbandonedCartAnalytics(
      parseInt(thresholdHours)
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      analytics: result.analytics
    });
  } catch (error) {
    console.error('Get Abandoned Cart Analytics Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching abandoned cart analytics'
    });
  }
};

/**
 * @desc    Get low stock alerts
 * @route   GET /api/v1/admin/analytics/low-stock
 * @access  Admin
 * @query   threshold (default: 10)
 */
const getLowStockAlerts = async (req, res) => {
  try {
    const { threshold = 10 } = req.query;

    const result = await AnalyticsService.getLowStockAlerts(parseInt(threshold));

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      alerts: result.alerts,
      count: result.count
    });
  } catch (error) {
    console.error('Get Low Stock Alerts Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching low stock alerts'
    });
  }
};

/**
 * @desc    Get product performance
 * @route   GET /api/v1/admin/analytics/products
 * @access  Admin
 * @query   period, startDate, endDate, limit (default: 10)
 */
const getProductPerformance = async (req, res) => {
  try {
    const { period = 'last30days', startDate, endDate, limit = 10 } = req.query;

    const result = await AnalyticsService.getProductPerformance(
      period,
      startDate,
      endDate,
      parseInt(limit)
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      performance: result.performance
    });
  } catch (error) {
    console.error('Get Product Performance Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching product performance'
    });
  }
};

/**
 * @desc    Get order trends
 * @route   GET /api/v1/admin/analytics/trends
 * @access  Admin
 * @query   period, startDate, endDate
 */
const getOrderTrends = async (req, res) => {
  try {
    const { period = 'last30days', startDate, endDate } = req.query;

    const result = await AnalyticsService.getOrderTrends(
      period,
      startDate,
      endDate
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      trends: result.trends
    });
  } catch (error) {
    console.error('Get Order Trends Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching order trends'
    });
  }
};

module.exports = {
  getDashboardOverview,
  getSalesAnalytics,
  getUserAnalytics,
  getAbandonedCartAnalytics,
  getLowStockAlerts,
  getProductPerformance,
  getOrderTrends
};