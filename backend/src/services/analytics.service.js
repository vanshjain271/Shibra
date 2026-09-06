/**
 * Analytics Service - MVP
 * 
 * Business analytics and reporting
 * - Sales metrics (30 days / 12 months / custom range)
 * - Order statistics
 * - Active users tracking
 * - Abandoned cart analytics
 * - Low stock alerts
 */

const Order = require('../models/Order');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

class AnalyticsService {
  /**
   * Get dashboard overview
   * Quick snapshot of key metrics
   */
  async getDashboardOverview() {
    try {
      const now = new Date();
      const last30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Parallel queries for performance
      const [
        totalSalesThisMonth,
        totalOrdersThisMonth,
        totalOrders30Days,
        activeUsers30Days,
        abandonedCartsCount,
        lowStockProducts,
        recentOrders
      ] = await Promise.all([
        this._calculateSales(thisMonthStart, now),
        this._countOrders(thisMonthStart, now),
        this._countOrders(last30Days, now),
        this._countActiveUsers(last30Days),
        this._countAbandonedCarts(),
        this._getLowStockProducts(10), // Threshold: 10 units
        Order.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('user', 'name phone')
          .select('orderNumber status totalAmount createdAt')
          .lean()
      ]);

      return {
        success: true,
        overview: {
          thisMonth: {
            sales: totalSalesThisMonth,
            orders: totalOrdersThisMonth
          },
          last30Days: {
            orders: totalOrders30Days,
            activeUsers: activeUsers30Days
          },
          abandonedCarts: abandonedCartsCount,
          lowStockProducts: lowStockProducts.length,
          recentOrders
        }
      };
    } catch (error) {
      console.error('Get Dashboard Overview Error:', error);
      return {
        success: false,
        message: 'Failed to fetch dashboard overview'
      };
    }
  }

  /**
   * Get sales analytics
   * Supports: last30days, last12months, custom range
   */
  async getSalesAnalytics(period = 'last30days', startDate = null, endDate = null) {
    try {
      const dateRange = this._getDateRange(period, startDate, endDate);
      
      if (!dateRange.success) {
        return dateRange;
      }

      const { start, end } = dateRange;

      // Total sales and orders
      const [totalSales, totalOrders, ordersByStatus, salesByDay] = await Promise.all([
        this._calculateSales(start, end),
        this._countOrders(start, end),
        this._getOrdersByStatus(start, end),
        this._getSalesByDay(start, end, period)
      ]);

      // Calculate average order value
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Top products
      const topProducts = await this._getTopProducts(start, end, 5);

      return {
        success: true,
        analytics: {
          period,
          dateRange: { start, end },
          summary: {
            totalSales: Math.round(totalSales * 100) / 100,
            totalOrders,
            averageOrderValue: Math.round(averageOrderValue * 100) / 100
          },
          ordersByStatus,
          salesByDay,
          topProducts
        }
      };
    } catch (error) {
      console.error('Get Sales Analytics Error:', error);
      return {
        success: false,
        message: 'Failed to fetch sales analytics'
      };
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(period = 'last30days', startDate = null, endDate = null) {
    try {
      const dateRange = this._getDateRange(period, startDate, endDate);
      
      if (!dateRange.success) {
        return dateRange;
      }

      const { start, end } = dateRange;

      const [
        totalUsers,
        newUsers,
        activeUsers,
        usersByRole
      ] = await Promise.all([
        User.countDocuments({ isActive: true }),
        User.countDocuments({ createdAt: { $gte: start, $lte: end }, isActive: true }),
        this._countActiveUsers(start, end),
        User.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ])
      ]);

      return {
        success: true,
        analytics: {
          period,
          dateRange: { start, end },
          totalUsers,
          newUsers,
          activeUsers,
          usersByRole: usersByRole.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {})
        }
      };
    } catch (error) {
      console.error('Get User Analytics Error:', error);
      return {
        success: false,
        message: 'Failed to fetch user analytics'
      };
    }
  }

  /**
   * Get abandoned cart analytics
   */
  async getAbandonedCartAnalytics(thresholdHours = 24) {
    try {
      const thresholdTime = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);

      const [
        totalAbandonedCarts,
        abandonedCartsWithValue
      ] = await Promise.all([
        Cart.countDocuments({
          'items.0': { $exists: true },
          lastModified: { $lt: thresholdTime }
        }),
        Cart.find({
          'items.0': { $exists: true },
          lastModified: { $lt: thresholdTime }
        })
          .populate('items.product', 'salePrice')
          .lean()
      ]);

      // Calculate total abandoned value
      let totalAbandonedValue = 0;
      
      for (const cart of abandonedCartsWithValue) {
        for (const item of cart.items) {
          if (item.product) {
            totalAbandonedValue += item.product.salePrice * item.quantity;
          }
        }
      }

      return {
        success: true,
        analytics: {
          totalAbandonedCarts,
          totalAbandonedValue: Math.round(totalAbandonedValue * 100) / 100,
          averageCartValue: totalAbandonedCarts > 0 
            ? Math.round((totalAbandonedValue / totalAbandonedCarts) * 100) / 100 
            : 0
        }
      };
    } catch (error) {
      console.error('Get Abandoned Cart Analytics Error:', error);
      return {
        success: false,
        message: 'Failed to fetch abandoned cart analytics'
      };
    }
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(threshold = 10) {
    try {
      const lowStockProducts = await this._getLowStockProducts(threshold);

      return {
        success: true,
        alerts: lowStockProducts,
        count: lowStockProducts.length
      };
    } catch (error) {
      console.error('Get Low Stock Alerts Error:', error);
      return {
        success: false,
        message: 'Failed to fetch low stock alerts'
      };
    }
  }

  /**
   * Get product performance
   */
  async getProductPerformance(period = 'last30days', startDate = null, endDate = null, limit = 10) {
    try {
      const dateRange = this._getDateRange(period, startDate, endDate);
      
      if (!dateRange.success) {
        return dateRange;
      }

      const { start, end } = dateRange;

      const [topProducts, bottomProducts] = await Promise.all([
        this._getTopProducts(start, end, limit),
        this._getBottomProducts(start, end, limit)
      ]);

      return {
        success: true,
        performance: {
          period,
          dateRange: { start, end },
          topProducts,
          bottomProducts
        }
      };
    } catch (error) {
      console.error('Get Product Performance Error:', error);
      return {
        success: false,
        message: 'Failed to fetch product performance'
      };
    }
  }

  /**
   * Get order trends
   */
  async getOrderTrends(period = 'last30days', startDate = null, endDate = null) {
    try {
      const dateRange = this._getDateRange(period, startDate, endDate);
      
      if (!dateRange.success) {
        return dateRange;
      }

      const { start, end } = dateRange;

      const trends = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            totalOrders: { $sum: 1 },
            totalSales: { $sum: '$totalAmount' },
            avgOrderValue: { $avg: '$totalAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return {
        success: true,
        trends: trends.map(day => ({
          date: day._id,
          orders: day.totalOrders,
          sales: Math.round(day.totalSales * 100) / 100,
          avgOrderValue: Math.round(day.avgOrderValue * 100) / 100
        }))
      };
    } catch (error) {
      console.error('Get Order Trends Error:', error);
      return {
        success: false,
        message: 'Failed to fetch order trends'
      };
    }
  }

  /**
   * Internal: Get date range based on period
   */
  _getDateRange(period, startDate, endDate) {
    const now = new Date();
    let start, end;

    switch (period) {
      case 'last30days':
        start = new Date(now - 30 * 24 * 60 * 60 * 1000);
        end = now;
        break;

      case 'last12months':
        start = new Date(now);
        start.setMonth(now.getMonth() - 12);
        end = now;
        break;

      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = now;
        break;

      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;

      case 'custom':
        if (!startDate || !endDate) {
          return {
            success: false,
            message: 'Start date and end date required for custom period'
          };
        }
        start = new Date(startDate);
        end = new Date(endDate);
        break;

      default:
        return {
          success: false,
          message: 'Invalid period. Use: last30days, last12months, thisMonth, lastMonth, or custom'
        };
    }

    return { success: true, start, end };
  }

  /**
   * Internal: Calculate total sales
   */
  async _calculateSales(start, end) {
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['PAID', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    return result.length > 0 ? result[0].total : 0;
  }

  /**
   * Internal: Count orders
   */
  async _countOrders(start, end = null) {
    const query = { createdAt: { $gte: start } };
    if (end) query.createdAt.$lte = end;

    return Order.countDocuments(query);
  }

  /**
   * Internal: Count active users (users who placed orders)
   */
  async _countActiveUsers(start, end = null) {
    const query = { createdAt: { $gte: start } };
    if (end) query.createdAt.$lte = end;

    const activeUsers = await Order.distinct('user', query);
    return activeUsers.length;
  }

  /**
   * Internal: Count abandoned carts
   */
  async _countAbandonedCarts() {
    const thresholdTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return Cart.countDocuments({
      'items.0': { $exists: true },
      lastModified: { $lt: thresholdTime }
    });
  }

  /**
   * Internal: Get low stock products
   */
  async _getLowStockProducts(threshold) {
    const products = await Product.find({ isActive: true }).lean();
    const lowStockProducts = [];

    for (const product of products) {
      if (product.hasVariants && product.variants.length > 0) {
        // Check variants
        for (const variant of product.variants) {
          if (variant.isActive && variant.stock <= threshold) {
            lowStockProducts.push({
              _id: product._id,
              name: product.name,
              variant: variant.name,
              sku: variant.sku,
              stock: variant.stock,
              threshold,
              status: variant.stock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'
            });
          }
        }
      } else {
        // Check base product
        if (product.stock <= threshold) {
          lowStockProducts.push({
            _id: product._id,
            name: product.name,
            variant: null,
            sku: product.sku,
            stock: product.stock,
            threshold,
            status: product.stock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'
          });
        }
      }
    }

    return lowStockProducts.sort((a, b) => a.stock - b.stock);
  }

  /**
   * Internal: Get orders by status
   */
  async _getOrdersByStatus(start, end) {
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    return result.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
  }

  /**
   * Internal: Get sales by day/month
   */
  async _getSalesByDay(start, end, period) {
    const format = period === 'last12months' ? '%Y-%m' : '%Y-%m-%d';

    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['PAID', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format, date: '$createdAt' }
          },
          sales: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return result.map(item => ({
      date: item._id,
      sales: Math.round(item.sales * 100) / 100,
      orders: item.orders
    }));
  }

  /**
   * Internal: Get top products
   */
  async _getTopProducts(start, end, limit) {
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['PAID', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'] }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 1,
          name: '$product.name',
          image: { $arrayElemAt: ['$product.images', 0] },
          totalQuantity: 1,
          totalRevenue: 1,
          orderCount: 1
        }
      }
    ]);

    return result.map(item => ({
      ...item,
      totalRevenue: Math.round(item.totalRevenue * 100) / 100
    }));
  }

  /**
   * Internal: Get bottom products
   */
  async _getBottomProducts(start, end, limit) {
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $in: ['PAID', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'] }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: 1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 1,
          name: '$product.name',
          image: { $arrayElemAt: ['$product.images', 0] },
          totalQuantity: 1,
          totalRevenue: 1,
          orderCount: 1
        }
      }
    ]);

    return result.map(item => ({
      ...item,
      totalRevenue: Math.round(item.totalRevenue * 100) / 100
    }));
  }
}

module.exports = new AnalyticsService();