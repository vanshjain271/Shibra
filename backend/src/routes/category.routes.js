/**
 * Category Routes - Public
 * GET endpoints for fetching categories
 */

const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Categories change rarely — cache for 5 seconds for fast updates
const setCache = (req, res, next) => {
  res.set('Cache-Control', 'private, max-age=5');
  next();
};

/**
 * GET /api/v1/categories
 * Get all active categories
 */
router.get('/', setCache, async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .sort('sortOrder name')
            .lean();

        res.json({
            success: true,
            data: { categories }
        });
    } catch (error) {
        console.error('Get categories error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories'
        });
    }
});

/**
 * GET /api/v1/categories/tree
 * Get category tree structure
 */
router.get('/tree', setCache, async (req, res) => {
    try {
        const tree = await Category.getCategoryTree();

        res.json({
            success: true,
            data: { categories: tree }
        });
    } catch (error) {
        console.error('Get category tree error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category tree'
        });
    }
});

/**
 * GET /api/v1/categories/:id
 * Get single category
 */
router.get('/:id', setCache, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: { category }
        });
    } catch (error) {
        console.error('Get category error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category'
        });
    }
});

module.exports = router;
