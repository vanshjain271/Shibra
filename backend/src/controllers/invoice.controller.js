/**
 * Invoice Controller - MVP
 */

const InvoiceService = require('../services/invoice.service');
const Order = require('../models/Order');
const User = require('../models/User');

const getInvoiceByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Verify order belongs to the user
    const order = await Order.findById(orderId).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    if (order.user.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Return the URL for the mobile app to download (RNFS needs a public URL)
    const publicUrl = `https://api.shibrab2b.com/api/v1/invoices/public-pdf/${orderId}`;
    
    return res.status(200).json({ 
      success: true, 
      url: publicUrl,
      invoiceUrl: publicUrl // for backwards compatibility
    });
  } catch (error) {
    console.error('Get Invoice Error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred while fetching invoice' });
  }
};

const getMyInvoices = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await InvoiceService.getBuyerInvoices(req.user.userId, { page, limit });
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json({ success: true, invoices: result.invoices, pagination: result.pagination });
  } catch (error) {
    console.error('Get My Invoices Error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred while fetching invoices' });
  }
};

const getInvoices = async (req, res) => {
  try {
    const { page, limit, status, dateFrom, dateTo } = req.query;
    const result = await InvoiceService.listInvoices({ status, dateFrom, dateTo }, { page, limit: limit || 500 });
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json({ success: true, invoices: result.invoices, pagination: result.pagination });
  } catch (error) {
    console.error('Get Invoices Error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred while fetching invoices' });
  }
};

/**
 * NEW: Query orders directly to generate the invoice list — always up to date, no sync needed.
 * Returns all confirmed/packed/shipped/delivered orders mapped as invoice rows.
 * Supports filters: payStatus (PAID | UNPAID | PART_PAID), dateFrom, dateTo, search
 */
const getInvoicesFromOrders = async (req, res) => {
  try {
    const { payStatus, dateFrom, dateTo, search } = req.query;

    // Base filter: only show orders that are actionable (not cancelled/failed)
    const query = {
      status: { $nin: ['CANCELLED', 'PAYMENT_FAILED'] }
    };

    // Date filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        query.createdAt.$gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        query.createdAt.$lte = to;
      }
    }

    let orders = await Order.find(query)
      .populate('user', 'name phone email')
      .sort({ createdAt: -1 })
      .lean();

    // Map orders → invoice rows
    const invoices = orders.map(order => {
      const total = Number(order.totalAmount || 0);
      const token = Number(order.tokenReceived || 0);
      const discount = Number(order.coupon?.discountAmount || 0);
      const shipping = Number(order.shippingCharge || 0);
      const balance = Math.max(0, total - token);

      let payStatus = 'UNPAID';
      if (balance === 0) payStatus = 'PAID';
      else if (token > 0) payStatus = 'PART_PAID';

      const addr = order.shippingAddress || {};
      const user = order.user || {};

      return {
        _id: order._id,
        orderId: order._id,
        invoiceNumber: `INV-${order.orderNumber}`,
        orderNumber: order.orderNumber,
        invoiceDate: order.createdAt,
        customerName: addr.name || user.name || '-',
        customerPhone: addr.phone || user.phone || '-',
        customerEmail: user.email || '',
        amount: total,
        tokenReceived: token,
        discount,
        shipping,
        balance,
        payStatus,
        orderStatus: order.status,
        items: order.items || [],
        billingAddress: addr,
        user,
        payment: order.payment || {},
      };
    });

    // Filter by payment status
    const filteredByPay = payStatus && payStatus !== 'ALL'
      ? invoices.filter(inv => inv.payStatus === payStatus)
      : invoices;

    // Search filter
    const searchLower = (search || '').toLowerCase().trim();
    const filtered = searchLower
      ? filteredByPay.filter(inv =>
          inv.invoiceNumber.toLowerCase().includes(searchLower) ||
          inv.customerName.toLowerCase().includes(searchLower) ||
          inv.customerPhone.includes(searchLower) ||
          inv.orderNumber.toLowerCase().includes(searchLower)
        )
      : filteredByPay;

    return res.status(200).json({
      success: true,
      invoices: filtered,
      total: filtered.length,
      counts: {
        all: invoices.length,
        paid: invoices.filter(i => i.payStatus === 'PAID').length,
        unpaid: invoices.filter(i => i.payStatus === 'UNPAID').length,
        partPaid: invoices.filter(i => i.payStatus === 'PART_PAID').length,
      }
    });
  } catch (error) {
    console.error('Get Invoices From Orders Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const result = await InvoiceService.getInvoiceById(invoiceId, null, true);
    if (!result.success) return res.status(404).json(result);
    return res.status(200).json({ success: true, invoice: result.invoice });
  } catch (error) {
    console.error('Get Invoice Error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred while fetching invoice' });
  }
};

const regeneratePDF = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const result = await InvoiceService.regeneratePDF(invoiceId);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json({ success: true, message: result.message, invoice: result.invoice });
  } catch (error) {
    console.error('Regenerate PDF Error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred while regenerating PDF' });
  }
};

const createInvoice = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }
    const result = await InvoiceService.generateInvoice(orderId);
    if (!result.success) return res.status(400).json(result);
    return res.status(201).json({ success: true, message: 'Invoice created', invoice: result.invoice });
  } catch (error) {
    console.error('Create Invoice Error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred while creating invoice' });
  }
};

const bulkGenerate = async (req, res) => {
  try {
    const result = await InvoiceService.bulkGenerateInvoices();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Bulk Generate Error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred while bulk generating invoices' });
  }
};

const generatePublicPDF = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { generateInvoicePDF } = require('../utils/pdf.utils');
    const Order = require('../models/Order');
    
    // We only need the order ID, which is a 24-character hex string (unguessable).
    // This allows the mobile app's RNFS and react-native-pdf to download it without headers.
    const order = await Order.findById(orderId).populate('user', 'name phone email').lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const existingInvoice = {
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

    const pdfBuffer = await generateInvoicePDF(existingInvoice);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${order.orderNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate Public PDF Error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred while generating invoice PDF' });
  }
};

module.exports = {
  getInvoiceByOrder,
  getMyInvoices,
  getInvoices,
  getInvoicesFromOrders,
  getInvoiceById,
  regeneratePDF,
  createInvoice,
  bulkGenerate,
  generatePublicPDF
};