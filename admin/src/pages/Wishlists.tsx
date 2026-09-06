import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, IconButton, Tooltip, Collapse, Grid,
  Chip, CircularProgress, Button
} from '@mui/material';
import {
  Chat as ChatIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';
import apiClient from '../services/api.service';

interface WishlistUser {
  user: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
  };
  items: {
    _id: string;
    name: string;
    price: number;
    image?: string;
    sku?: string;
    colors?: string[];
    sizes?: string[];
    attributes?: { name: string; value: string }[];
  }[];
  totalAmount: number;
}

export default function Wishlists() {
  const [users, setUsers] = useState<WishlistUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchWishlists();
  }, [page]);

  const fetchWishlists = async () => {
    setIsLoading(true);
    try {
      const res: any = await apiClient.get(`/admin/wishlists?page=${page}&limit=15`);
      setUsers(res.wishlists || []);
      setTotalPages(res.pagination?.pages || 1);
    } catch (err) {
      console.error('Failed to load wishlists', err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalWishlisted = users.reduce((sum, u) => sum + (u.items?.length || 0), 0);

  return (
    <Box sx={{ p: 3, bgcolor: 'grey.50', minHeight: '100vh' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FavoriteIcon sx={{ color: 'error.main', fontSize: 32 }} />
          Customer Wishlists
        </Typography>
        <Typography variant="body2" color="text.secondary">
          See what your customers love and want to buy
        </Typography>
      </Box>

      {/* Stats Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'purple.100' }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">Users with Wishlists</Typography>
            <Typography variant="h3" fontWeight="bold" color="primary.main" mt={1}>{users.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'purple.100' }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">Total Items Wishlisted</Typography>
            <Typography variant="h3" fontWeight="bold" color="primary.main" mt={1}>{totalWishlisted}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'purple.100' }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">Avg. Wishlist Size</Typography>
            <Typography variant="h3" fontWeight="bold" color="primary.main" mt={1}>
              {users.length > 0 ? (totalWishlisted / users.length).toFixed(1) : '0'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Users Wishlist Table */}
      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'grey.100', overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'grey.100' }}>
          <Typography variant="h6" fontWeight="bold" color="text.primary">Customer Wishlist Details</Typography>
        </Box>

        {isLoading ? (
          <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : users.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h2" sx={{ mb: 2 }}>♡</Typography>
            <Typography color="text.secondary">No wishlists yet. Customers will appear here once they save products.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Items Saved</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Value</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => {
                  const isExpanded = expandedUser === user.user._id;
                  return (
                    <React.Fragment key={user.user._id}>
                      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
                        <TableCell>
                          <IconButton size="small" onClick={() => setExpandedUser(isExpanded ? null : user.user._id)}>
                            {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Avatar sx={{ bgcolor: 'purple.100', color: 'purple.700', fontWeight: 'bold', width: 40, height: 40 }}>
                              {(user.user.name || user.user.phone || '?')[0].toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">{user.user.name || 'Unknown User'}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {user.user.phone} {user.user.email ? `• ${user.user.email}` : ''}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={`♥ ${user.items?.length || 0} items`} 
                            size="small"
                            sx={{ fontWeight: 'bold', bgcolor: 'red.50', color: 'red.600' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            ₹{user.totalAmount?.toLocaleString('en-IN') || 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Contact on WhatsApp">
                            <IconButton
                              component="a"
                              href={`https://wa.me/91${user.user.phone.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${user.user.name || ''}, we noticed you liked some products on Shibra! Let us know if you need any help ordering.`)}`}
                              target="_blank"
                              sx={{ color: 'success.main', bgcolor: 'success.light', '&:hover': { bgcolor: 'success.main', color: 'white' } }}
                            >
                              <ChatIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                      
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 3, bgcolor: 'grey.50' }}>
                              <Grid container spacing={2}>
                                {(user.items || []).map((product) => (
                                  <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                                    <Paper variant="outlined" sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', bgcolor: 'white' }}>
                                      <Avatar
                                        variant="rounded"
                                        src={product.image || ''}
                                        sx={{ width: 56, height: 56, bgcolor: 'grey.50' }}
                                      >
                                        {!product.image && '📦'}
                                      </Avatar>
                                      <Box sx={{ overflow: 'hidden' }}>
                                        <Typography variant="body2" fontWeight="bold" noWrap>{product.name}</Typography>
                                        <Typography variant="caption" color="text.secondary" display="block">SKU: {product.sku}</Typography>
                                        <Typography variant="body2" fontWeight="bold" color="purple.700" sx={{ mt: 0.5 }}>
                                          ₹{(product.price || 0).toLocaleString('en-IN')}
                                        </Typography>
                                      </Box>
                                    </Paper>
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {totalPages > 1 && (
          <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'grey.100', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button variant="outlined" size="small" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <Typography variant="body2" color="text.secondary">Page {page} of {totalPages}</Typography>
            <Button variant="outlined" size="small" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
