export const darkTheme = {
  colors: {
    background: '#0F0F14',
    surface: '#1A1A24',
    surfaceElevated: '#232334',
    border: '#2A2A3C',
    primary: '#6C5CE7',
    primaryLight: '#A29BFE',
    primaryDark: '#5A4BD1',
    success: '#00D68F',
    danger: '#FF6B6B',
    warning: '#FDCB6E',
    info: '#74B9FF',
    textPrimary: '#F0F0F5',
    textSecondary: '#8888A0',
    textMuted: '#555570',
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },
};

export type Theme = typeof darkTheme;
