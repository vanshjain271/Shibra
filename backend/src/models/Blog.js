/**
 * Blog Model - Store Blog Posts
 */

const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Blog title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    excerpt: {
        type: String,
        trim: true,
        maxlength: [500, 'Excerpt cannot exceed 500 characters'],
        default: ''
    },
    content: {
        type: String,
        default: ''
    },
    featuredImage: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft'
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    tags: [{
        type: String,
        trim: true
    }],
    viewCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Generate slug from title
blogSchema.pre('save', function (next) {
    if (this.isModified('title')) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
    }
    next();
});

// Indexes
blogSchema.index({ status: 1, createdAt: -1 });
blogSchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model('Blog', blogSchema);
