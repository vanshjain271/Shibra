import React, { useState } from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Collapse, Button, Typography, Divider } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dashboard, Receipt, ShoppingCart, Inventory, People, LocalOffer, Assessment, ExpandLess, ExpandMore, Language, Settings } from '@mui/icons-material';
import { SIDEBAR_WIDTH, SIDEBAR_BG, SIDEBAR_HOVER, SIDEBAR_ACTIVE, SIDEBAR_ACTIVE_TEXT } from '../../theme/theme';
import shibraLogo from '../../assets/shibra-logo-dark.png';

interface NavItem {
  title: string;
  path?: string;
  icon: React.ReactElement;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { title: 'Dashboard', path: '/', icon: <Dashboard fontSize="small" /> },
  {
    title: 'Orders',
    icon: <ShoppingCart fontSize="small" />,
    children: [
      { title: 'Online Orders', path: '/orders/online', icon: <></> },
      { title: 'Purchase Orders', path: '/orders/purchase', icon: <></> },
      { title: 'Abandoned Carts', path: '/orders/abandoned', icon: <></> },
      { title: 'Bulk Inquiries', path: '/inquiries', icon: <></> },
      { title: 'Bulk Orders', path: '/bulk-orders', icon: <></> },
    ],
  },
  { title: 'Invoices', path: '/invoices', icon: <Receipt fontSize="small" /> },
  {
    title: 'Catalog',
    icon: <Inventory fontSize="small" />,
    children: [
      { title: 'Products', path: '/catalog/products', icon: <></> },
      { title: 'Product Lots', path: '/catalog/lots', icon: <></> },
      { title: 'Categories', path: '/catalog/categories', icon: <></> },
      { title: 'Blogs', path: '/catalog/blogs', icon: <></> },
      { title: 'Reviews', path: '/catalog/reviews', icon: <></> },
    ],
  },
  {
    title: 'Customers',
    icon: <People fontSize="small" />,
    children: [
      { title: 'All Customers', path: '/customers', icon: <></> },
      { title: 'Wishlists', path: '/customers/wishlists', icon: <></> },
    ],
  },
  {
    title: 'Promotions',
    icon: <LocalOffer fontSize="small" />,
    children: [
      { title: 'Coupons', path: '/promotions/coupons', icon: <></> },
      { title: 'Banners', path: '/promotions/banners', icon: <></> },
    ],
  },
  { title: 'Reports', path: '/reports', icon: <Assessment fontSize="small" /> },
  {
    title: 'Settings',
    icon: <Settings fontSize="small" />,
    children: [
      { title: 'Store Settings', path: '/store/settings', icon: <></> },
      { title: 'Store Blog', path: '/store/blog', icon: <></> },
    ],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, handleDrawerToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();

  const getInitialOpenItems = () => {
    const result: { [key: string]: boolean } = {};
    navItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some(
          (child) => child.path && location.pathname.startsWith(child.path)
        );
        if (isChildActive) result[item.title] = true;
      }
    });
    return result;
  };

  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>(getInitialOpenItems);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const handleItemClick = (item: NavItem) => {
    if (item.children) {
      setOpenItems((prev) => ({ ...prev, [item.title]: !prev[item.title] }));
    } else if (item.path) {
      navigate(item.path);
      if (window.innerWidth < 600) handleDrawerToggle();
    }
  };

  const isActive = (path?: string) => path && location.pathname === path;

  const renderNavItem = (item: NavItem, depth = 0) => {
    const active = isActive(item.path);
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openItems[item.title];

    return (
      <React.Fragment key={item.title}>
        <ListItem disablePadding sx={{ px: 1.5, mb: 0.5 }}>
          <ListItemButton
            onClick={() => handleItemClick(item)}
            sx={{
              minHeight: 36,
              py: 0.5,
              px: depth === 0 ? 1.5 : 4,
              color: active ? SIDEBAR_ACTIVE_TEXT : 'rgba(255,255,255,0.7)',
              backgroundColor: active ? SIDEBAR_ACTIVE : 'transparent',
              borderRadius: 1.5,
              '&:hover': { backgroundColor: SIDEBAR_HOVER, color: '#FFFFFF' },
            }}
          >
            {depth === 0 && (
              <ListItemIcon sx={{ minWidth: 0, mr: 1.5, color: active ? '#FFFFFF' : 'rgba(255,255,255,0.6)' }}>
                {item.icon}
              </ListItemIcon>
            )}
            <ListItemText
              primary={item.title}
              primaryTypographyProps={{
                fontSize: depth === 0 ? 14 : 13,
                fontWeight: active ? 600 : 500,
                color: active ? SIDEBAR_ACTIVE_TEXT : 'inherit',
              }}
            />
            {hasChildren && (isOpen
              ? <ExpandLess sx={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} />
              : <ExpandMore sx={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
            )}
          </ListItemButton>
        </ListItem>
        {hasChildren && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ mb: 1 }}>
              {item.children!.map((child) => renderNavItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <>
      {/* Shibra Logo Header */}
      <Box sx={{ p: 2.5, pb: 2, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <img src={shibraLogo} alt="Shibra" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
        <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', mt: 0.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Admin Panel
        </Typography>
      </Box>

      <List sx={{ px: 0, py: 1.5, flexGrow: 1 }}>{navItems.map((item) => renderNavItem(item))}</List>

      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.08)' }} />
        <Button
          fullWidth variant="outlined" onClick={toggleLanguage}
          startIcon={<Language sx={{ fontSize: 18 }} />}
          sx={{
            color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.15)',
            justifyContent: 'flex-start', textTransform: 'none', fontSize: 13, fontWeight: 500,
            '&:hover': { backgroundColor: SIDEBAR_HOVER, borderColor: 'rgba(255,255,255,0.3)', color: '#FFFFFF' }
          }}
        >
          {i18n.language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
        </Button>
      </Box>
    </>
  );

  const paperSx = {
    boxSizing: 'border-box' as const,
    width: SIDEBAR_WIDTH,
    backgroundColor: SIDEBAR_BG,
    color: '#FFFFFF',
    borderRight: 'none',
  };

  return (
    <Box component="nav" sx={{ width: { sm: SIDEBAR_WIDTH }, flexShrink: { sm: 0 } }}>
      <Drawer
        variant="temporary" open={mobileOpen} onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': paperSx }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { ...paperSx, boxShadow: '4px 0 24px rgba(13,27,42,0.3)' },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
