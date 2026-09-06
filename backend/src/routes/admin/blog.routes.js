/**
 * Admin Blog Routes
 */

const express = require('express');
const router = express.Router();
const Blog = require('../../models/Blog');
const { adminOnly } = require('../../middleware/auth.middleware');

// Get all blog posts
router.get('/', adminOnly, async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status) query.status = status;

        const posts = await Blog.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('author', 'name')
            .lean();

        const total = await Blog.countDocuments(query);

        res.json({
            success: true,
            data: {
                posts,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Blog List Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch blog posts' });
    }
});

// Get single blog post
router.get('/:id', adminOnly, async (req, res) => {
    try {
        const post = await Blog.findById(req.params.id).populate('author', 'name');

        if (!post) {
            return res.status(404).json({ success: false, message: 'Blog post not found' });
        }

        res.json({ success: true, data: post });
    } catch (error) {
        console.error('Blog Get Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch blog post' });
    }
});

// Create blog post
router.post('/', adminOnly, async (req, res) => {
    try {
        const { title, excerpt, content, featuredImage, status, tags } = req.body;

        const post = await Blog.create({
            title,
            excerpt,
            content,
            featuredImage,
            status: status || 'draft',
            tags: tags || [],
            author: req.user._id
        });

        res.status(201).json({ success: true, data: post });
    } catch (error) {
        console.error('Blog Create Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create blog post' });
    }
});

// Update blog post
router.put('/:id', adminOnly, async (req, res) => {
    try {
        const { title, excerpt, content, featuredImage, status, tags } = req.body;

        const post = await Blog.findByIdAndUpdate(
            req.params.id,
            { title, excerpt, content, featuredImage, status, tags },
            { new: true, runValidators: true }
        );

        if (!post) {
            return res.status(404).json({ success: false, message: 'Blog post not found' });
        }

        res.json({ success: true, data: post });
    } catch (error) {
        console.error('Blog Update Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update blog post' });
    }
});

// Delete blog post
router.delete('/:id', adminOnly, async (req, res) => {
    try {
        const post = await Blog.findByIdAndDelete(req.params.id);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Blog post not found' });
        }

        res.json({ success: true, message: 'Blog post deleted successfully' });
    } catch (error) {
        console.error('Blog Delete Error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete blog post' });
    }
});

module.exports = router;
