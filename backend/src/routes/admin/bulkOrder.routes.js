/**
 * Admin Bulk Order Routes - Special Price Orders
 */

const express = require('express');
const router = express.Router();
const BulkOrder = require('../../models/BulkOrder');
const Product = require('../../models/Product');
const { adminOnly } = require('../../middleware/auth.middleware');

// Get all bulk orders
router.get('/', adminOnly, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status) query.status = status;

        const orders = await BulkOrder.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('items.product', 'name images')
            .lean();

        const total = await BulkOrder.countDocuments(query);

        res.json({
            success: true,
            orders,
            pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Bulk Orders List Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch bulk orders' });
    }
});

// Get single bulk order
router.get('/:id', adminOnly, async (req, res) => {
    try {
        const order = await BulkOrder.findById(req.params.id)
            .populate('items.product', 'name images salePrice')
            .populate('createdBy', 'name');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Bulk order not found' });
        }

        res.json({ success: true, order });
    } catch (error) {
        console.error('Bulk Order Get Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch bulk order' });
    }
});

// Create bulk order with special pricing
router.post('/', adminOnly, async (req, res) => {
    try {
        const {
            customerName, customerPhone, customerEmail, customerAddress,
            items, discount, deliveryFee, paymentMode, advanceAmount, notes, internalNotes, expectedDelivery
        } = req.body;

        // Calculate totals
        let subtotal = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) continue;

            const regularPrice = product.salePrice || product.mrp;
            const specialPrice = item.specialPrice || regularPrice;
            const itemDiscount = ((regularPrice - specialPrice) / regularPrice) * 100;

            processedItems.push({
                product: product._id,
                productName: product.name,
                quantity: item.quantity,
                regularPrice,
                specialPrice,
                discount: Math.round(itemDiscount)
            });

            subtotal += specialPrice * item.quantity;
        }

        const totalAmount = subtotal - (discount || 0) + (deliveryFee || 0);

        const order = await BulkOrder.create({
            customerName,
            customerPhone,
            customerEmail,
            customerAddress,
            items: processedItems,
            subtotal,
            discount: discount || 0,
            deliveryFee: deliveryFee || 0,
            totalAmount,
            paymentMode: paymentMode || 'COD',
            advanceAmount: advanceAmount || 0,
            paymentStatus: advanceAmount > 0 ? 'PARTIAL' : 'PENDING',
            notes,
            internalNotes,
            expectedDelivery,
            createdBy: req.user._id
        });

        res.status(201).json({ success: true, order });
    } catch (error) {
        console.error('Bulk Order Create Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create bulk order' });
    }
});

// Update bulk order status
router.put('/:id/status', adminOnly, async (req, res) => {
    try {
        const { status, trackingNumber } = req.body;

        const order = await BulkOrder.findByIdAndUpdate(
            req.params.id,
            { status, ...(trackingNumber && { trackingNumber }) },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Bulk order not found' });
        }

        res.json({ success: true, order });
    } catch (error) {
        console.error('Bulk Order Status Update Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update status' });
    }
});

// Update payment status
router.put('/:id/payment', adminOnly, async (req, res) => {
    try {
        const { paymentStatus, advanceAmount } = req.body;

        const order = await BulkOrder.findByIdAndUpdate(
            req.params.id,
            { paymentStatus, ...(advanceAmount && { advanceAmount }) },
            { new: true }
        );

        res.json({ success: true, order });
    } catch (error) {
        console.error('Bulk Order Payment Update Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update payment' });
    }
});

// Delete bulk order
router.delete('/:id', adminOnly, async (req, res) => {
    try {
        const order = await BulkOrder.findByIdAndDelete(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Bulk order not found' });
        }

        res.json({ success: true, message: 'Bulk order deleted' });
    } catch (error) {
        console.error('Bulk Order Delete Error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete bulk order' });
    }
});

module.exports = router;
