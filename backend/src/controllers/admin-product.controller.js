/**
 * Admin Product Controller - MVP
 * 
 * Admin-only product endpoints
 * Variants handled inline via create/update only
 * 
 * STRICT RULES:
 * - No DB calls
 * - Only input validation + service calls
 * - Role checks handled by middleware
 */

const ProductService = require('../services/product.service');
const { logActivity } = require('../services/activity.service');

/**
 * @desc    Get all products (admin view with all products)
 * @route   GET /api/v1/admin/products
 * @access  Admin
 */
const getProducts = async (req, res) => {
  try {
    const Product = require('../models/Product');
    const { page = 1, limit = 50, search, category, status, sort, isLot } = req.query;

    const query = {};
    if (isLot === 'true') query.isLot = true;
    if (isLot === 'false') query.isLot = { $ne: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      const categoryIds = Array.isArray(category) ? category : category.split(',');
      query.category = { $in: categoryIds };
    }

    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    // Handle sorting
    let sortOptions = { createdAt: -1 }; // Default
    if (sort === 'name_asc') sortOptions = { name: 1 };
    if (sort === 'name_desc') sortOptions = { name: -1 };
    if (sort === 'price_asc') sortOptions = { salePrice: 1 };
    if (sort === 'price_desc') sortOptions = { salePrice: -1 };
    if (sort === 'stock_asc') sortOptions = { stock: 1 };
    if (sort === 'stock_desc') sortOptions = { stock: -1 };
    if (sort === 'oldest') sortOptions = { createdAt: 1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log('🔍 ADMIN PRODUCT FETCH - Query:', JSON.stringify(query));
    
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name')

        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(query)
    ]);

    console.log(`📦 ADMIN PRODUCT FETCH - Found ${products.length} products (Total: ${total})`);

    return res.status(200).json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
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
 * @desc    Create new product
 * @route   POST /api/v1/admin/products
 * @access  Admin
 */
const createProduct = async (req, res) => {
  try {
    const productData = req.body;
    const imageFiles = req.files || [];

    // Parse stringified variants if present (from FormData)
    if (typeof productData.variants === 'string') {
      try { productData.variants = JSON.parse(productData.variants); } catch (err) { console.error('Failed to parse variants:', err); }
    }
    if (typeof productData.bulkPricing === 'string') {
      try { productData.bulkPricing = JSON.parse(productData.bulkPricing); } catch (err) { console.error('Failed to parse bulkPricing:', err); }
    }
    if (typeof productData.homepageSections === 'string') {
      try { productData.homepageSections = JSON.parse(productData.homepageSections); } catch (err) { console.error('Failed to parse homepageSections:', err); }
    }
    if (typeof productData.lotDetails === 'string') {
      try { productData.lotDetails = JSON.parse(productData.lotDetails); } catch (err) { console.error('Failed to parse lotDetails:', err); }
    }
    if (typeof productData.availableModels === 'string') {
      try { productData.availableModels = JSON.parse(productData.availableModels); } catch (err) { console.error('Failed to parse availableModels:', err); }
    }

    const result = await ProductService.createProduct(productData, imageFiles);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Invalidate cache so buyers see the new product immediately
    ProductService.invalidateProductCache();

    logActivity({
      userId: req.user?.userId,
      action: 'CREATE',
      entityType: 'Product',
      entityId: result.product?._id,
      description: `Product created: ${result.product?.name || productData.name}`,
      ip: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: result.message,
      product: result.product
    });
  } catch (error) {
    console.error('Create Product Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating product'
    });
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/v1/admin/products/:productId
 * @access  Admin
 */
const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updates = req.body;
    const newImageFiles = req.files || [];

    // Parse stringified variants if present (from FormData)
    if (typeof updates.variants === 'string') {
      try { updates.variants = JSON.parse(updates.variants); } catch (err) { console.error('Failed to parse variants:', err); }
    }
    if (typeof updates.bulkPricing === 'string') {
      try { updates.bulkPricing = JSON.parse(updates.bulkPricing); } catch (err) { console.error('Failed to parse bulkPricing:', err); }
    }
    if (typeof updates.homepageSections === 'string') {
      try { updates.homepageSections = JSON.parse(updates.homepageSections); } catch (err) { console.error('Failed to parse homepageSections:', err); }
    }
    if (typeof updates.lotDetails === 'string') {
      try { updates.lotDetails = JSON.parse(updates.lotDetails); } catch (err) { console.error('Failed to parse lotDetails:', err); }
    }
    if (typeof updates.availableModels === 'string') {
      try { updates.availableModels = JSON.parse(updates.availableModels); } catch (err) { console.error('Failed to parse availableModels:', err); }
    }

    const result = await ProductService.updateProduct(productId, updates, newImageFiles);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Invalidate cache so buyers see the updated product immediately
    ProductService.invalidateProductCache();

    logActivity({
      userId: req.user?.userId,
      action: 'UPDATE',
      entityType: 'Product',
      entityId: productId,
      description: `Product updated: ${result.product?.name || 'Unknown'}`,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      product: result.product
    });
  } catch (error) {
    console.error('Update Product Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating product'
    });
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/v1/admin/products/:productId
 * @access  Admin
 */
const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await ProductService.deleteProduct(productId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Invalidate cache so buyers see the deletion immediately
    ProductService.invalidateProductCache();

    logActivity({
      userId: req.user?.userId,
      action: 'DELETE',
      entityType: 'Product',
      entityId: productId,
      description: `Product deleted`,
      ip: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Delete Product Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while deleting product'
    });
  }
};

/**
 * @desc    Get products with stock below threshold
 * @route   GET /api/v1/admin/products/low-stock
 * @access  Admin
 */
const getLowStockProducts = async (req, res) => {
  try {
    const Product = require('../models/Product');

    // Find products where stock <= lowStockThreshold
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
      isActive: true
    })
      .select('name sku stock lowStockThreshold images category')
      .populate('category', 'name')
      .sort({ stock: 1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      count: lowStockProducts.length,
      products: lowStockProducts
    });
  } catch (error) {
    console.error('Get Low Stock Products Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching low stock products'
    });
  }
};

/**
 * @desc    Bulk import products from CSV
 * @route   POST /api/v1/admin/products/import
 * @access  Admin
 */
const importProducts = async (req, res) => {
  try {
    const ImportService = require('../services/import.service');
    const { csvContent } = req.body;

    if (!csvContent) {
      return res.status(400).json({
        success: false,
        message: 'CSV content is required'
      });
    }

    // Parse CSV
    const productsData = ImportService.parseCSV(csvContent);

    if (productsData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid products found in CSV'
      });
    }

    // Import products
    const results = await ImportService.importProducts(productsData);

    return res.status(200).json({
      success: true,
      message: `Imported ${results.created} new, updated ${results.updated}, failed ${results.failed}`,
      results
    });
  } catch (error) {
    console.error('Import Products Error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'An error occurred while importing products'
    });
  }
};

/**
 * @desc    Get CSV import template
 * @route   GET /api/v1/admin/products/import/template
 * @access  Admin
 */
const getImportTemplate = async (req, res) => {
  try {
    const ImportService = require('../services/import.service');
    const template = ImportService.generateCSVTemplate();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=product_import_template.csv');
    return res.send(template);
  } catch (error) {
    console.error('Get Import Template Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while generating template'
    });
  }
};

/**
 * @desc    Duplicate a product (clone with editable copy)
 * @route   POST /api/v1/admin/products/:productId/duplicate
 * @access  Admin
 */
const duplicateProduct = async (req, res) => {
  try {
    const Product = require('../models/Product');
    const { productId } = req.params;

    const original = await Product.findById(productId).lean();
    if (!original) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Remove fields that should be unique
    delete original._id;
    delete original.__v;
    delete original.createdAt;
    delete original.updatedAt;

    // Create the copy with modified name and slug
    original.name = `${original.name} (Copy)`;
    if (original.slug) {
      original.slug = `${original.slug}-copy-${Date.now()}`;
    }
    if (original.sku) {
      original.sku = `${original.sku}-COPY`;
    }

    // Reset stock to 0 for safety
    original.stock = 0;

    // Duplicate variants with new IDs
    if (original.variants && original.variants.length > 0) {
      original.variants = original.variants.map(v => {
        delete v._id;
        v.stock = 0;
        return v;
      });
    }

    const newProduct = await Product.create(original);

    // Invalidate cache so buyers see the new duplicate
    ProductService.invalidateProductCache();

    logActivity({
      userId: req.user?.userId,
      action: 'DUPLICATE',
      entityType: 'Product',
      entityId: newProduct._id,
      description: `Product duplicated from ${productId}: ${newProduct.name}`,
      details: { originalId: productId },
      ip: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Product duplicated! You can now edit it.',
      product: newProduct
    });
  } catch (error) {
    console.error('Duplicate Product Error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while duplicating product'
    });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  importProducts,
  getImportTemplate,
  duplicateProduct
};
