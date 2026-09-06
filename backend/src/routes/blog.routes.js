/**
 * Public Blog Routes
 * Read-only access for mobile app
 */

const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');

// GET /api/v1/blogs — list active blog posts
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const query = { isPublished: true };

        const [posts, total] = await Promise.all([
            Blog.find(query)
                .select('title slug excerpt coverImage category tags publishedAt createdAt')
                .sort({ publishedAt: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Blog.countDocuments(query),
        ]);

        res.json({
            success: true,
            data: posts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
                hasNext: page * limit < total,
            },
        });
    } catch (error) {
        console.error('Public Blog List Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch blog posts' });
    }
});

// GET /api/v1/blogs/:slug — single blog post by slug or id
router.get('/:slug', async (req, res) => {
    try {
        const post = await Blog.findOne({
            $or: [{ slug: req.params.slug }, { _id: req.params.slug.match(/^[0-9a-fA-F]{24}$/) ? req.params.slug : null }],
            isPublished: true,
        }).populate('author', 'name').lean();

        if (!post) {
            return res.status(404).json({ success: false, message: 'Blog post not found' });
        }

        res.json({ success: true, data: post });
    } catch (error) {
        console.error('Public Blog Get Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch blog post' });
    }
});

module.exports = router;
