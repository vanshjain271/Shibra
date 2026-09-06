import { createTheme } from '@mui/material/styles';
import type {} from '@mui/x-data-grid/themeAugmentation';

// Shibra Brand Colors
// Primary: Electric Blue #2563EB (matches logo gradient end)
// Dark:    Deep Navy #0D1B2A
// Accent:  Cyan #00B4D8 (matches logo gradient start)

export const theme = createTheme({
  palette: {
    primary: { main: '#2563EB' },        // Shibra Electric Blue
    secondary: { main: '#0D1B2A' },      // Shibra Deep Navy
    background: { default: '#F0F4FF', paper: '#FFFFFF' },
    text: { primary: '#0D1B2A', secondary: '#475569' },
    success: { main: '#22C55E' },
    error: { main: '#EF4444' },
    warning: { main: '#F59E0B' },
    info: { main: '#00B4D8' },           // Shibra Cyan
    divider: '#DBEAFE',
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #00B4D8 0%, #2563EB 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0096B5 0%, #1D4ED8 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px 0 rgb(37 99 235 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
          border: '1px solid #DBEAFE',
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: 16 },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgb(37 99 235 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#F0F4FF',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#BFDBFE' },
          '&:hover': { backgroundColor: '#FFFFFF' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#93C5FD' },
          '&.Mui-focused': {
            backgroundColor: '#FFFFFF',
            boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.15)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#2563EB',
            borderWidth: '1px',
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#EFF6FF',
          '& .MuiTableCell-root': {
            color: '#1E40AF',
            fontWeight: 700,
            fontSize: '0.75rem',
            borderBottom: '1px solid #DBEAFE',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #F0F4FF',
          padding: '16px',
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          border: '1px solid #DBEAFE',
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          boxShadow: '0 1px 2px 0 rgb(37 99 235 / 0.05)',
          '& .MuiDataGrid-cell': { borderBottom: '1px solid #F0F4FF' },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#EFF6FF',
            borderBottom: '1px solid #DBEAFE',
            color: '#1E40AF',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
          '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #DBEAFE' },
          '& .MuiDataGrid-row:hover': { backgroundColor: '#EFF6FF' },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgb(37 99 235 / 0.12), 0 8px 10px -6px rgb(0 0 0 / 0.08)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 600 },
        outlined: { backgroundColor: '#FFFFFF' },
      },
    },
  },
});

export const SIDEBAR_WIDTH = 260;
export const SIDEBAR_BG = '#0D1B2A';          // Shibra Deep Navy
export const SIDEBAR_HOVER = '#1A2D45';
export const SIDEBAR_ACTIVE = '#2563EB';      // Shibra Electric Blue
export const SIDEBAR_ACTIVE_TEXT = '#FFFFFF';
