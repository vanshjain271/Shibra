/**
 * Admin Order Routes - MVP (Razorpay Integrated)
 */

const express = require('express');
const router = express.Router();
const AdminOrderController = require('../../controllers/admin-order.controller');
const auth = require('../../middleware/auth.middleware');

// Admin only routes
router.get('/', auth.adminOnly, AdminOrderController.getOrders);

// Bulk actions (MUST be before :orderId routes to avoid collision)
router.post('/bulk-status', auth.adminOnly, AdminOrderController.bulkStatusUpdate);

router.get('/:orderId', auth.adminOnly, AdminOrderController.getOrderById);

// Order management
router.put('/:orderId/edit', auth.adminOnly, AdminOrderController.editOrder);
router.post('/:orderId/confirm', auth.adminOnly, AdminOrderController.confirmOrder);
router.post('/:orderId/cod-collected', auth.adminOnly, AdminOrderController.markCodCollected);
router.put('/:orderId/status', auth.adminOnly, AdminOrderController.updateOrderStatus);
router.post('/:orderId/cancel', auth.adminOnly, AdminOrderController.cancelOrder);
router.delete('/:orderId', auth.adminOnly, AdminOrderController.deleteOrder);

// Packing slip & Invoice
router.get('/:orderId/packing-slip', auth.adminOnly, AdminOrderController.generatePackingSlip);
router.get('/:orderId/invoice-pdf', auth.adminOnly, AdminOrderController.generateInvoicePDFDirect);

module.exports = router;