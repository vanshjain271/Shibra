import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, Select, MenuItem, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip,
  Grid, Divider, CircularProgress
} from '@mui/material';
import { Chat as ChatIcon, Visibility as VisibilityIcon, Close as CloseIcon } from '@mui/icons-material';
import api from '../services/api.service';

interface Inquiry {
  _id: string;
  product: {
    _id: string;
    name: string;
    sku: string;
    images: string[];
    salePrice?: number;
    mrp?: number;
    colors?: string[];
    sizes?: string[];
    attributes?: { name: string; value: string }[];
  };
  user?: {
    name: string;
    phone: string;
  };
  name: string;
  phone: string;
  quantity: number;
  status: string;
  notes: string;
  createdAt: string;
}

export default function Inquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const res: any = await api.get('/inquiries');
      if (res.success) {
        setInquiries(res.inquiries);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/inquiries/${id}/status`, { status: newStatus });
      fetchInquiries();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="text.primary">
          Bulk Inquiries
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage wholesale requests from customers
        </Typography>
      </Box>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No inquiries found.
                </TableCell>
              </TableRow>
            ) : (
              inquiries.map((inq) => {
                const amount = (inq.product?.salePrice || inq.product?.mrp || 0) * inq.quantity;
                return (
                  <TableRow key={inq._id} hover>
                    <TableCell>
                      {new Date(inq.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">{inq.name}</Typography>
                      <Typography variant="caption" color="text.secondary">+91 {inq.phone}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Avatar
                          variant="rounded"
                          src={inq.product?.images?.[0] || ''}
                          sx={{ width: 48, height: 48, border: '1px solid', borderColor: 'divider' }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight="medium" sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            maxWidth: 250
                          }}>
                            {inq.product?.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            SKU: {inq.product?.sku}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        ₹{amount.toLocaleString('en-IN')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={`${inq.quantity} units`} />
                    </TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        value={inq.status}
                        onChange={(e) => updateStatus(inq._id, e.target.value as string)}
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          height: 32,
                          '& .MuiSelect-select': { py: 0.5 },
                          bgcolor: 
                            inq.status === 'PENDING' ? 'warning.light' :
                            inq.status === 'CONTACTED' ? 'info.light' :
                            inq.status === 'CONVERTED' ? 'success.light' : 'grey.100',
                          color: 
                            inq.status === 'PENDING' ? 'warning.dark' :
                            inq.status === 'CONTACTED' ? 'info.dark' :
                            inq.status === 'CONVERTED' ? 'success.dark' : 'text.secondary',
                        }}
                      >
                        <MenuItem value="PENDING">PENDING</MenuItem>
                        <MenuItem value="CONTACTED">CONTACTED</MenuItem>
                        <MenuItem value="CONVERTED">CONVERTED</MenuItem>
                        <MenuItem value="CLOSED">CLOSED</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="Chat on WhatsApp">
                          <IconButton
                            size="small"
                            component="a"
                            href={`https://wa.me/91${inq.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${inq.name}, regarding your bulk inquiry for ${inq.product?.name} (${inq.quantity} units)...`)}`}
                            target="_blank"
                            sx={{ color: '#25D366', bgcolor: '#25D3661A', '&:hover': { bgcolor: '#25D36633' } }}
                          >
                            <ChatIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => setSelectedInquiry(inq)}
                            sx={{ bgcolor: 'primary.light', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Modal */}
      <Dialog open={!!selectedInquiry} onClose={() => setSelectedInquiry(null)} maxWidth="sm" fullWidth>
        {selectedInquiry && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
              <Typography variant="h6" fontWeight="bold">Inquiry Details</Typography>
              <IconButton size="small" onClick={() => setSelectedInquiry(null)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <Avatar
                  variant="rounded"
                  src={selectedInquiry.product?.images?.[0] || ''}
                  sx={{ width: 100, height: 100, border: '1px solid', borderColor: 'divider' }}
                />
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {selectedInquiry.product?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    SKU: {selectedInquiry.product?.sku}
                  </Typography>
                  <Typography variant="subtitle2" color="primary" fontWeight="bold">
                    ₹{(selectedInquiry.product?.salePrice || selectedInquiry.product?.mrp || 0).toLocaleString('en-IN')} / unit
                  </Typography>
                </Box>
              </Box>

              {(selectedInquiry.product?.colors?.length || selectedInquiry.product?.sizes?.length || selectedInquiry.product?.attributes?.length) && (
                <>
                  <Typography variant="overline" fontWeight="bold" color="text.secondary">
                    Product Variants / Attributes
                  </Typography>
                  <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedInquiry.product.colors?.map(c => <Chip key={c} size="small" label={`Color: ${c}`} variant="outlined" />)}
                    {selectedInquiry.product.sizes?.map(s => <Chip key={s} size="small" label={`Size: ${s}`} variant="outlined" />)}
                    {selectedInquiry.product.attributes?.map((attr, i) => (
                      <Chip key={i} size="small" label={`${attr.name}: ${attr.value}`} variant="outlined" />
                    ))}
                  </Box>
                </>
              )}

              <Typography variant="overline" fontWeight="bold" color="text.secondary">
                Customer Details
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">Name</Typography>
                    <Typography variant="body2" fontWeight="medium">{selectedInquiry.name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">Phone</Typography>
                    <Typography variant="body2" fontWeight="medium">+91 {selectedInquiry.phone}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">Quantity</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary">{selectedInquiry.quantity} units</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">Total Amount</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ₹{((selectedInquiry.product?.salePrice || selectedInquiry.product?.mrp || 0) * selectedInquiry.quantity).toLocaleString('en-IN')}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Button
                variant="contained"
                startIcon={<ChatIcon />}
                sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#20b858' }, fontWeight: 'bold' }}
                component="a"
                href={`https://wa.me/91${selectedInquiry.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${selectedInquiry.name}, regarding your bulk inquiry for ${selectedInquiry.product?.name} (${selectedInquiry.quantity} units)...`)}`}
                target="_blank"
              >
                Chat on WhatsApp
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
