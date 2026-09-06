/**
 * Admin Cart Routes - MVP
 * 
 * Abandoned cart monitoring
 */

const express = require('express');
const router = express.Router();
const AdminCartController = require('../../controllers/admin-cart.controller');
const auth = require('../../middleware/auth.middleware');

router.get('/abandoned', auth.adminOnly, AdminCartController.getAbandonedCarts);

module.exports = router;