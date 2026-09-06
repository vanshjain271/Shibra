import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  IconButton, Paper, Chip, Alert, Snackbar, CircularProgress,
  ToggleButton, ToggleButtonGroup, Tooltip, Autocomplete
} from '@mui/material';
import {
  Delete, CloudUpload, ArrowBack, Save, Add,
  FormatBold, FormatItalic, FormatListBulleted, FormatListNumbered,
  Undo, Redo,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

import { API_BASE_URL as API_BASE } from '../services/api.service';

interface ImagePreview {
  id: string;
  url: string;
  file?: File;
  isExisting: boolean;
}

interface VariantOption {
  name: string;
  sku: string;
  color: string;
  mrp: string;
  salePrice: string;
  stock: string;
  isActive: boolean;
}

interface BulkPriceTier {
  minQty: string;
  salePrice: string;
}

/* ─── Mini Rich Text Editor ─────────────────────── */
const RichEditor: React.FC<{
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}> = ({ value, onChange, placeholder = 'Write here...', minHeight = 120 }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);

  // Seed initial HTML once on mount only
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || '';
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save selection whenever user interacts with the editor
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // Restore the saved selection before executing a command
  const restoreSelection = () => {
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    if (savedRange.current) {
      try { sel.addRange(savedRange.current); } catch (_) { }
    } else {
      // No saved selection — place caret at end of editor
      editorRef.current?.focus();
      const range = document.createRange();
      range.selectNodeContents(editorRef.current!);
      range.collapse(false);
      sel.addRange(range);
    }
  };

  const exec = (command: string, arg?: string) => {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const handleInput = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const toolbarBtn = (title: string, icon: React.ReactNode, cmd: string, arg?: string) => (
    <Tooltip title={title} key={cmd + (arg || '')}>
      <IconButton
        size="small"
        onPointerDown={(e) => {
          // Save selection NOW (before the click can shift focus away)
          saveSelection();
          // Prevent the button from stealing focus
          e.preventDefault();
        }}
        onClick={() => exec(cmd, arg)}
        sx={{ borderRadius: 1, '&:hover': { bgcolor: '#E2E8F0' }, width: 30, height: 30 }}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );

  return (
    <Box sx={{
      border: '1px solid #CBD5E1', borderRadius: 1.5, overflow: 'hidden',
      '&:focus-within': { borderColor: 'primary.main', boxShadow: '0 0 0 2px rgba(59,130,246,0.1)' }
    }}>
      {/* Toolbar */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap',
        px: 1, py: 0.5, borderBottom: '1px solid #E2E8F0', bgcolor: '#fff',
      }}>
        {toolbarBtn('Undo', <Undo sx={{ fontSize: 17 }} />, 'undo')}
        {toolbarBtn('Redo', <Redo sx={{ fontSize: 17 }} />, 'redo')}
        <Box sx={{ width: '1px', alignSelf: 'stretch', bgcolor: '#E2E8F0', mx: 1, my: 0.5 }} />
        {toolbarBtn('Bold', <FormatBold sx={{ fontSize: 17 }} />, 'bold')}
        {toolbarBtn('Italic', <FormatItalic sx={{ fontSize: 17 }} />, 'italic')}
        <Box sx={{ width: '1px', alignSelf: 'stretch', bgcolor: '#E2E8F0', mx: 1, my: 0.5 }} />
        {toolbarBtn('Bullet List', <FormatListBulleted sx={{ fontSize: 17 }} />, 'insertUnorderedList')}
        {toolbarBtn('Numbered List', <FormatListNumbered sx={{ fontSize: 17 }} />, 'insertOrderedList')}
        <Box sx={{ width: '1px', alignSelf: 'stretch', bgcolor: '#E2E8F0', mx: 1, my: 0.5 }} />
        <Select
          size="small"
          value="p"
          onOpen={saveSelection}
          onChange={(e) => { exec('formatBlock', e.target.value as string); }}
          sx={{ height: 26, fontSize: 12, mx: 0.5, '& .MuiSelect-select': { py: 0.3, px: 1 }, border: 'none', '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
        >
          <MenuItem value="p">Paragraph</MenuItem>
          <MenuItem value="h1">Heading 1</MenuItem>
          <MenuItem value="h2">Heading 2</MenuItem>
          <MenuItem value="h3">Heading 3</MenuItem>
          <MenuItem value="pre">Code</MenuItem>
        </Select>
      </Box>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onSelect={saveSelection}
        data-placeholder={placeholder}
        style={{
          minHeight, padding: '10px 16px',
          outline: 'none', fontSize: 14, color: '#1E293B',
          lineHeight: 1.6,
        }}
      />
      <style>{`
        [data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #94A3B8;
        }
        [contenteditable] ul { padding-left: 20px; }
        [contenteditable] ol { padding-left: 20px; }
        [contenteditable] pre { background: #F1F5F9; border-radius: 4px; padding: 8px; font-family: monospace; }
        [contenteditable] strong { font-weight: 700; }
        [contenteditable] b { font-weight: 700; }
        [contenteditable] em { font-style: italic; }
        [contenteditable] i { font-style: italic; }
        [contenteditable] h1 { font-size: 1.8em; margin: 0.5em 0; }
        [contenteditable] h2 { font-size: 1.4em; margin: 0.4em 0; }
        [contenteditable] h3 { font-size: 1.2em; margin: 0.3em 0; }
      `}</style>
    </Box>
  );
};


/* ─── Main Product Form ──────────────────────────── */
const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(id);

  // Basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<string[]>([]);
  const [colour, setColour] = useState('');
  const [modal, setModal] = useState('');
  const [warranty, setWarranty] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Pricing
  const [mrp, setMrp] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [taxMode, setTaxMode] = useState<'included' | 'excluded'>('excluded');
  const [taxPercent, setTaxPercent] = useState<'' | '5' | '18'>('');

  // Inventory
  const [stock, setStock] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [unit, setUnit] = useState('Pcs');
  const [minQuantity, setMinQuantity] = useState('1');
  const [paymentMode, setPaymentMode] = useState('default');

  // Status & Variants
  const [isActive, setIsActive] = useState(true);
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [hasModels, setHasModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<{name: string, stock: string}[]>([]);

  // Image state
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // New Fields
  const [homepageSections, setHomepageSections] = useState<string[]>([]);
  const [homepageSectionInput, setHomepageSectionInput] = useState('');
  const [bulkPricing, setBulkPricing] = useState<BulkPriceTier[]>([]);

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
          setColour(product.colour || '');
          setModal(product.modal || '');
          setYoutubeUrl(product.youtubeUrl || '');
          setWarranty(product.warranty || '');
          setMrp(String(product.mrp || ''));
          setSalePrice(String(product.salePrice || ''));
          setTaxMode(product.taxMode || 'excluded');
          setTaxPercent(product.taxRate ? String(product.taxRate) as '5' | '18' : ''); // Map taxRate -> taxPercent
          setStock(String(product.stock || ''));
          setLowStockThreshold(String(product.lowStockThreshold || '10'));
          setUnit(product.unit || 'Pcs');
          setMinQuantity(String(product.minOrderQty || product.minQuantity || '1')); // Map minOrderQty -> minQuantity
          setPaymentMode(product.paymentMode || 'default');
          setIsActive(product.isActive !== false);
          setHasVariants(product.hasVariants || false);
          if (product.variants?.length > 0) {
            setVariants(product.variants.map((v: any) => ({
              name: v.name || '', sku: v.sku || '', color: v.color || '', mrp: v.mrp ? String(v.mrp) : '',
              salePrice: v.salePrice ? String(v.salePrice) : '', stock: v.stock ? String(v.stock) : '', isActive: v.isActive !== false
            })));
          }
          setHasModels(product.hasModels || false);
          if (product.availableModels?.length > 0) {
            setAvailableModels(product.availableModels.map((m: any) => ({
              name: m.name || '',
              stock: m.stock !== undefined ? String(m.stock) : ''
            })));
          }
          setHomepageSections(product.homepageSections || []);
          if (product.bulkPricing?.length > 0) {
            setBulkPricing(product.bulkPricing.map((t: any) => ({
              minQty: String(t.minQty),
              salePrice: String(t.salePrice)
            })));
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
        console.error('Failed to load product', err);
        setSnackbar({ open: true, message: 'Failed to load product', severity: 'error' });
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

  const addVariant = () => setVariants(prev => [...prev, { name: '', sku: '', color: '', mrp: '', salePrice: '', stock: '', isActive: true }]);
  const updateVariant = (idx: number, field: keyof VariantOption, value: any) => {
    setVariants(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };
  const removeVariant = (idx: number) => setVariants(prev => prev.filter((_, i) => i !== idx));

  const addModel = () => setAvailableModels(prev => [...prev, { name: '', stock: '' }]);
  const updateModel = (idx: number, field: keyof {name: string, stock: string}, value: any) => {
    setAvailableModels(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };
  const removeModel = (idx: number) => setAvailableModels(prev => prev.filter((_, i) => i !== idx));

  // Bulk Pricing handlers
  const addBulkTier = () => setBulkPricing(prev => [...prev, { minQty: '', salePrice: '' }]);
  const updateBulkTier = (idx: number, field: keyof BulkPriceTier, value: string) => {
    setBulkPricing(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };
  const removeBulkTier = (idx: number) => setBulkPricing(prev => prev.filter((_, i) => i !== idx));

  const toggleHomeSection = (section: string) => {
    setHomepageSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) { setSnackbar({ open: true, message: 'Product name is required', severity: 'error' }); return; }
    if (!mrp || !salePrice) { setSnackbar({ open: true, message: 'MRP and Sale Price are required', severity: 'error' }); return; }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('description', description);
      formData.append('sku', (sku || '').trim());
      if (category && category.length > 0) {
        category.forEach(catId => formData.append('category', catId));
      }
      if (colour) formData.append('colour', colour);
      if (modal) formData.append('modal', modal);
      if (youtubeUrl) formData.append('youtubeUrl', youtubeUrl);
      formData.append('mrp', mrp);
      formData.append('salePrice', salePrice);
      formData.append('taxMode', taxMode);
      if (taxPercent) formData.append('taxRate', taxPercent); // Map taxPercent -> taxRate
      formData.append('stock', stock || '0');
      formData.append('lowStockThreshold', lowStockThreshold || '10');
      formData.append('unit', unit);
      formData.append('minOrderQty', minQuantity || '1'); // Map minQuantity -> minOrderQty
      formData.append('warranty', warranty || '');
      formData.append('paymentMode', paymentMode);
      formData.append('isActive', String(isActive));
      formData.append('hasVariants', String(hasVariants));
      formData.append('hasModels', String(hasModels));
      if (hasVariants && variants.length > 0) {
        const cleanedVariants = variants.map(v => ({
          ...v,
          mrp: v.mrp ? parseFloat(v.mrp) : undefined,
          salePrice: v.salePrice ? parseFloat(v.salePrice) : undefined,
          stock: v.stock ? parseInt(v.stock) : 0,
        }));
        formData.append('variants', JSON.stringify(cleanedVariants));
      }

      if (hasModels) {
        const cleanedModels = availableModels.filter(m => m.name.trim()).map(m => ({
          name: m.name.trim(),
          stock: m.stock ? parseInt(m.stock) : 0
        }));
        formData.append('availableModels', JSON.stringify(cleanedModels));
      }

      let finalSections = [...homepageSections];
      if (homepageSectionInput.trim() && !finalSections.includes(homepageSectionInput.trim())) {
        finalSections.push(homepageSectionInput.trim());
      }
      formData.append('homepageSections', JSON.stringify(finalSections));
      if (bulkPricing.length > 0) {
        const cleanedBulk = bulkPricing
          .filter(t => t.minQty && t.salePrice)
          .map(t => ({ minQty: parseInt(t.minQty), salePrice: parseFloat(t.salePrice) }))
          .sort((a, b) => a.minQty - b.minQty);
        formData.append('bulkPricing', JSON.stringify(cleanedBulk));
      }
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
        setSnackbar({ open: true, message: isEdit ? 'Product updated!' : 'Product created!', severity: 'success' });
        setTimeout(() => navigate('/catalog/products'), 1000);
      } else {
        // Show specific validation errors if available
        let errorMsg = result.message || 'Failed to save product';
        if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          errorMsg = `${result.message}: ${result.errors[0].message}`;
        }
        setSnackbar({ open: true, message: errorMsg, severity: 'error' });
      }
    } catch (err) {
      console.error('Save error:', err);
      setSnackbar({ open: true, message: 'Failed to save product', severity: 'error' });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
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
        setSnackbar({ open: true, message: 'Product deleted!', severity: 'success' });
        setTimeout(() => navigate('/catalog/products'), 1000);
      } else {
        setSnackbar({ open: true, message: result.message || 'Failed to delete product', severity: 'error' });
      }
    } catch (err) {
      console.error('Delete error:', err);
      setSnackbar({ open: true, message: 'Failed to delete product', severity: 'error' });
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

  const discountPct = mrp && salePrice && Number(salePrice) < Number(mrp)
    ? Math.round((1 - Number(salePrice) / Number(mrp)) * 100)
    : null;

  return (
    <Box sx={{ pb: 6, px: 1 }}>
      {/* Sticky Header */}
      <Box sx={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, 
        position: 'sticky', top: 0, zIndex: 10, bgcolor: 'rgba(248, 250, 252, 0.9)', backdropFilter: 'blur(8px)',
        py: 2, borderBottom: '1px solid #E2E8F0', mx: -3, px: 3
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/catalog/products')} size="small" sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <ArrowBack fontSize="small" sx={{ color: '#475569' }} />
          </IconButton>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>
                {isEdit ? name || 'Edit Product' : 'Add New Product'}
              </Typography>
              {isEdit && <Chip label={isActive ? 'Active' : 'Draft'} color={isActive ? 'success' : 'default'} size="small" sx={{ fontWeight: 600, borderRadius: 1.5 }} />}
            </Box>
            {isEdit && <Typography variant="caption" color="text.secondary">Manage your product details and availability</Typography>}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {isEdit && <Button variant="outlined" color="error" startIcon={<Delete />} onClick={handleDelete} disabled={saving} sx={{ bgcolor: '#fff' }}>Delete</Button>}
          <Button variant="outlined" sx={{ bgcolor: '#fff', borderColor: '#E2E8F0', color: '#475569' }} onClick={() => navigate('/catalog/products')}>Discard</Button>
          <Button variant="contained" color="primary" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
            onClick={handleSave} disabled={saving} sx={{ boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.25)' }}>
            {saving ? 'Saving...' : 'Save Product'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* LEFT SIDEBAR (70%) */}
        <Grid item xs={12} md={8}>
          
          {/* Section 1: Basic Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, color: '#0F172A' }}>Basic Information</Typography>
              <TextField 
                fullWidth 
                label="Product Title" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder="e.g. iPhone 15 Pro Max Clear Case"
                variant="outlined"
              />
            </CardContent>
          </Card>

          {/* Section 2: Product Description */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, color: '#0F172A' }}>Product Description</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1, color: '#64748B' }}>
                Detailed description of the product features and benefits.
              </Typography>
              <RichEditor value={description} onChange={setDescription} placeholder="Write a compelling description..." minHeight={200} />
            </CardContent>
          </Card>

          {/* Section 3: Media Gallery */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>Media Gallery</Typography>
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
                <Typography variant="caption" sx={{ color: '#64748B' }}>SVG, PNG, JPG or GIF (max. 5MB)</Typography>
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
                        <img src={img.url} alt={`Product ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

          {/* Section 4: Product Attributes */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, color: '#0F172A' }}>Product Attributes</Typography>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="SKU (Stock Keeping Unit)" value={sku} onChange={(e) => setSku(e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Barcode / ISBN" placeholder="Optional" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Colour" value={colour} onChange={(e) => setColour(e.target.value)} placeholder="e.g. Midnight Black" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Model / Series" value={modal} onChange={(e) => setModal(e.target.value)} placeholder="e.g. iPhone 15 Pro" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Measuring Unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. Pcs, Box, Set" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Mode</InputLabel>
                    <Select value={paymentMode} label="Payment Mode" onChange={(e) => setPaymentMode(e.target.value)}>
                      <MenuItem value="default">Default</MenuItem>
                      <MenuItem value="cod">COD Only</MenuItem>
                      <MenuItem value="prepaid">Prepaid Only</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Youtube URL" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Warranty Details" value={warranty} onChange={(e) => setWarranty(e.target.value)} placeholder="e.g. '1 Year Manufacturer Warranty'" />
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #E2E8F0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>Product Variants</Typography>
                  <FormControlLabel control={<Switch checked={hasVariants} onChange={(e) => setHasVariants(e.target.checked)} color="primary" />} label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Enable Variants</Typography>} />
                </Box>
                
                {hasVariants && (
                  <Box sx={{ bgcolor: '#F8FAFC', p: 2, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                    {variants.map((variant, idx) => (
                      <Paper key={idx} sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid #E2E8F0', boxShadow: 'none' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#475569' }}>Variant {idx + 1}</Typography>
                          <IconButton size="small" color="error" onClick={() => removeVariant(idx)} sx={{ bgcolor: '#FEE2E2', width: 28, height: 28 }}><Delete fontSize="small" /></IconButton>
                        </Box>
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={4}><TextField size="small" fullWidth label="Variant Name" value={variant.name} onChange={(e) => updateVariant(idx, 'name', e.target.value)} placeholder="e.g. 256GB" /></Grid>
                          <Grid item xs={6} sm={4}><TextField size="small" fullWidth label="SKU" value={variant.sku} onChange={(e) => updateVariant(idx, 'sku', e.target.value)} /></Grid>
                          <Grid item xs={6} sm={4}><TextField size="small" fullWidth label="Color" value={variant.color} onChange={(e) => updateVariant(idx, 'color', e.target.value)} /></Grid>
                          <Grid item xs={6} sm={4}><TextField size="small" fullWidth label="MRP" type="number" value={variant.mrp} onChange={(e) => updateVariant(idx, 'mrp', e.target.value)} /></Grid>
                          <Grid item xs={6} sm={4}><TextField size="small" fullWidth label="Sale Price" type="number" value={variant.salePrice} onChange={(e) => updateVariant(idx, 'salePrice', e.target.value)} /></Grid>
                          <Grid item xs={6} sm={4}><TextField size="small" fullWidth label="Stock" type="number" value={variant.stock} onChange={(e) => updateVariant(idx, 'stock', e.target.value)} /></Grid>
                        </Grid>
                      </Paper>
                    ))}
                    <Button variant="outlined" startIcon={<Add />} onClick={addVariant} sx={{ bgcolor: '#fff', fontWeight: 600 }}>Add Variant</Button>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Section: Available Models */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>Available Models</Typography>
                <FormControlLabel control={<Switch checked={hasModels} onChange={(e) => setHasModels(e.target.checked)} color="primary" />} label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Enable Models</Typography>} />
              </Box>
              
              {hasModels && (
                <Box sx={{ bgcolor: '#F8FAFC', p: 2, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                  {availableModels.map((model, idx) => (
                    <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1.5 }}>
                      <TextField size="small" label="Model Name" value={model.name} onChange={(e) => updateModel(idx, 'name', e.target.value)} sx={{ flex: 1, bgcolor: '#fff' }} placeholder="e.g. Samsung S24 Ultra" />
                      <TextField size="small" label="Stock" type="number" value={model.stock} onChange={(e) => updateModel(idx, 'stock', e.target.value)} sx={{ width: 120, bgcolor: '#fff' }} />
                      <IconButton size="small" color="error" onClick={() => removeModel(idx)} sx={{ bgcolor: '#FEE2E2', width: 32, height: 32 }}><Delete fontSize="small" /></IconButton>
                    </Box>
                  ))}
                  <Button variant="outlined" startIcon={<Add />} onClick={addModel} sx={{ bgcolor: '#fff', fontWeight: 600, mt: 1 }}>Add Model</Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Section 5: Bulk Pricing */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>Volume Pricing / Wholesale</Typography>
                <Button variant="outlined" size="small" startIcon={<Add />} onClick={addBulkTier} sx={{ fontWeight: 600 }}>Add Tier</Button>
              </Box>
              {bulkPricing.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>No volume discount tiers created.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {bulkPricing.map((tier, idx) => (
                    <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#F8FAFC', p: 1.5, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                      <TextField size="small" label="Min. Quantity" type="number" value={tier.minQty} onChange={(e) => updateBulkTier(idx, 'minQty', e.target.value)} sx={{ width: 120, bgcolor: '#fff' }} />
                      <TextField size="small" label="Price per unit (₹)" type="number" value={tier.salePrice} onChange={(e) => updateBulkTier(idx, 'salePrice', e.target.value)} sx={{ flex: 1, bgcolor: '#fff' }} />
                      <IconButton size="small" color="error" onClick={() => removeBulkTier(idx)} sx={{ bgcolor: '#FEE2E2', width: 32, height: 32 }}><Delete fontSize="small" /></IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT SIDEBAR (30%) - Sticky */}
        <Grid item xs={12} md={4}>
          <Box sx={{ position: 'sticky', top: 100, display: 'flex', flexDirection: 'column', gap: 3 }}>
            
            {/* Publishing Status Card */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 12 }}>Status</Typography>
                <FormControlLabel
                  control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} color="success" />}
                  label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{isActive ? 'Active' : 'Draft'}</Typography>}
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                  {isActive ? 'This product will be visible to all customers on your store.' : 'This product is hidden from the storefront.'}
                </Typography>
              </CardContent>
            </Card>

            {/* Pricing Card */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 12 }}>Pricing</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    fullWidth type="number" label="Sale Price (₹)" value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)} required
                    helperText={discountPct ? `${discountPct}% off MRP` : ''}
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiOutlinedInput-root': { fontWeight: 600, fontSize: 18 } }}
                  />
                  <TextField fullWidth label="Compare at Price / MRP (₹)" type="number" value={mrp} onChange={(e) => setMrp(e.target.value)} required InputLabelProps={{ shrink: true }} />
                  
                  <Box sx={{ pt: 1, borderTop: '1px solid #E2E8F0' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', mb: 1, display: 'block' }}>Tax Settings</Typography>
                    <ToggleButtonGroup
                      value={taxMode}
                      exclusive
                      fullWidth
                      onChange={(_, v) => { if (v) setTaxMode(v); }}
                      size="small"
                      sx={{ mb: 2 }}
                    >
                      <ToggleButton value="excluded" sx={{ fontWeight: 600, textTransform: 'none' }}>Tax Excluded</ToggleButton>
                      <ToggleButton value="included" sx={{ fontWeight: 600, textTransform: 'none' }}>Tax Included</ToggleButton>
                    </ToggleButtonGroup>
                    <FormControl fullWidth size="small">
                      <InputLabel>Tax Bracket</InputLabel>
                      <Select value={taxPercent} label="Tax Bracket" onChange={(e) => setTaxPercent(e.target.value as any)}>
                        <MenuItem value="">No Tax (0%)</MenuItem>
                        <MenuItem value="5">GST 5%</MenuItem>
                        <MenuItem value="18">GST 18%</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Inventory Card */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 12 }}>Inventory</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField fullWidth label="Current Stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
                  <TextField fullWidth label="Low Stock Alert Level" type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} />
                  <TextField fullWidth label="Min. Order Quantity" type="number" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} />
                </Box>
              </CardContent>
            </Card>

            {/* Organization Card */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 12 }}>Organization</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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

            {/* Visibility Card */}
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

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );

};

export default ProductForm;
