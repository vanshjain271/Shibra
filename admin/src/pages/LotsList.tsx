import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, TextField, InputAdornment,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Link, Stack, Snackbar, IconButton, Tooltip
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Search, Add, Warning, Edit } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import productService from '../services/product.service';

const LotsList: React.FC = () => {
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
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

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
      headerName: 'Lot Name',
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
    { 
      field: 'fullLotPrice', 
      headerName: 'Full Lot Price', 
      width: 130, 
      renderCell: (params) => `₹${params.row.lotDetails?.fullLotPrice || 0}` 
    },
    { 
      field: 'halfLotPrice', 
      headerName: 'Half Lot Price', 
      width: 130, 
      renderCell: (params) => params.row.lotDetails?.allowHalfLot ? `₹${params.row.lotDetails?.halfLotPrice || 0}` : 'Not Allowed' 
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
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button size="small" onClick={() => navigate(`/catalog/lots/${params.row._id}`)}>Edit</Button>
        </Box>
      )
    }
  ];

  useEffect(() => {
    loadProducts();
  }, [paginationModel, search, sort]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { page, pageSize } = paginationModel;
      const data = await productService.getProducts(page + 1, pageSize, search, sort, true); // isLot = true
      const rows = (data.data?.products || data.products || []).map((p: any) => ({ ...p, id: p._id }));
      setProducts(rows);
      setTotalProducts(data.data?.pagination?.total || data.pagination?.total || rows.length);
    } catch (error) {
      console.error('Failed to load lots:', error);
    }
    setLoading(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Product Lots</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/catalog/lots/new')}>
            Add Product Lot
          </Button>
        </Box>
      </Box>

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <TextField
          placeholder="Search lots..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          sx={{ width: 350 }}
        />

        <Box sx={{ ml: 'auto', display: 'flex', gap: 2, alignItems: 'center' }}>
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

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default LotsList;
