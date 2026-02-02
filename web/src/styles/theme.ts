export const theme = {
  colors: {
    // Primary palette
    primary: '#2563eb',      // Blue
    primaryHover: '#1d4ed8',
    primaryLight: '#dbeafe',

    // Semantic colors
    success: '#16a34a',
    successLight: '#dcfce7',
    warning: '#ca8a04',
    warningLight: '#fef9c3',
    error: '#dc2626',
    errorLight: '#fee2e2',

    // Neutrals
    background: '#ffffff',
    surface: '#f8fafc',
    border: '#e2e8f0',
    borderDark: '#cbd5e1',

    // Text
    text: '#1e293b',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    textInverse: '#ffffff',

    // Chart colors (for categories)
    chart: [
      '#3b82f6', // blue
      '#10b981', // emerald
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#06b6d4', // cyan
      '#84cc16', // lime
      '#f97316', // orange
      '#6366f1', // indigo
    ],
  },

  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    xxl: '3rem',     // 48px
  },

  borderRadius: {
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    full: '9999px',
  },

  fontSize: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    xxl: '1.5rem',   // 24px
    xxxl: '2rem',    // 32px
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },

  transitions: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
  },
} as const

export type Theme = typeof theme
