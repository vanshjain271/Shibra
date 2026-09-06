import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Button, Card, Grid, TextField, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl,
    InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, Snackbar, Alert, Autocomplete, InputAdornment, Divider
} from '@mui/material';
import { Add, Delete, Receipt } from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import productService from '../services/product.service';
import bulkOrderService from '../services/bulkOrder.service';

interface Product {
    _id: string;
    name: string;
    salePrice: number;
    mrp: number;
}

interface BulkOrderItem {
    productId: string;
    productName: string;
    quantity: number;
    regularPrice: number;
    specialPrice: number;
}

const BulkOrders: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [createDialog, setCreateDialog] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // New order form
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [orderItems, setOrderItems] = useState<BulkOrderItem[]>([]);
    const [discount, setDiscount] = useState(0);
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [paymentMode, setPaymentMode] = useState('COD');
    const [advanceAmount, setAdvanceAmount] = useState(0);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadOrders();
        loadProducts();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const data = await bulkOrderService.getBulkOrders();
            setOrders(data.orders || []);
        } catch (error) {
            console.error('Load orders error:', error);
        }
        setLoading(false);
    };

    const loadProducts = async () => {
        try {
            const productsData = await productService.getProducts(1, 100);
            setProducts(productsData || []);
        } catch (error) {
            console.error('Load products error:', error);
        }
    };

    const addItem = (product: Product | null) => {
        if (!product) return;
        const exists = orderItems.find(i => i.productId === product._id);
        if (exists) return;

        setOrderItems([...orderItems, {
            productId: product._id,
            productName: product.name,
            quantity: 1,
            regularPrice: product.salePrice || product.mrp,
            specialPrice: product.salePrice || product.mrp
        }]);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const updated = [...orderItems];
        (updated[index] as any)[field] = value;
        setOrderItems(updated);
    };

    const removeItem = (index: number) => {
        setOrderItems(orderItems.filter((_, i) => i !== index));
    };

    const calculateSubtotal = () => orderItems.reduce((sum, item) => sum + item.specialPrice * item.quantity, 0);
    const calculateTotal = () => calculateSubtotal() - discount + deliveryFee;
    const calculateSavings = () => orderItems.reduce((sum, item) => sum + (item.regularPrice - item.specialPrice) * item.quantity, 0);

    const createOrder = async () => {
        if (!customerName || !customerPhone || !customerAddress || orderItems.length === 0) {
            setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
            return;
        }

        try {
            await bulkOrderService.createBulkOrder({
                customerName, customerPhone, customerEmail, customerAddress,
                items: orderItems.map(i => ({ productId: i.productId, quantity: i.quantity, specialPrice: i.specialPrice })),
                discount, deliveryFee, paymentMode, advanceAmount, notes
            });

            setSnackbar({ open: true, message: 'Bulk order created!', severity: 'success' });
            resetForm();
            setCreateDialog(false);
            loadOrders();
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to create order', severity: 'error' });
        }
    };

    const resetForm = () => {
        setCustomerName(''); setCustomerPhone(''); setCustomerEmail('');
        setCustomerAddress(''); setOrderItems([]); setDiscount(0);
        setDeliveryFee(0); setPaymentMode('COD'); setAdvanceAmount(0); setNotes('');
    };

    const updateStatus = async (orderId: string, status: string) => {
        try {
            await bulkOrderService.updateStatus(orderId, status);
            loadOrders();
            setSnackbar({ open: true, message: 'Status updated', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: 'Update failed', severity: 'error' });
        }
    };

    const statusColors: any = {
        PENDING: 'warning', CONFIRMED: 'info', PROCESSING: 'secondary',
        SHIPPED: 'primary', DELIVERED: 'success', CANCELLED: 'error'
    };

    const columns: GridColDef[] = [
        { field: 'orderNumber', headerName: 'Order #', width: 160 },
        { field: 'customerName', headerName: 'Customer', flex: 1 },
        { field: 'customerPhone', headerName: 'Phone', width: 130 },
        { field: 'totalAmount', headerName: 'Amount', width: 120, valueFormatter: (p) => `₹${p.value?.toLocaleString()}` },
        { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <Chip label={p.value} size="small" color={statusColors[p.value] || 'default'} /> },
        { field: 'paymentStatus', headerName: 'Payment', width: 100, renderCell: (p) => <Chip label={p.value} size="small" variant="outlined" /> },
        { field: 'createdAt', headerName: 'Date', width: 120, valueFormatter: (p) => new Date(p.value).toLocaleDateString() },
        {
            field: 'actions', headerName: 'Actions', width: 200, sortable: false,
            renderCell: (p) => (
                <Box>
                    <Select size="small" value="" displayEmpty onChange={(e) => updateStatus(p.row._id, e.target.value as string)} sx={{ minWidth: 100 }}>
                        <MenuItem value="" disabled>Update</MenuItem>
                        <MenuItem value="CONFIRMED">Confirm</MenuItem>
                        <MenuItem value="PROCESSING">Process</MenuItem>
                        <MenuItem value="SHIPPED">Ship</MenuItem>
                        <MenuItem value="DELIVERED">Deliver</MenuItem>
                    </Select>
                </Box>
            )
        }
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>🏷️ Special Bulk Orders</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialog(true)}>
                    Create Bulk Order
                </Button>
            </Box>

            <Card sx={{ mb: 3, p: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <Typography variant="h6" sx={{ mb: 1 }}>💰 Special Pricing Feature</Typography>
                <Typography variant="body2">
                    Create orders with custom pricing for bulk buyers, distributors, or special customers.
                    Set individual product prices, apply discounts, and track payments separately.
                </Typography>
            </Card>

            <DataGrid
                rows={orders}
                columns={columns}
                loading={loading}
                getRowId={(row) => row._id}
                initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
                pageSizeOptions={[25, 50]}
                sx={{ backgroundColor: '#fff', borderRadius: 2, minHeight: 400 }}
            />

            {/* Create Order Dialog */}
            <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Create Special Bulk Order</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        {/* Customer Info */}
                        <Grid item xs={12}><Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Customer Details</Typography></Grid>
                        <Grid item xs={6}><TextField fullWidth label="Customer Name *" value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></Grid>
                        <Grid item xs={6}><TextField fullWidth label="Phone *" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} /></Grid>
                        <Grid item xs={6}><TextField fullWidth label="Email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} /></Grid>
                        <Grid item xs={6}><TextField fullWidth label="Address *" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} /></Grid>

                        <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>

                        {/* Add Products */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Products with Special Pricing</Typography>
                            <Autocomplete
                                options={Array.isArray(products) ? products : []}
                                getOptionLabel={(p) => p ? `${p.name} (₹${p.salePrice || p.mrp})` : ''}
                                isOptionEqualToValue={(option, value) => option?._id === value?._id}
                                onChange={(_, v) => addItem(v)}
                                renderInput={(params) => <TextField {...params} label="Search and add product" />}
                            />
                        </Grid>

                        {/* Items Table */}
                        {orderItems.length > 0 && (
                            <Grid item xs={12}>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Product</TableCell>
                                                <TableCell align="center">Qty</TableCell>
                                                <TableCell align="right">Regular ₹</TableCell>
                                                <TableCell align="right">Special ₹</TableCell>
                                                <TableCell align="right">Total</TableCell>
                                                <TableCell width={50}></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {orderItems.map((item, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>{item.productName}</TableCell>
                                                    <TableCell align="center">
                                                        <TextField size="small" type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} sx={{ width: 70 }} inputProps={{ min: 1 }} />
                                                    </TableCell>
                                                    <TableCell align="right">₹{item.regularPrice}</TableCell>
                                                    <TableCell align="right">
                                                        <TextField size="small" type="number" value={item.specialPrice} onChange={(e) => updateItem(i, 'specialPrice', parseFloat(e.target.value) || 0)} sx={{ width: 90 }} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                                                    </TableCell>
                                                    <TableCell align="right">₹{(item.specialPrice * item.quantity).toLocaleString()}</TableCell>
                                                    <TableCell><IconButton size="small" onClick={() => removeItem(i)}><Delete fontSize="small" /></IconButton></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Grid>
                        )}

                        <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>

                        {/* Pricing & Payment */}
                        <Grid item xs={3}><TextField fullWidth label="Discount" type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} /></Grid>
                        <Grid item xs={3}><TextField fullWidth label="Delivery Fee" type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} /></Grid>
                        <Grid item xs={3}>
                            <FormControl fullWidth>
                                <InputLabel>Payment Mode</InputLabel>
                                <Select value={paymentMode} label="Payment Mode" onChange={(e) => setPaymentMode(e.target.value)}>
                                    <MenuItem value="COD">Cash on Delivery</MenuItem>
                                    <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                                    <MenuItem value="UPI">UPI</MenuItem>
                                    <MenuItem value="ADVANCE_PAYMENT">Advance Payment</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={3}><TextField fullWidth label="Advance Paid" type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} /></Grid>

                        <Grid item xs={12}><TextField fullWidth label="Notes" multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Grid>

                        {/* Summary */}
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={3}><Typography variant="body2">Subtotal:</Typography><Typography variant="h6">₹{calculateSubtotal().toLocaleString()}</Typography></Grid>
                                    <Grid item xs={3}><Typography variant="body2">You Save:</Typography><Typography variant="h6" color="success.main">₹{calculateSavings().toLocaleString()}</Typography></Grid>
                                    <Grid item xs={3}><Typography variant="body2">Discount:</Typography><Typography variant="h6" color="error.main">-₹{discount}</Typography></Grid>
                                    <Grid item xs={3}><Typography variant="body2">Grand Total:</Typography><Typography variant="h4" color="primary">₹{calculateTotal().toLocaleString()}</Typography></Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { resetForm(); setCreateDialog(false); }}>Cancel</Button>
                    <Button variant="contained" onClick={createOrder} startIcon={<Receipt />}>Create Order</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default BulkOrders;
