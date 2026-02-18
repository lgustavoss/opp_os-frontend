/**
 * Configurações centralizadas do tema
 * Todas as cores, espaçamentos e estilos devem ser definidos aqui
 */

export const theme = {
  colors: {
    primary: {
      light: '#0ea5e9',
      main: '#0284c7',
      dark: '#0369a1',
    },
    secondary: {
      light: '#64748b',
      main: '#475569',
      dark: '#334155',
    },
    success: {
      light: '#4ade80',
      main: '#22c55e',
      dark: '#16a34a',
    },
    danger: {
      light: '#f87171',
      main: '#ef4444',
      dark: '#dc2626',
    },
    warning: {
      light: '#fbbf24',
      main: '#f59e0b',
      dark: '#d97706',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
      disabled: '#94a3b8',
    },
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  borderRadius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  typography: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  transitions: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
}

export default theme

