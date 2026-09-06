import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, InputAdornment,
  Menu, MenuItem, IconButton,
  Stack, Paper, Divider, Avatar, Dialog,
  DialogContent, DialogActions, Snackbar, Alert,
  Grid, CircularProgress, Table, TableBody, TableCell,
  TableHead, TableRow, TableContainer, Tabs, Tab,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Search, Download, MoreVert, Visibility,
  WhatsApp, Close, Settings,
} from '@mui/icons-material';
import apiClient from '../services/api.service';
import orderService from '../services/order.service';
import dayjs from 'dayjs';

/* ─── Types ──────────────────────────────────────────────────── */
type PayStatus = 'PAID' | 'UNPAID' | 'PART_PAID';

interface InvoiceRow {
  id: string;
  orderId: string;
  invoiceNumber: string;
  orderNumber: string;
  invoiceDate: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  tokenReceived: number;
  discount: number;
  shipping: number;
  balance: number;
  payStatus: PayStatus;
  orderStatus: string;
  items: any[];
  billingAddress: any;
  user: any;
  payment: any;
}

/* ─── Status chip ─────────────────────────────────────────────── */
const PayChip = ({ status }: { status: PayStatus }) => {
  const cfg: Record<PayStatus, { label: string; color: string; bg: string }> = {
    PAID:      { label: 'Paid',      color: '#059669', bg: '#D1FAE5' },
    UNPAID:    { label: 'Unpaid',    color: '#DC2626', bg: '#FEE2E2' },
    PART_PAID: { label: 'Part Paid', color: '#D97706', bg: '#FEF3C7' },
  };
  const c = cfg[status] || cfg.UNPAID;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5,
      bgcolor: c.bg, color: c.color, px: 1.5, py: 0.4, borderRadius: 10,
      fontSize: 12, fontWeight: 700 }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c.color }} />
      {c.label}
    </Box>
  );
};

/* ─── Detail Modal ────────────────────────────────────────────── */
const InvoiceModal = ({
  invoice, open, onClose, downloading, onDownload,
}: {
  invoice: InvoiceRow | null; open: boolean; onClose: () => void;
  downloading: boolean; onDownload: (inv: InvoiceRow) => void;
}) => {
  if (!invoice) return null;
  const fmtCurr = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const addr = invoice.billingAddress || {};

  const summaryRows = [
    { label: 'Sub Total',       val: fmtCurr(invoice.amount) },
    ...(invoice.shipping > 0 ? [{ label: 'Delivery Charge', val: `+ ${fmtCurr(invoice.shipping)}`, color: DARK }] : []),
    ...(invoice.discount > 0 ? [{ label: 'Discount',        val: `- ${fmtCurr(invoice.discount)}`, color: '#059669' }] : []),
    ...(invoice.tokenReceived > 0 ? [{ label: 'Advance (Token)', val: `- ${fmtCurr(invoice.tokenReceived)}`, color: '#059669' }] : []),
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', maxHeight: '92vh' } }}>

      {/* Header */}
      <Box sx={{ bgcolor: '#6D28D9', px: 4, py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 20, letterSpacing: 1 }}>INVOICE</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{invoice.invoiceNumber}</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Arbuda Wholesale Mobile Accessories</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Arbuda accessories | Ahmedabad</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#fff', ml: 2 }}><Close /></IconButton>
      </Box>

      <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC', overflowY: 'auto' }}>

        {/* Meta cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Invoice Date',  val: dayjs(invoice.invoiceDate).format('DD MMM YYYY'), border: '#6D28D9' },
            { label: 'Order Number',  val: invoice.orderNumber,                              border: '#3B82F6' },
            { label: 'Order Status',  val: invoice.orderStatus,                              border: '#10B981' },
          ].map(c => (
            <Grid item xs={12} sm={4} key={c.label}>
              <Paper sx={{ p: 2, borderRadius: 2, borderLeft: `4px solid ${c.border}` }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{c.label}</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>{c.val}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Bill To */}
        <Paper sx={{ p: 2, borderRadius: 2, mb: 3, borderLeft: '4px solid #6D28D9' }}>
          <Typography variant="overline" sx={{ fontWeight: 700, color: '#6D28D9', display: 'block', mb: 0.5 }}>BILL TO</Typography>
          <Typography variant="body1" sx={{ fontWeight: 700 }}>{invoice.customerName}</Typography>
          <Typography variant="body2" color="text.secondary">{invoice.customerPhone}</Typography>
          {addr.addressLine1 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {[addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.pincode && `- ${addr.pincode}`].filter(Boolean).join(', ')}
            </Typography>
          )}
        </Paper>

        {/* Items Table */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Items</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2, mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#6D28D9' }}>
                {['#', 'Product', 'Qty', 'MRP', 'Price', 'Discount', 'Total'].map(h => (
                  <TableCell key={h} sx={{ color: '#fff', fontWeight: 700, py: 1.5, fontSize: 12 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.items.map((item: any, i: number) => {
                const mrp = Number(item.mrp || item.price || 0);
                const price = Number(item.price || 0);
                const qty = Number(item.quantity || 0);
                const discPerItem = Math.max(0, mrp - price);
                const discTotal = discPerItem * qty;
                const total = Number(item.total || item.totalWithTax || price * qty);
                return (
                  <TableRow key={i} sx={{ '&:nth-of-type(even)': { bgcolor: '#FEF2F2' } }}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.name}</Typography>
                      {item.variantName && <Typography variant="caption" color="text.secondary">{item.variantName}</Typography>}
                    </TableCell>
                    <TableCell>{qty}</TableCell>
                    <TableCell sx={{ color: '#94A3B8', textDecoration: 'line-through' }}>₹{mrp.toFixed(2)}</TableCell>
                    <TableCell>₹{price.toFixed(2)}</TableCell>
                    <TableCell sx={{ color: '#059669', fontWeight: 600 }}>
                      {discTotal > 0 ? `-₹${discTotal.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>₹{total.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Payment Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Paper sx={{ p: 2.5, borderRadius: 2, minWidth: 320 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Payment Summary</Typography>
            {summaryRows.map(row => (
              <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid #F1F5F9' }}>
                <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: (row as any).color || '#1E293B' }}>{row.val}</Typography>
              </Box>
            ))}
            {/* Balance Due */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5, pt: 1.5,
              borderTop: '2px solid #6D28D9', bgcolor: '#FEF2F2', mx: -2.5, px: 2.5, py: 1.5, borderRadius: '0 0 8px 8px' }}>
              <Typography variant="body1" sx={{ fontWeight: 800, color: '#6D28D9' }}>Balance Due</Typography>
              <Typography variant="body1" sx={{ fontWeight: 800, color: '#6D28D9' }}>{fmtCurr(invoice.balance)}</Typography>
            </Box>
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #E2E8F0', gap: 1 }}>
        <Button onClick={onClose} variant="outlined">Close</Button>
        <Button variant="outlined" startIcon={<WhatsApp sx={{ color: '#25D366' }} />}
          onClick={() => {
            const phone = invoice.customerPhone;
            const msg = `Hi ${invoice.customerName}, your invoice ${invoice.invoiceNumber} for ₹${invoice.amount.toFixed(2)} has been created. Balance due: ₹${invoice.balance.toFixed(2)}.`;
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
          }}>
          WhatsApp
        </Button>
        <Button variant="contained"
          startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <Download />}
          onClick={() => onDownload(invoice)}
          disabled={downloading}
          sx={{ bgcolor: '#6D28D9', '&:hover': { bgcolor: '#5B21B6' } }}>
          {downloading ? 'Generating...' : 'Download PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DARK = '#1E293B';

/* ─── Main Page ───────────────────────────────────────────────── */
const Invoices: React.FC = () => {
  const [all, setAll] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0); // 0=All, 1=Paid, 2=Unpaid, 3=Part Paid
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [detailInv, setDetailInv] = useState<InvoiceRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuRow, setMenuRow] = useState<InvoiceRow | null>(null);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' as 'success' | 'error' });

  /* ── Load ── */
  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo)   params.dateTo   = dateTo;

      const res: any = await apiClient.get('/admin/invoices/from-orders', params);
      const rows: InvoiceRow[] = (res?.invoices || res?.data?.invoices || []).map((inv: any) => ({
        ...inv,
        id: inv._id || inv.orderId,
      }));
      setAll(rows);
    } catch (err) {
      console.error('Failed to load invoices:', err);
      setSnack({ open: true, msg: 'Failed to load invoices', sev: 'error' });
    }
    setLoading(false);
  }, [dateFrom, dateTo]);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  /* ── Counts ── */
  const counts = {
    all:      all.length,
    paid:     all.filter(i => i.payStatus === 'PAID').length,
    unpaid:   all.filter(i => i.payStatus === 'UNPAID').length,
    partPaid: all.filter(i => i.payStatus === 'PART_PAID').length,
  };

  /* ── Tab → payStatus filter ── */
  const tabStatus: (PayStatus | null)[] = [null, 'PAID', 'UNPAID', 'PART_PAID'];
  const afterTab = tab === 0 ? all : all.filter(i => i.payStatus === tabStatus[tab]);

  /* ── Search ── */
  const filtered = search
    ? afterTab.filter(i =>
        i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        i.customerName.toLowerCase().includes(search.toLowerCase()) ||
        i.customerPhone.includes(search) ||
        i.orderNumber.toLowerCase().includes(search.toLowerCase())
      )
    : afterTab;

  /* ── PDF download ── */
  const downloadPDF = async (inv: InvoiceRow) => {
    setDownloading(true);
    try {
      await orderService.getInvoicePDF(inv.orderId, inv.orderNumber);
    } catch (err: any) {
      setSnack({ open: true, msg: err?.message || 'PDF generation failed', sev: 'error' });
    }
    setDownloading(false);
  };

  /* ── Quick date buttons ── */
  const applyQuickDate = (type: string) => {
    const today = dayjs();
    if (type === 'today') {
      setDateFrom(today.format('YYYY-MM-DD'));
      setDateTo(today.format('YYYY-MM-DD'));
    } else if (type === 'yesterday') {
      const y = today.subtract(1, 'day').format('YYYY-MM-DD');
      setDateFrom(y); setDateTo(y);
    } else if (type === 'week') {
      setDateFrom(today.subtract(7, 'day').format('YYYY-MM-DD'));
      setDateTo(today.format('YYYY-MM-DD'));
    } else if (type === 'month') {
      setDateFrom(today.subtract(1, 'month').format('YYYY-MM-DD'));
      setDateTo(today.format('YYYY-MM-DD'));
    } else {
      setDateFrom(''); setDateTo('');
    }
  };

  /* ── Columns ── */
  const columns: GridColDef[] = [
    {
      field: 'invoiceNumber', headerName: 'Invoice #', width: 195,
      renderCell: params => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#6D28D9', cursor: 'pointer',
          '&:hover': { textDecoration: 'underline' } }}
          onClick={() => { setDetailInv(params.row); setModalOpen(true); }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'amount', headerName: 'Amount', width: 115,
      renderCell: p => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          ₹{Number(p.value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Typography>
      ),
    },
    {
      field: 'balance', headerName: 'Balance', width: 115,
      renderCell: p => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: Number(p.value) > 0 ? '#6D28D9' : '#059669' }}>
          ₹{Number(p.value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Typography>
      ),
    },
    {
      field: 'invoiceDate', headerName: 'Create Date', width: 120,
      renderCell: p => <Typography variant="body2">{dayjs(p.value).format('DD-MMM-YYYY')}</Typography>,
    },
    {
      field: 'customerName', headerName: 'Customer Name', flex: 1, minWidth: 160,
      renderCell: p => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 30, height: 30, fontSize: 13, fontWeight: 700, bgcolor: '#6D28D9' }}>
            {String(p.value || '-').charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.value || '-'}</Typography>
            <Typography variant="caption" color="text.secondary">{p.row.customerPhone}</Typography>
          </Box>
        </Stack>
      ),
    },
    {
      field: 'payStatus', headerName: 'Status', width: 120,
      renderCell: p => <PayChip status={p.value as PayStatus} />,
    },
    {
      field: 'actions', headerName: '', width: 50, sortable: false,
      renderCell: p => (
        <IconButton size="small" onClick={e => { setAnchorEl(e.currentTarget); setMenuRow(p.row); }}>
          <MoreVert fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Invoices</Typography>
          <Typography variant="body2" color="text.secondary">
            {counts.all} total · Click invoice # to view details
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Settings />}
          onClick={loadInvoices}
          sx={{ bgcolor: '#6D28D9', '&:hover': { bgcolor: '#5B21B6' } }}>
          Refresh
        </Button>
      </Box>

      {/* ── Filters ── */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" gap={1} alignItems="center">
          {/* Search */}
          <TextField
            placeholder="Invoice #, Customer Name, Mobile..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            sx={{ width: 310 }}
          />
          <Divider orientation="vertical" flexItem />
          {/* Quick date buttons */}
          {[['all', 'All'], ['today', 'Today'], ['yesterday', 'Yesterday'], ['week', 'Last Week'], ['month', 'Last Month']].map(([k, label]) => (
            <Button key={k} size="small" variant="outlined"
              onClick={() => applyQuickDate(k)}
              sx={{ textTransform: 'none', borderRadius: 10, borderColor: '#E2E8F0', color: '#64748B',
                '&:hover': { borderColor: '#6D28D9', color: '#6D28D9' } }}>
              {label}
            </Button>
          ))}
          <Divider orientation="vertical" flexItem />
          {/* Date range */}
          <TextField type="date" size="small" label="From" InputLabelProps={{ shrink: true }}
            value={dateFrom} onChange={e => setDateFrom(e.target.value)} sx={{ width: 150 }} />
          <TextField type="date" size="small" label="To" InputLabelProps={{ shrink: true }}
            value={dateTo} onChange={e => setDateTo(e.target.value)} sx={{ width: 150 }} />
          <Button size="small" variant="contained"
            onClick={loadInvoices}
            sx={{ bgcolor: '#6D28D9', '&:hover': { bgcolor: '#5B21B6' } }}>
            Apply
          </Button>
          {(dateFrom || dateTo) && (
            <Button size="small" variant="outlined" color="inherit"
              onClick={() => { setDateFrom(''); setDateTo(''); }}>
              Clear
            </Button>
          )}
        </Stack>
      </Paper>

      {/* ── Tabs ── */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 0 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: '1px solid #E2E8F0', px: 2,
            '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', minWidth: 'auto', px: 2 },
            '& .Mui-selected': { color: '#6D28D9' },
            '& .MuiTabs-indicator': { bgcolor: '#6D28D9' } }}>
          <Tab label={`All (${counts.all})`} />
          <Tab label={`Paid (${counts.paid})`} />
          <Tab label={`Unpaid (${counts.unpaid})`} />
          <Tab label={`Part Paid (${counts.partPaid})`} />
        </Tabs>

        {/* ── DataGrid ── */}
        <DataGrid
          rows={filtered}
          columns={columns}
          loading={loading}
          rowHeight={60}
          onRowClick={params => { setDetailInv(params.row); setModalOpen(true); }}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          pageSizeOptions={[10, 25, 50, 100]}
          sx={{
            border: 'none', bgcolor: '#fff',
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#F8FAFC', fontWeight: 700, fontSize: 13 },
            '& .MuiDataGrid-cell': { borderBottom: '1px solid #F1F5F9', cursor: 'pointer' },
            '& .MuiDataGrid-row:hover': { bgcolor: '#FEF2F2' },
          }}
        />
      </Paper>

      {/* ── Detail Modal ── */}
      <InvoiceModal
        invoice={detailInv}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setDetailInv(null); }}
        downloading={downloading}
        onDownload={downloadPDF}
      />

      {/* ── Row Action Menu ── */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { setDetailInv(menuRow); setModalOpen(true); setAnchorEl(null); }}>
          <Visibility sx={{ mr: 1.5, fontSize: 18 }} /> View Invoice
        </MenuItem>
        <MenuItem onClick={() => { if (menuRow) downloadPDF(menuRow); setAnchorEl(null); }}>
          <Download sx={{ mr: 1.5, fontSize: 18 }} /> Download PDF
        </MenuItem>
        <MenuItem onClick={() => {
          if (!menuRow) return;
          const msg = `Hi ${menuRow.customerName}, your invoice ${menuRow.invoiceNumber} for ₹${menuRow.amount.toFixed(2)}. Balance: ₹${menuRow.balance.toFixed(2)}.`;
          window.open(`https://wa.me/${menuRow.customerPhone}?text=${encodeURIComponent(msg)}`, '_blank');
          setAnchorEl(null);
        }}>
          <WhatsApp sx={{ mr: 1.5, fontSize: 18, color: '#25D366' }} /> WhatsApp
        </MenuItem>
      </Menu>

      {/* ── Snackbar ── */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.sev}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Invoices;
