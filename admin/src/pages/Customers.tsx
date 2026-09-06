import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, TextField, InputAdornment, Chip, Snackbar, Alert } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Search, Add, WhatsApp, Download } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import customerService from '../services/customer.service';

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
    { field: 'phone', headerName: 'Phone', width: 130 },
    { field: 'email', headerName: 'Email', width: 180 },
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => <Chip label={params.value} size="small" color={params.value === 'RETAILER' ? 'primary' : 'default'} sx={{ fontWeight: 600 }} />
    },
    { field: 'totalOrders', headerName: 'Orders', width: 100 },
    {
      field: 'totalSpent',
      headerName: 'Total Spent',
      width: 130,
      valueFormatter: (params) => `₹${params.value?.toFixed(2) || 0}`
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" onClick={() => navigate(`/customers/${params.row._id}`)} sx={{ bgcolor: '#fff' }}>View</Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<WhatsApp />}
            color="success"
            sx={{ boxShadow: 'none' }}
            onClick={() => {
              const phone = (params.row.phone || '').replace(/\D/g, '');
              if (phone) window.open(`https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}`, '_blank');
            }}
          >Chat</Button>
        </Box>
      ),
    },
  ];

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await customerService.getCustomers(1, 50, search) as any;
      const list = response?.data?.customers || response?.customers || (Array.isArray(response?.data) ? response.data : []) || (Array.isArray(response) ? response : []);
      setCustomers(list);
    } catch (error) {
      console.error('Failed to load customers', error);
      setCustomers([]);
    }
    setLoading(false);
  };

  const exportCustomersCSV = () => {
    if (customers.length === 0) {
      setSnackbar({ open: true, message: 'No customers to export', severity: 'error' });
      return;
    }
    const headers = ['Name', 'Phone', 'Email', 'Type', 'Orders', 'Total Spent'];
    const rows = customers.map(c => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      c.phone || '',
      c.email || '',
      c.type || 'CONSUMER',
      c.totalOrders || 0,
      c.totalSpent?.toFixed(2) || '0.00',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setSnackbar({ open: true, message: `Exported ${customers.length} customers to CSV`, severity: 'success' });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>Customers</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Download />} onClick={exportCustomersCSV} sx={{ bgcolor: '#fff', borderColor: '#E2E8F0', color: '#475569' }}>
            Export CSV
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/customers/new')} sx={{ boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.25)' }}>
            Add Customer
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <TextField
          placeholder="Search customers by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: '#94A3B8' }} /></InputAdornment> }}
          sx={{ width: 400, bgcolor: '#fff' }}
        />
      </Box>

      <DataGrid
        rows={customers}
        columns={columns}
        loading={loading}
        getRowId={(row) => row._id}
        initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        pageSizeOptions={[25, 50, 100]}
        disableRowSelectionOnClick
        autoHeight
        sx={{ backgroundColor: '#fff', borderRadius: 2 }}
      />

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Customers;
