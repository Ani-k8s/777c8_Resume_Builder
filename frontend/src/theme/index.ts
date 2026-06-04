import { createTheme, alpha } from '@mui/material/styles';

// ── 777c8 Brand Colors ──────────────────────────────────────────────────────
const brand = {
  navy: {
    900: '#060E1A',
    800: '#0A1628',
    700: '#0D1B2A',
    600: '#132238',
    500: '#1B3050',
    400: '#243D62',
    300: '#3A5A80',
  },
  gold: {
    main: '#C9A84C',
    light: '#D4B96A',
    dark: '#A88B3A',
    50: 'rgba(201, 168, 76, 0.08)',
    100: 'rgba(201, 168, 76, 0.15)',
  },
  white: '#F0F0F0',
  text: {
    primary: '#E8E8E8',
    secondary: '#8899AA',
    muted: '#5A6B7C',
  },
  success: '#4CAF50',
  error: '#EF5350',
  warning: '#FFA726',
  info: '#42A5F5',
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: brand.navy[700],
      light: brand.navy[500],
      dark: brand.navy[900],
    },
    secondary: {
      main: brand.gold.main,
      light: brand.gold.light,
      dark: brand.gold.dark,
    },
    background: {
      default: brand.navy[800],
      paper: brand.navy[600],
    },
    text: {
      primary: brand.text.primary,
      secondary: brand.text.secondary,
    },
    success: { main: brand.success },
    error: { main: brand.error },
    warning: { main: brand.warning },
    info: { main: brand.info },
    divider: alpha(brand.text.muted, 0.2),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: brand.text.primary,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      color: brand.text.primary,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: brand.text.primary,
    },
    h4: {
      fontSize: '1.1rem',
      fontWeight: 600,
      color: brand.text.primary,
    },
    h5: {
      fontSize: '0.95rem',
      fontWeight: 600,
      color: brand.text.primary,
    },
    h6: {
      fontSize: '0.85rem',
      fontWeight: 600,
      color: brand.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.8125rem',
      lineHeight: 1.5,
      color: brand.text.secondary,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
    caption: {
      fontSize: '0.75rem',
      color: brand.text.muted,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: `${brand.navy[500]} ${brand.navy[800]}`,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { background: brand.navy[800] },
          '&::-webkit-scrollbar-thumb': {
            background: brand.navy[500],
            borderRadius: 3,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 20px',
          fontSize: '0.8125rem',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          background: brand.gold.main,
          color: brand.navy[900],
          fontWeight: 700,
          '&:hover': {
            background: brand.gold.light,
          },
        },
        outlined: {
          borderColor: alpha(brand.text.muted, 0.3),
          color: brand.text.primary,
          '&:hover': {
            borderColor: brand.gold.main,
            background: brand.gold[50],
          },
        },
        text: {
          color: brand.text.secondary,
          '&:hover': {
            background: alpha(brand.text.muted, 0.08),
            color: brand.text.primary,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: brand.navy[600],
          border: `1px solid ${alpha(brand.text.muted, 0.12)}`,
          borderRadius: 10,
          boxShadow: `0 2px 8px ${alpha('#000', 0.2)}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            background: alpha(brand.navy[800], 0.5),
            '& fieldset': {
              borderColor: alpha(brand.text.muted, 0.2),
            },
            '&:hover fieldset': {
              borderColor: alpha(brand.gold.main, 0.4),
            },
            '&.Mui-focused fieldset': {
              borderColor: brand.gold.main,
              borderWidth: 1,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          fontSize: '0.75rem',
          height: 26,
        },
        filled: {
          background: alpha(brand.gold.main, 0.12),
          color: brand.gold.light,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: alpha(brand.text.muted, 0.1),
          padding: '12px 16px',
          fontSize: '0.8125rem',
        },
        head: {
          fontWeight: 700,
          color: brand.text.secondary,
          textTransform: 'uppercase',
          fontSize: '0.7rem',
          letterSpacing: '0.08em',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: brand.navy[700],
          border: `1px solid ${alpha(brand.text.muted, 0.15)}`,
          borderRadius: 12,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.8125rem',
          '&.Mui-selected': {
            color: brand.gold.main,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: brand.gold.main,
          height: 2,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          marginBottom: 2,
          '&:hover': {
            background: alpha(brand.text.muted, 0.08),
          },
          '&.Mui-selected': {
            background: alpha(brand.gold.main, 0.1),
            borderLeft: `3px solid ${brand.gold.main}`,
            '&:hover': {
              background: alpha(brand.gold.main, 0.15),
            },
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: brand.navy[500],
          fontSize: '0.75rem',
          border: `1px solid ${alpha(brand.text.muted, 0.2)}`,
        },
      },
    },
  },
});

export { brand };
export default theme;
