import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, ShoppingCart, People, CalendarToday,
  Favorite, Settings, Receipt, Group, AddBox, 
  LocalOffer, Inventory, ErrorOutline, Category, BrandingWatermark
} from '@mui/icons-material';
import { 
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { 
  Grid, Card, CardContent, Typography, Box, CircularProgress, 
  Chip, FormControl, Select, MenuItem, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Avatar, IconButton
} from '@mui/material';
import apiClient from '../services/api.service';
import { useNavigate } from 'react-router-dom';

interface DashboardData {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  recentOrders: any[];
  ordersByStatus: { [key: string]: number };
  salesByDay: { date: string; amount: number; orders: number }[];
  wishlistData: {
    totalItems: number;
    uniqueProducts: number;
    topProducts: { _id: string; name: string; count: number; category: any }[];
  };
  data: {
    summary: {
      totalProducts: number;
      lowStockProducts: number;
    }
  }
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('month');

  useEffect(() => {
    loadDashboardData();
  }, [timeframe]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const result = await apiClient.get<any>(`/admin/reports/dashboard?timeframe=${timeframe}`);
      if (result.success) {
        setData({
          totalSales: result.totalRevenue || result.data?.summary?.totalRevenue || 0,
          totalOrders: result.totalOrders || result.data?.summary?.totalOrders || 0,
          totalCustomers: result.totalCustomers || result.data?.summary?.totalCustomers || 0,
          recentOrders: result.recentOrders || result.data?.recentOrders || [],
          ordersByStatus: result.ordersByStatus || {},
          salesByDay: result.salesByDay || [],
          wishlistData: result.wishlistData || { totalItems: 0, uniqueProducts: 0, topProducts: [] },
          data: result.data || { summary: { totalProducts: 0, lowStockProducts: 0 } }
        });
      }
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusLabels: { [key: string]: string } = {
    'PENDING': 'Pending', 'PROCESSING_PAYMENT': 'Processing',
    'PAID': 'Paid', 'CONFIRMED': 'Confirmed', 'PACKED': 'Packed',
    'SHIPPED': 'Shipped', 'DELIVERED': 'Delivered',
    'CANCELLED': 'Cancelled', 'PAYMENT_FAILED': 'Failed'
  };

  const statusColors: { [key: string]: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" } = {
    'PENDING': 'warning', 'PAID': 'info', 'CONFIRMED': 'primary', 
    'DELIVERED': 'success', 'CANCELLED': 'error', 'SHIPPED': 'secondary'
  };

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#F8FAFC' }}>
        <CircularProgress sx={{ color: '#000' }} />
      </Box>
    );
  }

  const todayRevenue = data?.salesByDay?.length ? data.salesByDay[data.salesByDay.length - 1].amount : 0;
  const todayOrders = data?.salesByDay?.length ? data.salesByDay[data.salesByDay.length - 1].orders : 0;
  const pendingOrders = data?.ordersByStatus['PENDING'] || 0;

  const kpis = [
    { label: 'Revenue', value: `₹${(data?.totalSales || 0).toLocaleString()}`, icon: <TrendingUp fontSize="small" />, color: '#10B981', bg: '#ecfdf5', trend: '+12%' },
    { label: 'Orders', value: (data?.totalOrders || 0).toLocaleString(), icon: <ShoppingCart fontSize="small" />, color: '#3B82F6', bg: '#eff6ff', trend: '+5%' },
    { label: 'Customers', value: (data?.totalCustomers || 0).toLocaleString(), icon: <People fontSize="small" />, color: '#8B5CF6', bg: '#f5f3ff', trend: '+18%' },
    { label: 'Wishlist Items', value: (data?.wishlistData?.totalItems || 0).toLocaleString(), icon: <Favorite fontSize="small" />, color: '#EC4899', bg: '#fdf2f8', trend: '+24%' },
  ];

  const quickActions = [
    { label: 'Add Product', icon: <AddBox />, path: '/catalog/products/new' },
    { label: 'Create Coupon', icon: <LocalOffer />, path: '/promotions/coupons' },
    { label: 'View Orders', icon: <Receipt />, path: '/orders/online' },
    { label: 'Customers', icon: <Group />, path: '/customers' },
    { label: 'Invoices', icon: <Receipt />, path: '/invoices' },
    { label: 'Settings', icon: <Settings />, path: '/store/settings' },
  ];

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', p: { xs: 2, md: 4 }, fontFamily: '"Inter", sans-serif' }}>
      
      {/* SECTION 1: Top Welcome Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', mb: 1 }}>
            Good Morning, Shibra
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981' }} />
              Today's Revenue: <b>₹{todayRevenue.toLocaleString()}</b>
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#3B82F6' }} />
              Today's Orders: <b>{todayOrders}</b>
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#F59E0B' }} />
              Pending Orders: <b>{pendingOrders}</b>
            </Typography>
          </Box>
        </Box>

        <FormControl size="small" sx={{ minWidth: 160, bgcolor: '#FFFFFF', borderRadius: '12px', '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}>
          <Select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            displayEmpty
            startAdornment={<CalendarToday sx={{ mr: 1, fontSize: 18, color: '#64748B' }} />}
            sx={{ fontWeight: 500, fontSize: '14px', color: '#0F172A', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' } }}
          >
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="6months">Last 6 Months</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* SECTION 2: Performance Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpis.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ borderRadius: '16px', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)', border: '1px solid #F1F5F9', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.04)' } }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>
                    {kpi.icon}
                  </Box>
                  <Chip label={kpi.trend} size="small" sx={{ bgcolor: '#ecfdf5', color: '#059669', fontWeight: 600, fontSize: '12px', height: 24 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5, letterSpacing: '-0.02em' }}>
                  {kpi.value}
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
                  {kpi.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          
          {/* SECTION 3: Sales Analytics */}
          <Card sx={{ borderRadius: '16px', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)', border: '1px solid #F1F5F9', mb: 4 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>Sales Analytics</Typography>
              </Box>
              <ResponsiveContainer width="100%" height={360}>
                <ComposedChart data={data?.salesByDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} minTickGap={30} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dx={-10} tickFormatter={(val) => `₹${val/1000}k`} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dx={10} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 500 }}
                    itemStyle={{ color: '#0F172A' }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="amount" fill="url(#colorAmount)" stroke="#10B981" strokeWidth={3} />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* SECTION 4: Recent Orders */}
          <Card sx={{ borderRadius: '16px', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)', border: '1px solid #F1F5F9' }}>
            <CardContent sx={{ p: 4, pb: '24px !important' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 3 }}>Recent Orders</Typography>
              <TableContainer>
                <Table sx={{ minWidth: 600 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#64748B', fontWeight: 600, borderBottom: '1px solid #F1F5F9' }}>Order ID</TableCell>
                      <TableCell sx={{ color: '#64748B', fontWeight: 600, borderBottom: '1px solid #F1F5F9' }}>Customer</TableCell>
                      <TableCell sx={{ color: '#64748B', fontWeight: 600, borderBottom: '1px solid #F1F5F9' }}>Date</TableCell>
                      <TableCell sx={{ color: '#64748B', fontWeight: 600, borderBottom: '1px solid #F1F5F9' }}>Amount</TableCell>
                      <TableCell align="right" sx={{ color: '#64748B', fontWeight: 600, borderBottom: '1px solid #F1F5F9' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.recentOrders.map((order) => (
                      <TableRow key={order._id} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: '#F8FAFC' } }}>
                        <TableCell sx={{ fontWeight: 600, color: '#0F172A', borderBottom: '1px solid #F1F5F9' }}>#{order.orderNumber}</TableCell>
                        <TableCell sx={{ borderBottom: '1px solid #F1F5F9' }}>{order.user?.name || 'Guest'}</TableCell>
                        <TableCell sx={{ color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell sx={{ fontWeight: 600, borderBottom: '1px solid #F1F5F9' }}>₹{order.totalAmount.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ borderBottom: '1px solid #F1F5F9' }}>
                          <Chip 
                            label={statusLabels[order.status] || order.status} 
                            color={statusColors[order.status] || 'default'}
                            size="small" 
                            sx={{ fontWeight: 600, borderRadius: '6px' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          
          {/* SECTION 6: Quick Actions */}
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>Quick Actions</Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {quickActions.map((action, idx) => (
              <Grid item xs={6} key={idx}>
                <Box 
                  onClick={() => navigate(action.path)}
                  sx={{ 
                    bgcolor: '#FFFFFF', p: 2, borderRadius: '12px', border: '1px solid #F1F5F9',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                    cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.01)',
                    '&:hover': { borderColor: '#E2E8F0', transform: 'translateY(-2px)', boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.04)' }
                  }}
                >
                  <Box sx={{ color: '#3B82F6', display: 'flex' }}>{action.icon}</Box>
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{action.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* SECTION 5: Wishlist Analytics */}
          <Card sx={{ borderRadius: '16px', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)', border: '1px solid #F1F5F9', mb: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>Top Wishlisted</Typography>
                <Chip label={`${data?.wishlistData.uniqueProducts || 0} Products`} size="small" sx={{ bgcolor: '#fdf2f8', color: '#EC4899', fontWeight: 600 }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {data?.wishlistData.topProducts.map((prod, idx) => (
                  <Box key={prod._id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#F1F5F9', color: '#64748B', width: 40, height: 40, borderRadius: '10px', fontSize: '14px', fontWeight: 700 }}>
                      #{idx + 1}
                    </Avatar>
                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                      <Typography sx={{ fontWeight: 600, color: '#0F172A', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {prod.name}
                      </Typography>
                      <Typography sx={{ fontSize: '12px', color: '#64748B' }}>
                        {prod.category?.name || 'Category'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#fdf2f8', px: 1, py: 0.5, borderRadius: '6px' }}>
                      <Favorite sx={{ fontSize: 14, color: '#EC4899' }} />
                      <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#EC4899' }}>{prod.count}</Typography>
                    </Box>
                  </Box>
                ))}
                {(!data?.wishlistData.topProducts || data.wishlistData.topProducts.length === 0) && (
                  <Typography variant="body2" sx={{ color: '#64748B', textAlign: 'center', py: 2 }}>No wishlist data available.</Typography>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* SECTION 7: Store Health Widget */}
          <Card sx={{ borderRadius: '16px', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.02)', border: '1px solid #F1F5F9' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A', mb: 3 }}>Store Health</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#F8FAFC', borderRadius: '12px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Inventory sx={{ color: '#3B82F6', fontSize: 20 }} />
                    <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Active Products</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>{(data?.data.summary.totalProducts || 0).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: '#FEF2F2', borderRadius: '12px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ErrorOutline sx={{ color: '#EF4444', fontSize: 20 }} />
                    <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#991B1B' }}>Out of Stock</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '16px', fontWeight: 800, color: '#991B1B' }}>{data?.data.summary.lowStockProducts || 0}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
