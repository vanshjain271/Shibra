const express = require('express');
const router = express.Router();
const wishlistController = require('../../controllers/admin-wishlist.controller');
const { adminOnly } = require('../../middleware/auth.middleware');

// Routes mapped to /api/v1/admin/wishlists
router.get('/', adminOnly, wishlistController.getWishlists);

module.exports = router;
