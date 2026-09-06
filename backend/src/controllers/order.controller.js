/**
 * Order Controller - MVP (Buyer - Razorpay Integrated)
 */

const OrderService = require('../services/order.service');

const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMode, utr } = req.body;
    const result = await OrderService.createOrder(req.user.userId, items, shippingAddress, paymentMode, null, utr);
    if (!result.success) return res.status(400).json(result);
    return res.status(201).json({ success: true, message: 'Order created successfully', order: result.order, amountToPay: result.amountToPay });
  } catch (error) {
    console.error('Create Order Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

const initiatePayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await OrderService.initiatePayment(orderId, req.user.userId);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('Initiate Payment Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await OrderService.verifyPayment(orderId, req.body, req.user.userId);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Verify Payment Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const paymentFailed = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await OrderService.handlePaymentFailure(orderId, req.body.reason, req.user.userId);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Payment Failed Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await OrderService.cancelOrder(orderId, req.user.userId, req.body.reason);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Cancel Order Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const result = await OrderService.listOrders({ userId: req.user.userId, status }, { page, limit });
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get My Orders Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const result = await OrderService.getOrderById(req.params.orderId, req.user.userId);
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get Order Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getRecentlyOrderedProducts = async (req, res) => {
  try {
    const { limit } = req.query;
    const result = await OrderService.getRecentlyOrderedProducts(req.user.userId, limit ? parseInt(limit) : 10);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Recently Ordered Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const result = await OrderService.handleRazorpayWebhook(req.body, req.rawBody, signature);
    return res.status(result.success ? 200 : (result.status || 500)).json(result);
  } catch (error) {
    console.error('Razorpay Webhook Error:', error);
    return res.status(500).json({ success: false });
  }
};

module.exports = {
  createOrder,
  initiatePayment,
  verifyPayment,
  paymentFailed,
  cancelOrder,
  getMyOrders,
  getOrderById,
  getRecentlyOrderedProducts,
  handleRazorpayWebhook
};
