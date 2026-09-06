import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Button, TextField, MenuItem,
  Checkbox, FormControlLabel, Breadcrumbs, Link, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  Avatar, Divider, IconButton, Snackbar, Alert, CircularProgress,
} from '@mui/material';
import {
  WhatsApp, Edit, Delete, ShoppingBag, History, Phone,
  LocationOn, Receipt, ShoppingCart, Assessment, Close, Assignment, Save,
} from '@mui/icons-material';
import customerService from '../services/customer.service';

import { API_BASE_URL as API_BASE } from '../services/api.service';

const CustomerDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const navState: any = location.state || {};

  const [customer, setCustomer] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState(0);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [historyStats, setHistoryStats] = useState<any>({ totalOrders: 0, totalSpent: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
  });

  useEffect(() => {
    if (id && id !== 'new') {
      loadCustomer();
      loadOrderHistory();
    } else {
      setEditing(true);
      setCustomer({
        name: navState.customerName || '',
        phone: navState.customerPhone || '',
        email: navState.customerEmail || '',
        type: 'CONSUMER', hasGSTNo: false, gstNo: '', isAffiliate: false, blockCOD: false,
      });
    }
  }, [id]);

  const loadCustomer = async () => {
    try {
      const response: any = await customerService.getCustomerById(id!);
      // API returns { success, data: { customer: {...} } }
      const customerData = response?.data?.customer || response?.customer || (response?.name ? response : null);
      if (customerData && customerData.name !== undefined) {
        setCustomer(customerData);
      } else {
        // API returned empty / not found – use navigation state if available
        setCustomer({
          _id: id,
          name: navState.customerName || 'Unknown Customer',
          phone: navState.customerPhone || '',
          email: navState.customerEmail || '',
          type: 'CONSUMER', hasGSTNo: false, gstNo: '', isAffiliate: false, blockCOD: false,
        });
      }
    } catch {
      // Fallback with navigation state so page doesn't show empty
      setCustomer({
        _id: id,
        name: navState.customerName || 'Customer',
        phone: navState.customerPhone || '',
        email: navState.customerEmail || '',
        type: 'CONSUMER', hasGSTNo: false, gstNo: '', isAffiliate: false, blockCOD: false,
      });
    }
  };

  const loadOrderHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/reports/customer/${id}/history`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (data.success) {
        setOrderHistory(data.data.orders || []);
        setHistoryStats({ totalOrders: data.data.totalOrders || 0, totalSpent: data.data.totalSpent || 0 });
      }
    } catch {
      // Stats stay at 0
    }
  };

  const handleSave = async () => {
    if (!customer.name?.trim()) {
      setSnackbar({ open: true, message: 'Customer name is required', severity: 'error' });
      return;
    }
    setSaving(true);
    try {
      if (id === 'new') {
        await customerService.createCustomer(customer);
        setSnackbar({ open: true, message: 'Customer created successfully!', severity: 'success' });
        navigate('/customers');
      } else {
        const response: any = await customerService.updateCustomer(id!, customer);
        // Unpack updated customer from response and refresh state
        const updated = response?.data?.customer || response?.customer || null;
        if (updated) {
          setCustomer(updated);
        } else {
          // Reload from server to get fresh data shown everywhere
          await loadCustomer();
        }
        setSnackbar({ open: true, message: 'Customer details updated successfully!', severity: 'success' });
        setEditing(false);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to save customer. Please try again.';
      console.error('Failed to save customer', error);
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await customerService.deleteCustomer(id!);
      navigate('/customers');
    } catch (error) {
      console.error('Failed to delete customer', error);
    }
  };

  const handleWhatsApp = () => {
    const phone = (customer?.phone || '').replace(/\D/g, '');
    if (phone) window.open(`https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'success';
      case 'PENDING': case 'CONFIRMED': return 'warning';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  if (!customer) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <Typography color="text.secondary">Loading customer...</Typography>
      </Box>
    );
  }

  const isNew = id === 'new';

  // ─── Dashboard View (not editing, existing customer) ───
  if (!editing && !isNew) {
    return (
      <Box>
        {/* Breadcrumb */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link underline="hover" color="primary" onClick={() => navigate('/customers')} sx={{ cursor: 'pointer' }}>
            Customers
          </Link>
          <Typography color="text.primary">{customer.name || 'Customer'}</Typography>
        </Breadcrumbs>

        {/* Customer Header Card */}
        <Card sx={{ borderRadius: 3, mb: 3, overflow: 'visible' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Avatar sx={{
                  width: 64, height: 64, fontSize: 24, fontWeight: 700,
                  background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                }}>
                  {(customer.name || '?')[0].toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{customer.name || 'Customer'}</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
                    {customer.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Phone sx={{ fontSize: 16, color: '#64748B' }} />
                        <Typography variant="body2" color="text.secondary">{customer.phone}</Typography>
                      </Box>
                    )}
                    {customer.phone && (
                      <Box
                        onClick={handleWhatsApp}
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', color: '#25D366', '&:hover': { textDecoration: 'underline' } }}
                      >
                        <WhatsApp sx={{ fontSize: 16 }} />
                        <Typography variant="body2" sx={{ color: '#25D366', fontWeight: 600 }}>WhatsApp</Typography>
                      </Box>
                    )}
                    {customer.email && (
                      <Typography variant="body2" color="text.secondary">{customer.email}</Typography>
                    )}
                  </Box>
                  {customer.type && (
                    <Chip size="small" label={customer.type} sx={{ mt: 0.5 }} />
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton onClick={() => setEditing(true)} title="Edit" sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
                  <Edit sx={{ color: '#3B82F6' }} />
                </IconButton>
                <IconButton onClick={() => setDeleteConfirm(true)} title="Delete" sx={{ border: '1px solid #FEE2E2', borderRadius: 2, color: '#EF4444' }}>
                  <Delete />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Stats grid — Shoopy style */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            {
              icon: <Assessment sx={{ color: '#EF4444', fontSize: 28 }} />,
              iconBg: '#FEF2F2',
              label: 'Total Sales',
              value: `₹${(historyStats.totalSpent || 0).toLocaleString()}`,
              valueColor: '#EF4444',
            },
            {
              icon: <ShoppingCart sx={{ color: '#F59E0B', fontSize: 28 }} />,
              iconBg: '#FFFBEB',
              label: 'Orders',
              value: historyStats.totalOrders || 0,
              valueColor: 'inherit',
            },
            {
              icon: <Receipt sx={{ color: '#6366F1', fontSize: 28 }} />,
              iconBg: '#EEF2FF',
              label: 'Invoices',
              value: 0,
              valueColor: 'inherit',
            },
            {
              icon: <ShoppingBag sx={{ color: '#EF4444', fontSize: 28 }} />,
              iconBg: '#FEF2F2',
              label: 'Purchases',
              value: 0,
              valueColor: 'inherit',
            },
            {
              icon: <Assessment sx={{ color: '#F59E0B', fontSize: 28 }} />,
              iconBg: '#FFFBEB',
              label: 'Estimates',
              value: 0,
              valueColor: 'inherit',
            },
          ].map((stat, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{ borderRadius: 2, border: '1px solid #F1F5F9', '&:hover': { boxShadow: 3, borderColor: '#E2E8F0' }, cursor: 'pointer', transition: '0.2s' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: '16px !important' }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: stat.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {stat.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: stat.valueColor, lineHeight: 1.2 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Tabs */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: '1px solid #E2E8F0' }}>
          <Tab label="Details" icon={<Assignment />} iconPosition="start" />
          <Tab label="Order History" icon={<History />} iconPosition="start" />
        </Tabs>

        {/* Details tab */}
        {tab === 0 && (
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              {/* Billing / Shipping addresses */}
              {customer.addresses?.length > 0 ? (
                customer.addresses.map((addr: any, i: number) => (
                  <Box key={i} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOn fontSize="small" /> {addr.type || 'Address'}
                    </Typography>
                    <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 1.5, p: 1.5, border: '1px solid #E2E8F0' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{addr.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{addr.phone}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {[addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary" variant="body2">No addresses saved for this customer.</Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{customer.type || '—'}</Typography>
                </Grid>
                {customer.hasGSTNo && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" color="text.secondary">GST No</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{customer.gstNo || 'Yes'}</Typography>
                  </Grid>
                )}
                <Grid item xs={12} md={4}>
                  <Typography variant="caption" color="text.secondary">COD Status</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: customer.blockCOD ? '#EF4444' : '#10B981' }}>
                    {customer.blockCOD ? 'Blocked' : 'Allowed'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Order History tab */}
        {tab === 1 && (
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ShoppingBag sx={{ mr: 1 }} /> Purchase History
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {historyStats.totalOrders} orders • ₹{historyStats.totalSpent?.toLocaleString()} total
                </Typography>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                      <TableCell>Order #</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Items</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Payment</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderHistory.length > 0 ? orderHistory.map((order, idx) => (
                      <TableRow key={idx} hover onClick={() => navigate('/orders/online')} sx={{ cursor: 'pointer' }}>
                        <TableCell sx={{ fontWeight: 600, color: '#2563EB' }}>{order.orderNumber}</TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell>{order.items?.length || 0} items</TableCell>
                        <TableCell align="right">₹{order.total?.toLocaleString() || order.totalAmount?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip size="small" label={order.status} color={getStatusColor(order.status) as any} />
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={order.paymentStatus || '—'} variant="outlined"
                            color={order.paymentStatus === 'PAID' ? 'success' : 'default'} />
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Box sx={{ py: 4 }}>
                            <ShoppingBag sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                            <Typography color="text.secondary">No orders yet</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Delete confirmation dialog */}
        {deleteConfirm && (
          <Box sx={{
            position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.4)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Card sx={{ borderRadius: 3, p: 3, maxWidth: 360, width: '90%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Delete Customer?</Typography>
                <IconButton size="small" onClick={() => setDeleteConfirm(false)}><Close /></IconButton>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Are you sure you want to delete <strong>{customer.name}</strong>? This action cannot be undone.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button fullWidth variant="outlined" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
                <Button fullWidth variant="contained" color="error" onClick={handleDelete}>Delete</Button>
              </Box>
            </Card>
          </Box>
        )}
      </Box>
    );
  }

  // ─── Edit / New Customer Form ───
  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        {!isNew && <Link underline="hover" color="primary" onClick={() => setEditing(false)} sx={{ cursor: 'pointer' }}>
          {customer.name || 'Customer'}
        </Link>}
        {isNew && <Link underline="hover" color="primary" onClick={() => navigate('/customers')} sx={{ cursor: 'pointer' }}>
          Customers
        </Link>}
        <Typography color="text.primary">{isNew ? 'New Customer' : 'Edit'}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>{isNew ? 'New Customer' : `Edit: ${customer.name}`}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={() => isNew ? navigate('/customers') : setEditing(false)} disabled={saving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Box>
      </Box>

      <Card sx={{ borderRadius: 2 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Name" value={customer.name || ''}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Phone Number" value={customer.phone || ''}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Email" value={customer.email || ''}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select label="Type" value={customer.type || 'CONSUMER'}
                onChange={(e) => setCustomer({ ...customer, type: e.target.value })}>
                <MenuItem value="CONSUMER">Consumer</MenuItem>
                <MenuItem value="RETAILER">Retailer</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox checked={!!customer.hasGSTNo} onChange={(e) => setCustomer({ ...customer, hasGSTNo: e.target.checked })} />}
                label="Customer has GST No. (Optional)"
              />
              {customer.hasGSTNo && (
                <TextField
                  fullWidth
                  label="GST Number"
                  value={customer.gstNo || ''}
                  onChange={(e) => setCustomer({ ...customer, gstNo: e.target.value })}
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  sx={{ mt: 1.5 }}
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              )}
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox checked={!!customer.isAffiliate} onChange={(e) => setCustomer({ ...customer, isAffiliate: e.target.checked })} />}
                label="Affiliate Customer (Optional)"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox checked={!!customer.blockCOD} onChange={(e) => setCustomer({ ...customer, blockCOD: e.target.checked })} />}
                label="Block Cash on Delivery for this Customer"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomerDetails;
