import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Chip, Button, Tabs, Tab, Rating,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Avatar, IconButton, Snackbar, Alert,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { CheckCircle, Cancel, Delete, Star, Visibility } from '@mui/icons-material';
import apiClient from '../services/api.service';

const STATUS_COLORS: Record<string, 'warning' | 'success' | 'error'> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'error',
};

const Reviews: React.FC = () => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(25);
    const [statusFilter, setStatusFilter] = useState('');
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // Detail dialog
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState<any>(null);
    const [adminReply, setAdminReply] = useState('');

    const loadReviews = async () => {
        setLoading(true);
        try {
            const params: any = { page: page + 1, limit: pageSize };
            if (statusFilter) params.status = statusFilter;

            const result = await apiClient.get<any>('/admin/reviews', params);
            setReviews(result?.reviews || []);
            setTotal(result?.pagination?.total || 0);
            setStats(result?.stats || { pending: 0, approved: 0, rejected: 0 });
        } catch (error) {
            console.error('Failed to load reviews', error);
            setReviews([]);
        }
        setLoading(false);
    };

    useEffect(() => { loadReviews(); }, [page, pageSize, statusFilter]);

    const handleStatusUpdate = async (reviewId: string, status: string, reply?: string) => {
        try {
            const body: any = { status };
            if (reply !== undefined) body.adminReply = reply;
            await apiClient.put(`/admin/reviews/${reviewId}`, body);
            setSnackbar({ open: true, message: `Review ${status.toLowerCase()}`, severity: 'success' });
            loadReviews();
            setDetailOpen(false);
        } catch {
            setSnackbar({ open: true, message: 'Failed to update review', severity: 'error' });
        }
    };

    const handleDelete = async (reviewId: string) => {
        try {
            await apiClient.delete(`/admin/reviews/${reviewId}`);
            setSnackbar({ open: true, message: 'Review deleted', severity: 'success' });
            loadReviews();
        } catch {
            setSnackbar({ open: true, message: 'Failed to delete review', severity: 'error' });
        }
    };

    const openDetail = (review: any) => {
        setSelectedReview(review);
        setAdminReply(review.adminReply || '');
        setDetailOpen(true);
    };

    const columns: GridColDef[] = [
        {
            field: 'product', headerName: 'Product', width: 200,
            renderCell: (params) => {
                const product = params.row.product;
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                            src={product?.images?.[0]}
                            variant="rounded"
                            sx={{ width: 36, height: 36 }}
                        >
                            <Star />
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{product?.name || '—'}</Typography>
                    </Box>
                );
            },
        },
        {
            field: 'user', headerName: 'Customer', width: 150,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontSize: 13 }}>{params.row.user?.name || 'Anonymous'}</Typography>
            ),
        },
        {
            field: 'rating', headerName: 'Rating', width: 140,
            renderCell: (params) => (
                <Rating value={params.value} readOnly size="small" />
            ),
        },
        {
            field: 'comment', headerName: 'Review', flex: 1, minWidth: 200,
            renderCell: (params) => (
                <Box>
                    {params.row.title && <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{params.row.title}</Typography>}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
                        {(params.value || '').substring(0, 80)}{(params.value || '').length > 80 ? '...' : ''}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'isVerifiedPurchase', headerName: 'Verified', width: 90,
            renderCell: (params) => params.value ? <Chip label="✓ Verified" size="small" color="success" variant="outlined" /> : null,
        },
        {
            field: 'status', headerName: 'Status', width: 110,
            renderCell: (params) => (
                <Chip label={params.value} size="small" color={STATUS_COLORS[params.value] || 'default'} />
            ),
        },
        {
            field: 'createdAt', headerName: 'Date', width: 120,
            renderCell: (params) => (
                <Typography variant="caption" color="text.secondary">
                    {new Date(params.value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Typography>
            ),
        },
        {
            field: 'actions', headerName: 'Actions', width: 180, sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => openDetail(params.row)} title="View">
                        <Visibility fontSize="small" />
                    </IconButton>
                    {params.row.status === 'PENDING' && (
                        <>
                            <IconButton size="small" color="success" onClick={() => handleStatusUpdate(params.row._id, 'APPROVED')} title="Approve">
                                <CheckCircle fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => handleStatusUpdate(params.row._id, 'REJECTED')} title="Reject">
                                <Cancel fontSize="small" />
                            </IconButton>
                        </>
                    )}
                    <IconButton size="small" onClick={() => handleDelete(params.row._id)} title="Delete" sx={{ color: '#94A3B8' }}>
                        <Delete fontSize="small" />
                    </IconButton>
                </Box>
            ),
        },
    ];

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Star sx={{ color: '#F59E0B', fontSize: 28 }} />
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>Reviews & Ratings</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label={`${stats.pending} Pending`} color="warning" variant="outlined" />
                    <Chip label={`${stats.approved} Approved`} color="success" variant="outlined" />
                    <Chip label={`${stats.rejected} Rejected`} color="error" variant="outlined" />
                </Box>
            </Box>

            {/* Tabs */}
            <Tabs value={statusFilter} onChange={(_, v) => { setStatusFilter(v); setPage(0); }} sx={{ mb: 2 }}>
                <Tab label="All" value="" />
                <Tab label="Pending" value="PENDING" />
                <Tab label="Approved" value="APPROVED" />
                <Tab label="Rejected" value="REJECTED" />
            </Tabs>

            {/* Data Grid */}
            <DataGrid
                rows={reviews}
                columns={columns}
                loading={loading}
                getRowId={(row) => row._id}
                rowCount={total}
                paginationMode="server"
                paginationModel={{ page, pageSize }}
                onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }}
                pageSizeOptions={[25, 50, 100]}
                disableRowSelectionOnClick
                autoHeight
                sx={{ backgroundColor: '#fff', borderRadius: 2, minHeight: 400 }}
            />

            {/* Review Detail Dialog */}
            <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
                {selectedReview && (
                    <>
                        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Review Detail
                            <Chip label={selectedReview.status} size="small" color={STATUS_COLORS[selectedReview.status] || 'default'} />
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Product</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedReview.product?.name || '—'}</Typography>
                            </Box>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Customer</Typography>
                                <Typography variant="body1">{selectedReview.user?.name || 'Anonymous'}</Typography>
                                {selectedReview.isVerifiedPurchase && <Chip label="✓ Verified Purchase" size="small" color="success" variant="outlined" sx={{ mt: 0.5 }} />}
                            </Box>
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Rating</Typography>
                                <Rating value={selectedReview.rating} readOnly />
                            </Box>
                            {selectedReview.title && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary">Title</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedReview.title}</Typography>
                                </Box>
                            )}
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">Comment</Typography>
                                <Typography variant="body2" sx={{ bgcolor: '#F8FAFC', p: 1.5, borderRadius: 1, border: '1px solid #E2E8F0' }}>
                                    {selectedReview.comment || 'No comment'}
                                </Typography>
                            </Box>
                            <TextField
                                label="Admin Reply (optional)"
                                fullWidth
                                multiline
                                rows={3}
                                value={adminReply}
                                onChange={(e) => setAdminReply(e.target.value)}
                                sx={{ mt: 1 }}
                            />
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                            <Button onClick={() => setDetailOpen(false)}>Close</Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<Cancel />}
                                onClick={() => handleStatusUpdate(selectedReview._id, 'REJECTED', adminReply)}
                            >
                                Reject
                            </Button>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircle />}
                                onClick={() => handleStatusUpdate(selectedReview._id, 'APPROVED', adminReply)}
                            >
                                Approve
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default Reviews;
