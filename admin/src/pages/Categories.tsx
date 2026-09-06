import React, { useState, useEffect } from 'react';
import { Add, Edit, Delete, CloudUpload } from '@mui/icons-material';
import { 
  Box, Typography, Button, Card, CardContent, Grid, IconButton,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Switch, FormControlLabel, Snackbar, MenuItem
} from '@mui/material';
import apiClient, { API_BASE_URL as API_BASE } from '../services/api.service';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  isActive: boolean;
  parent?: string | { _id: string; name: string } | null;
  level?: number;
}

const emptyForm = { name: '', description: '', isActive: true };

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<{ name: string; description: string; isActive: boolean; parent: string; imageFile: File | null; imagePreview: string | null }>({ ...emptyForm, parent: '', imageFile: null, imagePreview: null });
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: { categories: Category[] } }>('/admin/categories');
      setCategories(response.data?.categories || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, parent: '', imageFile: null, imagePreview: null });
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    const parentId = typeof cat.parent === 'string' ? cat.parent : cat.parent?._id || '';
    setForm({ name: cat.name, description: cat.description || '', isActive: cat.isActive, parent: parentId, imageFile: null, imagePreview: cat.image || null });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('description', form.description);
      formData.append('isActive', String(form.isActive));
      if (form.parent) formData.append('parent', form.parent);
      if (form.imageFile) formData.append('image', form.imageFile);

      if (editing) {
        await apiClient.put(`/admin/categories/${editing._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSnackbar({ open: true, message: 'Category updated!', severity: 'success' });
      } else {
        await apiClient.post('/admin/categories', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSnackbar({ open: true, message: 'Category created!', severity: 'success' });
      }
      setDialogOpen(false);
      fetchCategories();
    } catch (err: any) {
      console.error("Save category error:", err);
      let msg = 'Failed to save category';
      if (err.response) {
        msg = err.response.data?.message || err.response.statusText || msg;
      } else if (err.message) {
        msg = err.message;
      }
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await apiClient.delete(`/admin/categories/${id}`);
      setCategories(categories.filter(c => c._id !== id));
      setSnackbar({ open: true, message: 'Category deleted', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to delete', severity: 'error' });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Categories</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.25)' }}>Add Category</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {categories.length === 0 ? (
          <Grid item xs={12}>
            <Typography color="text.secondary">No categories found. Add your first category.</Typography>
          </Grid>
        ) : (
          categories.sort((a, b) => {
            // Sort by hierarchy: Parent first, then its children
            const aParent = typeof a.parent === 'string' ? a.parent : a.parent?._id;
            const bParent = typeof b.parent === 'string' ? b.parent : b.parent?._id;
            if (!aParent && bParent === a._id) return -1;
            if (!bParent && aParent === b._id) return 1;
            return 0;
          }).map((category) => {
            const isSub = !!category.parent;
            const parentName = typeof category.parent === 'object' ? category.parent?.name : 
                               categories.find(c => c._id === category.parent)?.name;
            
            return (
              <Grid item xs={12} sm={isSub ? 5.5 : 6} md={isSub ? 3.8 : 4} key={category._id} sx={{ ml: isSub ? 4 : 0 }}>
                <Card sx={{ 
                  opacity: category.isActive ? 1 : 0.6,
                  borderLeft: isSub ? '4px solid #3B82F6' : 'none',
                  backgroundColor: isSub ? '#F8FAFC' : '#fff'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Box>
                        {isSub && (
                          <Typography variant="caption" color="primary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                            SUB OF: {parentName?.toUpperCase()}
                          </Typography>
                        )}
                        <Typography variant="h6" sx={{ fontSize: isSub ? '1.1rem' : '1.25rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                          {category.image && <img src={category.image} alt={category.name} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />}
                          {category.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{category.slug}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex' }}>
                        {!isSub && (
                           <IconButton size="small" title="Add Subcategory" onClick={() => {
                             openCreate();
                             setForm(f => ({ ...f, parent: category._id }));
                           }}>
                             <Add fontSize="small" />
                           </IconButton>
                        )}
                        <IconButton size="small" onClick={() => openEdit(category)}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(category._id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' 
                    }}>
                      {category.description || 'No description'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Category Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            sx={{ mt: 1 }}
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            sx={{ mt: 2 }}
            multiline
            rows={3}
          />
          <TextField
            select
            fullWidth
            label="Parent Category (Optional)"
            value={form.parent}
            onChange={(e) => setForm({ ...form, parent: e.target.value })}
            sx={{ mt: 2 }}
          >
            <MenuItem value="">None (Root Category)</MenuItem>
            {categories.filter(c => !c.parent && c._id !== editing?._id).map(c => (
              <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
            ))}
          </TextField>
            <Box sx={{ mt: 3, mb: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Category Image</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {(form.imagePreview) && (
                  <img src={form.imagePreview} alt="Preview" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />
                )}
                <Button variant="outlined" component="label" startIcon={<CloudUpload />}>
                  Upload Image
                  <input type="file" hidden accept="image/*" onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setForm({ ...form, imageFile: file, imagePreview: URL.createObjectURL(file) });
                    }
                  }} />
                </Button>
                {form.imageFile && (
                  <Typography variant="caption" color="text.secondary">{form.imageFile.name}</Typography>
                )}
              </Box>
            </Box>
          <FormControlLabel
            control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />}
            label="Active"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Categories;
