/**
 * Cart Routes - MVP (Buyer)
 */

const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cart.controller');
const auth = require('../middleware/auth.middleware');

router.get('/', auth.authenticate, CartController.getCart);
router.post('/items', auth.authenticate, CartController.addItem);
router.put('/items/:itemId', auth.authenticate, CartController.updateItemQuantity);
router.delete('/items/:itemId', auth.authenticate, CartController.removeItem);
router.delete('/', auth.authenticate, CartController.clearCart);

module.exports = router;