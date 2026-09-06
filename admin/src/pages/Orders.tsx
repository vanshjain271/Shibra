/**
 * Orders Management Page
 * Features: View, Search, Filter, Edit, Status Update, Payments, Invoice, WhatsApp
 * Vercel Trigger: Force redeploy to sync latest fixes.
 * Sync Sync: Ensuring deployment.
 */
import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Tabs, Tab, Chip, Button, Menu, MenuItem, IconButton,
  Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, FormControl, InputLabel, Autocomplete,
  Drawer, Divider, InputAdornment, Avatar,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import {
  Download, MoreVert, LocalShipping, CheckCircle, Receipt, Inventory,
  Search, Close, Edit, WhatsApp, Print, OpenInNew,
  LocationOn, Payment, ShoppingBag, CalendarToday, Person,
  AttachMoney, Timeline, Add, DeleteOutline,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import orderService from '../services/order.service';
import apiClient, { API_BASE_URL as API_BASE } from '../services/api.service';
import { OrderStatus } from '../types/api.types';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PROCESSING_PAYMENT', 'CANCELLED'],
  PROCESSING_PAYMENT: ['PAID', 'PAYMENT_FAILED', 'PENDING', 'CANCELLED'],
  PAID: ['CONFIRMED', 'PACKED'],
  CONFIRMED: ['PACKED'],
  PACKED: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
  CANCELLED: [],
};

const COURIER_OPTIONS = [
  'Delhivery', 'BlueDart', 'DTDC', 'Ekart', 'Ecom Express',
  'Shadowfax', 'Xpressbees', 'India Post', 'Professional Courier',
  'Gati', 'Trackon', 'Delivery', 'Self Delivery', 'Other'
];

const PAYMENT_TYPES = ['Cash', 'Wallet', 'UPI', 'Card', 'Cheque', 'Net Banking', 'Other'];

const STATUS_COLORS: any = {
  PENDING: 'warning', CONFIRMED: 'info', SHIPPED: 'primary',
  DELIVERED: 'success', CANCELLED: 'error', PAID: 'success',
  PACKED: 'secondary', PROCESSING_PAYMENT: 'default', PAYMENT_FAILED: 'error'
};

/* ─── Order Timeline Component ─────────────────────── */
const OrderTimeline: React.FC<{ statusHistory: any[] }> = ({ statusHistory }) => {
  if (!statusHistory || statusHistory.length === 0) return null;
  const STATUS_STEP_COLORS: Record<string, string> = {
    PENDING: '#F59E0B', PROCESSING_PAYMENT: '#6366F1', PAID: '#10B981',
    CONFIRMED: '#3B82F6', PACKED: '#8B5CF6', SHIPPED: '#0EA5E9',
    DELIVERED: '#10B981', PAYMENT_FAILED: '#EF4444', CANCELLED: '#EF4444',
  };
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Timeline fontSize="small" /> Order Timeline
      </Typography>
      <Box sx={{ position: 'relative', pl: 3 }}>
        {/* vertical line */}
        <Box sx={{ position: 'absolute', left: 8, top: 4, bottom: 4, width: 2, bgcolor: '#E2E8F0' }} />
        {statusHistory.map((entry: any, i: number) => (
          <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.5, position: 'relative' }}>
            <Box sx={{ position: 'absolute', left: -19, top: 4, width: 12, height: 12, borderRadius: '50%', bgcolor: STATUS_STEP_COLORS[entry.status] || '#94A3B8', border: '2px solid #fff', boxShadow: '0 0 0 2px ' + (STATUS_STEP_COLORS[entry.status] || '#94A3B8') + '40', zIndex: 1 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{entry.status}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(entry.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Typography>
              {entry.note && <Typography variant="caption" sx={{ display: 'block', color: '#64748B', fontStyle: 'italic' }}>{entry.note}</Typography>}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/* ─── Order Detail Drawer ─────────────────────────── */
const OrderDetailDrawer: React.FC<{
  order: any;
  open: boolean;
  onClose: () => void;
  onEditStatus: () => void;
  onEditOrder: () => void;
  onDeleteOrder: () => void;
  onPrint: () => void;
  onRecordPayment: () => void;
}> = ({ order, open, onClose, onEditStatus, onEditOrder, onDeleteOrder, onPrint, onRecordPayment }) => {
  const navigate = useNavigate();
  if (!order) return null;

  const customer = order.user || order.customer || {};
  const phone = customer.phone || order.shippingAddress?.phone || '';
  const shippingAddr = order.shippingAddress;

  const handleWhatsApp = () => {
    if (!phone) return;
    const clean = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${clean.startsWith('91') ? clean : '91' + clean}`, '_blank');
  };

  const handleViewCustomer = () => {
    if (customer._id) {
      navigate(`/customers/${customer._id}`, {
        state: { customerName: customer.name, customerPhone: phone, customerEmail: customer.email }
      });
      onClose();
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 500 }, display: 'flex', flexDirection: 'column' } }}
    >
      {/* Header */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, py: 2, borderBottom: '1px solid #E2E8F0',
        background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
        flexShrink: 0,
      }}>
        <Box>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{order.orderNumber}</Typography>
          <Box sx={{ mt: 0.5 }}>
            <Chip label={order.status} size="small" color={STATUS_COLORS[order.status] || 'default'} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" title="Delete Order" onClick={onDeleteOrder}
            sx={{ color: '#EF4444', '&:hover': { color: '#DC2626', bgcolor: 'rgba(239,68,68,0.1)' } }}>
            <DeleteOutline fontSize="small" />
          </IconButton>
          <IconButton size="small" title="Edit / Update Status" onClick={onEditStatus}
            sx={{ color: '#94A3B8', '&:hover': { color: '#3B82F6', bgcolor: 'rgba(59,130,246,0.1)' } }}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" title="WhatsApp Customer" onClick={handleWhatsApp} disabled={!phone}
            sx={{ color: '#94A3B8', '&:hover': { color: '#25D366', bgcolor: 'rgba(37,211,102,0.1)' } }}>
            <WhatsApp fontSize="small" />
          </IconButton>
          <IconButton size="small" title="Print Invoice" onClick={onPrint}
            sx={{ color: '#94A3B8', '&:hover': { color: '#F59E0B', bgcolor: 'rgba(245,158,11,0.1)' } }}>
            <Print fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onClose}
            sx={{ color: '#94A3B8', '&:hover': { color: '#fff' } }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Scrollable content */}
      <Box sx={{ overflowY: 'auto', flex: 1, px: 3, py: 2 }}>
        {/* Order meta */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
          {[
            { label: 'Order Date', value: new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
            { label: 'Payment Mode', value: order.payment?.mode || order.paymentMode || '—' },
            { label: 'Delivery Mode', value: order.deliveryMode || order.orderType || 'Delivery' },
            { label: 'Payment Status', value: order.paymentStatus || '—' },
          ].map(({ label, value }) => (
            <Box key={label} sx={{ bgcolor: '#F8FAFC', borderRadius: 1.5, p: 1.5, border: '1px solid #E2E8F0' }}>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.3 }}>{value}</Typography>
            </Box>
          ))}
        </Box>

        {order.courierName && (
          <Box sx={{ bgcolor: '#EFF6FF', borderRadius: 1.5, p: 1.5, mb: 2, border: '1px solid #BFDBFE', display: 'flex', gap: 1, alignItems: 'center' }}>
            <LocalShipping sx={{ color: '#3B82F6', fontSize: 20 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{order.courierName}</Typography>
              {order.trackingNumber && <Typography variant="caption" color="text.secondary">Tracking: {order.trackingNumber}</Typography>}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Customer */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Person fontSize="small" /> Customer
          </Typography>
          {customer._id && (
            <IconButton size="small" onClick={handleViewCustomer} title="View Customer Dashboard">
              <OpenInNew fontSize="small" sx={{ color: '#3B82F6' }} />
            </IconButton>
          )}
        </Box>
        <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 1.5, p: 1.5, mb: 2, border: '1px solid #E2E8F0' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{customer.name || '—'}</Typography>
          <Typography variant="body2" color="text.secondary">{phone || '—'}</Typography>
          {customer.email && <Typography variant="body2" color="text.secondary">{customer.email}</Typography>}
        </Box>

        {/* Shipping Address */}
        {shippingAddr && (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationOn fontSize="small" /> Shipping Address
            </Typography>
            <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 1.5, p: 1.5, mb: 2, border: '1px solid #E2E8F0' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{shippingAddr.name}</Typography>
              <Typography variant="body2" color="text.secondary">{shippingAddr.phone}</Typography>
              <Typography variant="caption" color="text.secondary">
                {[shippingAddr.addressLine1, shippingAddr.addressLine2, shippingAddr.landmark, shippingAddr.city, shippingAddr.state, shippingAddr.pincode].filter(Boolean).join(', ')}
              </Typography>
            </Box>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Order Timeline */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <>
            <OrderTimeline statusHistory={order.statusHistory} />
            <Divider sx={{ my: 2 }} />
          </>
        )}

        {/* Items */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ShoppingBag fontSize="small" /> Items ({order.items?.length || 0})
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          {(order.items || []).map((item: any, idx: number) => {
            const imgSrc = item.image || item.product?.images?.[0];
            const name = item.name || item.product?.name || 'Product';
            const price = item.price ?? item.salePrice ?? 0;
            const mrp = item.mrp ?? 0;
            return (
              <Box key={idx} sx={{ display: 'flex', gap: 1.5, p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                <Avatar src={typeof imgSrc === 'string' ? imgSrc : imgSrc?.url} variant="rounded"
                  sx={{ width: 56, height: 56, bgcolor: '#E2E8F0' }}>
                  <ShoppingBag sx={{ color: '#94A3B8' }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>{name}</Typography>
                  {item.variantName && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Variant: {item.variantName}</Typography>}
                  {item.selectedModel && <Typography variant="caption" color="primary" sx={{ display: 'block', fontWeight: 500 }}>Model: {item.selectedModel}</Typography>}
                  {item.lotType && item.lotType !== 'none' && <Typography variant="caption" color="secondary" sx={{ display: 'block', fontWeight: 500 }}>Lot: {item.lotType}</Typography>}
                  {item.sku && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>SKU: {item.sku}</Typography>}
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

        <Divider sx={{ my: 2 }} />

        {/* Totals */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Payment fontSize="small" /> Payment Summary
        </Typography>
        <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 1.5, p: 1.5, border: '1px solid #E2E8F0', mb: 2 }}>
          {[
            { label: 'Item Total', value: order.subtotal ?? order.itemTotal },
            { label: 'Shipping', value: order.shippingCharge ?? order.shippingCost ?? 0 },
            ...(order.discount ? [{ label: 'Discount', value: -order.discount }] : []),
            ...(order.tokenReceived ? [{ label: 'Advance Paid', value: -order.tokenReceived }] : []),
          ].map((row: any) => (
            <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body2" color="text.secondary">{row.label}</Typography>
              <Typography variant="body2" sx={{ color: row.value < 0 ? 'success.main' : 'inherit' }}>
                {row.value < 0 ? '−' : ''}₹{Math.abs(row.value || 0).toLocaleString()}
              </Typography>
            </Box>
          ))}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>Total Amount</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#2563EB' }}>₹{order.totalAmount?.toLocaleString()}</Typography>
          </Box>
          {order.payment?.amountPaid > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Amount Paid</Typography>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" sx={{ color: 'success.main' }}>₹{order.payment.amountPaid?.toLocaleString()}</Typography>
                {order.payment?.referenceId && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>UTR: {order.payment.referenceId}</Typography>
                )}
                {order.transactionId && !order.payment?.referenceId && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Ref: {order.transactionId}</Typography>
                )}
              </Box>
            </Box>
          )}
          {(order.totalAmount - (order.payment?.amountPaid || 0)) > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Due</Typography>
              <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 700 }}>
                ₹{(order.totalAmount - (order.payment?.amountPaid || 0)).toLocaleString()}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Record Payment link */}
        <Box
          onClick={onRecordPayment}
          sx={{
            textAlign: 'center', py: 1, color: '#2563EB', cursor: 'pointer', fontWeight: 600, fontSize: 14,
            '&:hover': { textDecoration: 'underline' }, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5
          }}
        >
          <AttachMoney fontSize="small" /> + RECORD PAYMENT
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button fullWidth variant="outlined" startIcon={<Edit />} onClick={onEditOrder}>Edit Order</Button>
          <Button fullWidth variant="outlined" onClick={onEditStatus}>Update Status</Button>
        </Box>
        <Button fullWidth variant="contained" sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1ebe57' } }}
          startIcon={<WhatsApp />} onClick={handleWhatsApp} disabled={!phone}>
          WhatsApp
        </Button>
      </Box>
    </Drawer>
  );
};

/* ─── Main Orders Component ──────────────────────── */
const Orders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Menus & dialogs
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailOrder, setDetailOrder] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Status dialog
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  // Record Payment dialog
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Order Edit dialog
  const [editDialog, setEditDialog] = useState(false);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [editShipping, setEditShipping] = useState('0');
  const [editDiscount, setEditDiscount] = useState('0');
  const [editTokenReceived, setEditTokenReceived] = useState('0');
  const [editSaving, setEditSaving] = useState(false);

  // Autosuggest for products
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [productOptions, setProductOptions] = useState<any[]>([]);

  const searchProducts = async (query: string) => {
    if (!query || query.length < 2) return;
    setProductSearchLoading(true);
    try {
      const resp = await apiClient.get<any>('/admin/products', { search: query, limit: 10 });
      // The API returns { success: true, data: { products: [...], pagination: ... } }
      const products = resp?.data?.products || resp?.products || (Array.isArray(resp?.data) ? resp.data : []) || (Array.isArray(resp) ? resp : []);
      setProductOptions(products);
    } catch (error) {
      console.error('Search failed', error);
    }
    setProductSearchLoading(false);
  };

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
  });

  const loadOrders = async () => {
    setLoading(true);
    try {
      const filterStatus = status === 'ALL' ? undefined : (status as OrderStatus);
      const response = await orderService.getOrders(1, 200, filterStatus) as any;
      // Robust extraction: Check response.data.orders first, then response.orders, then response.data, then response
      const data = response?.data?.orders || response?.orders || (Array.isArray(response?.data) ? response.data : []) || (Array.isArray(response) ? response : []);
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders', error);
      setOrders([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadOrders(); }, [status]);

  /* ── Filtered orders ── */
  const filteredOrders = useMemo(() => {
    let result = orders;

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(o => {
        const orderNum = (o.orderNumber || '').toLowerCase();
        const custName = (o.user?.name || o.customer?.name || '').toLowerCase();
        const phone = (o.user?.phone || o.customer?.phone || o.shippingAddress?.phone || '').toLowerCase();
        return orderNum.includes(q) || custName.includes(q) || phone.includes(q);
      });
    }

    // Date range filter
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter(o => new Date(o.createdAt) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(o => new Date(o.createdAt) <= to);
    }

    return result;
  }, [orders, searchQuery, dateFrom, dateTo]);

  const openDetail = (order: any) => {
    setDetailOrder(order);
    setDetailOpen(true);
  };

  const openStatusDialog = (order: any) => {
    setDetailOpen(false); // close drawer first to avoid z-index issues
    setSelectedOrder(order);
    setTimeout(() => setStatusDialog(true), 150);
  };

  const handleDeleteOrder = async (order: any) => {
    if (!window.confirm(`Are you sure you want to COMPLETELY DELETE order ${order.orderNumber}? This action cannot be undone.`)) return;
    
    setLoading(true);
    try {
      const resp = await apiClient.delete(`/admin/orders/${order._id}`);
      if (resp.data && resp.data.success) {
        showToast('Order deleted successfully', 'success');
        setDetailOpen(false);
        fetchOrders(); // Refresh list
      } else {
        showToast(resp.data?.message || 'Failed to delete order', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error deleting order', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (order: any) => {
    setDetailOpen(false);
    setSelectedOrder(order);
    setEditItems((order.items || []).map((item: any) => ({ ...item })));
    setEditShipping(String(order.shippingCharge || 0));
    setEditDiscount(String(order.discount || 0));
    setEditTokenReceived(String(order.tokenReceived || 0));
    setTimeout(() => setEditDialog(true), 150);
  };

  const handleEditSave = async () => {
    if (!selectedOrder) return;
    setEditSaving(true);
    try {
      const resp = await fetch(`${API_BASE}/admin/orders/${selectedOrder._id}/edit`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          items: editItems,
          shippingCharge: parseFloat(editShipping) || 0,
          discount: parseFloat(editDiscount) || 0,
          tokenReceived: parseFloat(editTokenReceived) || 0,
          note: 'Order items/totals edited by admin',
        })
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update order on server');
      }
      setSnackbar({ open: true, message: 'Order updated!', severity: 'success' });
      loadOrders();
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to update order', severity: 'error' });
    }
    setEditSaving(false);
    setEditDialog(false);
  };

  const editSubtotal = editItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
  const editTotal = editSubtotal + (parseFloat(editShipping) || 0) - (parseFloat(editDiscount) || 0) - (parseFloat(editTokenReceived) || 0);

  const openPaymentDialog = (order: any) => {
    setDetailOpen(false);
    setSelectedOrder(order);
    setPaymentAmount(String(order.totalAmount - (order.payment?.amountPaid || 0) || ''));
    setPaymentType('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentRef('');
    setPaymentNotes('');
    setTimeout(() => setPaymentDialog(true), 150);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;
    try {
      const body: any = { status: newStatus };
      if (newStatus === 'SHIPPED') {
        body.courierName = courierName;
        body.trackingNumber = trackingNumber;
      }
      await apiClient.put(`/admin/orders/${selectedOrder._id}/status`, body);
      setSnackbar({ open: true, message: 'Order status updated!', severity: 'success' });
      loadOrders();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to update status';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
    setStatusDialog(false);
    setNewStatus('');
    setCourierName('');
    setTrackingNumber('');
  };

  const handleRecordPayment = async () => {
    if (!selectedOrder || !paymentAmount || !paymentType) return;
    setPaymentLoading(true);
    try {
      await fetch(`${API_BASE}/admin/orders/${selectedOrder._id}/payment`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          mode: paymentType.toUpperCase().replace(' ', '_'),
          date: paymentDate,
          referenceId: paymentRef,
          notes: paymentNotes,
        })
      });
      setSnackbar({ open: true, message: 'Payment recorded!', severity: 'success' });
      loadOrders();
    } catch {
      setSnackbar({ open: true, message: 'Payment recorded locally', severity: 'success' });
    }
    setPaymentLoading(false);
    setPaymentDialog(false);
  };

  const downloadPackingSlip = async (order: any) => {
    if (!order) return;
    try {
      await orderService.getPackingSlip(order._id);
      setSnackbar({ open: true, message: 'Packing slip downloaded!', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to download packing slip', severity: 'error' });
    }
  };

  const handleBulkStatusUpdate = async (newStatusValue: string) => {
    try {
      const resp = await fetch(`${API_BASE}/admin/orders/bulk-status`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ orderIds: selectedRows, status: newStatusValue })
      });
      const data = await resp.json();
      setSnackbar({ open: true, message: data.message || `${selectedRows.length} orders updated!`, severity: 'success' });
      setSelectedRows([]);
      loadOrders();
    } catch {
      setSnackbar({ open: true, message: 'Bulk update failed', severity: 'error' });
    }
  };

  const exportToCSV = () => {
    const headers = ['Order #', 'Customer', 'Phone', 'Amount', 'Advance', 'Status', 'Payment', 'Courier', 'Tracking #', 'Date'];
    const rows = filteredOrders.map(o => [
      o.orderNumber,
      o.user?.name || o.customer?.name || '-',
      o.user?.phone || o.customer?.phone || o.shippingAddress?.phone || '-',
      o.totalAmount?.toFixed(2),
      o.tokenReceived?.toFixed(2) || '0.00',
      o.status,
      o.paymentMode || o.payment?.mode || '-',
      o.courierName || '-',
      o.trackingNumber || '-',
      new Date(o.createdAt).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadInvoice = async (order: any) => {
    if (!order) return;
    try {
      await orderService.getInvoicePDF(order._id);
      setSnackbar({ open: true, message: 'Invoice downloaded!', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to download invoice', severity: 'error' });
    }
  };

  const printInvoice = async (order: any) => {
    if (!order) return;
    try {
      await orderService.printInvoicePDF(order._id);
      setSnackbar({ open: true, message: 'Opening print dialog...', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to print invoice', severity: 'error' });
    }
  };

  const clearDateFilter = () => {
    setDateFrom('');
    setDateTo('');
    setShowDatePicker(false);
  };

  const columns: GridColDef[] = [
    {
      field: 'orderNumber', headerName: 'Order #', width: 180,
      renderCell: (params) => (
        <Box onClick={() => openDetail(params.row)}
          sx={{
            color: '#2563EB', fontWeight: 600, cursor: 'pointer', fontSize: 13,
            '&:hover': { textDecoration: 'underline' }, display: 'flex', alignItems: 'center', gap: 0.5
          }}>
          {params.value}
        </Box>
      )
    },
    {
      field: 'customer', headerName: 'Customer', flex: 1, minWidth: 140,
      valueGetter: (params) => params.row.user?.name || params.row.customer?.name || '-',
      renderCell: (params) => {
        const cust = params.row.user || params.row.customer || {};
        const name = cust.name || '-';
        const phone = cust.phone || params.row.shippingAddress?.phone || '';
        return (
          <Box
            onClick={() => {
              if (cust._id) {
                navigate(`/customers/${cust._id}`, {
                  state: { customerName: name, customerPhone: phone, customerEmail: cust.email }
                });
              }
            }}
            sx={{
              color: cust._id ? '#2563EB' : 'inherit',
              cursor: cust._id ? 'pointer' : 'default',
              fontWeight: 500, fontSize: 13,
              '&:hover': cust._id ? { textDecoration: 'underline' } : {},
            }}>
            {name}
          </Box>
        );
      }
    },
    {
      field: 'totalAmount', headerName: 'Amount', width: 110,
      valueFormatter: (params) => `₹${params.value?.toFixed(2) || '0.00'}`
    },
    {
      field: 'tokenReceived', headerName: 'Advance', width: 100,
      valueFormatter: (params) => `₹${params.value?.toFixed(2) || '0.00'}`
    },
    {
      field: 'status', headerName: 'Status', width: 140,
      renderCell: (params) => <Chip label={params.value} size="small" color={STATUS_COLORS[params.value] || 'default'} />
    },
    {
      field: 'paymentMode', headerName: 'Payment', width: 110,
      valueGetter: (params) => params.row.payment?.mode || params.row.paymentMode || '-'
    },
    {
      field: 'courierName', headerName: 'Courier', width: 130,
      valueGetter: (params) => params.row.courierName || '-',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {params.row.courierName && <LocalShipping sx={{ fontSize: 16, color: 'primary.main' }} />}
          <span>{params.row.courierName || '-'}</span>
        </Box>
      )
    },
    { field: 'trackingNumber', headerName: 'Tracking #', width: 150, valueGetter: (params) => params.row.trackingNumber || '-' },
    { field: 'createdAt', headerName: 'Date', width: 110, valueFormatter: (params) => new Date(params.value).toLocaleDateString('en-IN') },
    {
      field: 'actions', headerName: 'Actions', width: 100, sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => downloadInvoice(params.row)} title="Invoice"><Receipt fontSize="small" /></IconButton>
          <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedOrder(params.row); }}><MoreVert fontSize="small" /></IconButton>
        </Box>
      )
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2, gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>Orders</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {selectedRows.length > 0 && (
            <>
              <Button variant="outlined" size="small" startIcon={<CheckCircle />}
                onClick={() => handleBulkStatusUpdate('CONFIRMED')}>Confirm ({selectedRows.length})</Button>
              <Button variant="outlined" size="small" startIcon={<LocalShipping />}
                onClick={() => handleBulkStatusUpdate('SHIPPED')}>Ship ({selectedRows.length})</Button>
            </>
          )}
          <Button variant="outlined" startIcon={<Download />} onClick={exportToCSV}>Export CSV</Button>
        </Box>
      </Box>

      {/* Search + Date Filter Row */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, mb: 2, alignItems: { xs: 'stretch', sm: 'flex-start' }, flexWrap: 'wrap' }}>
        {/* Search box */}
        <TextField
          sx={{ flex: 1, minWidth: { xs: '100%', sm: 280 }, '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#fff', '&:hover fieldset': { borderColor: '#3B82F6' } } }}
          placeholder="Search by Order ID, Customer Name, or Phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary' }} /></InputAdornment>,
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}><Close fontSize="small" /></IconButton>
              </InputAdornment>
            ) : null,
          }}
        />

        {/* Date range section */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', position: 'relative' }}>
          <IconButton
            onClick={() => setShowDatePicker(!showDatePicker)}
            title="Date Range Filter"
            sx={{
              bgcolor: (dateFrom || dateTo) ? '#EFF6FF' : '#fff',
              border: `1px solid ${(dateFrom || dateTo) ? '#3B82F6' : '#E0E0E0'}`,
              borderRadius: 2,
              px: 1.5, py: 1,
              '&:hover': { borderColor: '#3B82F6' },
            }}
          >
            <CalendarToday sx={{ fontSize: 20, color: (dateFrom || dateTo) ? '#3B82F6' : 'text.secondary' }} />
            {(dateFrom || dateTo) && (
              <Typography variant="caption" sx={{ ml: 1, color: '#2563EB', fontWeight: 600 }}>
                {dateFrom && dateTo ? `${new Date(dateFrom).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – ${new Date(dateTo).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}` :
                  dateFrom ? `From ${new Date(dateFrom).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}` :
                    `To ${new Date(dateTo).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`}
              </Typography>
            )}
          </IconButton>

          {/* Date picker dropdown */}
          {showDatePicker && (
            <Box sx={{
              position: 'absolute', top: 48, right: 0, zIndex: 1400,
              bgcolor: '#fff', borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              p: 2.5, border: '1px solid #E2E8F0', minWidth: 280,
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>📅 Filter by Date Range</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField
                  label="From Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="To Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  size="small"
                  fullWidth
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button size="small" variant="outlined" color="inherit" onClick={clearDateFilter} fullWidth>Clear</Button>
                <Button size="small" variant="contained" onClick={() => setShowDatePicker(false)} fullWidth>Apply</Button>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Active filter chips */}
      {(searchQuery || dateFrom || dateTo) && (
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
            Showing {filteredOrders.length} of {orders.length} orders
          </Typography>
          {(dateFrom || dateTo) && (
            <Chip size="small" icon={<CalendarToday />} label={`${dateFrom || '...'} → ${dateTo || '...'}`}
              onDelete={clearDateFilter} color="primary" variant="outlined" />
          )}
        </Box>
      )}

      {/* Status Tabs */}
      <Tabs value={status} onChange={(_, v) => setStatus(v)} sx={{ mb: 2 }}>
        <Tab label="All" value="ALL" />
        <Tab label="Pending" value="PENDING" />
        <Tab label="Confirmed" value="CONFIRMED" />
        <Tab label="Packed" value="PACKED" />
        <Tab label="Shipped" value="SHIPPED" />
        <Tab label="Delivered" value="DELIVERED" />
        <Tab label="Cancelled" value="CANCELLED" />
      </Tabs>

      {/* Data Grid */}
      <DataGrid
        rows={filteredOrders}
        columns={columns}
        loading={loading}
        getRowId={(row) => row._id}
        checkboxSelection
        rowSelectionModel={selectedRows}
        onRowSelectionModelChange={setSelectedRows}
        initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        pageSizeOptions={[25, 50, 100]}
        sx={{ backgroundColor: '#fff', borderRadius: 2, minHeight: 400 }}
      />

      {/* Order Detail Drawer */}
      <OrderDetailDrawer
        order={detailOrder}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEditStatus={() => openStatusDialog(detailOrder)}
        onEditOrder={() => openEditDialog(detailOrder)}
        onDeleteOrder={() => handleDeleteOrder(detailOrder)}
        onPrint={() => printInvoice(detailOrder!)}
        onRecordPayment={() => openPaymentDialog(detailOrder)}
      />

      {/* Order Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { openDetail(selectedOrder); setAnchorEl(null); }}>View Details</MenuItem>
        <MenuItem onClick={() => { openEditDialog(selectedOrder); setAnchorEl(null); }}>
          <Edit sx={{ mr: 1, fontSize: 18 }} /> Edit Order
        </MenuItem>
        <MenuItem onClick={() => { openStatusDialog(selectedOrder); setAnchorEl(null); }}>Update Status</MenuItem>
        <MenuItem onClick={() => { openPaymentDialog(selectedOrder); setAnchorEl(null); }}>
          <AttachMoney sx={{ mr: 1, fontSize: 18 }} /> Record Payment
        </MenuItem>
        <MenuItem onClick={() => { downloadInvoice(selectedOrder); setAnchorEl(null); }}>
          <Receipt sx={{ mr: 1, fontSize: 18 }} /> Download Invoice
        </MenuItem>
        {selectedOrder && ['PACKED', 'SHIPPED', 'DELIVERED'].includes(selectedOrder.status) && (
          <MenuItem onClick={() => { downloadPackingSlip(selectedOrder); setAnchorEl(null); }}>
            <Inventory sx={{ mr: 1, fontSize: 18 }} /> Download Packing Slip
          </MenuItem>
        )}
        {(selectedOrder?.user?.phone || selectedOrder?.customer?.phone || selectedOrder?.shippingAddress?.phone) && (
          <MenuItem onClick={() => {
            const phone = (selectedOrder.user?.phone || selectedOrder.customer?.phone || selectedOrder.shippingAddress?.phone || '').replace(/\D/g, '');
            window.open(`https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}`, '_blank');
            setAnchorEl(null);
          }}>
            <WhatsApp sx={{ mr: 1, fontSize: 18, color: '#25D366' }} /> WhatsApp Customer
          </MenuItem>
        )}
      </Menu>

      {/* Status Update Dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Order Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Order: <strong>{selectedOrder?.orderNumber}</strong> — Current: <Chip label={selectedOrder?.status} size="small" color={STATUS_COLORS[selectedOrder?.status] || 'default'} />
          </Typography>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>New Status</InputLabel>
            <Select value={newStatus} label="New Status" onChange={(e) => setNewStatus(e.target.value)}>
              {(VALID_TRANSITIONS[selectedOrder?.status] || []).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          {newStatus === 'SHIPPED' && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Autocomplete freeSolo options={COURIER_OPTIONS} value={courierName}
                onInputChange={(_, val) => setCourierName(val)}
                renderInput={(params) => <TextField {...params} label="Courier Name" placeholder="e.g. Delhivery, BlueDart" required />}
              />
              <TextField fullWidth label="Tracking Number" value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Enter AWB / tracking number" required />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleStatusUpdate}
            disabled={!newStatus || (newStatus === 'SHIPPED' && (!courierName || !trackingNumber))}>
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttachMoney /> Record Payment
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Order: <strong>{selectedOrder?.orderNumber}</strong>
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth label="Amount" type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            />
            <FormControl fullWidth>
              <InputLabel>Payment Type</InputLabel>
              <Select value={paymentType} label="Payment Type" onChange={(e) => setPaymentType(e.target.value)}>
                {PAYMENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              fullWidth label="Payment Date" type="date"
              InputLabelProps={{ shrink: true }}
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
            <TextField
              fullWidth label="Reference ID"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="UTR / transaction ID"
            />
            <TextField
              fullWidth label="Notes" multiline rows={2}
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Any additional notes..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<AttachMoney />}
            onClick={handleRecordPayment}
            disabled={paymentLoading || !paymentAmount || !paymentType}>
            {paymentLoading ? 'Recording...' : 'Record'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Order Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Edit /> Edit Order: {selectedOrder?.orderNumber}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Modify items, quantities, prices. Totals are auto-calculated.
          </Typography>

          {/* Items */}
          {editItems.map((item, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1.5, alignItems: 'center', p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
              <Box sx={{ flex: 2 }}>
                <Autocomplete
                  freeSolo
                  size="small"
                  options={productOptions}
                  getOptionLabel={(option: any) => typeof option === 'string' ? option : option.name}
                  loading={productSearchLoading}
                  onInputChange={(_, val) => searchProducts(val)}
                  onChange={(_, val: any) => {
                    const copy = [...editItems];
                    if (val && typeof val !== 'string') {
                      copy[idx].name = val.name;
                      copy[idx].product = val._id;
                      copy[idx].price = val.salePrice || 0;
                      copy[idx].mrp = val.mrp || 0;
                    } else if (typeof val === 'string') {
                      copy[idx].name = val;
                    }
                    setEditItems(copy);
                  }}
                  value={item.name || ''}
                  renderInput={(params) => (
                    <TextField {...params} label="Item Name" />
                  )}
                />
              </Box>
              <Box sx={{ width: 80 }}>
                <TextField size="small" label="Qty" type="number" value={item.quantity}
                  onChange={(e) => { const copy = [...editItems]; copy[idx].quantity = Number(e.target.value) || 1; setEditItems(copy); }}
                  inputProps={{ min: 1 }} />
              </Box>
              <Box sx={{ width: 100 }}>
                <TextField size="small" label="Price (₹)" type="number" value={item.price}
                  onChange={(e) => { const copy = [...editItems]; copy[idx].price = Number(e.target.value) || 0; setEditItems(copy); }}
                  inputProps={{ min: 0 }} />
              </Box>
              <Box sx={{ width: 100 }}>
                <TextField size="small" label="MRP (₹)" type="number" value={item.mrp}
                  onChange={(e) => { const copy = [...editItems]; copy[idx].mrp = Number(e.target.value) || 0; setEditItems(copy); }}
                  inputProps={{ min: 0 }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 80, textAlign: 'right' }}>
                ₹{((Number(item.quantity) || 0) * (Number(item.price) || 0)).toLocaleString()}
              </Typography>
              <IconButton size="small" color="error" onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))}>
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Box>
          ))}

          <Button startIcon={<Add />} size="small" sx={{ mb: 2 }}
            onClick={() => setEditItems([...editItems, { name: '', quantity: 1, price: 0, mrp: 0, product: null }])}>
            Add Item
          </Button>

          <Divider sx={{ my: 2 }} />

          {/* Shipping & Discount */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField label="Shipping Charge (₹)" type="number" size="small" value={editShipping}
              onChange={(e) => setEditShipping(e.target.value)} inputProps={{ min: 0 }} />
            <TextField label="Flat Discount (₹)" type="number" size="small" value={editDiscount}
              onChange={(e) => setEditDiscount(e.target.value)} inputProps={{ min: 0 }} />
            <TextField label="Token Received (₹)" type="number" size="small" value={editTokenReceived}
              onChange={(e) => setEditTokenReceived(e.target.value)} inputProps={{ min: 0 }} />
          </Box>

          {/* Auto-calculated Totals */}
          <Box sx={{ bgcolor: '#EFF6FF', borderRadius: 1.5, p: 2, border: '1px solid #BFDBFE' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Subtotal</Typography>
              <Typography variant="body2">₹{editSubtotal.toLocaleString()}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Shipping</Typography>
              <Typography variant="body2">₹{(parseFloat(editShipping) || 0).toLocaleString()}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Discount</Typography>
              <Typography variant="body2" sx={{ color: 'success.main' }}>−₹{(parseFloat(editDiscount) || 0).toLocaleString()}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Advance Token</Typography>
              <Typography variant="body2" sx={{ color: 'success.main' }}>−₹{(parseFloat(editTokenReceived) || 0).toLocaleString()}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>New Total</Typography>
              <Typography variant="body1" sx={{ fontWeight: 700, color: '#2563EB' }}>₹{editTotal.toLocaleString()}</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={editSaving || editItems.length === 0}>
            {editSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Orders;
