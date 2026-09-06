/**
 * Report Controller - MVP (Admin)
 */

const ReportService = require('../services/report.service');

/**
 * @desc    Generate product report
 * @route   GET /api/v1/admin/reports/product/:productId
 * @access  Admin
 * @query   dateFrom, dateTo, status, format (json|csv|xlsx)
 */
const getProductReport = async (req, res) => {
  try {
    const { productId } = req.params;
    const { dateFrom, dateTo, status, format = 'json' } = req.query;

    const result = await ReportService.generateProductReport(productId, {
      dateFrom,
      dateTo,
      status
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Return based on format
    if (format === 'csv') {
      const csvResult = await ReportService.exportToCSV(
        result.data,
        `product-report-${result.product.name}`
      );

      if (!csvResult.success) {
        return res.status(500).json(csvResult);
      }

      res.setHeader('Content-Type', csvResult.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${csvResult.filename}"`);
      return res.send(csvResult.csv);
    }

    if (format === 'xlsx') {
      const xlsxResult = await ReportService.exportToXLSX(
        result.data,
        `product-report-${result.product.name}`,
        'Product Report'
      );

      if (!xlsxResult.success) {
        return res.status(500).json(xlsxResult);
      }

      res.setHeader('Content-Type', xlsxResult.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${xlsxResult.filename}"`);
      return res.send(xlsxResult.buffer);
    }

    // Default: JSON
    return res.status(200).json({
      success: true,
      report: result
    });
  } catch (error) {
    console.error('Get Product Report Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while generating product report'
    });
  }
};

/**
 * @desc    Generate sales report
 * @route   GET /api/v1/admin/reports/sales
 * @access  Admin
 * @query   dateFrom, dateTo, status, format (json|csv|xlsx)
 */
const getSalesReport = async (req, res) => {
  try {
    const { dateFrom, dateTo, status, format = 'json' } = req.query;

    const result = await ReportService.generateSalesReport({
      dateFrom,
      dateTo,
      status
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Return based on format
    if (format === 'csv') {
      const csvResult = await ReportService.exportToCSV(
        result.data,
        'sales-report'
      );

      if (!csvResult.success) {
        return res.status(500).json(csvResult);
      }

      res.setHeader('Content-Type', csvResult.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${csvResult.filename}"`);
      return res.send(csvResult.csv);
    }

    if (format === 'xlsx') {
      const xlsxResult = await ReportService.exportToXLSX(
        result.data,
        'sales-report',
        'Sales Report'
      );

      if (!xlsxResult.success) {
        return res.status(500).json(xlsxResult);
      }

      res.setHeader('Content-Type', xlsxResult.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${xlsxResult.filename}"`);
      return res.send(xlsxResult.buffer);
    }

    // Default: JSON
    return res.status(200).json({
      success: true,
      report: result
    });
  } catch (error) {
    console.error('Get Sales Report Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while generating sales report'
    });
  }
};

/**
 * @desc    Generate inventory report
 * @route   GET /api/v1/admin/reports/inventory
 * @access  Admin
 * @query   format (json|csv|xlsx)
 */
const getInventoryReport = async (req, res) => {
  try {
    const { format = 'json' } = req.query;

    const result = await ReportService.generateInventoryReport();

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Return based on format
    if (format === 'csv') {
      const csvResult = await ReportService.exportToCSV(
        result.data,
        'inventory-report'
      );

      if (!csvResult.success) {
        return res.status(500).json(csvResult);
      }

      res.setHeader('Content-Type', csvResult.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${csvResult.filename}"`);
      return res.send(csvResult.csv);
    }

    if (format === 'xlsx') {
      const xlsxResult = await ReportService.exportToXLSX(
        result.data,
        'inventory-report',
        'Inventory Report'
      );

      if (!xlsxResult.success) {
        return res.status(500).json(xlsxResult);
      }

      res.setHeader('Content-Type', xlsxResult.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${xlsxResult.filename}"`);
      return res.send(xlsxResult.buffer);
    }

    // Default: JSON
    return res.status(200).json({
      success: true,
      report: result
    });
  } catch (error) {
    console.error('Get Inventory Report Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while generating inventory report'
    });
  }
};

/**
 * @desc    Sales breakdown by product
 * @route   GET /api/v1/admin/reports/sales/by-product
 * @access  Admin
 */
const getSalesByProduct = async (req, res) => {
  try {
    const Order = require('../models/Order');
    const { dateFrom, dateTo, limit = 20 } = req.query;

    const matchStage = { status: { $in: ['DELIVERED', 'SHIPPED', 'PROCESSING', 'CONFIRMED'] } };
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
    }

    const salesByProduct = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) }
    ]);

    return res.status(200).json({
      success: true,
      data: salesByProduct
    });
  } catch (error) {
    console.error('Get Sales By Product Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred'
    });
  }
};

/**
 * @desc    Sales breakdown by category
 * @route   GET /api/v1/admin/reports/sales/by-category
 * @access  Admin
 */
const getSalesByCategory = async (req, res) => {
  try {
    const Order = require('../models/Order');
    const Product = require('../models/Product');
    const { dateFrom, dateTo } = req.query;

    const matchStage = { status: { $in: ['DELIVERED', 'SHIPPED', 'PROCESSING', 'CONFIRMED'] } };
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
    }

    const salesByCategory = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'productInfo.category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$categoryInfo._id',
          categoryName: { $first: '$categoryInfo.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          productCount: { $addToSet: '$items.product' }
        }
      },
      {
        $project: {
          categoryName: 1,
          totalQuantity: 1,
          totalRevenue: 1,
          productCount: { $size: '$productCount' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: salesByCategory
    });
  } catch (error) {
    console.error('Get Sales By Category Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred'
    });
  }
};

const mongoose = require('mongoose');

/**
 * @desc    Customer purchase history
 * @route   GET /api/v1/admin/reports/customer/:customerId/history
 * @access  Admin
 */
const getCustomerHistory = async (req, res) => {
  try {
    const Order = require('../models/Order');
    const { customerId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Convert customerId to ObjectId for aggregation
    let customerObjectId;
    try {
      customerObjectId = new mongoose.Types.ObjectId(customerId);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID' });
    }

    const orders = await Order.find({ user: customerObjectId })
      .select('orderNumber items totalAmount status paymentStatus createdAt')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const totalOrders = await Order.countDocuments({ user: customerObjectId });
    const totalSpent = await Order.aggregate([
      { 
        $match: { 
          user: customerObjectId, 
          status: { $in: ['DELIVERED', 'SHIPPED', 'CONFIRMED', 'PAID', 'PACKED'] } 
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    return res.status(200).json({
      success: true,
      data: {
        orders,
        totalOrders,
        totalSpent: totalSpent[0]?.total || 0,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalOrders / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get Customer History Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred'
    });
  }
};

module.exports = {
  getProductReport,
  getSalesReport,
  getInventoryReport,
  getSalesByProduct,
  getSalesByCategory,
  getCustomerHistory
};