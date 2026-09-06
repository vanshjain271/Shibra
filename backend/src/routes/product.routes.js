/**
 * Product Routes - MVP
 *
 * Public product endpoints
 *
 * GET /products            - Buyer, Admin
 * GET /products/:productId - Buyer, Admin
 */

const express = require('express');
const router = express.Router();

const ProductController = require('../controllers/product.controller');
const { productValidation } = require('../middleware/validation.middleware');

// Cache-Control: 60 seconds for product lists, 5 min for single product
const setListCache = (req, res, next) => {
  res.set('Cache-Control', 'private, max-age=60');
  next();
};
const setItemCache = (req, res, next) => {
  res.set('Cache-Control', 'private, max-age=300');
  next();
};

/**
 * @route   GET /api/v1/products
 * @desc    List products with filters
 * @access  Buyer, Admin
 * @query   page, limit, categoryId, search, sortBy, sortOrder
 */
router.get(
  '/',
  setListCache,
  productValidation.getProducts,
  ProductController.getProducts
);

/**
 * @route   GET /api/v1/products/:productId
 * @desc    Get single product by ID
 * @access  Buyer, Admin
 */
router.get(
  '/:productId',
  setItemCache,
  productValidation.getProductById,
  ProductController.getProductById
);

module.exports = router;
