import React, { useState, useEffect } from 'react';
import { Add, Edit, Delete } from '@mui/icons-material';
import { 
  Box, Typography, Button, Card, CardContent, Grid, IconButton,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Snackbar, MenuItem, Chip
} from '@mui/material';
import apiClient from '../services/api.service';

interface Blog {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: string;
  featuredImage: string;
}

const emptyForm = { title: '', excerpt: '', content: '', status: 'published', featuredImage: '' };

const Blogs: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Blog | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => { fetchBlogs(); }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<any>('/admin/blog');
      setBlogs(response.data?.data?.posts || response.data?.posts || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (b: Blog) => {
    setEditing(b);
    setForm({ title: b.title, excerpt: b.excerpt, content: b.content, status: b.status, featuredImage: b.featuredImage });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) return;
    try {
      await apiClient.delete(`/admin/blog/${id}`);
      setSnackbar({ open: true, message: 'Blog deleted successfully', severity: 'success' });
      fetchBlogs();
    } catch (err: any) {
      setSnackbar({ open: true, message: 'Failed to delete blog', severity: 'error' });
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content) {
      setSnackbar({ open: true, message: 'Title and content are required', severity: 'error' });
      return;
    }
    
    setSaving(true);
    try {
      if (editing) {
        await apiClient.put(`/admin/blog/${editing._id}`, form);
        setSnackbar({ open: true, message: 'Blog updated', severity: 'success' });
      } else {
        await apiClient.post('/admin/blog', form);
        setSnackbar({ open: true, message: 'Blog created', severity: 'success' });
      }
      setDialogOpen(false);
      fetchBlogs();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to save blog', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight="700">Blogs</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ borderRadius: 2 }}>
          Create Blog
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {blogs.map((b) => (
            <Grid item xs={12} md={6} lg={4} key={b._id}>
              <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" fontWeight="700" noWrap>{b.title}</Typography>
                    <Box>
                      <IconButton size="small" onClick={() => openEdit(b)} color="primary"><Edit fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete(b._id)} color="error"><Delete fontSize="small" /></IconButton>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden' }}>
                    {b.excerpt || 'No excerpt provided.'}
                  </Typography>
                  <Chip 
                    label={b.status === 'published' ? 'Published' : 'Draft'} 
                    size="small" 
                    color={b.status === 'published' ? 'success' : 'default'} 
                    sx={{ fontWeight: 'bold' }} 
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
          {blogs.length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#f8fafc', borderRadius: 3, border: '1px dashed #cbd5e1' }}>
                <Typography color="text.secondary">No blogs found. Create one!</Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Blog' : 'Create Blog'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField fullWidth label="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Excerpt (Short Description)" value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} multiline rows={2} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Featured Image URL" value={form.featuredImage} onChange={e => setForm({...form, featuredImage: e.target.value})} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Content (Markdown/HTML supported)" value={form.content} onChange={e => setForm({...form, content: e.target.value})} multiline rows={8} required />
            </Grid>
            <Grid item xs={12}>
              <TextField select fullWidth label="Status" value={form.status} onChange={e => setForm({...form, status: e.target.value as string})}>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Blogs;
