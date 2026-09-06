import React, { useState, useEffect } from 'react';
import {
  Box, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Paper, TextField, MenuItem, Switch, FormControlLabel,
  Button, Divider, Alert, Snackbar, Stack, Grid
} from '@mui/material';
import {
  Storefront, ShoppingCart, LocalShipping, Payment,
  Settings, Undo, Label, Search, Notifications, Login, Description, Info
} from '@mui/icons-material';

interface StoreSettingsData {
  // Store Details
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  storeLogo: string;
  paymentQrCode: string;
  tickerText: string;
  tickerEnabled: boolean;
  storeFeatures: Array<{ title: string; subtitle: string; iconName: string }>;

  // Checkout
  roundingMode: string;
  showTaxInfo: boolean;
  minOrderAmount: number;
  cartNote: string;
  // Delivery
  deliveryFee: number;
  freeDeliveryThreshold: number;
  allIndiaDelivery: boolean;
  serviceType: 'delivery' | 'pickup' | 'both';
  // Payment
  codEnabled: boolean;
  advancePartialPayment: boolean;
  partialPaymentType: 'percentage' | 'flat';
  partialPaymentPercent: number;
  partialPaymentFlatAmount: number;
  razorpayEnabled: boolean;
  // Order
  autoConfirmOrders: boolean;
  orderNotes: string;
  // SEO
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  // Notifications
  smsNotifications: boolean;
  emailNotifications: boolean;
  // Policies
  termsAndConditions: string;
  privacyPolicy: string;
  returnPolicy: string;
  refundPolicy: string;
  shippingPolicy: string;
  cancellationPolicy: string;
  // About
  aboutUs: string;
}

const defaultSettings: StoreSettingsData = {
  storeName: 'Shibra',
  storeEmail: 'contact@shibra.in',
  storePhone: '9876543210',
  storeAddress: 'Mumbai, India',
  storeLogo: '',
  paymentQrCode: '',
  tickerText: '✅ ऑर्डर कन्फर्म करने के लिए Token जमा करना ज़रूरी है 💰 📦',
  tickerEnabled: true,
  storeFeatures: [
    { title: 'Wholesale Pricing', subtitle: 'On all products', iconName: 'thumb-up' },
    { title: 'Secure Payment', subtitle: '100% safe checkout', iconName: 'shield-check' }
  ],

  roundingMode: 'No Rounding',
  showTaxInfo: true,
  minOrderAmount: 500,
  cartNote: '',
  deliveryFee: 50,
  freeDeliveryThreshold: 999,
  allIndiaDelivery: true,
  serviceType: 'delivery',
  codEnabled: true,
  advancePartialPayment: false,
  partialPaymentType: 'percentage',
  partialPaymentPercent: 20,
  partialPaymentFlatAmount: 100,
  razorpayEnabled: false,
  autoConfirmOrders: false,
  orderNotes: '',
  metaTitle: 'Shibra - Arbuda Accessories',
  metaDescription: 'Best quality mobile accessories at affordable prices',
  metaKeywords: 'mobile, accessories, phone, cases, earphones',
  smsNotifications: true,
  emailNotifications: true,
  termsAndConditions: '',
  privacyPolicy: '',
  returnPolicy: '',
  refundPolicy: '',
  shippingPolicy: '',
  cancellationPolicy: '',
  aboutUs: ''
};

import apiClient from '../services/api.service';

const StoreSettings: React.FC = () => {
  const [selectedSection, setSelectedSection] = useState('store');
  const [settings, setSettings] = useState<StoreSettingsData>(defaultSettings);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const sections = [
    { id: 'store', label: 'Store Details', icon: <Storefront /> },
    { id: 'checkout', label: 'Checkout Settings', icon: <ShoppingCart /> },
    { id: 'delivery', label: 'Delivery Settings', icon: <LocalShipping /> },
    { id: 'payment', label: 'Payment Settings', icon: <Payment /> },
    { id: 'order', label: 'Order Settings', icon: <Settings /> },
    { id: 'return', label: 'Return Order Settings', icon: <Undo /> },
    { id: 'label', label: 'Label Settings', icon: <Label /> },
    { id: 'seo', label: 'SEO Settings', icon: <Search /> },
    { id: 'notifications', label: 'Notifications Settings', icon: <Notifications /> },
    { id: 'login', label: 'Login Settings', icon: <Login /> },
    { id: 'policies', label: 'Policies', icon: <Description /> },
    { id: 'about', label: 'About Us', icon: <Info /> },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await apiClient.get<any>('/admin/settings');
      if (response.success && response.data) {
        setSettings({ ...defaultSettings, ...response.data });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      
      // Append all settings to FormData
      Object.keys(settings).forEach(key => {
        if (key === 'storeFeatures') {
          formData.append(key, JSON.stringify(settings[key as keyof StoreSettingsData]));
        } else {
          formData.append(key, String(settings[key as keyof StoreSettingsData]));
        }
      });

      // Append QR file if selected
      if (qrFile) {
        formData.append('image', qrFile);
      }

      const response = await apiClient.put<any>('/admin/settings', formData);
      if (response.success) {
        setSnackbar({ open: true, message: 'Settings saved successfully!', severity: 'success' });
        setQrFile(null); // Reset file input
        if (response.data?.paymentQrCode) {
          setSettings(prev => ({ ...prev, paymentQrCode: response.data.paymentQrCode }));
        }
      } else {
        throw new Error('Failed to save');
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to save settings', severity: 'error' });
    }
    setSaving(false);
  };

  const renderContent = () => {
    switch (selectedSection) {
      case 'store':
        return (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 1, fontWeight: 700, color: '#0F172A' }}>Store Details</Typography>
              <Typography variant="body2" sx={{ mb: 3, color: '#64748B' }}>Basic information about your store that appears on your website.</Typography>
              <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 3.5, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.02), 0 2px 4px -2px rgb(0 0 0 / 0.02)' }}>
              <TextField
                fullWidth
                label="Store Name"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              />
              <TextField
                fullWidth
                label="Store Email"
                type="email"
                value={settings.storeEmail}
                onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
              />
              <TextField
                fullWidth
                label="Store Phone"
                value={settings.storePhone}
                onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
              />
              <TextField
                fullWidth
                label="Store Address"
                multiline
                rows={2}
                value={settings.storeAddress}
                onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
              />
              <TextField
                fullWidth
                label="Store Logo URL"
                value={settings.storeLogo}
                onChange={(e) => setSettings({ ...settings, storeLogo: e.target.value })}
                helperText="Enter URL of your store logo"
              />
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Announcement Ticker</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControlLabel
                  control={<Switch checked={settings.tickerEnabled} onChange={(e) => setSettings({ ...settings, tickerEnabled: e.target.checked })} />}
                  label="Enable Ticker"
                />
              </Box>
              <TextField
                fullWidth
                label="Ticker Text"
                value={settings.tickerText}
                onChange={(e) => setSettings({ ...settings, tickerText: e.target.value })}
                helperText="This text will scroll continuously at the top of the storefront. Use emojis and spaces for better style."
                disabled={!settings.tickerEnabled}
                multiline
                rows={2}
              />
              {settings.tickerEnabled && settings.tickerText && (
                <Box sx={{ p: 1.5, bgcolor: '#4C1D95', borderRadius: 2, overflow: 'hidden' }}>
                  <Typography variant="caption" sx={{ color: '#DDD6FE', display: 'block', mb: 0.5, fontWeight: 600 }}>Live Preview:</Typography>
                  <Box sx={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    <Box
                      component="span"
                      sx={{
                        color: 'white',
                        fontSize: 12,
                        display: 'inline-block',
                        animation: 'adminMarquee 15s linear infinite',
                        '@keyframes adminMarquee': {
                          '0%': { transform: 'translateX(100%)' },
                          '100%': { transform: 'translateX(-100%)' },
                        }
                      }}
                    >
                      📢 &nbsp;{settings.tickerText}&nbsp;&nbsp;&nbsp;📢 &nbsp;{settings.tickerText}
                    </Box>
                  </Box>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              </Paper>
            </Box>
          </>
        );

      case 'checkout':
        return (
          <>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Checkout Settings</Typography>
            <Stack spacing={3}>
              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Order Precision</Typography>
                <TextField
                  select
                  fullWidth
                  label="Rounding Mode"
                  value={settings.roundingMode}
                  onChange={(e) => setSettings({ ...settings, roundingMode: e.target.value })}
                  helperText="Choose how you want to round Cart Total"
                >
                  <MenuItem value="No Rounding">No Rounding (Exact)</MenuItem>
                  <MenuItem value="Round Up">Round Up (Ceil)</MenuItem>
                  <MenuItem value="Round Down">Round Down (Floor)</MenuItem>
                </TextField>
              </Paper>

              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Order Limits</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Minimum Order Amount"
                      value={settings.minOrderAmount}
                      onChange={(e) => setSettings({ ...settings, minOrderAmount: parseInt(e.target.value) || 0 })}
                      InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography> }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={<Switch checked={settings.showTaxInfo} onChange={(e) => setSettings({ ...settings, showTaxInfo: e.target.checked })} />}
                      label="Include Tax in Pricing"
                      sx={{ mt: 1 }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Checkout Message</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  This note will be shown on the checkout page to your customers.
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="e.g. Please double check your shipping address before placing order."
                  value={settings.cartNote}
                  onChange={(e) => setSettings({ ...settings, cartNote: e.target.value })}
                />
              </Paper>
            </Stack>
          </>
        );

      case 'delivery':
        return (
          <>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Delivery Settings</Typography>
            <Stack spacing={3}>
              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Fees & Thresholds</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Standard Delivery Fee"
                      value={settings.deliveryFee}
                      onChange={(e) => setSettings({ ...settings, deliveryFee: parseInt(e.target.value) || 0 })}
                      InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography> }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Free Delivery Threshold"
                      value={settings.freeDeliveryThreshold}
                      onChange={(e) => setSettings({ ...settings, freeDeliveryThreshold: parseInt(e.target.value) || 0 })}
                      InputProps={{ startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography> }}
                    />
                  </Grid>
                </Grid>
                <FormControlLabel
                  control={<Switch checked={settings.allIndiaDelivery} onChange={(e) => setSettings({ ...settings, allIndiaDelivery: e.target.checked })} />}
                  label="Deliver to all Pincodes in India"
                  sx={{ mt: 2 }}
                />
              </Paper>

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Service Configuration</Typography>
                <Grid container spacing={2}>
                  {[
                    { value: 'delivery', label: 'Home Delivery', icon: '🚚', desc: "Orders delivered to customer address via courier." },
                    { value: 'pickup', label: 'Self Pickup', icon: '🏪', desc: "Customers collect orders from your physical store." },
                    { value: 'both', label: 'Hybrid Model', icon: '🔄', desc: "Offer both delivery and pickup options to customers." }
                  ].map((option) => (
                    <Grid item xs={12} md={4} key={option.value}>
                      <Paper
                        sx={{
                          p: 2,
                          height: '100%',
                          cursor: 'pointer',
                          transition: '0.2s',
                          border: settings.serviceType === option.value ? '2px solid #2563EB' : '1px solid #E2E8F0',
                          bgcolor: settings.serviceType === option.value ? '#EFF6FF' : '#fff',
                          '&:hover': { borderColor: 'primary.main', bgcolor: '#F8FAFC' },
                          borderRadius: 2
                        }}
                        onClick={() => setSettings({ ...settings, serviceType: option.value as any })}
                      >
                        <Typography variant="h5" sx={{ mb: 1 }}>{option.icon}</Typography>
                        <Typography variant="subtitle1" fontWeight={700}>{option.label}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2, display: 'block' }}>{option.desc}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Stack>
          </>
        );

      case 'payment':
        return (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>Payment Methods</Typography>
              <Button size="small" variant="text" sx={{ fontWeight: 600 }}>Manage Rules</Button>
            </Box>

            <Stack spacing={2.5}>
              <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ p: 1.5, bgcolor: '#F1F5F9', borderRadius: 2, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6">💵</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Cash on Delivery (COD)</Typography>
                      <Typography variant="body2" color="text.secondary">Accept physical cash during delivery of the product.</Typography>
                    </Box>
                  </Box>
                  <Switch checked={settings.codEnabled} onChange={(e) => setSettings({ ...settings, codEnabled: e.target.checked })} />
                </Box>

                {settings.codEnabled && (
                  <Box sx={{ mt: 2, pl: 8 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Partial Payment for COD</Typography>
                        <Typography variant="caption" color="text.secondary">Ask customer to pay a percentage upfront to confirm COD.</Typography>
                      </Box>
                      <Switch size="small" checked={settings.advancePartialPayment} onChange={(e) => setSettings({ ...settings, advancePartialPayment: e.target.checked })} />
                    </Box>
                    {settings.advancePartialPayment && (
                      <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                          select
                          label="Type"
                          value={settings.partialPaymentType}
                          onChange={(e) => setSettings({ ...settings, partialPaymentType: e.target.value as 'percentage' | 'flat' })}
                          size="small"
                          sx={{ width: 150 }}
                        >
                          <MenuItem value="percentage">Percentage</MenuItem>
                          <MenuItem value="flat">Flat Amount</MenuItem>
                        </TextField>

                        {settings.partialPaymentType === 'percentage' ? (
                          <TextField
                            type="number"
                            label="Pre-pay Percent"
                            value={settings.partialPaymentPercent}
                            onChange={(e) => setSettings({ ...settings, partialPaymentPercent: parseInt(e.target.value) || 0 })}
                            InputProps={{ endAdornment: <Typography variant="caption">%</Typography> }}
                            size="small"
                            sx={{ width: 150 }}
                          />
                        ) : (
                          <TextField
                            type="number"
                            label="Flat Amount"
                            value={settings.partialPaymentFlatAmount}
                            onChange={(e) => setSettings({ ...settings, partialPaymentFlatAmount: parseInt(e.target.value) || 0 })}
                            InputProps={{ startAdornment: <Typography variant="caption" sx={{ mr: 1 }}>₹</Typography> }}
                            size="small"
                            sx={{ width: 150 }}
                          />
                        )}
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>

              <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ p: 1.5, bgcolor: '#F1F5F9', borderRadius: 2, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6">💳</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Online Payment Gateway</Typography>
                      <Typography variant="body2" color="text.secondary">Accept UPI, Credit/Debit Cards, Net Banking via Razorpay.</Typography>
                    </Box>
                  </Box>
                  <Switch checked={settings.razorpayEnabled} onChange={(e) => setSettings({ ...settings, razorpayEnabled: e.target.checked })} />
                </Box>
                {settings.razorpayEnabled && (
                  <Box sx={{ mt: 2, pl: 8 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Button variant="outlined" size="small">Configure Credentials</Button>
                  </Box>
                )}
              </Paper>

              <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ p: 1.5, bgcolor: '#F1F5F9', borderRadius: 2, display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6">🤳</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Payment QR Code</Typography>
                      <Typography variant="body2" color="text.secondary">Upload your UPI QR code for direct payments.</Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={4}>
                    {settings.paymentQrCode || qrFile ? (
                      <Box sx={{ width: '100%', aspectRatio: '1/1', bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden', p: 1 }}>
                        <img 
                          src={qrFile ? URL.createObjectURL(qrFile) : settings.paymentQrCode} 
                          alt="Payment QR" 
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </Box>
                    ) : (
                      <Box sx={{ width: '100%', aspectRatio: '1/1', bgcolor: '#F8FAFC', border: '2px dashed #E2E8F0', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                        <Typography variant="caption" color="text.secondary" textAlign="center">No QR Code Uploaded</Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Stack spacing={2}>
                      <Button
                        variant="outlined"
                        component="label"
                        sx={{ textTransform: 'none', borderRadius: 2 }}
                      >
                        {settings.paymentQrCode ? 'Change QR Code' : 'Upload QR Code'}
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setQrFile(e.target.files[0]);
                            }
                          }}
                        />
                      </Button>
                      <Typography variant="caption" color="text.secondary">
                        Supported formats: JPG, PNG, WebP. Max size: 5MB.
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>

              <Paper sx={{ p: 2.5, bgcolor: '#FFFBEB', border: '1px solid #FEF3C7', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  🛡️ Payment Safety Rules
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Set rules to automatically hide or restrict payment methods based on order value or customer history.
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>Hide COD for orders below ₹500</Typography>
                    <Switch size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>Hide COD for orders above ₹10,000</Typography>
                    <Switch size="small" />
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          </>
        );

      case 'order':
        return (
          <>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Order Settings</Typography>
            <Stack spacing={3}>
              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Auto-Confirm Flow</Typography>
                    <Typography variant="body2" color="text.secondary">Automatically move paid orders to "Confirmed" status.</Typography>
                  </Box>
                  <Switch checked={settings.autoConfirmOrders} onChange={(e) => setSettings({ ...settings, autoConfirmOrders: e.target.checked })} />
                </Box>
              </Paper>

              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Order Footer (Invoice Note)</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="e.g. Thank you for shopping with us! For support reach us at +91..."
                  value={settings.orderNotes}
                  onChange={(e) => setSettings({ ...settings, orderNotes: e.target.value })}
                />
              </Paper>
            </Stack>
          </>
        );

      case 'seo':
        return (
          <>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>SEO Settings</Typography>
            <Stack spacing={3}>
              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Search Engine Appearance</Typography>
                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    label="Meta Title"
                    value={settings.metaTitle}
                    onChange={(e) => setSettings({ ...settings, metaTitle: e.target.value })}
                    helperText="Limit to 60 characters for best results"
                  />
                  <TextField
                    fullWidth
                    label="Meta Description"
                    multiline
                    rows={3}
                    value={settings.metaDescription}
                    onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
                    helperText="A brief summary shown in search results (160 characters)"
                  />
                  <TextField
                    fullWidth
                    label="Meta Keywords"
                    value={settings.metaKeywords}
                    onChange={(e) => setSettings({ ...settings, metaKeywords: e.target.value })}
                  />
                </Stack>
              </Paper>
            </Stack>
          </>
        );

      case 'notifications':
        return (
          <>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Notifications</Typography>
            <Stack spacing={2.5}>
              <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ p: 1, bgcolor: '#F1F5F9', borderRadius: 2 }}>💬</Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>SMS Alerts</Typography>
                      <Typography variant="body2" color="text.secondary">Notify customers via SMS on order placement/shipping.</Typography>
                    </Box>
                  </Box>
                  <Switch checked={settings.smsNotifications} onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })} />
                </Box>
              </Paper>
              <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ p: 1, bgcolor: '#F1F5F9', borderRadius: 2 }}>📧</Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Email Alerts</Typography>
                      <Typography variant="body2" color="text.secondary">Send branded emails for invoices and trackings.</Typography>
                    </Box>
                  </Box>
                  <Switch checked={settings.emailNotifications} onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })} />
                </Box>
              </Paper>
            </Stack>
          </>
        );

      case 'policies':
        return (
          <>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Legal Policies</Typography>
            <Stack spacing={3}>
              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Terms and Conditions</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  value={settings.termsAndConditions}
                  onChange={(e) => setSettings({ ...settings, termsAndConditions: e.target.value })}
                />
              </Paper>
              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Privacy Policy</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  value={settings.privacyPolicy}
                  onChange={(e) => setSettings({ ...settings, privacyPolicy: e.target.value })}
                />
              </Paper>
              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Return Policy</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  value={settings.returnPolicy}
                  onChange={(e) => setSettings({ ...settings, returnPolicy: e.target.value })}
                />
              </Paper>
              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Refund Policy</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  value={settings.refundPolicy}
                  onChange={(e) => setSettings({ ...settings, refundPolicy: e.target.value })}
                />
              </Paper>
              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Shipping Policy</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  value={settings.shippingPolicy}
                  onChange={(e) => setSettings({ ...settings, shippingPolicy: e.target.value })}
                />
              </Paper>
              <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Cancellation Policy</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  value={settings.cancellationPolicy}
                  onChange={(e) => setSettings({ ...settings, cancellationPolicy: e.target.value })}
                />
              </Paper>
            </Stack>
          </>
        );

      case 'about':
        return (
          <>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Brand Identity</Typography>
            <Paper sx={{ p: 2.5, borderRadius: 2, border: '1px solid #E2E8F0' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>About Us Content</Typography>
              <TextField
                fullWidth
                multiline
                rows={10}
                value={settings.aboutUs}
                onChange={(e) => setSettings({ ...settings, aboutUs: e.target.value })}
                placeholder="Share your brand story with your customers..."
              />
            </Paper>
          </>
        );

      default:
        return (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Box sx={{ fontSize: 40, mb: 2 }}>🚧</Box>
            <Typography variant="h6" color="text.secondary">
              Section Under Construction
            </Typography>
            <Typography variant="caption" color="text.secondary">
              We're working hard to bring you more granular control over your store.
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 800, 
          background: 'linear-gradient(135deg, #0F172A 0%, #475569 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em'
        }}>
          Store Settings
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748B', mt: 1, fontWeight: 500 }}>Manage your store's configuration and appearance</Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={3}>
          <Box sx={{ position: 'sticky', top: 88 }}>
            <List sx={{ px: 0 }}>
              {sections.map((section) => (
                <ListItem key={section.id} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    selected={selectedSection === section.id}
                    onClick={() => setSelectedSection(section.id)}
                    sx={{
                      borderRadius: 3,
                      py: 1.2,
                      px: 2,
                      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderLeft: '4px solid transparent',
                      '&.Mui-selected': { 
                        bgcolor: 'rgba(124, 58, 237, 0.06)', 
                        color: 'primary.main', 
                        borderLeft: '4px solid #7C3AED',
                        '& .MuiListItemIcon-root': { color: 'primary.main' } 
                      },
                      '&:hover': { 
                        bgcolor: selectedSection === section.id ? 'rgba(124, 58, 237, 0.1)' : '#F8FAFC',
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 44, color: selectedSection === section.id ? 'primary.main' : '#94A3B8', transition: 'color 0.2s' }}>
                      {React.cloneElement(section.icon as React.ReactElement, { fontSize: 'small' })}
                    </ListItemIcon>
                    <ListItemText primary={section.label} primaryTypographyProps={{ fontSize: 14, fontWeight: selectedSection === section.id ? 700 : 500 }} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Grid>
        <Grid item xs={12} md={9}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ flex: 1 }}>
              {renderContent()}
            </Box>
            <Box sx={{ 
              position: 'sticky', 
              bottom: 24, 
              mt: 6,
              p: 2.5, 
              display: 'flex', 
              gap: 2, 
              justifyContent: 'flex-end',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              borderRadius: 4,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
              zIndex: 10
            }}>
              <Button variant="outlined" sx={{ borderRadius: 2.5, textTransform: 'none', px: 3, fontWeight: 600, borderColor: '#E2E8F0', color: '#475569', '&:hover': { bgcolor: '#F8FAFC', borderColor: '#CBD5E1' } }} onClick={loadSettings}>Discard Changes</Button>
              <Button variant="contained" sx={{ borderRadius: 2.5, textTransform: 'none', px: 5, fontWeight: 600, background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', boxShadow: '0 4px 14px 0 rgba(124, 58, 237, 0.39)', '&:hover': { boxShadow: '0 6px 20px rgba(124, 58, 237, 0.23)' } }} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StoreSettings;
