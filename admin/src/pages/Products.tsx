import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, TextField, InputAdornment,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress, Link, Stack, Snackbar, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Search, Add, Upload, Download, Warning, ContentCopy, Edit } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import productService from '../services/product.service';
import { API_BASE_URL as API_BASE } from '../services/api.service';

const Products: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [totalProducts, setTotalProducts] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [sort, setSort] = useState('recent');
  const [importOpen, setImportOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
  });

  const columns: GridColDef[] = [
    {
      field: 'image',
      headerName: '',
      width: 60,
      renderCell: (params) => (
        <Box
          component="img"
          src={params.row.images?.[0] || params.row.images?.[0]?.url || 'https://via.placeholder.com/40'}
          sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover', border: '1px solid #E2E8F0' }}
          onError={(e: any) => { e.target.src = 'https://via.placeholder.com/40'; }}
        />
      )
    },
    {
      field: 'name',
      headerName: 'Product Name',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ py: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            SKU: {params.row.sku || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 180,
      renderCell: (params) => {
        const cats = Array.isArray(params.row.category) ? params.row.category : [params.row.category];
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {cats.filter(Boolean).map((c: any, i: number) => (
              <Chip key={i} label={c.name || '-'} size="small" variant="outlined" />
            ))}
          </Box>
        );
      }
    },
    { field: 'salePrice', headerName: 'Price', width: 100, valueFormatter: (params) => `₹${params.value || 0}` },
    {
      field: 'variants',
      headerName: 'Variants',
      width: 100,
      renderCell: (params) => (
        <Link
          component="button"
          variant="body2"
          onClick={() => {
            setSelectedProduct(params.row);
            setVariantDialogOpen(true);
          }}
          sx={{ fontWeight: 500 }}
        >
          Variants ({params.row.variants?.length || 0})
        </Link>
      )
    },
    {
      field: 'stock',
      headerName: 'Inventory',
      width: 120,
      renderCell: (params) => {
        const isLow = (params.value || 0) <= (params.row.lowStockThreshold || 10);
        return (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="body2" sx={{ fontWeight: 600, color: isLow ? 'error.main' : 'text.primary' }}>
              {params.value || 0} in stock
            </Typography>
            {isLow && <Warning sx={{ fontSize: 14, color: 'error.main' }} />}
          </Stack>
        );
      }
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Draft'}
          size="small"
          variant="outlined"
          color={params.value ? 'success' : 'default'}
          sx={{ borderRadius: 1 }}
        />
      )
    },
    {
      field: 'actions',
      headerName: '',
      width: 160,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button size="small" onClick={() => navigate(`/catalog/products/${params.row._id}`)}>Edit</Button>
          <Tooltip title="Duplicate Product">
            <IconButton size="small" onClick={() => handleDuplicate(params.row._id)} color="primary">
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  useEffect(() => {
    loadProducts();
  }, [paginationModel, search, sort]);

  useEffect(() => {
    checkLowStock();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { page, pageSize } = paginationModel;
      const data = await productService.getProducts(page + 1, pageSize, search, sort);
      const rows = (data.data?.products || data.products || []).map((p: any) => ({ ...p, id: p._id }));
      setProducts(rows);
      setTotalProducts(data.data?.pagination?.total || data.pagination?.total || rows.length);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
    setLoading(false);
  };

  const handleDuplicate = async (productId: string) => {
    try {
      const response = await fetch(`${API_BASE}/admin/products/${productId}/duplicate`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success || response.ok) {
        setSnackbar({ open: true, message: `Product duplicated! New: ${data.product?.name || 'Copy'}`, severity: 'success' });
        loadProducts();
      } else {
        setSnackbar({ open: true, message: data.message || 'Duplication failed', severity: 'error' });
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to duplicate product', severity: 'error' });
    }
  };

  const checkLowStock = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/products/low-stock`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setLowStockCount(data.count);
      }
    } catch (error) {
      console.error('Failed to check low stock', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCsvContent(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const response = await fetch(`${API_BASE}/admin/products/import`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvContent }),
      });

      const data = await response.json();
      if (response.ok) {
        setImportResult({ success: true, message: 'Products imported successfully!', results: data });
        setCsvContent('');
        setTimeout(() => {
          setImportOpen(false);
          loadProducts();
        }, 2000);
      } else {
        setImportResult({ success: false, message: data.message || 'Import failed' });
      }
    } catch (error) {
      setImportResult({ success: false, message: 'Import failed' });
    }
    setImporting(false);
  };

  const downloadTemplate = () => {
    window.open(`${API_BASE}/admin/products/import/template`, '_blank');
  };

  // Client side filtering removed in favor of server-side search
  // const filteredProducts = products.filter(p =>
  //   p.name.toLowerCase().includes(search.toLowerCase()) ||
  //   (p.sku || '').toLowerCase().includes(search.toLowerCase())
  // );

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Products</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<Upload />} onClick={() => setImportOpen(true)}>
            Import CSV
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/catalog/products/new')}>
            Add Product
          </Button>
        </Box>
      </Box>

      {lowStockCount > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>{lowStockCount} products</strong> have low stock! Check inventory soon.
        </Alert>
      )}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 3 }}>
        <TextField
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          sx={{ width: { xs: '100%', sm: 350 } }}
        />

        <Box sx={{ ml: { sm: 'auto' }, display: 'flex', gap: 2, alignItems: 'center', justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
          <Typography variant="body2" color="text.secondary">Sort by:</Typography>
          <TextField
            select
            size="small"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            sx={{ width: 180 }}
            SelectProps={{ native: true }}
          >
            <option value="recent">Recently Added</option>
            <option value="name_asc">Name: A-Z</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="stock_asc">Stock: Low to High</option>
          </TextField>
        </Box>
      </Stack>

      <DataGrid
        rows={products}
        columns={columns}
        loading={loading}
        getRowId={(row) => row._id}
        autoHeight
        disableRowSelectionOnClick
        paginationMode="server"
        rowCount={totalProducts}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 25, 50, 100]}
        sx={{ backgroundColor: '#fff', borderRadius: 2 }}
      />

      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>📦 Import Products from CSV</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {importResult && (
            <Alert severity={importResult.success ? 'success' : 'error'} sx={{ mb: 2 }}>
              {importResult.message}
              {importResult.results && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    ✅ Created: {importResult.results.created} |
                    📝 Updated: {importResult.results.updated} |
                    ❌ Failed: {importResult.results.failed}
                  </Typography>
                </Box>
              )}
            </Alert>
          )}
          <Typography variant="body2" sx={{ mb: 2 }}>
            Upload a CSV file with product data. Need a template?{' '}
            <Link component="button" onClick={downloadTemplate}>Download Template</Link>
          </Typography>
          <input type="file" accept=".csv" onChange={handleFileUpload} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportOpen(false)}>Cancel</Button>
          <Button onClick={downloadTemplate} startIcon={<Download />}>
            Download Template
          </Button>
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={!csvContent || importing}
            startIcon={importing ? <CircularProgress size={20} /> : <Upload />}
          >
            {importing ? 'Importing...' : 'Import Products'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>

      {/* Variant Details Dialog */}
      <Dialog open={variantDialogOpen} onClose={() => setVariantDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Variants for: {selectedProduct?.name}</Typography>
            <Button 
              size="small" 
              variant="contained" 
              onClick={() => navigate(`/catalog/products/${selectedProduct?._id}`)}
              startIcon={<Edit />}
            >
              Edit Product
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {!selectedProduct?.variants || selectedProduct.variants.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>No variants found for this product.</Typography>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0' }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Variant Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Color</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">MRP</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Sale Price</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align="right">Stock</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedProduct.variants.map((v: any, idx: number) => (
                    <TableRow key={idx} hover>
                      <TableCell>{v.name || '-'}</TableCell>
                      <TableCell>{v.sku || '-'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {v.color}
                        </Box>
                      </TableCell>
                      <TableCell align="right">₹{v.mrp || selectedProduct.mrp}</TableCell>
                      <TableCell align="right">₹{v.salePrice || selectedProduct.salePrice}</TableCell>
                      <TableCell align="right">{v.stock || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVariantDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;
