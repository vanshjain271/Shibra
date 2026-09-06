/**
 * Admin Brand Routes
 * CRUD operations for brands (requires auth)
 */

const express = require('express');
const router = express.Router();
const Brand = require('../../models/Brand');
const { authenticate } = require('../../middleware/auth.middleware');

const { handleSingleUpload } = require('../../middleware/upload.middleware');
const S3Service = require('../../services/s3.service');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/admin/brands
 * Get all brands (including inactive)
 */
router.get('/', async (req, res) => {
    try {
        const brands = await Brand.find()
            .sort('sortOrder name')
            .lean();

        res.json({
            success: true,
            data: { brands }
        });
    } catch (error) {
        console.error('Admin get brands error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch brands'
        });
    }
});

/**
 * POST /api/v1/admin/brands
 * Create new brand
 */
router.post('/', handleSingleUpload, async (req, res) => {
    try {
        const { name, description, isActive, sortOrder } = req.body;
        let imageUrl = '';

        if (req.file) {
            const uploadResult = await S3Service.uploadFile(req.file, 'brands');
            if (uploadResult.success) {
                imageUrl = uploadResult.url;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to upload brand image'
                });
            }
        }

        const brand = new Brand({
            name,
            description,
            image: imageUrl,
            isActive: isActive !== 'false', // FormData sends everything as strings
            sortOrder: Number(sortOrder) || 0
        });

        await brand.save();

        res.status(201).json({
            success: true,
            message: 'Brand created successfully',
            data: { brand }
        });
    } catch (error) {
        console.error('Create brand error:', error.message);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Brand with this name already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create brand'
        });
    }
});

/**
 * PUT /api/v1/admin/brands/:id
 * Update brand
 */
router.put('/:id', handleSingleUpload, async (req, res) => {
    try {
        const { name, description, isActive, sortOrder } = req.body;
        const brand = await Brand.findById(req.params.id);

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: 'Brand not found'
            });
        }

        if (name) brand.name = name;
        if (description !== undefined) brand.description = description;
        if (isActive !== undefined) brand.isActive = isActive !== 'false';
        if (sortOrder !== undefined) brand.sortOrder = Number(sortOrder) || 0;

        if (req.file) {
            // Delete old image
            if (brand.image) {
                await S3Service.deleteFile(brand.image);
            }

            const uploadResult = await S3Service.uploadFile(req.file, 'brands');
            if (uploadResult.success) {
                brand.image = uploadResult.url;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to upload new brand image'
                });
            }
        }

        await brand.save();

        res.json({
            success: true,
            message: 'Brand updated successfully',
            data: { brand }
        });
    } catch (error) {
        console.error('Update brand error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to update brand'
        });
    }
});

/**
 * DELETE /api/v1/admin/brands/:id
 * Delete brand
 */
router.delete('/:id', async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: 'Brand not found'
            });
        }

        // Delete image from S3
        if (brand.image) {
            await S3Service.deleteFile(brand.image);
        }

        await brand.deleteOne();

        res.json({
            success: true,
            message: 'Brand deleted successfully'
        });
    } catch (error) {
        console.error('Delete brand error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to delete brand'
        });
    }
});

module.exports = router;
