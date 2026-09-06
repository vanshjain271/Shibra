import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Snackbar, Alert, Divider } from '@mui/material';
import { Save, Lock } from '@mui/icons-material';
import apiClient from '../services/api.service';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const resp = await apiClient.get<any>('/admin/profile');
      if (resp?.data) {
        setProfile({ name: resp.data.name || '', email: resp.data.email || '' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to load profile', severity: 'error' });
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const payload: any = { name: profile.name, email: profile.email };
      
      if (passwords.newPassword) {
        if (passwords.newPassword !== passwords.confirmPassword) {
          setSnackbar({ open: true, message: 'New passwords do not match', severity: 'error' });
          setSaving(false);
          return;
        }
        if (!passwords.oldPassword) {
          setSnackbar({ open: true, message: 'Old password is required', severity: 'error' });
          setSaving(false);
          return;
        }
        payload.oldPassword = passwords.oldPassword;
        payload.newPassword = passwords.newPassword;
      }

      await apiClient.put('/admin/profile', payload);
      setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' });
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to update profile';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
    setSaving(false);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>My Profile</Typography>

      <Paper sx={{ p: 4, borderRadius: 2 }}>
        {loading ? (
          <Typography>Loading...</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Personal Information</Typography>
              <TextField
                fullWidth
                label="Name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lock fontSize="small" /> Change Password
              </Typography>
              <TextField
                fullWidth
                label="Current Password"
                type="password"
                value={passwords.oldPassword}
                onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                sx={{ mb: 2 }}
                placeholder="Leave blank if not changing"
              />
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Confirm New Password"
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSaveProfile}
                disabled={saving}
                size="large"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;
