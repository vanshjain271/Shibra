import React, { useState } from 'react';
import { AppBar, Toolbar, Box, IconButton, Badge, Typography, Button, Menu, MenuItem } from '@mui/material';
import { Notifications, AccountCircle, Storefront, OpenInNew, Menu as MenuIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { SIDEBAR_WIDTH } from '../../theme/theme';

interface TopBarProps {
  handleDrawerToggle: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ handleDrawerToggle }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleClose();
    localStorage.removeItem('admin_token');
    window.location.href = '/login';
  };

  const handleSettings = () => {
    handleClose();
    navigate('/store/settings');
  };

  const handleProfile = () => {
    handleClose();
    navigate('/profile');
  };

  const handleVisitStore = () => {
    // Open frontend in new tab
    window.open('https://shibra.in', '_blank');
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        ml: { sm: `${SIDEBAR_WIDTH}px` },
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        color: '#1F2937',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { sm: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        <Button
          startIcon={<Storefront />}
          endIcon={<OpenInNew fontSize="small" />}
          onClick={handleVisitStore}
          sx={{ textTransform: 'none', color: '#1F2937' }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Arbuda Accessories</Typography>
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton color="inherit" sx={{ mr: 1 }}>
          <Badge badgeContent={0} color="error"><Notifications /></Badge>
        </IconButton>
        <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
          <AccountCircle />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleProfile}>Profile</MenuItem>
          <MenuItem onClick={handleSettings}>Settings</MenuItem>
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
