/**
 * Admin Analytics Routes - MVP
 */

const express = require('express');
const router = express.Router();
const AnalyticsController = require('../../controllers/analytics.controller');
const auth = require('../../middleware/auth.middleware');

// Dashboard overview
router.get('/dashboard', auth.adminOnly, AnalyticsController.getDashboardOverview);

// Sales analytics
router.get('/sales', auth.adminOnly, AnalyticsController.getSalesAnalytics);

// User analytics
router.get('/users', auth.adminOnly, AnalyticsController.getUserAnalytics);

// Abandoned cart analytics
router.get('/abandoned-carts', auth.adminOnly, AnalyticsController.getAbandonedCartAnalytics);

// Low stock alerts
router.get('/low-stock', auth.adminOnly, AnalyticsController.getLowStockAlerts);

// Product performance
router.get('/products', auth.adminOnly, AnalyticsController.getProductPerformance);

// Order trends
router.get('/trends', auth.adminOnly, AnalyticsController.getOrderTrends);

module.exports = router;