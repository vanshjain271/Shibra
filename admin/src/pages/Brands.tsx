import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, IconButton, Avatar,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Switch, FormControlLabel, Snackbar
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import apiClient from '../services/api.service';

interface Brand {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder?: number;
}

const emptyForm = { name: '', description: '', isActive: true, sortOrder: '0' };

const Brands: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => { fetchBrands(); }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<any>('/admin/brands');
      setBrands(response.data?.brands || response.brands || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch brands');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setImageFile(null);
    setPreviewUrl('');
    setDialogOpen(true);
  };

  const openEdit = (brand: Brand) => {
    setEditing(brand);
    setForm({ 
      name: brand.name, 
      description: brand.description || '', 
      isActive: brand.isActive,
      sortOrder: (brand.sortOrder || 0).toString()
    });
    setPreviewUrl(brand.image || '');
    setImageFile(null);
    setDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('isActive', String(form.isActive));
      formData.append('sortOrder', form.sortOrder);
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editing) {
        await apiClient.put(`/admin/brands/${editing._id}`, formData);
        setSnackbar({ open: true, message: 'Brand updated!', severity: 'success' });
      } else {
        await apiClient.post('/admin/brands', formData);
        setSnackbar({ open: true, message: 'Brand created!', severity: 'success' });
      }
      setDialogOpen(false);
      fetchBrands();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save brand';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return;
    try {
      await apiClient.delete(`/admin/brands/${id}`);
      setBrands(brands.filter(b => b._id !== id));
      setSnackbar({ open: true, message: 'Brand deleted', severity: 'success' });
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
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Brands</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.25)' }}>Add Brand</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {brands.length === 0 ? (
          <Grid item xs={12}>
            <Typography color="text.secondary">No brands found. Add your first brand.</Typography>
          </Grid>
        ) : (
          brands.map((brand) => (
            <Grid item xs={12} sm={6} md={4} key={brand._id}>
              <Card sx={{ opacity: brand.isActive ? 1 : 0.6 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ width: 56, height: 56 }} src={brand.image || undefined}>
                      {brand.name[0]}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">{brand.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {brand.description || brand.slug}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => openEdit(brand)}><Edit /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(brand._id)}>
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Brand Name"
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
            rows={2}
          />
          <TextField
            fullWidth
            label="Sort Order"
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            sx={{ mt: 2 }}
          />

          <Box sx={{ mt: 3, mb: 1 }}>
            <Typography variant="subtitle2" gutterBottom>Brand Logo</Typography>
            <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ marginBottom: '10px' }}
            />
          </Box>
          
          {previewUrl && (
            <Box sx={{ mt: 1, borderRadius: 1, overflow: 'hidden', border: '1px solid #e0e0e0', width: 100, height: 100 }}>
              <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e: any) => { e.target.style.display = 'none'; }} />
            </Box>
          )}

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

export default Brands;
