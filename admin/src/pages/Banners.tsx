import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, CardMedia, Grid, IconButton,
  Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel,
  Snackbar, Alert, Autocomplete
} from '@mui/material';
import { Add, Edit, Delete, Launch } from '@mui/icons-material';
import apiClient from '../services/api.service';

const PLACEMENT_OPTIONS = [
  { value: 'HOME_TOP', label: 'Home Page Top Banner' },
  { value: 'HOME_MIDDLE', label: 'Home Page Middle (Promotional)' },
  { value: 'HOME_BOTTOM', label: 'Home Page Bottom' },
  { value: 'PRODUCT_PAGE', label: 'Product Details Page' },
  { value: 'CART_PAGE', label: 'Cart Page' }
];


interface CategoryOption {
  _id: string;
  name: string;
}

interface ProductOption {
  _id: string;
  name: string;
}

const emptyForm = {
  title: '',
  description: '',
  placement: 'HOME_TOP',
  sortOrder: '0',
  isActive: true,
  linkedProduct: null as ProductOption | null,
  linkedCategory: null as CategoryOption | null,
};

const Banners: React.FC = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  useEffect(() => {
    fetchBanners();
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get<any>('/categories');
      const cats = response.data?.categories || response.categories || [];
      setCategories(cats);
    } catch (err: any) {
      console.error('Failed to fetch categories', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get<any>('/admin/products', { limit: 500 });
      const prods = response.data?.products || response.products || [];
      setProducts(prods);
    } catch (err: any) {
      console.error('Failed to fetch products', err);
    }
  };

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<any>('/admin/banners');
      setBanners(response.data?.banners || response.banners || []);
    } catch (err: any) {
      console.error('Failed to fetch banners', err);
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

  const openEdit = (banner: any) => {
    setEditing(banner);

    // Resolve linked product/category from banner's linkType + linkTarget
    let linkedProduct: ProductOption | null = null;
    let linkedCategory: CategoryOption | null = null;
    if (banner.linkType === 'PRODUCT' && banner.linkTarget) {
      linkedProduct = products.find((p) => p._id === banner.linkTarget) || { _id: banner.linkTarget, name: banner.linkTarget };
    } else if (banner.linkType === 'CATEGORY' && banner.linkTarget) {
      linkedCategory = categories.find((c) => c._id === banner.linkTarget) || { _id: banner.linkTarget, name: banner.linkTarget };
    }

    setForm({
      title: banner.title || '',
      description: banner.description || '',
      placement: banner.placement || 'HOME_TOP',
      sortOrder: banner.sortOrder?.toString() || '0',
      isActive: banner.isActive !== false,
      linkedProduct,
      linkedCategory,
    });
    setPreviewUrl(banner.image || '');
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
    if (!form.title.trim()) return;
    if (!editing && !imageFile) {
        setSnackbar({ open: true, message: 'Please select an image', severity: 'error' });
        return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('placement', form.placement);
      formData.append('sortOrder', form.sortOrder);
      formData.append('isActive', String(form.isActive));

      // Determine linkType and linkTarget based on dropdown selections
      // Priority: Product > Category > None
      if (form.linkedProduct) {
        formData.append('linkType', 'PRODUCT');
        formData.append('linkTarget', form.linkedProduct._id);
      } else if (form.linkedCategory) {
        formData.append('linkType', 'CATEGORY');
        formData.append('linkTarget', form.linkedCategory._id);
      } else {
        formData.append('linkType', 'NONE');
        formData.append('linkTarget', '');
      }

      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editing) {
        await apiClient.put(`/admin/banners/${editing._id}`, formData);
        setSnackbar({ open: true, message: 'Banner updated!', severity: 'success' });
      } else {
        await apiClient.post('/admin/banners', formData);
        setSnackbar({ open: true, message: 'Banner created!', severity: 'success' });
      }
      setDialogOpen(false);
      fetchBanners();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save banner';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      await apiClient.delete(`/admin/banners/${id}`);
      setBanners(banners.filter(b => b._id !== id));
      setSnackbar({ open: true, message: 'Banner deleted', severity: 'success' });
    } catch (err: any) {
      console.error('Failed to delete banner', err);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Banners</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add Banner</Button>
      </Box>

      <Grid container spacing={3}>
        {banners.length === 0 ? (
          <Grid item xs={12}>
            <Typography color="text.secondary">No banners found. Add your first banner.</Typography>
          </Grid>
        ) : (
          banners.map((banner) => (
            <Grid item xs={12} md={6} key={banner._id}>
              <Card sx={{ opacity: banner.isActive ? 1 : 0.6 }}>
                <CardMedia
                  component="img"
                  sx={{ height: 140, objectFit: 'cover', backgroundColor: '#E0E0E0' }}
                  image={banner.image || ''}
                  alt={banner.title}
                  onError={(e: any) => {
                    e.target.style.display = 'none';
                  }}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6">{banner.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {PLACEMENT_OPTIONS.find(p => p.value === banner.placement)?.label || banner.placement}
                      </Typography>
                    </Box>
                    <Chip
                      label={banner.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={banner.isActive ? 'success' : 'default'}
                    />
                  </Box>

                  {/* Show linked product/category info */}
                  {banner.linkType && banner.linkType !== 'NONE' && (
                    <Box sx={{ mb: 1 }}>
                      <Chip
                        icon={<Launch sx={{ fontSize: 14 }} />}
                        label={
                          banner.linkType === 'PRODUCT'
                            ? `Product: ${products.find(p => p._id === banner.linkTarget)?.name || banner.linkTarget}`
                            : `Category: ${categories.find(c => c._id === banner.linkTarget)?.name || banner.linkTarget}`
                        }
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {banner.viewCount || 0} views
                    </Typography>
                    <Box>
                      <IconButton size="small" onClick={() => openEdit(banner)}><Edit /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(banner._id)}><Delete /></IconButton>
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
        <DialogTitle>{editing ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth label="Title" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            sx={{ mt: 1 }} required
          />
          <TextField
            fullWidth label="Description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            sx={{ mt: 2 }} multiline rows={2}
          />

          <Box sx={{ mt: 3, mb: 1 }}>
            <Typography variant="subtitle2" gutterBottom>Banner Image</Typography>
            <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ marginBottom: '10px' }}
            />
          </Box>
          
          {previewUrl && (
            <Box sx={{ mt: 1, borderRadius: 1, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
              <img src={previewUrl} alt="Preview" style={{ width: '100%', maxHeight: 180, objectFit: 'cover' }}
                onError={(e: any) => { e.target.style.display = 'none'; }} />
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Placement</InputLabel>
              <Select value={form.placement} label="Placement" onChange={(e) => setForm({ ...form, placement: e.target.value })}>
                {PLACEMENT_OPTIONS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              fullWidth label="Sort Order" type="number" value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
          </Box>

          {/* Category Dropdown (Optional) */}
          <Autocomplete
            options={categories}
            getOptionLabel={(option) => option.name}
            value={form.linkedCategory}
            onChange={(_e, newVal) => setForm({ ...form, linkedCategory: newVal })}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            renderInput={(params) => (
              <TextField {...params} label="Link to Category (Optional)" placeholder="Select a category" />
            )}
            sx={{ mt: 2 }}
          />

          {/* Product Dropdown (Optional) */}
          <Autocomplete
            options={products}
            getOptionLabel={(option) => option.name}
            value={form.linkedProduct}
            onChange={(_e, newVal) => setForm({ ...form, linkedProduct: newVal })}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            renderInput={(params) => (
              <TextField {...params} label="Link to Product (Optional)" placeholder="Select a product" />
            )}
            sx={{ mt: 2 }}
          />

          {form.linkedProduct && form.linkedCategory && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Both product and category are selected. Product link takes priority on mobile.
            </Alert>
          )}

          <FormControlLabel
            control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />}
            label="Active" sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.title.trim()}>
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

export default Banners;