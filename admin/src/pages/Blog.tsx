import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Switch, FormControlLabel, Card, CardContent
} from '@mui/material';
import { Add, Edit, Delete, Visibility } from '@mui/icons-material';

import { API_BASE_URL as API_BASE } from '../services/api.service';

interface BlogPost {
    _id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featuredImage: string;
    status: 'draft' | 'published';
    author: string;
    createdAt: string;
    updatedAt: string;
}

const Blog: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        excerpt: '',
        content: '',
        featuredImage: '',
        status: 'draft' as 'draft' | 'published'
    });

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
    });

    const loadPosts = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/admin/blog`, {
                headers: getAuthHeaders()
            });
            const data = await response.json();
            if (data.success) {
                setPosts(data.data?.posts || data.posts || []);
            }
        } catch (error) {
            console.error('Failed to load blog posts:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadPosts();
    }, []);

    const handleOpenDialog = (post?: BlogPost) => {
        if (post) {
            setEditingPost(post);
            setFormData({
                title: post.title,
                excerpt: post.excerpt,
                content: post.content,
                featuredImage: post.featuredImage,
                status: post.status
            });
        } else {
            setEditingPost(null);
            setFormData({ title: '', excerpt: '', content: '', featuredImage: '', status: 'draft' });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingPost(null);
    };

    const handleSubmit = async () => {
        try {
            const url = editingPost
                ? `${API_BASE}/admin/blog/${editingPost._id}`
                : `${API_BASE}/admin/blog`;

            const response = await fetch(url, {
                method: editingPost ? 'PUT' : 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                handleCloseDialog();
                loadPosts();
            }
        } catch (error) {
            console.error('Failed to save blog post:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this blog post?')) return;

        try {
            await fetch(`${API_BASE}/admin/blog/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            loadPosts();
        } catch (error) {
            console.error('Failed to delete blog post:', error);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>Store Blog</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
                    New Post
                </Button>
            </Box>

            {posts.length === 0 && !loading ? (
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No Blog Posts Yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Start creating content to engage your customers
                        </Typography>
                        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
                            Create Your First Post
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Title</TableCell>
                                <TableCell>Excerpt</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {posts.map((post) => (
                                <TableRow key={post._id} hover>
                                    <TableCell>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            {post.title}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary" sx={{
                                            maxWidth: 300,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {post.excerpt}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={post.status === 'published' ? 'Published' : 'Draft'}
                                            color={post.status === 'published' ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {new Date(post.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" color="primary">
                                            <Visibility />
                                        </IconButton>
                                        <IconButton size="small" color="primary" onClick={() => handleOpenDialog(post)}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(post._id)}>
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>{editingPost ? 'Edit Blog Post' : 'Create New Blog Post'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Title"
                            fullWidth
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                        <TextField
                            label="Excerpt"
                            fullWidth
                            multiline
                            rows={2}
                            value={formData.excerpt}
                            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                            helperText="Short description shown in blog list"
                        />
                        <TextField
                            label="Content"
                            fullWidth
                            multiline
                            rows={10}
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            helperText="Full blog content (supports markdown)"
                        />
                        <TextField
                            label="Featured Image URL"
                            fullWidth
                            value={formData.featuredImage}
                            onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.status === 'published'}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'published' : 'draft' })}
                                />
                            }
                            label="Publish immediately"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit}>
                        {editingPost ? 'Save Changes' : 'Create Post'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Blog;
