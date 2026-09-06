/**
 * Brand Routes - Public
 * GET endpoints for fetching brands
 */

const express = require('express');
const router = express.Router();
const Brand = require('../models/Brand');

// Brands change rarely — cache for 5 minutes
const setCache = (req, res, next) => {
  res.set('Cache-Control', 'private, max-age=300');
  next();
};

/**
 * GET /api/v1/brands
 * Get all active brands
 */
router.get('/', setCache, async (req, res) => {
    try {
        const brands = await Brand.find({ isActive: true })
            .sort('sortOrder name')
            .lean();

        res.json({
            success: true,
            data: { brands }
        });
    } catch (error) {
        console.error('Get brands error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch brands'
        });
    }
});

/**
 * GET /api/v1/brands/:id
 * Get single brand
 */
router.get('/:id', setCache, async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: 'Brand not found'
            });
        }

        res.json({
            success: true,
            data: { brand }
        });
    } catch (error) {
        console.error('Get brand error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch brand'
        });
    }
});

module.exports = router;
