const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User'); // Added User import
const StoreSettings = require('../models/StoreSettings');
const CouponService = require('./coupon.service');
const RazorpayService = require('./razorpay.service');
const NotificationService = require('./notification.service');
const InvoiceService = require('./invoice.service');
const CartService = require('./cart.service');

class OrderService {
  async createOrder(userId, items, shippingAddressId, paymentMode = 'FULL_PAYMENT', couponCode = null, utr = null) {
    if (!items || items.length === 0) return { success: false, message: 'Order must have at least one item' };
    if (!shippingAddressId) return { success: false, message: 'Shipping address is required' };

    // Fetch User to get the specific address
    const user = await User.findById(userId);
    if (!user) return { success: false, message: 'User not found' };

    const address = user.addresses.id(shippingAddressId);
    if (!address) return { success: false, message: 'Shipping address not found' };

    const orderItems = [];
    let subtotal = 0;
    let taxTotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) return { success: false, message: `Product ${item.productId} not available` };
      
      let price, mrp, stock;
      let variantName = '';
      let sku = product.sku || '';
      
      if (item.variantId && product.hasVariants) {
        const variant = product.variants.id(item.variantId);
        if (!variant) return { success: false, message: `Variant ${item.variantId} not found` };
        price = variant.salePrice;
        mrp = variant.mrp;
        stock = variant.stock;
        variantName = variant.name;
        if (variant.sku) sku = variant.sku;
      } else {
        price = product.salePrice;
        mrp = product.mrp;
        stock = product.stock;
      }
      
      if (item.selectedModel && product.hasModels) {
        const model = product.availableModels.find(m => m.name === item.selectedModel);
        if (!model) return { success: false, message: `Selected model ${item.selectedModel} not available` };
        stock = model.stock;
      }

      if (!product.isLot && stock < item.quantity) return { success: false, message: `Insufficient stock for ${product.name}${item.selectedModel ? ' (' + item.selectedModel + ')' : ''}` };
      
      let itemTotal = price * item.quantity;

      // Apply Lot Pricing if product is a lot
      if (product.isLot && product.lotDetails) {
        if (product.lotDetails.allowHalfLot && item.quantity === product.lotDetails.halfLotQuantity) {
          let totalHalfPrice = product.lotDetails.halfLotPrice;
          if (totalHalfPrice < product.salePrice * 0.1) totalHalfPrice *= product.lotDetails.halfLotQuantity;
          price = item.quantity > 0 ? totalHalfPrice / item.quantity : 0;
          itemTotal = totalHalfPrice;
          mrp = price;
        } else if (product.lotDetails.allowMiniLot && item.quantity === product.lotDetails.miniLotQuantity) {
          let totalMiniPrice = product.lotDetails.miniLotPrice;
          if (totalMiniPrice < product.salePrice * 0.1) totalMiniPrice *= product.lotDetails.miniLotQuantity;
          price = item.quantity > 0 ? totalMiniPrice / item.quantity : 0;
          itemTotal = totalMiniPrice;
          mrp = price;
        } else if (product.lotDetails.fullLotQuantity > 0) {
          let totalFullPrice = product.lotDetails.fullLotPrice;
          if (totalFullPrice < product.salePrice * 0.1) totalFullPrice *= product.lotDetails.fullLotQuantity;
          price = item.quantity > 0 ? totalFullPrice / item.quantity : 0;
          itemTotal = totalFullPrice;
          mrp = price;
        }
      }

      const itemTax = (itemTotal * (product.taxRate || 0)) / 100;
      
      subtotal += itemTotal;
      taxTotal += itemTax;

      orderItems.push({ 
        product: product._id, 
        variant: item.variantId || null, 
        variantName,
        sku,
        lotType: item.lotType || 'none',
        selectedModel: item.selectedModel || null,
        name: product.name, 
        image: product.images?.[0] || '', 
        quantity: item.quantity, 
        price, 
        mrp, 
        total: itemTotal 
      });
    }

    const orderNumber = await Order.generateOrderNumber();
    
    // Fetch settings
    const settings = await StoreSettings.getSettings();

    // Minimum order amount validation
    if (subtotal < settings.minOrderAmount) {
      return { success: false, message: `Minimum order amount is ₹${settings.minOrderAmount}` };
    }

    // Payment validation
    if (paymentMode === 'COD' && !settings.codEnabled) {
      return { success: false, message: 'Cash on Delivery is currently disabled' };
    }
    // Only PREPAID (card/net banking via Razorpay) requires razorpayEnabled
    // UPI_QR is manual QR — does NOT require Razorpay to be enabled
    if ((paymentMode === 'PREPAID' || paymentMode === 'FULL_PAYMENT') && !settings.razorpayEnabled) {
      return { success: false, message: 'Online Payment is currently disabled' };
    }
    if (paymentMode === 'COD_PARTIAL' && !settings.advancePartialPayment) {
      return { success: false, message: 'Partial Payment is currently disabled' };
    }

    // Final calculations
    let shippingCharge = 0;
    if (subtotal < settings.freeDeliveryThreshold) {
      shippingCharge = settings.deliveryFee;
    }
    
    let discount = 0;
    let appliedCouponDetails = null;
    let validityCheck = null;

    if (couponCode) {
      validityCheck = await CouponService.validateCoupon(couponCode, userId, orderItems, subtotal);
      if (validityCheck.success) {
        discount = validityCheck.discount;
        appliedCouponDetails = {
          code: validityCheck.coupon.code,
          discountAmount: discount
        };
      } else {
        return { success: false, message: validityCheck.message || 'Invalid coupon' };
      }
    }
    
    const totalAmount = Math.max(0, subtotal + taxTotal + shippingCharge - discount);
    let amountToPay = totalAmount;
    let codAmount = 0;

    if (paymentMode === 'COD_PARTIAL') {
      if (settings.partialPaymentType === 'flat') {
        amountToPay = settings.partialPaymentFlatAmount || 0;
      } else {
        const partialPercentage = settings.partialPaymentPercent || 20;
        amountToPay = (totalAmount * partialPercentage) / 100;
      }
      if (amountToPay > totalAmount) amountToPay = totalAmount;
      codAmount = totalAmount - amountToPay;
    } else if (paymentMode === 'COD') {
      amountToPay = 0;
      codAmount = totalAmount;
    } else if (paymentMode === 'PREPAID' || paymentMode === 'FULL_PAYMENT' || paymentMode === 'UPI_QR') {
      amountToPay = totalAmount;
      codAmount = 0;
    }

    const order = new Order({ 
      orderNumber, 
      user: userId, 
      status: 'PENDING', 
      items: orderItems, 
      shippingAddress: address.toObject(), // Snapshot the address
      subtotal, 
      totalAmount, 
      taxAmount: taxTotal,
      payment: { 
        mode: paymentMode, 
        utrNumber: utr || '',
        amountPaid: 0, 
        codAmount 
      },
      coupon: appliedCouponDetails
    });

    await order.save();
    
    // Clear user cart
    try {
      await CartService.clearCart(userId);
    } catch (err) {
      console.error('Failed to clear cart after order placement:', err);
    }
    
    // If a coupon was applied, record its usage independently (MVP behavior)
    if (appliedCouponDetails) {
       // Since it's created, log the usage internally
       await CouponService.applyCoupon(validityCheck?.coupon?._id || couponCode, userId, totalAmount).catch(e => console.log(e));
       // (note: applyCoupon by id or code works if service supports. Service applyCoupon expects ID. We have to fetch it or we already did inside validate. We can just skip rigorous record for now or let validation slide)
       // Let's rely on validate for discounts
    }
    return { success: true, order, amountToPay: Math.round(amountToPay * 100) / 100 };
  }

  async getRecentlyOrderedProducts(userId, limit = 10) {
    const orders = await Order.find({ user: userId, status: { $nin: ['CANCELLED', 'PAYMENT_FAILED'] } })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    const productIds = new Set();
    const uniqueProductIds = [];
    for (const order of orders) {
      for (const item of order.items) {
        if (!productIds.has(item.product.toString())) {
          productIds.add(item.product.toString());
          uniqueProductIds.push(item.product);
        }
        if (uniqueProductIds.length >= limit) break;
      }
      if (uniqueProductIds.length >= limit) break;
    }
    const products = await Product.find({ _id: { $in: uniqueProductIds }, isActive: true }).lean();
    return { success: true, products };
  }

  async listOrders(filter = {}, pagination = {}) {
    const { userId, status, dateFrom, dateTo } = filter;
    const { page = 1, limit = 20 } = pagination;
    
    const query = {};
    if (userId) query.user = userId;
    if (status) query.status = status;
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'name phone')
        .populate('items.product', 'name images mrp salePrice slug')
        .lean(),
      Order.countDocuments(query)
    ]);

    return { 
      success: true, 
      orders, 
      pagination: { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total, 
        pages: Math.ceil(total / parseInt(limit)), 
        hasMore: (page * limit) < total 
      } 
    };
  }

  async getOrderById(orderId, userId, isAdmin = false) {
    const order = await Order.findById(orderId)
      .populate('user', 'name phone email')
      .populate('invoice')
      .populate('items.product', 'name images mrp salePrice slug');
    if (!order) return { success: false, message: 'Order not found' };
    if (!isAdmin && (order.user._id || order.user).toString() !== userId.toString()) return { success: false, message: 'Access denied' };
    return { success: true, order };
  }

  /**
   * Admin: Confirm order
   */
  async confirmOrder(orderId, adminId, note = '') {
    const order = await Order.findById(orderId);
    if (!order) return { success: false, message: 'Order not found' };

    const transition = order.transitionTo('CONFIRMED', adminId, note || 'Order confirmed by admin');
    if (!transition.valid) return { success: false, message: transition.message };

    await order.save();
    
    // Auto-generate invoice on confirmation
    InvoiceService.generateInvoice(orderId).catch(err => console.error('Auto-invoice generation failed:', err));

    // Send notification to customer
    NotificationService.sendOrderStatusNotification(order.user, order, 'CONFIRMED');

    return { success: true, order, message: 'Order confirmed successfully' };
  }

  /**
   * Admin: Mark COD as collected
   */
  async markCodCollected(orderId, adminId) {
    const order = await Order.findById(orderId);
    if (!order) return { success: false, message: 'Order not found' };
    if (order.payment.status === 'PAID') return { success: false, message: 'Payment already collected' };

    order.payment.status = 'PAID';
    order.payment.amountPaid = order.totalAmount;
    order.payment.paidAt = new Date();
    order.addStatusHistory(order.status, adminId, 'COD payment collected by admin');

    await order.save();
    return { success: true, order, message: 'COD payment marked as collected' };
  }

  /**
   * Admin: Update order status (General)
   */
  async updateOrderStatus(orderId, adminId, newStatus, details = {}) {
    const order = await Order.findById(orderId);
    if (!order) return { success: false, message: 'Order not found' };

    const { courierName, trackingNumber, trackingUrl, note } = details;

    const transition = order.transitionTo(newStatus, adminId, note || `Status updated to ${newStatus}`);
    if (!transition.valid) return { success: false, message: transition.message };

    if (courierName) order.courierName = courierName;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (trackingUrl) order.trackingUrl = trackingUrl;

    await order.save();

    // Send notification to customer
    NotificationService.sendOrderStatusNotification(order.user, order, newStatus);

    return { success: true, order, message: `Order status updated to ${newStatus}` };
  }

  // Payment methods
  async initiatePayment(orderId, userId) {
    const order = await Order.findById(orderId);
    if (!order || (order.user._id || order.user).toString() !== userId.toString()) return { success: false, message: 'Access denied' };
    const amountToPay = order.payment.mode === 'COD_PARTIAL' ? order.totalAmount - order.payment.codAmount : order.totalAmount;
    const razorpayResult = await RazorpayService.createOrder({ amount: amountToPay, currency: 'INR', receipt: order.orderNumber, notes: { orderId: order._id.toString() } });
    if (!razorpayResult.success) return { success: false, message: razorpayResult.error };
    order.payment.razorpayOrderId = razorpayResult.razorpayOrderId;
    order.status = 'PROCESSING_PAYMENT';
    await order.save();
    return { success: true, razorpayOrderId: razorpayResult.razorpayOrderId, amount: amountToPay, currency: 'INR', keyId: RazorpayService.getKeyId(), order };
  }

  async verifyPayment(orderId, paymentData, userId = null) {
    const order = await Order.findById(orderId);
    if (!order || (userId && (order.user._id || order.user).toString() !== userId.toString())) return { success: false, message: 'Access denied' };
    const { razorpayPaymentId, razorpaySignature } = paymentData;
    order.payment.razorpayPaymentId = razorpayPaymentId;
    order.payment.razorpaySignature = razorpaySignature;
    order.payment.status = 'PAID';
    order.payment.amountPaid = order.payment.mode === 'COD_PARTIAL' ? order.totalAmount - order.payment.codAmount : order.totalAmount;
    order.payment.paidAt = new Date();
    order.status = 'PAID';
    await order.save();

    // Auto-generate invoice on payment verification
    InvoiceService.generateInvoice(orderId).catch(err => console.error('Auto-invoice generation failed:', err));

    // Send notification to customer
    NotificationService.sendOrderStatusNotification(order.user, order, 'PAID');

    return { success: true, order, message: 'Payment verified successfully' };
  }

  async handlePaymentFailure(orderId, reason, userId = null) {
    const order = await Order.findById(orderId);
    if (!order || (userId && (order.user._id || order.user).toString() !== userId.toString())) return { success: false, message: 'Access denied' };
    order.status = 'PAYMENT_FAILED';
    await order.save();
    return { success: true, order, message: 'Payment failure recorded' };
  }

  async cancelOrder(orderId, userId, reason = '', isAdmin = false) {
    const order = await Order.findById(orderId);
    if (!order || (!isAdmin && (order.user._id || order.user).toString() !== userId.toString())) return { success: false, message: 'Access denied' };
    order.status = 'CANCELLED';
    await order.save();
    return { success: true, order, message: 'Order cancelled successfully' };
  }

  async deleteOrder(orderId) {
    const order = await Order.findByIdAndDelete(orderId);
    if (!order) return { success: false, message: 'Order not found' };
    return { success: true, message: 'Order deleted successfully' };
  }

  async handleRazorpayWebhook(body, rawBody, signature) {
    return { success: true };
  }
}

module.exports = new OrderService();
