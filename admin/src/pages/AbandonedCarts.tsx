import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Chip, Paper, Alert, FormControl, InputLabel, Select, MenuItem, Drawer, IconButton, Divider, Avatar } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { WhatsApp, Refresh, ShoppingCartOutlined, CalendarToday, Close, Person, ShoppingBag } from '@mui/icons-material';
import apiClient from '../services/api.service';

interface AbandonedCart {
  _id: string;
  user: { _id: string; name: string; phone: string; email?: string };
  items: { product: { _id: string; name: string; salePrice: number; mrp?: number; sku?: string; images?: string[] }; quantity: number }[];
  itemCount: number;
  total: number;
  lastModified: string;
  hoursSinceLastModified: number;
}

const AbandonedCartDrawer: React.FC<{
  cart: AbandonedCart | null;
  open: boolean;
  onClose: () => void;
}> = ({ cart, open, onClose }) => {
  if (!cart) return null;

  const customer = cart.user || {} as any;
  const phone = customer.phone || '';

  const handleWhatsApp = () => {
    if (!phone) return;
    const clean = phone.replace(/\D/g, '');
    window.open(`https://wa.me/91${clean}?text=Hi! We noticed you left some items in your cart. Complete your order today!`, '_blank');
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 450 }, display: 'flex', flexDirection: 'column' } }}
    >
      {/* Header */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 2, borderBottom: '1px solid #E2E8F0',
        background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
        flexShrink: 0,
      }}>
        <Box>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>Cart #{cart._id.substring(cart._id.length - 6).toUpperCase()}</Typography>
          <Typography sx={{ color: '#94A3B8', fontSize: 12 }}>Value: ₹{cart.total?.toLocaleString('en-IN')}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" title="WhatsApp Customer" onClick={handleWhatsApp} disabled={!phone}
            sx={{ color: '#94A3B8', '&:hover': { color: '#25D366', bgcolor: 'rgba(37,211,102,0.1)' } }}>
            <WhatsApp fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onClose}
            sx={{ color: '#94A3B8', '&:hover': { color: '#fff' } }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Scrollable content */}
      <Box sx={{ overflowY: 'auto', flex: 1, px: 3, py: 2 }}>
        {/* Customer */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <Person fontSize="small" /> Customer
        </Typography>
        <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 1.5, p: 1.5, mb: 2, border: '1px solid #E2E8F0' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{customer.name || 'Guest User'}</Typography>
          <Typography variant="body2" color="text.secondary">{phone || '—'}</Typography>
          {customer.email && <Typography variant="body2" color="text.secondary">{customer.email}</Typography>}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Items */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ShoppingBag fontSize="small" /> Products ({cart.items?.length || 0})
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          {(cart.items || []).map((item, idx) => {
            const imgSrc = item.product?.images?.[0];
            const name = item.product?.name || 'Unknown Product';
            const price = item.product?.salePrice || 0;
            const mrp = item.product?.mrp || price;
            return (
              <Box key={idx} sx={{ display: 'flex', gap: 1.5, p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                <Avatar src={imgSrc || ''} variant="rounded"
                  sx={{ width: 56, height: 56, bgcolor: '#E2E8F0' }}>
                  <ShoppingBag sx={{ color: '#94A3B8' }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>{name}</Typography>
                  {item.product?.sku && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>SKU: {item.product.sku}</Typography>}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">MRP: ₹{mrp} &nbsp;</Typography>
                      <Typography variant="caption">Qty: {item.quantity}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{(price * item.quantity).toLocaleString()}</Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
        <Button fullWidth variant="contained" sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1ebe57' } }}
          startIcon={<WhatsApp />} onClick={handleWhatsApp} disabled={!phone}>
          Recover via WhatsApp
        </Button>
      </Box>
    </Drawer>
  );
};

const AbandonedCarts: React.FC = () => {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('all');
  const [threshold, setThreshold] = useState('0'); // Default to 0 hours (all carts)
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);

  useEffect(() => {
    fetchCarts();
  }, [timeframe, threshold]);

  const fetchCarts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get<any>(`/admin/carts/abandoned?thresholdHours=${threshold}&timeframe=${timeframe}`);
      setCarts(response.data?.carts || response.carts || []);
    } catch (err: any) {
      setError('Failed to fetch abandoned carts');
      console.error('Fetch abandoned carts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (hours: number): string => {
    if (hours < 1) return 'Less than 1 hour ago';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h ago`;
  };

  const columns: GridColDef[] = [
    {
      field: 'customer',
      headerName: 'Customer',
      flex: 1,
      minWidth: 150,
      renderCell: (params: any) => (
        <Box onClick={() => setSelectedCart(params.row)}
          sx={{
            color: '#2563EB', fontWeight: 600, cursor: 'pointer', fontSize: 13,
            '&:hover': { textDecoration: 'underline' }, display: 'flex', alignItems: 'center', height: '100%'
          }}>
          {params.row.user?.name || 'Guest User'}
        </Box>
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 140,
      valueGetter: (params: any) => params.row.user?.phone || '-',
    },
    {
      field: 'items',
      headerName: 'Items',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (params: any) => params.row.itemCount || params.row.items?.length || 0,
    },
    {
      field: 'cartValue',
      headerName: 'Cart Value',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      valueGetter: (params: any) => params.row.total || 0,
      valueFormatter: (params: any) => `₹${(params.value || 0).toLocaleString('en-IN')}`,
    },
    {
      field: 'abandonedSince',
      headerName: 'Abandoned Since',
      width: 160,
      valueGetter: (params: any) => params.row.hoursSinceLastModified || 0,
      valueFormatter: (params: any) => formatTimeAgo(params.value),
    },
    {
      field: 'lastModified',
      headerName: 'Last Active',
      width: 160,
      valueFormatter: (params: any) => {
        try {
          return new Date(params.value).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          });
        } catch { return '-'; }
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params: any) => {
        const hours = params.row.hoursSinceLastModified || 0;
        const severity = hours > 72 ? 'error' : hours > 48 ? 'warning' : 'info';
        const label = hours > 72 ? 'Critical' : hours > 48 ? 'At Risk' : 'Recent';
        return (
          <Chip
            label={label}
            size="small"
            color={severity}
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params: any) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<WhatsApp />}
            color="success"
            variant="outlined"
            onClick={() => {
              const phone = params.row.user?.phone;
              if (phone) {
                window.open(`https://wa.me/91${phone}?text=Hi! We noticed you left some items in your cart. Complete your order today!`, '_blank');
              }
            }}
          >
            WhatsApp
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            <ShoppingCartOutlined sx={{ mr: 1, verticalAlign: 'middle' }} />
            Abandoned Carts
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Recover lost sales by reaching out to customers who left items in their cart
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="timeframe-label">Timeframe</InputLabel>
            <Select
              labelId="timeframe-label"
              value={timeframe}
              label="Timeframe"
              onChange={(e) => setTimeframe(e.target.value)}
              sx={{ borderRadius: 2, bgcolor: 'background.paper' }}
              startAdornment={<CalendarToday sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="6months">Last 6 Months</MenuItem>
              <MenuItem value="all">All Time</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="threshold-label">Time Idle</InputLabel>
            <Select
              labelId="threshold-label"
              value={threshold}
              label="Time Idle"
              onChange={(e) => setThreshold(e.target.value)}
              sx={{ borderRadius: 2, bgcolor: 'background.paper' }}
            >
              <MenuItem value="0">Show All Carts</MenuItem>
              <MenuItem value="1">1+ Hour</MenuItem>
              <MenuItem value="2">2+ Hours</MenuItem>
              <MenuItem value="24">24+ Hours</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchCarts} disabled={loading}>
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 2, p: 2, display: 'flex', gap: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{carts.length}</Typography>
          <Typography variant="body2" color="text.secondary">Total Abandoned</Typography>
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            ₹{carts.reduce((sum, c) => sum + (c.total || 0), 0).toLocaleString('en-IN')}
          </Typography>
          <Typography variant="body2" color="text.secondary">Lost Revenue</Typography>
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {carts.reduce((sum, c) => sum + (c.itemCount || 0), 0)}
          </Typography>
          <Typography variant="body2" color="text.secondary">Total Items</Typography>
        </Box>
      </Paper>

      <DataGrid
        rows={carts}
        columns={columns}
        loading={loading}
        getRowId={(row) => row._id}
        initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        pageSizeOptions={[25, 50, 100]}
        autoHeight
        disableRowSelectionOnClick
        sx={{ backgroundColor: '#fff', borderRadius: 2 }}
        localeText={{ noRowsLabel: 'No abandoned carts found — great news! 🎉' }}
      />

      <AbandonedCartDrawer 
        cart={selectedCart}
        open={!!selectedCart}
        onClose={() => setSelectedCart(null)}
      />
    </Box>
  );
};

export default AbandonedCarts;
