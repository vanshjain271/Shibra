/**
 * Admin Report Routes - MVP
 */

const express = require('express');
const router = express.Router();
const ReportController = require('../../controllers/report.controller');
const auth = require('../../middleware/auth.middleware');

// Dashboard summary (aggregated stats)
router.get('/dashboard', auth.adminOnly, async (req, res) => {
    try {
        const Order = require('../../models/Order');
        const User = require('../../models/User');
        const Product = require('../../models/Product');
        const Cart = require('../../models/Cart');

        const today = new Date();
        const { timeframe = 'month' } = req.query;
        let startDate;

        switch (timeframe) {
            case 'today':
                startDate = new Date(today);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate = new Date(today);
                const day = startDate.getDay();
                const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
                startDate.setDate(diff);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case '6months':
                startDate = new Date(today);
                startDate.setMonth(startDate.getMonth() - 6);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'all':
                startDate = new Date(0);
                break;
            default:
                startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const abandonedThreshold = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours
        // Keep 7 days for the sparkline chart regardless of timeframe to avoid overcrowding
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [
            totalOrders,
            totalRevenue,
            totalCustomers,
            totalProducts,
            recentOrders,
            lowStockProducts,
            wishlistStats,
            topWishlisted,
            ordersByStatus,
            salesByDay,
        ] = await Promise.all([
            Order.countDocuments({ createdAt: { $gte: startDate } }),
            Order.aggregate([
                { $match: { createdAt: { $gte: startDate }, status: { $in: ['DELIVERED', 'SHIPPED', 'CONFIRMED', 'PAID', 'PACKED'] } } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            User.countDocuments({ role: 'BUYER', createdAt: { $gte: startDate } }),
            Product.countDocuments({ isActive: true }),
            Order.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('user', 'name')
                .select('orderNumber status totalAmount createdAt')
                .lean(),
            Product.countDocuments({
                $expr: { $lte: ['$stock', '$lowStockThreshold'] },
                isActive: true
            }),
            User.aggregate([
                { $unwind: "$wishlist" },
                { $group: { _id: null, totalItems: { $sum: 1 }, uniqueProducts: { $addToSet: "$wishlist" } } }
            ]),
            User.aggregate([
                { $unwind: "$wishlist" },
                { $group: { _id: "$wishlist", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 },
                { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
                { $unwind: "$product" },
                { $project: { _id: 1, count: 1, name: "$product.name", category: "$product.category" } }
            ]),
            Order.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Order.aggregate([
                { $match: { createdAt: { $gte: startDate }, status: { $in: ['DELIVERED', 'SHIPPED', 'CONFIRMED', 'PAID', 'PACKED'] } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, amount: { $sum: '$totalAmount' }, ordersCount: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]),
        ]);

        const statusMap = {};
        ordersByStatus.forEach(s => { statusMap[s._id] = s.count; });

        // Fill in missing days for salesByDay to make chart look continuous
        const salesDataMap = {};
        salesByDay.forEach(d => { salesDataMap[d._id] = { amount: Math.round(d.amount), count: d.ordersCount }; });

        const salesData = [];
        const curr = new Date(startDate);
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);

        // Limit to max 31 days if 'all' or '6months' to avoid client-side crash, but for month/week it's fine
        let loopDate = new Date(curr);
        if (timeframe === 'all' || timeframe === '6months') {
            loopDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        while (loopDate <= end) {
            const dateStr = loopDate.toISOString().split('T')[0];
            salesData.push({
                date: dateStr,
                amount: salesDataMap[dateStr]?.amount || 0,
                orders: salesDataMap[dateStr]?.count || 0
            });
            loopDate.setDate(loopDate.getDate() + 1);
        }

        return res.status(200).json({
            success: true,
            totalRevenue: totalRevenue[0]?.total || 0,
            totalOrders,
            totalCustomers,
            wishlistData: {
                totalItems: wishlistStats[0]?.totalItems || 0,
                uniqueProducts: wishlistStats[0]?.uniqueProducts?.length || 0,
                topProducts: topWishlisted || []
            },
            recentOrders,
            ordersByStatus: statusMap,
            salesByDay: salesData,
            data: {
                summary: {
                    totalOrders,
                    totalRevenue: totalRevenue[0]?.total || 0,
                    totalCustomers,
                    totalProducts,
                    lowStockProducts
                },
                recentOrders
            }
        });
    } catch (error) {
        console.error('Dashboard Report Error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching dashboard data'
        });
    }
});

// Product report
router.get('/product/:productId', auth.adminOnly, ReportController.getProductReport);

// Sales report
router.get('/sales', auth.adminOnly, ReportController.getSalesReport);

// Sales by product
router.get('/sales/by-product', auth.adminOnly, ReportController.getSalesByProduct);

// Sales by category
router.get('/sales/by-category', auth.adminOnly, ReportController.getSalesByCategory);

// Inventory report
router.get('/inventory', auth.adminOnly, ReportController.getInventoryReport);

// Customer purchase history
router.get('/customer/:customerId/history', auth.adminOnly, ReportController.getCustomerHistory);

module.exports = router;