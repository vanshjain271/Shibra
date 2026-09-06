import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  IconButton, Paper, Chip, Alert, Snackbar, CircularProgress, Tooltip, Autocomplete
} from '@mui/material';
import {
  Delete, CloudUpload, ArrowBack, Save
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

import { API_BASE_URL as API_BASE } from '../services/api.service';

interface ImagePreview {
  id: string;
  url: string;
  file?: File;
  isExisting: boolean;
}

const LotForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(id);

  // Basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<string[]>([]);

  // Lot Details
  const [fullLotQuantity, setFullLotQuantity] = useState('');
  const [fullLotPrice, setFullLotPrice] = useState('');
  const [allowHalfLot, setAllowHalfLot] = useState(false);
  const [halfLotQuantity, setHalfLotQuantity] = useState('');
  const [halfLotPrice, setHalfLotPrice] = useState('');
  const [allowMiniLot, setAllowMiniLot] = useState(false);
  const [miniLotQuantity, setMiniLotQuantity] = useState('');
  const [miniLotPrice, setMiniLotPrice] = useState('');

  // Status & Images
  const [isActive, setIsActive] = useState(true);
  const [homepageSections, setHomepageSections] = useState<string[]>([]);
  const [homepageSectionInput, setHomepageSectionInput] = useState('');
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // UI
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
  });

  useEffect(() => {
    const load = async () => {
      try {
        const catRes = await fetch(`${API_BASE}/categories`, { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } });
        const catData = await catRes.json();
        if (catData.success || catData.data) {
          setCategories(catData.data?.categories || catData.categories || catData.data || []);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!id) return;
    const loadProduct = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/products/${id}`, {
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        const product = data.product || data.data || data;
        if (product) {
          setName(product.name || '');
          setDescription(product.description || '');
          setSku(product.sku || '');
          setCategory(Array.isArray(product.category) ? product.category.map((c: any) => c._id || c) : (product.category ? [product.category._id || product.category] : []));
          setIsActive(product.isActive !== false);
          setHomepageSections(product.homepageSections || []);

          if (product.lotDetails) {
            setFullLotQuantity(String(product.lotDetails.fullLotQuantity || ''));
            setFullLotPrice(String(product.lotDetails.fullLotPrice || ''));
            setAllowHalfLot(Boolean(product.lotDetails.allowHalfLot));
            setHalfLotQuantity(String(product.lotDetails.halfLotQuantity || ''));
            setHalfLotPrice(String(product.lotDetails.halfLotPrice || ''));
            setAllowMiniLot(Boolean(product.lotDetails.allowMiniLot));
            setMiniLotQuantity(String(product.lotDetails.miniLotQuantity || ''));
            setMiniLotPrice(String(product.lotDetails.miniLotPrice || ''));
          }

          if (product.images?.length > 0) {
            setImages(product.images.map((url: any, idx: number) => ({
              id: `existing-${idx}`,
              url: typeof url === 'string' ? url : url?.url || url,
              isExisting: true
            })));
          }
        }
      } catch (err) {
        console.error('Failed to load lot product', err);
        setSnackbar({ open: true, message: 'Failed to load lot product', severity: 'error' });
      }
      setLoading(false);
    };
    loadProduct();
  }, [id]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    addImageFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')));
  }, []);
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addImageFiles(Array.from(e.target.files || []));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const addImageFiles = (files: File[]) => {
    const newImages: ImagePreview[] = files.map(file => ({
      id: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      url: URL.createObjectURL(file), file, isExisting: false
    }));
    setImages(prev => [...prev, ...newImages].slice(0, 10));
  };
  const removeImage = (imageId: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === imageId);
      if (img && !img.isExisting) URL.revokeObjectURL(img.url);
      return prev.filter(i => i.id !== imageId);
    });
  };

  const handleSave = async () => {
    if (!name.trim()) { setSnackbar({ open: true, message: 'Lot name is required', severity: 'error' }); return; }
    if (!fullLotPrice || !fullLotQuantity) { setSnackbar({ open: true, message: 'Full lot price and quantity are required', severity: 'error' }); return; }
    
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description);
      formData.append('sku', (sku || '').trim());
      formData.append('isLot', 'true');
      
      // We set dummy values for these required base product fields so validation passes
      formData.append('mrp', fullLotPrice);
      formData.append('salePrice', fullLotPrice);

      if (category && category.length > 0) {
        category.forEach(catId => formData.append('category', catId));
      }
      formData.append('isActive', String(isActive));
      let finalSections = [...homepageSections];
      if (homepageSectionInput.trim() && !finalSections.includes(homepageSectionInput.trim())) {
        finalSections.push(homepageSectionInput.trim());
      }
      formData.append('homepageSections', JSON.stringify(finalSections));

      const lotDetails = {
        fullLotQuantity: parseInt(fullLotQuantity),
        fullLotPrice: parseFloat(fullLotPrice),
        allowHalfLot,
        halfLotQuantity: allowHalfLot ? parseInt(halfLotQuantity || '0') : 0,
        halfLotPrice: allowHalfLot ? parseFloat(halfLotPrice || '0') : 0,
        allowMiniLot,
        miniLotQuantity: allowMiniLot ? parseInt(miniLotQuantity || '0') : 0,
        miniLotPrice: allowMiniLot ? parseFloat(miniLotPrice || '0') : 0,
      };
      formData.append('lotDetails', JSON.stringify(lotDetails));

      const existingImageUrls = images.filter(i => i.isExisting).map(i => i.url);
      formData.append('existingImages', JSON.stringify(existingImageUrls));
      images.filter(i => !i.isExisting && i.file).forEach(img => formData.append('images', img.file!));

      const url = isEdit ? `${API_BASE}/admin/products/${id}` : `${API_BASE}/admin/products`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` },
        body: formData
      });
      const result = await res.json();
      if (result.success) {
        setSnackbar({ open: true, message: isEdit ? 'Lot updated!' : 'Lot created!', severity: 'success' });
        setTimeout(() => navigate('/catalog/lots'), 1000);
      } else {
        let errorMsg = result.message || 'Failed to save lot';
        if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          errorMsg = `${result.message}: ${result.errors[0].message}`;
        }
        setSnackbar({ open: true, message: errorMsg, severity: 'error' });
      }
    } catch (err) {
      console.error('Save error:', err);
      setSnackbar({ open: true, message: 'Failed to save lot product', severity: 'error' });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this lot? This action cannot be undone.')) {
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }
      });
      const result = await res.json();
      if (result.success) {
        setSnackbar({ open: true, message: 'Lot deleted!', severity: 'success' });
        setTimeout(() => navigate('/catalog/lots'), 1000);
      } else {
        setSnackbar({ open: true, message: result.message || 'Failed to delete lot', severity: 'error' });
      }
    } catch (err) {
      console.error('Delete error:', err);
      setSnackbar({ open: true, message: 'Failed to delete lot', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6, px: 1 }}>
      <Box sx={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, 
        position: 'sticky', top: 0, zIndex: 10, bgcolor: 'rgba(248, 250, 252, 0.9)', backdropFilter: 'blur(8px)',
        py: 2, borderBottom: '1px solid #E2E8F0', mx: -3, px: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/catalog/lots')} size="small" sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <ArrowBack fontSize="small" sx={{ color: '#475569' }} />
          </IconButton>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>
                {isEdit ? name || 'Edit Product Lot' : 'Add New Product Lot'}
              </Typography>
              {isEdit && <Chip label={isActive ? 'Active' : 'Draft'} color={isActive ? 'success' : 'default'} size="small" sx={{ fontWeight: 600, borderRadius: 1.5 }} />}
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {isEdit && <Button variant="outlined" color="error" startIcon={<Delete />} onClick={handleDelete} disabled={saving} sx={{ bgcolor: '#fff' }}>Delete</Button>}
          <Button variant="outlined" sx={{ bgcolor: '#fff', borderColor: '#E2E8F0', color: '#475569' }} onClick={() => navigate('/catalog/lots')}>Discard</Button>
          <Button variant="contained" color="primary" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
            onClick={handleSave} disabled={saving} sx={{ boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.25)' }}>
            {saving ? 'Saving...' : 'Save Lot'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, color: '#0F172A' }}>Basic Information</Typography>
              <TextField 
                fullWidth 
                label="Lot Title" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder="e.g. Mixed iPhone Cases Lot"
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <TextField 
                fullWidth 
                multiline
                rows={4}
                label="Lot Description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Describe what is included in this lot..."
                variant="outlined"
              />
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>Lot Images</Typography>
                <Chip label={`${images.length} / 10 Images`} size="small" sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 600 }} />
              </Box>
              <Paper
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  p: 4, mb: 3, textAlign: 'center', cursor: 'pointer',
                  border: '2px dashed',
                  borderColor: dragActive ? 'primary.main' : '#CBD5E1',
                  backgroundColor: dragActive ? '#F3E8FF' : '#F8FAFC',
                  transition: 'all 0.2s ease',
                  borderRadius: 2,
                  '&:hover': { borderColor: 'primary.main', backgroundColor: '#F3E8FF' }
                }}
              >
                <CloudUpload sx={{ fontSize: 40, color: dragActive ? 'primary.main' : '#94A3B8', mb: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A' }}>Click to upload or drag and drop</Typography>
              </Paper>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={handleFileSelect} />
              
              {images.length > 0 && (
                <Grid container spacing={2}>
                  {images.map((img, idx) => (
                    <Grid item key={img.id}>
                      <Box sx={{
                        position: 'relative', width: 120, height: 120, borderRadius: 3, overflow: 'hidden',
                        border: idx === 0 ? '2px solid #7C3AED' : '1px solid #E2E8F0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}>
                        <img src={img.url} alt={`Lot image ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {idx === 0 && <Chip label="Main" size="small" sx={{ position: 'absolute', top: 6, left: 6, fontSize: '0.65rem', height: 20, bgcolor: '#7C3AED', color: '#fff', fontWeight: 600 }} />}
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                          sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.9)', color: '#EF4444', '&:hover': { bgcolor: '#FEE2E2' }, width: 24, height: 24, boxShadow: 1 }}>
                          <Delete sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, color: '#0F172A' }}>Lot Pricing Options</Typography>
              
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="number" label="Full Lot Quantity (Units)" value={fullLotQuantity} onChange={(e) => setFullLotQuantity(e.target.value)} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="number" label="Full Lot Price (₹)" value={fullLotPrice} onChange={(e) => setFullLotPrice(e.target.value)} required />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch checked={allowHalfLot} onChange={(e) => setAllowHalfLot(e.target.checked)} color="primary" />}
                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Allow purchasing half lot</Typography>}
                  />
                </Grid>

                {allowHalfLot && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth type="number" label="Half Lot Quantity (Units)" value={halfLotQuantity} onChange={(e) => setHalfLotQuantity(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth type="number" label="Half Lot Price (₹)" value={halfLotPrice} onChange={(e) => setHalfLotPrice(e.target.value)} />
                    </Grid>
                  </>
                )}

                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch checked={allowMiniLot} onChange={(e) => setAllowMiniLot(e.target.checked)} color="primary" />}
                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Allow purchasing mini lot</Typography>}
                  />
                </Grid>

                {allowMiniLot && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth type="number" label="Mini Lot Quantity (Units)" value={miniLotQuantity} onChange={(e) => setMiniLotQuantity(e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth type="number" label="Mini Lot Price (₹)" value={miniLotPrice} onChange={(e) => setMiniLotPrice(e.target.value)} />
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ position: 'sticky', top: 100, display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 12 }}>Status</Typography>
                <FormControlLabel
                  control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} color="success" />}
                  label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{isActive ? 'Active' : 'Draft'}</Typography>}
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                  {isActive ? 'This lot will be visible to all customers on your store.' : 'This lot is hidden from the storefront.'}
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 12 }}>Organization</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField fullWidth label="SKU (Stock Keeping Unit)" value={sku} onChange={(e) => setSku(e.target.value)} />
                  <FormControl fullWidth>
                    <InputLabel>Categories</InputLabel>
                    <Select
                      multiple
                      value={category}
                      label="Categories"
                      onChange={(e) => setCategory(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((value) => {
                            const cat = categories.find(c => c._id === value);
                            return <Chip key={value} label={cat?.name || value} size="small" sx={{ borderRadius: 1 }} />;
                          })}
                        </Box>
                      )}
                    >
                      {categories.filter(c => !c.parent).sort((a, b) => a.name.localeCompare(b.name)).map(root => (
                        [
                          <MenuItem key={root._id} value={root._id} sx={{ fontWeight: 700 }}>{root.name}</MenuItem>,
                          ...categories.filter(sub => (typeof sub.parent === 'string' ? sub.parent : sub.parent?._id) === root._id).sort((a, b) => a.name.localeCompare(b.name)).map(sub => (
                            <MenuItem key={sub._id} value={sub._id} sx={{ pl: 4 }}>— {sub.name}</MenuItem>
                          ))
                        ]
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 12 }}>Storefront Visibility</Typography>
                <Autocomplete
                  multiple
                  freeSolo
                  options={[]}
                  value={homepageSections}
                  onChange={(_, newValue) => setHomepageSections(newValue)}
                  inputValue={homepageSectionInput}
                  onInputChange={(_, newInputValue) => setHomepageSectionInput(newInputValue)}
                  renderTags={(value: readonly string[], getTagProps) =>
                    value.map((option: string, index: number) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return (
                        <Chip variant="outlined" label={option} key={key} {...tagProps} size="small" sx={{ borderRadius: 1 }} />
                      );
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="outlined"
                      placeholder="Add tags..."
                      helperText="Create custom homepage sections"
                      sx={{ '& .MuiFormHelperText-root': { ml: 0, mt: 1 } }}
                    />
                  )}
                />
              </CardContent>
            </Card>

          </Box>
        </Grid>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default LotForm;
