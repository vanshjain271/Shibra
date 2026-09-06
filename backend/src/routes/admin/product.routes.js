/**
 * Admin Product Routes - MVP
 * 
 * Admin-only product endpoints
 * 
 * POST   /admin/products              - Create product
 * PUT    /admin/products/:productId   - Update product
 * DELETE /admin/products/:productId   - Delete product
 * 
 * Variants are handled inline via create/update only
 */

const express = require('express');
const router = express.Router();

const AdminProductController = require('../../controllers/admin-product.controller');
const { adminOnly } = require('../../middleware/auth.middleware');
const { productValidation } = require('../../middleware/validation.middleware');
const { handleMultipleUpload } = require('../../middleware/upload.middleware');

/**
 * @route   GET /api/v1/admin/products
 * @desc    Get all products (admin view)
 * @access  Admin
 */
router.get(
  '/',
  adminOnly,
  AdminProductController.getProducts
);

/**
 * @route   POST /api/v1/admin/products
 * @desc    Create new product (with optional variants inline)
 * @access  Admin
 */
router.post(
  '/',
  adminOnly,
  handleMultipleUpload,
  productValidation.createProduct,
  AdminProductController.createProduct
);

/**
 * @route   PUT /api/v1/admin/products/:productId
 * @desc    Update product (with optional variants inline)
 * @access  Admin
 */
router.put(
  '/:productId',
  adminOnly,
  handleMultipleUpload,
  productValidation.updateProduct,
  AdminProductController.updateProduct
);

/**
 * @route   DELETE /api/v1/admin/products/:productId
 * @desc    Delete product
 * @access  Admin
 */
router.delete(
  '/:productId',
  adminOnly,
  productValidation.deleteProduct,
  AdminProductController.deleteProduct
);

/**
 * @route   GET /api/v1/admin/products/low-stock
 * @desc    Get products with stock below threshold
 * @access  Admin
 */
router.get(
  '/low-stock',
  adminOnly,
  AdminProductController.getLowStockProducts
);

/**
 * @route   POST /api/v1/admin/products/import
 * @desc    Bulk import products from CSV
 * @access  Admin
 */
router.post(
  '/import',
  adminOnly,
  AdminProductController.importProducts
);

/**
 * @route   GET /api/v1/admin/products/import/template
 * @desc    Download CSV import template
 * @access  Admin
 */
router.get(
  '/import/template',
  adminOnly,
  AdminProductController.getImportTemplate
);

/**
 * @route   POST /api/v1/admin/products/:productId/duplicate
 * @desc    Duplicate/clone a product for quick editing
 * @access  Admin
 */
router.post(
  '/:productId/duplicate',
  adminOnly,
  AdminProductController.duplicateProduct
);

module.exports = router;
