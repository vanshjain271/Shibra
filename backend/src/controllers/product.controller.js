/**
 * Product Controller - MVP
 * 
 * Public product endpoints
 * 
 * STRICT RULES:
 * - No DB calls
 * - Only input validation + service calls
 */

const ProductService = require('../services/product.service');

/**
 * @desc    List products with filters
 * @route   GET /api/v1/products
 * @access  Buyer, Admin
 */
const getProducts = async (req, res) => {
  try {
    const { page, limit, categoryId, search, sortBy, sortOrder, homepageSection } = req.query;

    const result = await ProductService.getProducts({
      page: page || 1,
      limit: limit || 20,
      categoryId,

      search,
      sortBy,
      sortOrder,
      homepageSection
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json({
      success: true,
      products: result.products,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Get Products Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching products'
    });
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/v1/products/:productId
 * @access  Buyer, Admin
 */
const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await ProductService.getProductById(productId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json({
      success: true,
      product: result.product
    });
  } catch (error) {
    console.error('Get Product Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching product'
    });
  }
};

module.exports = {
  getProducts,
  getProductById
};
