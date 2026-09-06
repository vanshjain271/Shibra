
/**
 * Invoice Routes - MVP (Buyer)
 */

const express = require('express');
const router = express.Router();
const InvoiceController = require('../controllers/invoice.controller');
const { buyerOrAdmin } = require('../middleware/auth.middleware');

router.get('/my', buyerOrAdmin, InvoiceController.getMyInvoices);
router.get('/order/:orderId', buyerOrAdmin, InvoiceController.getInvoiceByOrder);
router.get('/public-pdf/:orderId', InvoiceController.generatePublicPDF);

module.exports = router;
