/**
 * Admin Order Controller - MVP (Razorpay Integrated)
 */

const OrderService = require('../services/order.service');
const Order = require('../models/Order');
const { generatePackingSlipPDF } = require('../utils/packing-slip.utils');
const { logActivity } = require('../services/activity.service');

/**
 * @desc    Get all orders
 * @route   GET /api/v1/admin/orders
 * @access  Admin
 */
const getOrders = async (req, res) => {
  try {
    const { page, limit, status, dateFrom, dateTo } = req.query;

    const result = await OrderService.listOrders(
      { status, dateFrom, dateTo },
      { page, limit }
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      orders: result.orders,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Admin Get Orders Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching orders'
    });
  }
};

/**
 * @desc    Get order by ID
 * @route   GET /api/v1/admin/orders/:orderId
 * @access  Admin
 */
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await OrderService.getOrderById(orderId, null, true);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json({
      success: true,
      order: result.order
    });
  } catch (error) {
    console.error('Admin Get Order Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching order'
    });
  }
};

/**
 * @desc    Confirm order (after payment)
 * @route   POST /api/v1/admin/orders/:orderId/confirm
 * @access  Admin
 * @body    { note }
 */
const confirmOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { note } = req.body;

    const result = await OrderService.confirmOrder(
      orderId,
      req.user.userId,
      note
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: 'Order confirmed',
      order: result.order
    });
  } catch (error) {
    console.error('Admin Confirm Order Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while confirming order'
    });
  }
};

/**
 * @desc    Mark COD collected
 * @route   POST /api/v1/admin/orders/:orderId/cod-collected
 * @access  Admin
 */
const markCodCollected = async (req, res) => {
  try {
    const { orderId } = req.params;

    const result = await OrderService.markCodCollected(
      orderId,
      req.user.userId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      order: result.order
    });
  } catch (error) {
    console.error('Admin Mark COD Collected Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while marking COD collected'
    });
  }
};

/**
 * @desc    Update order status
 * @route   POST /api/v1/admin/orders/:orderId/status
 * @access  Admin
 * @body    { status, courierName, trackingNumber, trackingUrl, note }
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, courierName, trackingNumber, trackingUrl, note } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: '`status` field is required'
      });
    }

    const result = await OrderService.updateOrderStatus(
      orderId,
      req.user.userId,
      status,
      { courierName, trackingNumber, trackingUrl, note }
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Log the activity
    logActivity({
      userId: req.user.userId,
      action: 'STATUS_CHANGE',
      entityType: 'Order',
      entityId: orderId,
      description: `Order status changed to ${status}`,
      details: { from: result.order?.statusHistory?.slice(-2, -1)?.[0]?.status, to: status, courierName, trackingNumber },
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Order status updated',
      order: result.order
    });
  } catch (error) {
    console.error('Admin Update Order Status Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating order status'
    });
  }
};

/**
 * @desc    Cancel order (admin)
 * @route   POST /api/v1/admin/orders/:orderId/cancel
 * @access  Admin
 * @body    { reason }
 */
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const result = await OrderService.cancelOrder(
      orderId,
      req.user.userId,
      reason,
      true
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    logActivity({
      userId: req.user.userId,
      action: 'STATUS_CHANGE',
      entityType: 'Order',
      entityId: orderId,
      description: `Order cancelled. Reason: ${reason || 'N/A'}`,
      details: { reason },
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      order: result.order,
      requiresRefund: result.requiresRefund
    });
  } catch (error) {
    console.error('Admin Cancel Order Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while cancelling order'
    });
  }
};

/**
 * @desc    Delete order completely
 * @route   DELETE /api/v1/admin/orders/:orderId
 * @access  Admin
 */
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Call the service for hard delete
    const result = await OrderService.deleteOrder(orderId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    logActivity({
      userId: req.user.userId,
      action: 'DELETE',
      entityType: 'Order',
      entityId: orderId,
      description: `Order deleted completely`,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Admin Delete Order Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while deleting order'
    });
  }
};

/**
 * @desc    Generate and download packing slip PDF
 * @route   GET /api/v1/admin/orders/:orderId/packing-slip
 * @access  Admin
 */
const generatePackingSlip = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Use lean() - item name/sku/variant are already stored as snapshots, no populate needed
    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Allow packing slip for any status
    // Removed allowedStatuses restriction

    const pdfBuffer = await generatePackingSlipPDF(order);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="packing-slip-${order.orderNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate Packing Slip Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while generating packing slip',
      error: error.message
    });
  }
};

/**
 * @desc    Generate Invoice PDF (Direct download for admin panel)
 * @route   GET /api/v1/admin/orders/:orderId/invoice-pdf
 * @access  Admin
 */
const generateInvoicePDFDirect = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { generateInvoicePDF } = require('../utils/pdf.utils');
    const Invoice = require('../models/invoice');

    const order = await Order.findById(orderId)
      .populate('user', 'name phone email')
      .lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Try to find an existing invoice
    let existingInvoice = await Invoice.findOne({ order: orderId })
      .populate('order', 'orderNumber status createdAt shippingCharge discount tokenReceived payment')
      .populate('user', 'name phone email')
      .lean();

    // If no invoice exists, try to generate one (works for any status)
    if (!existingInvoice) {
      // Build a synthetic invoice object directly from order data
      // (bypasses the status check in InvoiceService.generateInvoice)
      existingInvoice = {
        invoiceNumber: `INV-${order.orderNumber}`,
        invoiceDate: order.createdAt || new Date(),
        billingAddress: order.shippingAddress || {},
        shippingAddress: order.shippingAddress || {},
        items: (order.items || []).map(item => ({
          name: item.name || '',
          variantName: item.variantName || '',
          quantity: item.quantity || 0,
          price: item.price || 0,
          mrp: item.mrp || item.price || 0,
          totalWithTax: (item.price || 0) * (item.quantity || 0),
        })),
        grandTotal: order.totalAmount || 0,
        subtotal: order.totalAmount || 0,
        status: 'GENERATED',
        order: {
          orderNumber: order.orderNumber,
          status: order.status,
          shippingCharge: order.shippingCharge || 0,
          discount: order.discount || 0,
          tokenReceived: order.tokenReceived || 0,
          payment: order.payment || {},
        },
        user: order.user || {},
      };
    }

    const pdfBuffer = await generateInvoicePDF(existingInvoice);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${order.orderNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate Invoice PDF Error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred while generating invoice PDF' });
  }
};

/**
 * @desc    Edit order items / totals (admin override)
 * @route   PUT /api/v1/admin/orders/:orderId/edit
 * @access  Admin
 * @body    { items, shippingCharge, discount, note }
 */
const editOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { items, shippingCharge, discount, tokenReceived, note } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Update items if provided
    if (items && Array.isArray(items)) {
      order.items = items.map(item => ({
        product: item.product,
        variant: item.variant || null,
        name: item.name,
        variantName: item.variantName || '',
        sku: item.sku || '',
        image: item.image || '',
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
        mrp: Number(item.mrp) || Number(item.price) || 0,
        total: (Number(item.quantity) || 1) * (Number(item.price) || 0),
      }));
    }

    // Recalculate subtotal from items
    const subtotal = order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    order.subtotal = subtotal;

    // Apply shipping & discount & token
    const shipping = shippingCharge !== undefined ? Number(shippingCharge) : (order.shippingCharge || 0);
    const disc = discount !== undefined ? Number(discount) : (order.discount || 0);
    const token = tokenReceived !== undefined ? Number(tokenReceived) : (order.tokenReceived || 0);
    
    order.shippingCharge = shipping;
    order.discount = disc;
    order.tokenReceived = token;
    order.totalAmount = subtotal + shipping - disc - token;

    // Add to status history as an edit note
    order.addStatusHistory(order.status, req.user.userId, note || 'Order edited by admin');

    await order.save();

    logActivity({
      userId: req.user.userId,
      action: 'UPDATE',
      entityType: 'Order',
      entityId: orderId,
      description: `Order edited: ${order.items.length} items, total ₹${order.totalAmount}`,
      details: { itemCount: order.items.length, subtotal: order.subtotal, totalAmount: order.totalAmount },
      ip: req.ip,
    });

    // If an invoice exists, regenerate its PDF to reflect new amounts
    try {
      const Invoice = require('../models/Invoice');
      const InvoiceService = require('../services/invoice.service');
      const existingInvoice = await Invoice.findOne({ order: orderId });
      if (existingInvoice) {
        // Just regenerate the PDF buffer & upload so it uses the latest order data
        await InvoiceService.regeneratePDF(existingInvoice._id);
      }
    } catch (err) {
      console.error('Failed to regenerate invoice after order edit:', err);
    }

    return res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order
    });
  } catch (error) {
    console.error('Admin Edit Order Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while editing order'
    });
  }
};

/**
 * @desc    Bulk update status for multiple orders
 * @route   POST /api/v1/admin/orders/bulk-status
 * @access  Admin
 * @body    { orderIds: string[], status: string, note?: string }
 */
const bulkStatusUpdate = async (req, res) => {
  try {
    const { orderIds, status: newStatus, note } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ success: false, message: 'orderIds array is required' });
    }
    if (!newStatus) {
      return res.status(400).json({ success: false, message: 'status is required' });
    }

    const results = { updated: 0, failed: 0, errors: [] };

    for (const id of orderIds) {
      try {
        const order = await Order.findById(id);
        if (!order) {
          results.failed++;
          results.errors.push({ id, error: 'Order not found' });
          continue;
        }

        const transition = order.transitionTo(newStatus, req.user.userId, note || `Bulk update to ${newStatus}`);
        if (!transition.valid) {
          results.failed++;
          results.errors.push({ id, orderNumber: order.orderNumber, error: `Cannot transition from ${order.status} to ${newStatus}` });
          continue;
        }

        await order.save();
        results.updated++;
      } catch (err) {
        results.failed++;
        results.errors.push({ id, error: err.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: `${results.updated} orders updated, ${results.failed} failed`,
      results
    });
  } catch (error) {
    console.error('Admin Bulk Status Update Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during bulk status update'
    });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  confirmOrder,
  markCodCollected,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  generatePackingSlip,
  generateInvoicePDFDirect,
  editOrder,
  bulkStatusUpdate
};