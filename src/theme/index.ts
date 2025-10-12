import type { ThemeConfig } from 'antd';

// Sentra Brand Color Palette
export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#e0f2f1',
    100: '#b2dfdb',
    200: '#80cbc4',
    300: '#4db6ac',
    400: '#26a69a',
    500: '#009688', // Sentra Teal - Core brand color
    600: '#00897b',
    700: '#00796b',
    800: '#00695c',
    900: '#004d40',
  },
  
  // Secondary Colors
  secondary: {
    50: '#f5f5f5',
    100: '#e7e7e7',
    200: '#d1d1d1',
    300: '#b0b0b0',
    400: '#888888',
    500: '#6d6d6d',
    600: '#5d5d5d',
    700: '#4f4f4f',
    800: '#454545',
    900: '#1E1E1E', // Charcoal Gray - Industrial backdrop
  },
  
  // Accent Colors
  accent: {
    yellow: '#F7C600', // Safety Yellow - Graphs, inspection metrics
    orange: '#FF6A00', // Alert Orange - Attention, alerts, out-of-service
  },
  
  // Status Colors
  success: {
    50: '#e8f5e8',
    100: '#c8e6c9',
    200: '#a5d6a7',
    300: '#81c784',
    400: '#66bb6a',
    500: '#32C766', // Lime Green - Passed inspections, uptime
    600: '#43a047',
    700: '#388e3c',
    800: '#2e7d32',
    900: '#1b5e20',
  },
  
  warning: {
    50: '#fff8e1',
    100: '#ffecb3',
    200: '#ffe082',
    300: '#ffd54f',
    400: '#ffca28',
    500: '#FFC107', // Amber - Pending actions, training needed
    600: '#ffb300',
    700: '#ffa000',
    800: '#ff8f00',
    900: '#ff6f00',
  },
  
  danger: {
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#E53935', // Signal Red - Failure alerts, defects
    600: '#e53935',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c',
  },
  
  // Neutral Colors for UI
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
} as const;

// Typography scale
export const typography = {
  fontFamily: {
    primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    accent: '"Manrope", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    mono: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
  },
  
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
    '6xl': '60px',
  },
  
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// Spacing scale
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
  36: '144px',
  40: '160px',
  44: '176px',
  48: '192px',
  52: '208px',
  56: '224px',
  60: '240px',
  64: '256px',
  72: '288px',
  80: '320px',
  96: '384px',
} as const;

// Border radius
export const borderRadius = {
  none: '0px',
  sm: '2px',
  base: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  '3xl': '24px',
  full: '9999px',
} as const;

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
} as const;

// Layout tokens
export const layout = {
  headerHeight: '64px',
  sidebarWidth: '250px',
  sidebarCollapsedWidth: '80px',
  footerHeight: '64px',
  contentPadding: spacing[6],
  borderRadius: borderRadius.lg,
} as const;

// Light Theme Configuration
export const lightTheme: ThemeConfig = {
  token: {
    // Colors
    colorPrimary: colors.primary[500],
    colorSuccess: colors.success[500],
    colorWarning: colors.warning[500],
    colorError: colors.danger[500],
    colorInfo: colors.primary[500],
    colorTextSecondary: 'var(--color-text-secondary)',
    
    // Typography
    fontFamily: typography.fontFamily.primary,
    fontSize: 14,
    fontSizeHeading1: 36,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 18,
    
    // Border radius
    borderRadius: 4,
    borderRadiusLG: 8,
    borderRadiusSM: 2,
    
    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingSM: 8,
    paddingXS: 4,
    
    // Layout
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,
  },
  
  components: {
    Layout: {
      headerBg: colors.neutral[50],
      siderBg: colors.neutral[50],
      bodyBg: '#FFFFFF', // Pure white background
      footerBg: colors.neutral[100],
    },
    Menu: {
      darkItemBg: colors.secondary[900],
      darkItemSelectedBg: colors.primary[600],
      darkItemHoverBg: colors.secondary[800],
    },
    Button: {
      borderRadius: 4,
      controlHeight: 32,
    },
    Card: {
      borderRadiusLG: 8,
    },
    Form: {
      labelColor: 'var(--color-text)',
      labelRequiredMarkColor: 'var(--color-danger)',
      labelFontSize: 14,
      labelHeight: 32,
      labelColonMarginInlineEnd: 8,
      itemMarginBottom: 16,
      verticalLabelPadding: '0 0 8px',
      verticalLabelMargin: 0,
    },
  },
};

// Dark Theme Configuration
export const darkTheme: ThemeConfig = {
  token: {
    // Colors
    colorPrimary: colors.primary[400],
    colorSuccess: colors.success[400],
    colorWarning: colors.warning[400],
    colorError: colors.danger[400],
    colorInfo: colors.primary[400],
    colorTextSecondary: 'var(--color-text-secondary)',
    
    // Typography
    fontFamily: typography.fontFamily.primary,
    fontSize: 14,
    fontSizeHeading1: 36,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 18,
    
    // Border radius
    borderRadius: 4,
    borderRadiusLG: 8,
    borderRadiusSM: 2,
    
    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingSM: 8,
    paddingXS: 4,
    
    // Layout
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,
  },
  
  components: {
    Layout: {
      headerBg: colors.secondary[900],
      siderBg: colors.secondary[900],
      bodyBg: '#2E2E2E', // Slate Gray background
      footerBg: colors.secondary[800],
    },
    Menu: {
      darkItemBg: colors.secondary[900],
      darkItemSelectedBg: colors.primary[600],
      darkItemHoverBg: colors.secondary[800],
    },
    Button: {
      borderRadius: 4,
      controlHeight: 32,
    },
    Card: {
      borderRadiusLG: 8,
    },
    Form: {
      labelColor: 'var(--color-text)',
      labelRequiredMarkColor: 'var(--color-danger)',
      labelFontSize: 14,
      labelHeight: 32,
      labelColonMarginInlineEnd: 8,
      itemMarginBottom: 16,
      verticalLabelPadding: '0 0 8px',
      verticalLabelMargin: 0,
    },
  },
};

// CSS Variables for light theme
export const lightThemeVariables = {
  '--color-primary': colors.primary[500],
  '--color-primary-hover': colors.primary[400],
  '--color-primary-active': colors.primary[600],
  '--color-secondary': colors.secondary[900],
  '--color-accent-yellow': colors.accent.yellow,
  '--color-accent-orange': colors.accent.orange,
  '--color-success': colors.success[500],
  '--color-warning': colors.warning[500],
  '--color-danger': colors.danger[500],
  '--color-text': colors.neutral[900],
  '--color-text-secondary': colors.neutral[600],
  '--color-border': colors.neutral[300],
  '--color-background': '#FFFFFF',
  '--color-background-secondary': '#F5F5F5',
  '--color-surface': '#FFFFFF',
  '--color-surface-darker': '#F5F5F5',
  '--color-hover': 'rgba(0, 0, 0, 0.05)', // Subtle hover effect for light mode
  '--color-shadow': 'rgba(0, 0, 0, 0.1)', // Light shadow for light mode
  '--color-success-bg': 'rgba(50, 199, 102, 0.1)', // Success background with transparency
  '--font-family': typography.fontFamily.primary,
  '--font-family-accent': typography.fontFamily.accent,
  '--font-size-base': typography.fontSize.base,
  '--border-radius': borderRadius.base,
  '--spacing-base': spacing[4],
} as const;

// CSS Variables for dark theme
export const darkThemeVariables = {
  '--color-primary': colors.primary[400],
  '--color-primary-hover': colors.primary[300],
  '--color-primary-active': colors.primary[500],
  '--color-secondary': colors.secondary[900],
  '--color-accent-yellow': colors.accent.yellow,
  '--color-accent-orange': colors.accent.orange,
  '--color-success': colors.success[400],
  '--color-warning': colors.warning[400],
  '--color-danger': colors.danger[400],
  '--color-text': '#ECEFF1', // Soft White
  '--color-text-secondary': colors.neutral[400],
  '--color-border': colors.neutral[700],
  '--color-background': '#2E2E2E', // Slate Gray
  '--color-background-secondary': colors.secondary[800],
  '--color-surface': '#141414', // Darker than secondary[900] for better contrast
  '--color-surface-darker': '#0A0A0A', // Even darker for special sections
  '--color-hover': 'rgba(255, 255, 255, 0.08)', // Subtle hover effect for dark mode
  '--color-shadow': 'rgba(0, 0, 0, 0.3)', // Darker shadow for dark mode
  '--color-success-bg': 'rgba(50, 199, 102, 0.1)', // Success background with transparency
  '--font-family': typography.fontFamily.primary,
  '--font-family-accent': typography.fontFamily.accent,
  '--font-size-base': typography.fontSize.base,
  '--border-radius': borderRadius.base,
  '--spacing-base': spacing[4],
} as const;

// Default theme (light)
export const antdTheme = lightTheme;

export type ColorKey = keyof typeof colors;
export type TypographyKey = keyof typeof typography;
export type SpacingKey = keyof typeof spacing;
export type ThemeMode = 'light' | 'dark'; 