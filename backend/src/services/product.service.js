/**
 * Product Service - MVP
 *
 * Handles all product business logic
 * - CRUD operations
 * - Variants handled inline via create/update only
 *
 * Service-first architecture: Controllers only call services
 * Performance: In-memory cache with TTL to eliminate repeated cold DB hits.
 */

const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const S3Service = require('./s3.service');

// ─── In-Memory Cache ───────────────────────────────────────────────────────────
const PRODUCT_LIST_TTL = 30 * 1000;  // 30 seconds for product lists (was 2 min, reduced for near-realtime updates)
const PRODUCT_ITEM_TTL = 60 * 1000;  // 60 seconds for single products (was 5 min)
const _cache = new Map(); // key → { data, expiresAt }

const _cacheGet = (key) => {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _cache.delete(key);
    return null;
  }
  return entry.data;
};

const _cacheSet = (key, data, ttl) => {
  _cache.set(key, { data, expiresAt: Date.now() + ttl });
};

// 🧹 Fix for Memory Leak: Automatically clean up expired cache entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of _cache.entries()) {
    if (now > entry.expiresAt) {
      _cache.delete(key);
    }
  }
}, 60 * 1000);
// ─────────────────────────────────────────────────────────────────────────────

class ProductService {
  /**
   * Get products with pagination and filters (Public)
   * 
   * @param {Object} options - { page, limit, categoryId, search, sortBy, sortOrder }
   * @returns {Promise<Object>} { success, products, pagination }
   */
  async getProducts(options = {}) {
    try {
      const cacheKey = `products:${JSON.stringify(options)}`;
      const cached = _cacheGet(cacheKey);
      if (cached) return cached;

      const result = await Product.getActiveProducts(options);

      const response = {
        success: true,
        products: result.products,
        pagination: result.pagination
      };
      _cacheSet(cacheKey, response, PRODUCT_LIST_TTL);
      return response;
    } catch (error) {
      console.error('Get Products Error:', error);
      return {
        success: false,
        message: 'Failed to fetch products'
      };
    }
  }

  /**
   * Get single product by ID (Public)
   * 
   * @param {string} productId
   * @returns {Promise<Object>} { success, product?, message? }
   */
  async getProductById(productId) {
    try {
      const cacheKey = `product:${productId}`;
      const cached = _cacheGet(cacheKey);
      if (cached) return cached;

      const product = await Product.findById(productId)
        .populate('category', 'name slug');

      if (!product) {
        return { success: false, message: 'Product not found' };
      }

      if (!product.isActive) {
        return { success: false, message: 'Product is not available' };
      }

      const response = { success: true, product };
      _cacheSet(cacheKey, response, PRODUCT_ITEM_TTL);
      return response;
    } catch (error) {
      console.error('Get Product Error:', error);
      return { success: false, message: 'Failed to fetch product' };
    }
  }

  /**
   * Invalidate all product caches.
   * Call after any admin create / update / delete so app sees fresh data.
   */
  invalidateProductCache() {
    for (const key of _cache.keys()) {
      if (key.startsWith('products:') || key.startsWith('product:')) {
        _cache.delete(key);
      }
    }
    console.log('[Cache] Product cache cleared');
  }

  /**
   * Create new product (Admin)
   * Variants are handled inline via productData.variants
   * 
   * @param {Object} productData
   * @param {Array} imageFiles - Array of multer file objects
   * @returns {Promise<Object>} { success, product?, message? }
   */
  async createProduct(productData, imageFiles = []) {
    try {
      // Validate all categories exist
      if (productData.category) {
        const categories = Array.isArray(productData.category) ? productData.category : [productData.category];
        for (const catId of categories) {
          const category = await Category.findById(catId);
          if (!category) {
            return {
              success: false,
              message: `Category not found: ${catId}`
            };
          }
        }
      }

      // Validate brand if provided
      if (productData.brand) {
        const brand = await Brand.findById(productData.brand);
        if (!brand) {
          return {
            success: false,
            message: 'Brand not found'
          };
        }
      }

      // Upload images if provided
      let imageUrls = [];
      if (imageFiles && imageFiles.length > 0) {
        const uploadResult = await S3Service.uploadMultiple(imageFiles, 'products');
        if (uploadResult.success) {
          imageUrls = uploadResult.urls;
        }
      }

      // If images passed as URLs in productData
      if (productData.images && Array.isArray(productData.images)) {
        imageUrls = [...imageUrls, ...productData.images];
      }

      // Create product (variants included inline if provided)
      const product = new Product({
        ...productData,
        images: imageUrls
      });

      await product.save();

      // Populate references
      await product.populate('category', 'name slug');

      return {
        success: true,
        product,
        message: 'Product created successfully'
      };
    } catch (error) {
      console.error('Create Product Error:', error);

      // Handle duplicate slug
      if (error.code === 11000) {
        return {
          success: false,
          message: 'A product with this name already exists'
        };
      }

      return {
        success: false,
        message: error.message || 'Failed to create product'
      };
    }
  }

  /**
   * Update product (Admin)
   * Variants are handled inline via updates.variants
   * 
   * @param {string} productId
   * @param {Object} updates
   * @param {Array} newImageFiles - New images to add
   * @returns {Promise<Object>} { success, product?, message? }
   */
  async updateProduct(productId, updates, newImageFiles = []) {
    try {
      const product = await Product.findById(productId);

      if (!product) {
        return {
          success: false,
          message: 'Product not found'
        };
      }

      // Validate categories if being updated
      if (updates.category) {
        const categories = Array.isArray(updates.category) ? updates.category : [updates.category];
        for (const catId of categories) {
          const category = await Category.findById(catId);
          if (!category) {
            return {
              success: false,
              message: `Category not found: ${catId}`
            };
          }
        }
      }

      // Validate brand if being updated
      if (updates.brand) {
        const brand = await Brand.findById(updates.brand);
        if (!brand) {
          return {
            success: false,
            message: 'Brand not found'
          };
        }
      }

      // Handle images update
      let updatedImageUrls = [];
      
      // 1. Handle existing images (reordered or deleted)
      if (updates.existingImages) {
        try {
          // If it's a string (from FormData), parse it
          const existing = typeof updates.existingImages === 'string' 
            ? JSON.parse(updates.existingImages) 
            : updates.existingImages;
          
          if (Array.isArray(existing)) {
            updatedImageUrls = existing;
          }
        } catch (err) {
          console.error('Failed to parse existingImages:', err);
          updatedImageUrls = product.images || [];
        }
      } else if (updates.images && Array.isArray(updates.images)) {
        // Fallback for direct JSON updates
        updatedImageUrls = updates.images;
      } else {
        updatedImageUrls = product.images || [];
      }

      // 2. Upload and append new images if provided
      if (newImageFiles && newImageFiles.length > 0) {
        const uploadResult = await S3Service.uploadMultiple(newImageFiles, 'products');
        if (uploadResult.success) {
          updatedImageUrls = [...updatedImageUrls, ...uploadResult.urls];
        }
      }

      // 3. Set the final images list to updates so it gets saved
      updates.images = updatedImageUrls;

      // Apply updates (variants included inline if provided)
      const allowedFields = [
        'name', 'description', 'shortDescription', 'images',
        'category', 'brand', 'sku', 'salePrice', 'mrp', 'costPrice',
        'stock', 'hsnCode', 'taxRate', 'variants', 'minOrderQty',
        'maxOrderQty', 'unit', 'warranty', 'isActive', 'sortOrder', 'tags',
        'colour', 'modal', 'youtubeUrl', 'bulkPricing', 'homepageSections',
        'availableModels', 'paymentMode'
      ];

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          product[field] = updates[field];
        }
      }

      // Force Mongoose to recognize array mutations (including clearing to [])
      const arrayFields = ['images', 'homepageSections', 'bulkPricing', 'variants', 'availableModels', 'tags', 'category'];
      for (const field of arrayFields) {
        if (updates[field] !== undefined) {
          product.markModified(field);
        }
      }

      await product.save();

      // Populate references
      await product.populate('category', 'name slug');

      return {
        success: true,
        product,
        message: 'Product updated successfully'
      };
    } catch (error) {
      console.error('Update Product Error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update product'
      };
    }
  }

  /**
   * Delete product (Admin)
   * 
   * @param {string} productId
   * @returns {Promise<Object>} { success, message }
   */
  async deleteProduct(productId) {
    try {
      const product = await Product.findById(productId);

      if (!product) {
        return {
          success: false,
          message: 'Product not found'
        };
      }

      // Delete images from S3
      if (product.images && product.images.length > 0) {
        await S3Service.deleteMultiple(product.images);
      }

      // Delete variant images from S3
      if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
          if (variant.images && variant.images.length > 0) {
            await S3Service.deleteMultiple(variant.images);
          }
        }
      }

      await product.deleteOne();

      return {
        success: true,
        message: 'Product deleted successfully'
      };
    } catch (error) {
      console.error('Delete Product Error:', error);
      return {
        success: false,
        message: 'Failed to delete product'
      };
    }
  }

  /**
   * Clear all product-related cache
   */
  invalidateProductCache() {
    for (const key of _cache.keys()) {
      if (key.startsWith('product')) {
        _cache.delete(key);
      }
    }
  }
}

module.exports = new ProductService();
