import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Snackbar, Alert
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Edit, Delete, LocalShipping } from '@mui/icons-material';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  supplierContact: string;
  items: string;
  totalAmount: number;
  status: string;
  expectedDelivery: string;
  notes: string;
  createdAt: string;
}

const PO_STATUSES = ['DRAFT', 'SENT', 'CONFIRMED', 'SHIPPED', 'RECEIVED', 'CANCELLED'];

const STATUS_COLORS: Record<string, any> = {
  DRAFT: 'default',
  SENT: 'info',
  CONFIRMED: 'primary',
  SHIPPED: 'warning',
  RECEIVED: 'success',
  CANCELLED: 'error',
};

const STORAGE_KEY = 'shibra_purchase_orders';

const generatePONumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `PO-${date}-${seq}`;
};

const loadFromStorage = (): PurchaseOrder[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (orders: PurchaseOrder[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
};

const emptyForm = {
  supplierName: '',
  supplierContact: '',
  items: '',
  totalAmount: '',
  status: 'DRAFT',
  expectedDelivery: '',
  notes: '',
};

const PurchaseOrders: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseOrder | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    setOrders(loadFromStorage());
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (po: PurchaseOrder) => {
    setEditing(po);
    setForm({
      supplierName: po.supplierName,
      supplierContact: po.supplierContact,
      items: po.items,
      totalAmount: po.totalAmount.toString(),
      status: po.status,
      expectedDelivery: po.expectedDelivery ? new Date(po.expectedDelivery).toISOString().split('T')[0] : '',
      notes: po.notes,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.supplierName.trim() || !form.items.trim()) return;

    let updated: PurchaseOrder[];

    if (editing) {
      updated = orders.map(o =>
        o.id === editing.id
          ? {
            ...o,
            supplierName: form.supplierName,
            supplierContact: form.supplierContact,
            items: form.items,
            totalAmount: Number(form.totalAmount) || 0,
            status: form.status,
            expectedDelivery: form.expectedDelivery,
            notes: form.notes,
          }
          : o
      );
      setSnackbar({ open: true, message: 'Purchase order updated!', severity: 'success' });
    } else {
      const newPO: PurchaseOrder = {
        id: Date.now().toString(),
        poNumber: generatePONumber(),
        supplierName: form.supplierName,
        supplierContact: form.supplierContact,
        items: form.items,
        totalAmount: Number(form.totalAmount) || 0,
        status: form.status,
        expectedDelivery: form.expectedDelivery,
        notes: form.notes,
        createdAt: new Date().toISOString(),
      };
      updated = [newPO, ...orders];
      setSnackbar({ open: true, message: 'Purchase order created!', severity: 'success' });
    }

    setOrders(updated);
    saveToStorage(updated);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) return;
    const updated = orders.filter(o => o.id !== id);
    setOrders(updated);
    saveToStorage(updated);
    setSnackbar({ open: true, message: 'Purchase order deleted', severity: 'success' });
  };

  const columns: GridColDef[] = [
    { field: 'poNumber', headerName: 'PO #', width: 170 },
    { field: 'supplierName', headerName: 'Supplier', flex: 1, minWidth: 150 },
    { field: 'items', headerName: 'Items', flex: 1, minWidth: 150 },
    {
      field: 'totalAmount', headerName: 'Amount', width: 120,
      valueFormatter: (params) => `₹${(params.value || 0).toLocaleString()}`
    },
    {
      field: 'status', headerName: 'Status', width: 130,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color={STATUS_COLORS[params.value] || 'default'} />
      )
    },
    {
      field: 'expectedDelivery', headerName: 'Expected', width: 120,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : '-'
    },
    {
      field: 'createdAt', headerName: 'Created', width: 120,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'actions', headerName: 'Actions', width: 100, sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => openEdit(params.row)}><Edit fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}><Delete fontSize="small" /></IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalShipping color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>Purchase Orders</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
          New Purchase Order
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Purchase orders are stored locally in your browser. They help you track orders placed with your suppliers.
      </Alert>

      <DataGrid
        rows={orders}
        columns={columns}
        getRowId={(row) => row.id}
        initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
        pageSizeOptions={[25, 50, 100]}
        sx={{ backgroundColor: '#fff', borderRadius: 2, minHeight: 300 }}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Purchase Order' : 'New Purchase Order'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth label="Supplier Name" value={form.supplierName}
            onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
            sx={{ mt: 1 }} required
          />
          <TextField
            fullWidth label="Supplier Contact (Phone/Email)" value={form.supplierContact}
            onChange={(e) => setForm({ ...form, supplierContact: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth label="Items / Products" value={form.items}
            onChange={(e) => setForm({ ...form, items: e.target.value })}
            sx={{ mt: 2 }} required multiline rows={3}
            placeholder="e.g. 50x iPhone 15 Cases, 100x USB-C Cables"
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              fullWidth label="Total Amount (₹)" type="number" value={form.totalAmount}
              onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={form.status} label="Status" onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {PO_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <TextField
            fullWidth label="Expected Delivery" type="date" value={form.expectedDelivery}
            onChange={(e) => setForm({ ...form, expectedDelivery: e.target.value })}
            sx={{ mt: 2 }} InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth label="Notes" value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            sx={{ mt: 2 }} multiline rows={2}
            placeholder="Any additional notes about this order..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.supplierName.trim() || !form.items.trim()}>
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default PurchaseOrders;
