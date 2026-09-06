/**
 * Admin Customer Routes - MVP
 * 
 * GET /admin/customers - List all customers
 * GET /admin/customers/:id - Get customer details
 * GET /admin/customers/:id/orders - Get customer orders
 */

const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Order = require('../../models/Order');
const { adminOnly } = require('../../middleware/auth.middleware');

/**
 * @route   GET /api/v1/admin/customers
 * @desc    Get all customers (buyers)
 * @access  Admin
 */
router.get('/', adminOnly, async (req, res) => {
    try {
        const { page = 1, limit = 50, search, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = { role: 'BUYER' };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        if (status === 'active') query.isActive = true;
        if (status === 'inactive') query.isActive = false;

        const [customers, total] = await Promise.all([
            User.find(query)
                .select('name email phone businessName companyType gstNumber isActive createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            User.countDocuments(query)
        ]);

        // Get order counts for each customer
        const customerIds = customers.map(c => c._id);
        const orderStats = await Order.aggregate([
            { $match: { user: { $in: customerIds } } },
            {
                $group: {
                    _id: '$user',
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$totalAmount' }
                }
            }
        ]);

        const orderStatsMap = {};
        orderStats.forEach(stat => {
            orderStatsMap[stat._id.toString()] = stat;
        });

        const customersWithStats = customers.map(customer => ({
            ...customer,
            totalOrders: orderStatsMap[customer._id.toString()]?.totalOrders || 0,
            totalSpent: orderStatsMap[customer._id.toString()]?.totalSpent || 0
        }));

        return res.status(200).json({
            success: true,
            data: {
                customers: customersWithStats,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get Customers Error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching customers'
        });
    }
});

/**
 * @route   GET /api/v1/admin/customers/:id
 * @desc    Get single customer details
 * @access  Admin
 */
router.get('/:id', adminOnly, async (req, res) => {
    try {
        const customer = await User.findById(req.params.id)
            .select('-password')
            .lean();

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Get order stats
        const [orderStats, recentOrders] = await Promise.all([
            Order.aggregate([
                { $match: { user: customer._id } },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 },
                        totalSpent: { $sum: '$totalAmount' },
                        avgOrderValue: { $avg: '$totalAmount' }
                    }
                }
            ]),
            Order.find({ user: customer._id })
                .sort({ createdAt: -1 })
                .limit(10)
                .select('orderNumber status totalAmount createdAt')
                .lean()
        ]);

        return res.status(200).json({
            success: true,
            data: {
                customer: {
                    ...customer,
                    stats: orderStats[0] || { totalOrders: 0, totalSpent: 0, avgOrderValue: 0 },
                    recentOrders
                }
            }
        });
    } catch (error) {
        console.error('Get Customer Error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching customer'
        });
    }
});

/**
 * @route   PATCH /api/v1/admin/customers/:id
 * @desc    Update customer details (name, phone, email, type, GST, COD block, etc.)
 * @access  Admin
 */
router.patch('/:id', adminOnly, async (req, res) => {
    try {
        const { name, phone, email, type, hasGSTNo, gstNo, isAffiliate, blockCOD, businessName, companyType } = req.body;

        // Build update object — only include fields that were actually sent
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (phone !== undefined) updates.phone = phone;
        if (email !== undefined) updates.email = email;
        if (type !== undefined) updates.type = type;
        if (hasGSTNo !== undefined) updates.hasGSTNo = hasGSTNo;
        if (gstNo !== undefined) updates.gstNo = gstNo;
        if (isAffiliate !== undefined) updates.isAffiliate = isAffiliate;
        if (blockCOD !== undefined) updates.blockCOD = blockCOD;
        if (businessName !== undefined) updates.businessName = businessName;
        if (companyType !== undefined) updates.companyType = companyType;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        const customer = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Customer updated successfully',
            data: { customer }
        });
    } catch (error) {
        console.error('Update Customer Error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while updating customer'
        });
    }
});

/**
 * @route   PUT /api/v1/admin/customers/:id/status
 * @desc    Update customer status (activate/deactivate)
 * @access  Admin
 */
router.put('/:id/status', adminOnly, async (req, res) => {
    try {
        const { isActive } = req.body;

        const customer = await User.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        ).select('-password');

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: `Customer ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: { customer }
        });
    } catch (error) {
        console.error('Update Customer Status Error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while updating customer'
        });
    }
});

module.exports = router;
