import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button,
  ToggleButtonGroup, ToggleButton, CircularProgress, Alert, Stack,
  IconButton, Tooltip, Avatar
} from '@mui/material';
import {
  Download, ShoppingCart, People, Inventory,
  CalendarMonth, Receipt, TrendingUp, ShowChart, ShoppingBag
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

import { API_BASE_URL as API_BASE } from '../services/api.service';
const COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

type DatePreset = '1w' | '1m' | '3m' | '6m' | '1y' | 'all';

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: '7D', value: '1w' },
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '6M', value: '6m' },
  { label: '1Y', value: '1y' },
  { label: 'ALL', value: 'all' },
];

const getDateRange = (preset: DatePreset): { dateFrom?: string; dateTo?: string } => {
  const now = new Date();
  const dateTo = now.toISOString().split('T')[0];
  let from: Date;

  switch (preset) {
    case '1w': from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
    case '1m': from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); break;
    case '3m': from = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()); break;
    case '6m': from = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate()); break;
    case '1y': from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
    case 'all': return {};
  }

  return { dateFrom: from!.toISOString().split('T')[0], dateTo };
};

const Reports: React.FC = () => {
  const [datePreset, setDatePreset] = useState<DatePreset>('3m');
  const [salesByProduct, setSalesByProduct] = useState<any[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState({ totalRevenue: 0, totalOrders: 0, totalCustomers: 0, productsSold: 0 });
  const [loading, setLoading] = useState(false);
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [error, setError] = useState('');

  const reportTypes = [
    { id: 'sales', label: 'Sales Data', icon: <ShoppingCart sx={{ color: '#3B82F6' }} />, color: '#EFF6FF' },
    { id: 'invoice', label: 'Invoices', icon: <Receipt sx={{ color: '#10B981' }} />, color: '#ECFDF5' },
    { id: 'customer', label: 'Customers', icon: <People sx={{ color: '#8B5CF6' }} />, color: '#F5F3FF' },
    { id: 'inventory', label: 'Inventory', icon: <Inventory sx={{ color: '#F59E0B' }} />, color: '#FFFBEB' },
  ];

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
  });

  const buildDateParams = useCallback(() => {
    const range = getDateRange(datePreset);
    const params = new URLSearchParams();
    if (range.dateFrom) params.set('dateFrom', range.dateFrom);
    if (range.dateTo) params.set('dateTo', range.dateTo);
    return params.toString();
  }, [datePreset]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const dateParams = buildDateParams();
      const [productRes, categoryRes, salesRes] = await Promise.all([
        fetch(`${API_BASE}/admin/reports/sales/by-product?limit=5&${dateParams}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/admin/reports/sales/by-category?${dateParams}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/admin/reports/sales?${dateParams}`, { headers: getAuthHeaders() })
      ]);

      const productData = await productRes.json();
      const categoryData = await categoryRes.json();
      const salesData = await salesRes.json();

      if (productData.success) setSalesByProduct(productData.data || []);
      if (categoryData.success) setSalesByCategory(categoryData.data || []);

      if (salesData.success && salesData.report) {
        const report = salesData.report;
        setSummaryStats({
          totalRevenue: report.summary?.totalRevenue || report.totalRevenue || 0,
          totalOrders: report.summary?.totalOrders || report.totalOrders || 0,
          totalCustomers: report.summary?.uniqueCustomers || report.uniqueCustomers || 0,
          productsSold: report.summary?.totalItemsSold || report.totalItemsSold || 0,
        });
      }
    } catch (err) {
      console.error('Failed to load reports', err);
      setError('Failed to load analytics data.');
    }
    setLoading(false);
  }, [buildDateParams]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const exportReport = async (type: string) => {
    setExportingType(type);
    try {
      const dateParams = buildDateParams();
      const url = `${API_BASE}/admin/reports/${type}?format=xlsx&${dateParams}`;
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const presetLabel = DATE_PRESETS.find(p => p.value === datePreset)?.label || 'ALL';
      a.download = `${type}-report-${presetLabel}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Export failed:', err);
      setError(`Failed to export ${type} report.`);
    }
    setExportingType(null);
  };

  const presetLabel = DATE_PRESETS.find(p => p.value === datePreset)?.label || '';

  return (
    <Box sx={{ pb: 4 }}>
      {/* Top Header & Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>Analytics Overview</Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>Monitor your store's performance and download reports.</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#fff', p: 0.5, borderRadius: 2, border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', pl: 1.5, pr: 1 }}>
            <CalendarMonth sx={{ color: '#94A3B8', fontSize: 18 }} />
          </Box>
          <ToggleButtonGroup
            value={datePreset}
            exclusive
            onChange={(_, v) => v && setDatePreset(v)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                border: 'none', px: 2, py: 0.5, borderRadius: 1.5, textTransform: 'none', fontWeight: 600, color: '#64748B',
                '&.Mui-selected': { bgcolor: '#F8FAFC', color: '#0F172A', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
                '&:hover': { bgcolor: '#F1F5F9' }
              }
            }}
          >
            {DATE_PRESETS.map(p => <ToggleButton key={p.value} value={p.value}>{p.label}</ToggleButton>)}
          </ToggleButtonGroup>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total Revenue', value: `₹${summaryStats.totalRevenue.toLocaleString()}`, icon: <TrendingUp />, color: '#7C3AED', bg: '#F5F3FF' },
          { label: 'Total Orders', value: summaryStats.totalOrders.toLocaleString(), icon: <ShoppingBag />, color: '#3B82F6', bg: '#EFF6FF' },
          { label: 'Unique Customers', value: summaryStats.totalCustomers.toLocaleString(), icon: <People />, color: '#10B981', bg: '#ECFDF5' },
          { label: 'Items Sold', value: summaryStats.productsSold.toLocaleString(), icon: <Inventory />, color: '#F59E0B', bg: '#FFFBEB' },
        ].map((stat, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ borderRadius: 4, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative', overflow: 'visible' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: '#64748B', fontWeight: 600 }}>{stat.label}</Typography>
                  <Avatar sx={{ bgcolor: stat.bg, color: stat.color, width: 36, height: 36 }}>
                    {stat.icon}
                  </Avatar>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  {loading ? <CircularProgress size={24} sx={{ my: 1 }} /> : stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 4, height: '100%', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#0F172A' }}>Top Selling Products</Typography>
              <Box sx={{ height: 320, width: '100%' }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesByProduct} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="productName" width={150} tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="totalRevenue" fill="#7C3AED" radius={[0, 4, 4, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, height: '100%', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 700, color: '#0F172A' }}>Category Share</Typography>
              <Typography variant="caption" sx={{ color: '#64748B', mb: 2, display: 'block' }}>Revenue distribution</Typography>
              <Box sx={{ flexGrow: 1, minHeight: 280 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={salesByCategory} dataKey="totalRevenue" nameKey="categoryName" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2}>
                        {salesByCategory.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 12, color: '#475569', paddingTop: '20px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Export Modules Row */}
      <Typography variant="h6" sx={{ mb: 2, mt: 1, fontWeight: 700, color: '#0F172A' }}>Export Reports (Excel)</Typography>
      <Grid container spacing={3}>
        {reportTypes.map((rt) => (
          <Grid item xs={12} sm={6} md={3} key={rt.id}>
            <Card sx={{ borderRadius: 3, border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)', '&:hover': { borderColor: '#CBD5E1', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }, transition: 'all 0.2s' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: rt.color, width: 40, height: 40 }}>{rt.icon}</Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>{rt.label}</Typography>
                  </Box>
                  <Tooltip title={`Download ${rt.label}`}>
                    <span>
                      <IconButton 
                        size="small" 
                        onClick={() => exportReport(rt.id)} 
                        disabled={exportingType !== null}
                        sx={{ bgcolor: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', '&:hover': { bgcolor: '#fff', color: '#7C3AED', borderColor: '#7C3AED' } }}
                      >
                        {exportingType === rt.id ? <CircularProgress size={16} /> : <Download fontSize="small" />}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

    </Box>
  );
};

export default Reports;
