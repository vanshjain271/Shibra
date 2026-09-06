/**
 * Admin Category Routes
 * CRUD operations for categories (requires auth)
 */

const express = require('express');
const router = express.Router();
const Category = require('../../models/Category');
const { authenticate } = require('../../middleware/auth.middleware');
const s3Service = require('../../services/s3.service');
const { handleSingleUpload } = require('../../middleware/upload.middleware');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/admin/categories
 * Get all categories (including inactive)
 */
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find()
            .sort('sortOrder name')
            .lean();

        res.json({
            success: true,
            data: { categories }
        });
    } catch (error) {
        console.error('Admin get categories error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories'
        });
    }
});

/**
 * POST /api/v1/admin/categories
 * Create new category
 */
router.post('/', handleSingleUpload, async (req, res) => {
    try {
        let { name, description, parent, isActive, sortOrder } = req.body;
        let image = null;

        if (req.file) {
            const uploadResult = await s3Service.uploadFile(req.file, 'categories');
            if (uploadResult.success) {
                image = uploadResult.url;
            }
        }

        const category = new Category({
            name,
            description,
            parent: parent || null,
            isActive: isActive !== 'false' && isActive !== false,
            sortOrder: sortOrder || 0,
            image
        });

        await category.save();

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: { category }
        });
    } catch (error) {
        console.error('Create category error:', error.message);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create category'
        });
    }
});

/**
 * PUT /api/v1/admin/categories/:id
 * Update category
 */
router.put('/:id', handleSingleUpload, async (req, res) => {
    try {
        let { name, description, parent, isActive, sortOrder } = req.body;

        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        category.name = name || category.name;
        if (description !== undefined) category.description = description;
        if (parent !== undefined) category.parent = parent || null;
        if (isActive !== undefined) category.isActive = isActive !== 'false' && isActive !== false;
        if (sortOrder !== undefined) category.sortOrder = sortOrder;

        if (req.file) {
            const uploadResult = await s3Service.uploadFile(req.file, 'categories');
            if (uploadResult.success) {
                // Delete old image if it exists
                if (category.image) {
                    await s3Service.deleteFile(category.image);
                }
                category.image = uploadResult.url;
            }
        }

        await category.save();

        res.json({
            success: true,
            message: 'Category updated successfully',
            data: { category }
        });
    } catch (error) {
        console.error('Update category error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to update category'
        });
    }
});

/**
 * DELETE /api/v1/admin/categories/:id
 * Delete category
 */
router.delete('/:id', async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        if (category.image) {
            await s3Service.deleteFile(category.image);
        }

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Delete category error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to delete category'
        });
    }
});

module.exports = router;
