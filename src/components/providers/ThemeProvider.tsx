import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ConfigProvider } from 'antd';
import { lightTheme, darkTheme, ThemeMode } from '../../theme';

// Define the industrial safety color palette
const newColors = {
  light: {
    bg: '#F9FAFB',
    surface: '#FFFFFF',
    border: '#E0E0E0',
    text: '#1C1C1E',
    textSecondary: '#6E6E73',
    primary: '#009688',
    success: '#32C766',
    warning: '#FFC107',
    error: '#E53935',
    info: '#009688',
    accent: '#F7C600',
    accentOrange: '#FF6A00',
    hover: '#F0F0F0',
    glassBg: 'rgba(255, 255, 255, 0.8)',
    glassBorder: 'rgba(0, 0, 0, 0.1)',
    glassShadow: '0 16px 48px 0 rgba(0, 0, 0, 0.1)',
    glassBgHover: 'rgba(255, 255, 255, 0.9)',
    chart: ['#009688', '#32C766', '#F7C600', '#FF6A00', '#FFC107', '#E53935', '#6E6E73', '#1C1C1E', '#F9FAFB'],
  },
  dark: {
    bg: '#1C1C1E',
    surface: '#141414', // Much darker surface for better contrast
    border: '#3A3A3A',
    text: '#ECEFF1',
    textSecondary: '#A0A0A0',
    primary: '#00BFA5',
    success: '#81C784',
    warning: '#FFD54F',
    error: '#EF5350',
    info: '#00BFA5',
    accent: '#FFE082',
    accentOrange: '#FF8A65',
    hover: '#333333',
    glassBg: 'rgba(46, 46, 46, 0.8)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassShadow: '0 16px 48px 0 rgba(0, 0, 0, 0.3)',
    glassBgHover: 'rgba(46, 46, 46, 0.9)',
    chart: ['#00BFA5', '#81C784', '#FFE082', '#FF8A65', '#FFD54F', '#EF5350', '#A0A0A0', '#ECEFF1', '#2E2E2E'],
  }
};

interface ThemeColors {
  primary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
  };
  border: string;
  divider: string;
  accent: string;
  accentOrange: string;
  hover: string;
  chart: {
    colors: string[];
    grid: string;
    axis: string;
    tooltip: {
      background: string;
      text: string;
      border: string;
    };
  };
}

interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}

interface ThemeContextType {
  themeMode: ThemeMode;
  theme: Theme;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
}

// Create theme objects with colors
const createTheme = (mode: ThemeMode): Theme => {
  const palette = newColors[mode];
  return {
    mode,
    colors: {
      primary: palette.primary,
      success: palette.success,
      warning: palette.warning,
      error: palette.error,
      info: palette.info,
      background: palette.bg,
      surface: palette.surface,
      text: {
        primary: palette.text,
        secondary: palette.textSecondary,
      },
      border: palette.border,
      divider: palette.border, // Using border color for divider
      accent: palette.accent,
      accentOrange: palette.accentOrange,
      hover: palette.hover,
      chart: {
        colors: palette.chart,
        grid: palette.border,
        axis: palette.textSecondary,
        tooltip: {
          background: palette.surface,
          text: palette.text,
          border: palette.border,
        },
      },
    }
  };
};

// Helper to convert hex (#rrggbb) to "r,g,b" string
const hexToRgb = (hex: string): string => {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r},${g},${b}`;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'light' 
}) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme-mode');
    return (saved as ThemeMode) || defaultTheme;
  });

  const theme = createTheme(themeMode);
  const isDarkMode = themeMode === 'dark';

  const toggleTheme = useCallback(() => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const handleSetThemeMode = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme-mode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    
    const root = document.documentElement;
    const palette = newColors[themeMode];

    // Set CSS variables with --color- prefix for consistency
    root.style.setProperty('--color-bg', palette.bg);
    root.style.setProperty('--color-background', palette.bg);
    root.style.setProperty('--color-surface', palette.surface);
    root.style.setProperty('--color-text', palette.text);
    root.style.setProperty('--color-text-secondary', palette.textSecondary);
    root.style.setProperty('--color-subtext', palette.textSecondary);
    root.style.setProperty('--color-primary', palette.primary);
    root.style.setProperty('--color-accent-yellow', palette.accent);
    root.style.setProperty('--color-accent-orange', palette.accentOrange);
    root.style.setProperty('--color-success', palette.success);
    root.style.setProperty('--color-warning', palette.warning);
    root.style.setProperty('--color-danger', palette.error);
    root.style.setProperty('--color-border', palette.border);
    root.style.setProperty('--color-hover', palette.hover);
    
    // Additional theme variables for better dark mode support
    if (themeMode === 'dark') {
      root.style.setProperty('--color-surface-darker', '#0A0A0A');
      root.style.setProperty('--color-shadow', 'rgba(0, 0, 0, 0.3)');
      root.style.setProperty('--color-success-bg', 'rgba(50, 199, 102, 0.1)');
    } else {
      root.style.setProperty('--color-surface-darker', '#F5F5F5');
      root.style.setProperty('--color-shadow', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--color-success-bg', 'rgba(50, 199, 102, 0.1)');
    }

    // Also set the old variable names for backward compatibility
    Object.entries(palette).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.setProperty(cssVar, value);
      }
    });

    // primary RGB for translucent backgrounds
    root.style.setProperty('--primary-rgb', hexToRgb(palette.primary));
    
    document.body.style.backgroundColor = 'var(--color-background)';
    document.body.style.color = palette.text;
  }, [themeMode]);

  const currentAntdTheme = themeMode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ 
      themeMode, 
      theme,
      toggleTheme, 
      setThemeMode: handleSetThemeMode,
      isDarkMode
    }}>
      <ConfigProvider theme={currentAntdTheme}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 