import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip, IconButton,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel,
  Snackbar, Alert
} from '@mui/material';
import { Add, Edit, Delete, ContentCopy } from '@mui/icons-material';
import apiClient from '../services/api.service';

const emptyForm = {
  code: '',
  type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
  value: '',
  description: '',
  minOrderAmount: '',
  maxDiscountAmount: '',
  usageLimit: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
  isActive: true,
};

const Coupons: React.FC = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<any>('/admin/coupons');
      setCoupons(response.data?.coupons || response.coupons || []);
    } catch (err: any) {
      console.error('Failed to fetch coupons', err);
    } finally {
      setLoading(false);
    }
  };

  const getCouponStatus = (coupon: any) => {
    if (!coupon.isActive) return 'INACTIVE';
    const now = new Date();
    if (coupon.endDate && new Date(coupon.endDate) < now) return 'EXPIRED';
    if (coupon.startDate && new Date(coupon.startDate) > now) return 'SCHEDULED';
    return 'ACTIVE';
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (coupon: any) => {
    setEditing(coupon);
    setForm({
      code: coupon.code || '',
      type: coupon.type || 'PERCENTAGE',
      value: coupon.value?.toString() || '',
      description: coupon.description || '',
      minOrderAmount: coupon.minOrderAmount?.toString() || '',
      maxDiscountAmount: coupon.maxDiscountAmount?.toString() || '',
      usageLimit: coupon.usageLimit?.toString() || '',
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
      isActive: coupon.isActive !== false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.value) return;
    setSaving(true);
    try {
      const payload: any = {
        code: form.code.toUpperCase(),
        type: form.type,
        value: Number(form.value),
        description: form.description,
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        startDate: form.startDate,
        endDate: form.endDate,
        isActive: form.isActive,
      };

      if (editing) {
        await apiClient.put(`/admin/coupons/${editing._id}`, payload);
        setSnackbar({ open: true, message: 'Coupon updated!', severity: 'success' });
      } else {
        await apiClient.post('/admin/coupons', payload);
        setSnackbar({ open: true, message: 'Coupon created!', severity: 'success' });
      }
      setDialogOpen(false);
      fetchCoupons();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save coupon';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await apiClient.delete(`/admin/coupons/${id}`);
      setCoupons(coupons.filter(c => c._id !== id));
      setSnackbar({ open: true, message: 'Coupon deleted', severity: 'success' });
    } catch (err: any) {
      console.error('Failed to delete coupon', err);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setSnackbar({ open: true, message: `Copied: ${code}`, severity: 'success' });
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Coupons</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Create Coupon</Button>
      </Box>

      <Grid container spacing={3}>
        {coupons.length === 0 ? (
          <Grid item xs={12}>
            <Typography color="text.secondary">No coupons found. Create your first coupon.</Typography>
          </Grid>
        ) : (
          coupons.map((coupon) => {
            const status = getCouponStatus(coupon);
            const statusColor = status === 'ACTIVE' ? 'success' : status === 'EXPIRED' ? 'error' : status === 'SCHEDULED' ? 'info' : 'default';
            return (
              <Grid item xs={12} md={6} lg={4} key={coupon._id}>
                <Card sx={{ opacity: status === 'INACTIVE' || status === 'EXPIRED' ? 0.6 : 1 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                          {coupon.code}
                        </Typography>
                        <IconButton size="small" onClick={() => copyCode(coupon.code)}><ContentCopy fontSize="small" /></IconButton>
                      </Box>
                      <Chip label={status} size="small" color={statusColor as any} />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {coupon.type === 'PERCENTAGE' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                      {coupon.maxDiscountAmount ? ` (max ₹${coupon.maxDiscountAmount})` : ''}
                    </Typography>

                    {coupon.minOrderAmount > 0 && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        Min order: ₹{coupon.minOrderAmount}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Used: {coupon.usageCount || 0}/{coupon.usageLimit || '∞'}
                      </Typography>
                      <Box>
                        <IconButton size="small" onClick={() => openEdit(coupon)}><Edit /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(coupon._id)}><Delete /></IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth label="Coupon Code" value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            sx={{ mt: 1 }} required placeholder="e.g. SUMMER20"
            inputProps={{ style: { textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: 2 } }}
          />
          <TextField
            fullWidth label="Description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            sx={{ mt: 2 }} placeholder="Summer sale - 20% off everything"
          />

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Type</InputLabel>
              <Select value={form.type} label="Type" onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                <MenuItem value="PERCENTAGE">Percentage (%)</MenuItem>
                <MenuItem value="FIXED">Fixed Amount (₹)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth label={form.type === 'PERCENTAGE' ? 'Discount (%)' : 'Discount (₹)'}
              type="number" value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              required
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              fullWidth label="Min Order (₹)" type="number" value={form.minOrderAmount}
              onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
              placeholder="0"
            />
            {form.type === 'PERCENTAGE' && (
              <TextField
                fullWidth label="Max Discount (₹)" type="number" value={form.maxDiscountAmount}
                onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                placeholder="No limit"
              />
            )}
          </Box>

          <TextField
            fullWidth label="Usage Limit" type="number" value={form.usageLimit}
            onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
            sx={{ mt: 2 }} placeholder="Leave empty for unlimited"
          />

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              fullWidth label="Start Date" type="date" value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }} required
            />
            <TextField
              fullWidth label="End Date" type="date" value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }} required
            />
          </Box>

          <FormControlLabel
            control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />}
            label="Active" sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.code.trim() || !form.value}>
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

export default Coupons;
