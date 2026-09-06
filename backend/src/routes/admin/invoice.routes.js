/**
 * Admin Invoice Routes - MVP
 */

const express = require('express');
const router = express.Router();
const InvoiceController = require('../../controllers/invoice.controller');
const { adminOnly } = require('../../middleware/auth.middleware');

router.get('/', adminOnly, InvoiceController.getInvoices);
// New: order-centric invoices — never empty, no sync needed
router.get('/from-orders', adminOnly, InvoiceController.getInvoicesFromOrders);
router.post('/bulk-generate', adminOnly, InvoiceController.bulkGenerate);
router.get('/:invoiceId', adminOnly, InvoiceController.getInvoiceById);
router.post('/:invoiceId/regenerate-pdf', adminOnly, InvoiceController.regeneratePDF);
router.post('/create', adminOnly, InvoiceController.createInvoice);

module.exports = router;