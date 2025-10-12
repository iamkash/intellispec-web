/**
 * Modern Theme Provider with shadcn/ui New York Style
 * 
 * Features:
 * - Light/Dark mode toggle
 * - Multiple primary color themes (like shadcn/ui)
 * - CSS custom properties for design tokens
 * - Professional color palettes
 * - Accessibility compliant contrast ratios
 * - Smooth theme transitions
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { generateThemeVariables, formatHSL } from '../lib/utils';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type ThemeMode = 'light' | 'dark' | 'system';

export type ColorTheme = 
  | 'default'    // Slate blue
  | 'neutral'    // Gray
  | 'stone'      // Warm gray
  | 'red'        // Red
  | 'orange'     // Orange
  | 'amber'      // Amber/yellow
  | 'yellow'     // Bright yellow
  | 'lime'       // Lime green
  | 'green'      // Green
  | 'emerald'    // Emerald
  | 'teal'       // Teal
  | 'cyan'       // Cyan
  | 'sky'        // Sky blue
  | 'blue'       // Blue
  | 'indigo'     // Indigo
  | 'violet'     // Violet
  | 'purple'     // Purple
  | 'fuchsia'    // Fuchsia
  | 'pink'       // Pink
  | 'rose';      // Rose

export interface ThemeConfig {
  mode: ThemeMode;
  colorTheme: ColorTheme;
  radius: number; // Border radius in rem
  fontFamily: 'inter' | 'system';
}

export interface ThemeContextType {
  config: ThemeConfig;
  setMode: (mode: ThemeMode) => void;
  setColorTheme: (theme: ColorTheme) => void;
  setRadius: (radius: number) => void;
  setFontFamily: (font: 'inter' | 'system') => void;
  resolvedTheme: 'light' | 'dark';
  isLoading: boolean;
}

// =============================================================================
// THEME DEFINITIONS
// =============================================================================

/**
 * Base color themes following shadcn/ui New York style
 * Each theme includes light and dark variants
 */
const COLOR_THEMES: Record<ColorTheme, {
  light: Record<string, string>;
  dark: Record<string, string>;
}> = {
  default: {
    light: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      'card-foreground': '240 10% 3.9%',
      popover: '0 0% 100%',
      'popover-foreground': '240 10% 3.9%',
      primary: '240 5.9% 10%',
      'primary-foreground': '0 0% 98%',
      secondary: '240 4.8% 95.9%',
      'secondary-foreground': '240 5.9% 10%',
      muted: '240 4.8% 95.9%',
      'muted-foreground': '240 3.8% 46.1%',
      accent: '240 4.8% 95.9%',
      'accent-foreground': '240 5.9% 10%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '0 0% 98%',
      border: '240 5.9% 90%',
      input: '240 5.9% 90%',
      ring: '240 5.9% 10%',
    },
    dark: {
      background: '240 10% 3.9%',
      foreground: '0 0% 98%',
      card: '240 10% 3.9%',
      'card-foreground': '0 0% 98%',
      popover: '240 10% 3.9%',
      'popover-foreground': '0 0% 98%',
      primary: '0 0% 98%',
      'primary-foreground': '240 5.9% 10%',
      secondary: '240 3.7% 15.9%',
      'secondary-foreground': '0 0% 98%',
      muted: '240 3.7% 15.9%',
      'muted-foreground': '240 5% 64.9%',
      accent: '240 3.7% 15.9%',
      'accent-foreground': '0 0% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '0 0% 98%',
      border: '240 3.7% 15.9%',
      input: '240 3.7% 15.9%',
      ring: '240 4.9% 83.9%',
    },
  },
  neutral: {
    light: {
      background: '0 0% 100%',
      foreground: '0 0% 3.9%',
      card: '0 0% 100%',
      'card-foreground': '0 0% 3.9%',
      popover: '0 0% 100%',
      'popover-foreground': '0 0% 3.9%',
      primary: '0 0% 9%',
      'primary-foreground': '0 0% 98%',
      secondary: '0 0% 96.1%',
      'secondary-foreground': '0 0% 9%',
      muted: '0 0% 96.1%',
      'muted-foreground': '0 0% 45.1%',
      accent: '0 0% 96.1%',
      'accent-foreground': '0 0% 9%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '0 0% 98%',
      border: '0 0% 89.8%',
      input: '0 0% 89.8%',
      ring: '0 0% 3.9%',
    },
    dark: {
      background: '0 0% 3.9%',
      foreground: '0 0% 98%',
      card: '0 0% 3.9%',
      'card-foreground': '0 0% 98%',
      popover: '0 0% 3.9%',
      'popover-foreground': '0 0% 98%',
      primary: '0 0% 98%',
      'primary-foreground': '0 0% 9%',
      secondary: '0 0% 14.9%',
      'secondary-foreground': '0 0% 98%',
      muted: '0 0% 14.9%',
      'muted-foreground': '0 0% 63.9%',
      accent: '0 0% 14.9%',
      'accent-foreground': '0 0% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '0 0% 98%',
      border: '0 0% 14.9%',
      input: '0 0% 14.9%',
      ring: '0 0% 83.1%',
    },
  },
  stone: {
    light: {
      background: '0 0% 100%',
      foreground: '20 14.3% 4.1%',
      card: '0 0% 100%',
      'card-foreground': '20 14.3% 4.1%',
      popover: '0 0% 100%',
      'popover-foreground': '20 14.3% 4.1%',
      primary: '24 9.8% 10%',
      'primary-foreground': '60 9.1% 97.8%',
      secondary: '60 4.8% 95.9%',
      'secondary-foreground': '24 9.8% 10%',
      muted: '60 4.8% 95.9%',
      'muted-foreground': '25 5.3% 44.7%',
      accent: '60 4.8% 95.9%',
      'accent-foreground': '24 9.8% 10%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '60 9.1% 97.8%',
      border: '20 5.9% 90%',
      input: '20 5.9% 90%',
      ring: '24 5.7% 82.9%',
    },
    dark: {
      background: '20 14.3% 4.1%',
      foreground: '60 9.1% 97.8%',
      card: '20 14.3% 4.1%',
      'card-foreground': '60 9.1% 97.8%',
      popover: '20 14.3% 4.1%',
      'popover-foreground': '60 9.1% 97.8%',
      primary: '60 9.1% 97.8%',
      'primary-foreground': '24 9.8% 10%',
      secondary: '12 6.5% 15.1%',
      'secondary-foreground': '60 9.1% 97.8%',
      muted: '12 6.5% 15.1%',
      'muted-foreground': '24 5.4% 63.9%',
      accent: '12 6.5% 15.1%',
      'accent-foreground': '60 9.1% 97.8%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '60 9.1% 97.8%',
      border: '12 6.5% 15.1%',
      input: '12 6.5% 15.1%',
      ring: '24 5.7% 82.9%',
    },
  },
  red: {
    light: {
      background: '0 0% 100%',
      foreground: '0 0% 3.9%',
      card: '0 0% 100%',
      'card-foreground': '0 0% 3.9%',
      popover: '0 0% 100%',
      'popover-foreground': '0 0% 3.9%',
      primary: '0 72.2% 50.6%',
      'primary-foreground': '0 85.7% 97.3%',
      secondary: '0 0% 96.1%',
      'secondary-foreground': '0 0% 9%',
      muted: '0 0% 96.1%',
      'muted-foreground': '0 0% 45.1%',
      accent: '0 0% 96.1%',
      'accent-foreground': '0 0% 9%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '0 0% 98%',
      border: '0 0% 89.8%',
      input: '0 0% 89.8%',
      ring: '0 72.2% 50.6%',
    },
    dark: {
      background: '0 0% 3.9%',
      foreground: '0 0% 98%',
      card: '0 0% 3.9%',
      'card-foreground': '0 0% 98%',
      popover: '0 0% 3.9%',
      'popover-foreground': '0 0% 98%',
      primary: '0 72.2% 50.6%',
      'primary-foreground': '0 85.7% 97.3%',
      secondary: '0 0% 14.9%',
      'secondary-foreground': '0 0% 98%',
      muted: '0 0% 14.9%',
      'muted-foreground': '0 0% 63.9%',
      accent: '0 0% 14.9%',
      'accent-foreground': '0 0% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '0 0% 98%',
      border: '0 0% 14.9%',
      input: '0 0% 14.9%',
      ring: '0 72.2% 50.6%',
    },
  },
  orange: {
    light: {
      background: '0 0% 100%',
      foreground: '20 14.3% 4.1%',
      card: '0 0% 100%',
      'card-foreground': '20 14.3% 4.1%',
      popover: '0 0% 100%',
      'popover-foreground': '20 14.3% 4.1%',
      primary: '24.6 95% 53.1%',
      'primary-foreground': '60 9.1% 97.8%',
      secondary: '60 4.8% 95.9%',
      'secondary-foreground': '24 9.8% 10%',
      muted: '60 4.8% 95.9%',
      'muted-foreground': '25 5.3% 44.7%',
      accent: '60 4.8% 95.9%',
      'accent-foreground': '24 9.8% 10%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '60 9.1% 97.8%',
      border: '20 5.9% 90%',
      input: '20 5.9% 90%',
      ring: '24.6 95% 53.1%',
    },
    dark: {
      background: '20 14.3% 4.1%',
      foreground: '60 9.1% 97.8%',
      card: '20 14.3% 4.1%',
      'card-foreground': '60 9.1% 97.8%',
      popover: '20 14.3% 4.1%',
      'popover-foreground': '60 9.1% 97.8%',
      primary: '20.5 90.2% 48.2%',
      'primary-foreground': '60 9.1% 97.8%',
      secondary: '12 6.5% 15.1%',
      'secondary-foreground': '60 9.1% 97.8%',
      muted: '12 6.5% 15.1%',
      'muted-foreground': '24 5.4% 63.9%',
      accent: '12 6.5% 15.1%',
      'accent-foreground': '60 9.1% 97.8%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '60 9.1% 97.8%',
      border: '12 6.5% 15.1%',
      input: '12 6.5% 15.1%',
      ring: '20.5 90.2% 48.2%',
    },
  },
  yellow: {
    light: {
      background: '0 0% 100%',
      foreground: '20 14.3% 4.1%',
      card: '0 0% 100%',
      'card-foreground': '20 14.3% 4.1%',
      popover: '0 0% 100%',
      'popover-foreground': '20 14.3% 4.1%',
      primary: '47.9 95.8% 53.1%',
      'primary-foreground': '26 83.3% 14.1%',
      secondary: '60 4.8% 95.9%',
      'secondary-foreground': '24 9.8% 10%',
      muted: '60 4.8% 95.9%',
      'muted-foreground': '25 5.3% 44.7%',
      accent: '60 4.8% 95.9%',
      'accent-foreground': '24 9.8% 10%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '60 9.1% 97.8%',
      border: '20 5.9% 90%',
      input: '20 5.9% 90%',
      ring: '47.9 95.8% 53.1%',
    },
    dark: {
      background: '20 14.3% 4.1%',
      foreground: '60 9.1% 97.8%',
      card: '20 14.3% 4.1%',
      'card-foreground': '60 9.1% 97.8%',
      popover: '20 14.3% 4.1%',
      'popover-foreground': '60 9.1% 97.8%',
      primary: '47.9 95.8% 53.1%',
      'primary-foreground': '26 83.3% 14.1%',
      secondary: '12 6.5% 15.1%',
      'secondary-foreground': '60 9.1% 97.8%',
      muted: '12 6.5% 15.1%',
      'muted-foreground': '24 5.4% 63.9%',
      accent: '12 6.5% 15.1%',
      'accent-foreground': '60 9.1% 97.8%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '60 9.1% 97.8%',
      border: '12 6.5% 15.1%',
      input: '12 6.5% 15.1%',
      ring: '47.9 95.8% 53.1%',
    },
  },
  amber: {
    light: {
      background: '0 0% 100%',
      foreground: '20 14.3% 4.1%',
      card: '0 0% 100%',
      'card-foreground': '20 14.3% 4.1%',
      popover: '0 0% 100%',
      'popover-foreground': '20 14.3% 4.1%',
      primary: '45.4 93.4% 47.5%',
      'primary-foreground': '26 83.3% 14.1%',
      secondary: '60 4.8% 95.9%',
      'secondary-foreground': '24 9.8% 10%',
      muted: '60 4.8% 95.9%',
      'muted-foreground': '25 5.3% 44.7%',
      accent: '60 4.8% 95.9%',
      'accent-foreground': '24 9.8% 10%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '60 9.1% 97.8%',
      border: '20 5.9% 90%',
      input: '20 5.9% 90%',
      ring: '45.4 93.4% 47.5%',
    },
    dark: {
      background: '20 14.3% 4.1%',
      foreground: '60 9.1% 97.8%',
      card: '20 14.3% 4.1%',
      'card-foreground': '60 9.1% 97.8%',
      popover: '20 14.3% 4.1%',
      'popover-foreground': '60 9.1% 97.8%',
      primary: '45.4 93.4% 47.5%',
      'primary-foreground': '26 83.3% 14.1%',
      secondary: '12 6.5% 15.1%',
      'secondary-foreground': '60 9.1% 97.8%',
      muted: '12 6.5% 15.1%',
      'muted-foreground': '24 5.4% 63.9%',
      accent: '12 6.5% 15.1%',
      'accent-foreground': '60 9.1% 97.8%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '60 9.1% 97.8%',
      border: '12 6.5% 15.1%',
      input: '12 6.5% 15.1%',
      ring: '45.4 93.4% 47.5%',
    },
  },
  lime: {
    light: {
      background: '0 0% 100%',
      foreground: '20 14.3% 4.1%',
      card: '0 0% 100%',
      'card-foreground': '20 14.3% 4.1%',
      popover: '0 0% 100%',
      'popover-foreground': '20 14.3% 4.1%',
      primary: '84.2 85.2% 40.4%',
      'primary-foreground': '78.3 100% 6.9%',
      secondary: '60 4.8% 95.9%',
      'secondary-foreground': '24 9.8% 10%',
      muted: '60 4.8% 95.9%',
      'muted-foreground': '25 5.3% 44.7%',
      accent: '60 4.8% 95.9%',
      'accent-foreground': '24 9.8% 10%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '60 9.1% 97.8%',
      border: '20 5.9% 90%',
      input: '20 5.9% 90%',
      ring: '84.2 85.2% 40.4%',
    },
    dark: {
      background: '20 14.3% 4.1%',
      foreground: '60 9.1% 97.8%',
      card: '20 14.3% 4.1%',
      'card-foreground': '60 9.1% 97.8%',
      popover: '20 14.3% 4.1%',
      'popover-foreground': '60 9.1% 97.8%',
      primary: '84.2 85.2% 40.4%',
      'primary-foreground': '78.3 100% 6.9%',
      secondary: '12 6.5% 15.1%',
      'secondary-foreground': '60 9.1% 97.8%',
      muted: '12 6.5% 15.1%',
      'muted-foreground': '24 5.4% 63.9%',
      accent: '12 6.5% 15.1%',
      'accent-foreground': '60 9.1% 97.8%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '60 9.1% 97.8%',
      border: '12 6.5% 15.1%',
      input: '12 6.5% 15.1%',
      ring: '84.2 85.2% 40.4%',
    },
  },
  green: {
    light: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      'card-foreground': '240 10% 3.9%',
      popover: '0 0% 100%',
      'popover-foreground': '240 10% 3.9%',
      primary: '142.1 76.2% 36.3%',
      'primary-foreground': '355.7 100% 97.3%',
      secondary: '210 40% 96%',
      'secondary-foreground': '222.2 84% 4.9%',
      muted: '210 40% 96%',
      'muted-foreground': '215.4 16.3% 46.9%',
      accent: '210 40% 96%',
      'accent-foreground': '222.2 84% 4.9%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '142.1 76.2% 36.3%',
    },
    dark: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      card: '222.2 84% 4.9%',
      'card-foreground': '210 40% 98%',
      popover: '222.2 84% 4.9%',
      'popover-foreground': '210 40% 98%',
      primary: '142.1 70.6% 45.3%',
      'primary-foreground': '144.9 80.4% 10%',
      secondary: '217.2 32.6% 17.5%',
      'secondary-foreground': '210 40% 98%',
      muted: '217.2 32.6% 17.5%',
      'muted-foreground': '215 20.2% 65.1%',
      accent: '217.2 32.6% 17.5%',
      'accent-foreground': '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '142.4 71.8% 29.2%',
    },
  },
  emerald: {
    light: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      'card-foreground': '240 10% 3.9%',
      popover: '0 0% 100%',
      'popover-foreground': '240 10% 3.9%',
      primary: '160.1 84.1% 39.4%',
      'primary-foreground': '355.7 100% 97.3%',
      secondary: '210 40% 96%',
      'secondary-foreground': '222.2 84% 4.9%',
      muted: '210 40% 96%',
      'muted-foreground': '215.4 16.3% 46.9%',
      accent: '210 40% 96%',
      'accent-foreground': '222.2 84% 4.9%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '160.1 84.1% 39.4%',
    },
    dark: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      card: '222.2 84% 4.9%',
      'card-foreground': '210 40% 98%',
      popover: '222.2 84% 4.9%',
      'popover-foreground': '210 40% 98%',
      primary: '160.1 84.1% 39.4%',
      'primary-foreground': '355.7 100% 97.3%',
      secondary: '217.2 32.6% 17.5%',
      'secondary-foreground': '210 40% 98%',
      muted: '217.2 32.6% 17.5%',
      'muted-foreground': '215 20.2% 65.1%',
      accent: '217.2 32.6% 17.5%',
      'accent-foreground': '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '160.1 84.1% 39.4%',
    },
  },
  teal: {
    light: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      'card-foreground': '240 10% 3.9%',
      popover: '0 0% 100%',
      'popover-foreground': '240 10% 3.9%',
      primary: '173.4 80.4% 40%',
      'primary-foreground': '355.7 100% 97.3%',
      secondary: '210 40% 96%',
      'secondary-foreground': '222.2 84% 4.9%',
      muted: '210 40% 96%',
      'muted-foreground': '215.4 16.3% 46.9%',
      accent: '210 40% 96%',
      'accent-foreground': '222.2 84% 4.9%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '173.4 80.4% 40%',
    },
    dark: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      card: '222.2 84% 4.9%',
      'card-foreground': '210 40% 98%',
      popover: '222.2 84% 4.9%',
      'popover-foreground': '210 40% 98%',
      primary: '173.4 80.4% 40%',
      'primary-foreground': '355.7 100% 97.3%',
      secondary: '217.2 32.6% 17.5%',
      'secondary-foreground': '210 40% 98%',
      muted: '217.2 32.6% 17.5%',
      'muted-foreground': '215 20.2% 65.1%',
      accent: '217.2 32.6% 17.5%',
      'accent-foreground': '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '173.4 80.4% 40%',
    },
  },
  cyan: {
    light: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      'card-foreground': '240 10% 3.9%',
      popover: '0 0% 100%',
      'popover-foreground': '240 10% 3.9%',
      primary: '188.7 94.5% 42.7%',
      'primary-foreground': '355.7 100% 97.3%',
      secondary: '210 40% 96%',
      'secondary-foreground': '222.2 84% 4.9%',
      muted: '210 40% 96%',
      'muted-foreground': '215.4 16.3% 46.9%',
      accent: '210 40% 96%',
      'accent-foreground': '222.2 84% 4.9%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '188.7 94.5% 42.7%',
    },
    dark: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      card: '222.2 84% 4.9%',
      'card-foreground': '210 40% 98%',
      popover: '222.2 84% 4.9%',
      'popover-foreground': '210 40% 98%',
      primary: '188.7 94.5% 42.7%',
      'primary-foreground': '355.7 100% 97.3%',
      secondary: '217.2 32.6% 17.5%',
      'secondary-foreground': '210 40% 98%',
      muted: '217.2 32.6% 17.5%',
      'muted-foreground': '215 20.2% 65.1%',
      accent: '217.2 32.6% 17.5%',
      'accent-foreground': '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '188.7 94.5% 42.7%',
    },
  },
  sky: {
    light: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      'card-foreground': '240 10% 3.9%',
      popover: '0 0% 100%',
      'popover-foreground': '240 10% 3.9%',
      primary: '198.6 88.7% 48.4%',
      'primary-foreground': '355.7 100% 97.3%',
      secondary: '210 40% 96%',
      'secondary-foreground': '222.2 84% 4.9%',
      muted: '210 40% 96%',
      'muted-foreground': '215.4 16.3% 46.9%',
      accent: '210 40% 96%',
      'accent-foreground': '222.2 84% 4.9%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '198.6 88.7% 48.4%',
    },
    dark: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      card: '222.2 84% 4.9%',
      'card-foreground': '210 40% 98%',
      popover: '222.2 84% 4.9%',
      'popover-foreground': '210 40% 98%',
      primary: '198.6 88.7% 48.4%',
      'primary-foreground': '355.7 100% 97.3%',
      secondary: '217.2 32.6% 17.5%',
      'secondary-foreground': '210 40% 98%',
      muted: '217.2 32.6% 17.5%',
      'muted-foreground': '215 20.2% 65.1%',
      accent: '217.2 32.6% 17.5%',
      'accent-foreground': '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '198.6 88.7% 48.4%',
    },
  },
  blue: {
    light: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      'card-foreground': '240 10% 3.9%',
      popover: '0 0% 100%',
      'popover-foreground': '240 10% 3.9%',
      primary: '221.2 83.2% 53.3%',
      'primary-foreground': '210 40% 98%',
      secondary: '210 40% 96%',
      'secondary-foreground': '222.2 84% 4.9%',
      muted: '210 40% 96%',
      'muted-foreground': '215.4 16.3% 46.9%',
      accent: '210 40% 96%',
      'accent-foreground': '222.2 84% 4.9%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '221.2 83.2% 53.3%',
    },
    dark: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      card: '222.2 84% 4.9%',
      'card-foreground': '210 40% 98%',
      popover: '222.2 84% 4.9%',
      'popover-foreground': '210 40% 98%',
      primary: '217.2 91.2% 59.8%',
      'primary-foreground': '222.2 84% 4.9%',
      secondary: '217.2 32.6% 17.5%',
      'secondary-foreground': '210 40% 98%',
      muted: '217.2 32.6% 17.5%',
      'muted-foreground': '215 20.2% 65.1%',
      accent: '217.2 32.6% 17.5%',
      'accent-foreground': '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '217.2 91.2% 59.8%',
    },
  },
  indigo: {
    light: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      'card-foreground': '240 10% 3.9%',
      popover: '0 0% 100%',
      'popover-foreground': '240 10% 3.9%',
      primary: '238.7 83.5% 66.7%',
      'primary-foreground': '210 40% 98%',
      secondary: '210 40% 96%',
      'secondary-foreground': '222.2 84% 4.9%',
      muted: '210 40% 96%',
      'muted-foreground': '215.4 16.3% 46.9%',
      accent: '210 40% 96%',
      'accent-foreground': '222.2 84% 4.9%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '238.7 83.5% 66.7%',
    },
    dark: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      card: '222.2 84% 4.9%',
      'card-foreground': '210 40% 98%',
      popover: '222.2 84% 4.9%',
      'popover-foreground': '210 40% 98%',
      primary: '238.7 83.5% 66.7%',
      'primary-foreground': '210 40% 98%',
      secondary: '217.2 32.6% 17.5%',
      'secondary-foreground': '210 40% 98%',
      muted: '217.2 32.6% 17.5%',
      'muted-foreground': '215 20.2% 65.1%',
      accent: '217.2 32.6% 17.5%',
      'accent-foreground': '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '238.7 83.5% 66.7%',
    },
  },
  violet: {
    light: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      'card-foreground': '240 10% 3.9%',
      popover: '0 0% 100%',
      'popover-foreground': '240 10% 3.9%',
      primary: '262.1 83.3% 57.8%',
      'primary-foreground': '210 40% 98%',
      secondary: '210 40% 96%',
      'secondary-foreground': '222.2 84% 4.9%',
      muted: '210 40% 96%',
      'muted-foreground': '215.4 16.3% 46.9%',
      accent: '210 40% 96%',
      'accent-foreground': '222.2 84% 4.9%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '262.1 83.3% 57.8%',
    },
    dark: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      card: '222.2 84% 4.9%',
      'card-foreground': '210 40% 98%',
      popover: '222.2 84% 4.9%',
      'popover-foreground': '210 40% 98%',
      primary: '263.4 70% 50.4%',
      'primary-foreground': '210 40% 98%',
      secondary: '217.2 32.6% 17.5%',
      'secondary-foreground': '210 40% 98%',
      muted: '217.2 32.6% 17.5%',
      'muted-foreground': '215 20.2% 65.1%',
      accent: '217.2 32.6% 17.5%',
      'accent-foreground': '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '263.4 70% 50.4%',
    },
  },
  purple: {
    light: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      'card-foreground': '240 10% 3.9%',
      popover: '0 0% 100%',
      'popover-foreground': '240 10% 3.9%',
      primary: '258.3 89.5% 66.3%',
      'primary-foreground': '210 40% 98%',
      secondary: '210 40% 96%',
      'secondary-foreground': '222.2 84% 4.9%',
      muted: '210 40% 96%',
      'muted-foreground': '215.4 16.3% 46.9%',
      accent: '210 40% 96%',
      'accent-foreground': '222.2 84% 4.9%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '258.3 89.5% 66.3%',
    },
    dark: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      card: '222.2 84% 4.9%',
      'card-foreground': '210 40% 98%',
      popover: '222.2 84% 4.9%',
      'popover-foreground': '210 40% 98%',
      primary: '258.3 89.5% 66.3%',
      'primary-foreground': '210 40% 98%',
      secondary: '217.2 32.6% 17.5%',
      'secondary-foreground': '210 40% 98%',
      muted: '217.2 32.6% 17.5%',
      'muted-foreground': '215 20.2% 65.1%',
      accent: '217.2 32.6% 17.5%',
      'accent-foreground': '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '258.3 89.5% 66.3%',
    },
  },
  fuchsia: {
    light: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      'card-foreground': '240 10% 3.9%',
      popover: '0 0% 100%',
      'popover-foreground': '240 10% 3.9%',
      primary: '292.2 84.1% 60.6%',
      'primary-foreground': '210 40% 98%',
      secondary: '210 40% 96%',
      'secondary-foreground': '222.2 84% 4.9%',
      muted: '210 40% 96%',
      'muted-foreground': '215.4 16.3% 46.9%',
      accent: '210 40% 96%',
      'accent-foreground': '222.2 84% 4.9%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '292.2 84.1% 60.6%',
    },
    dark: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      card: '222.2 84% 4.9%',
      'card-foreground': '210 40% 98%',
      popover: '222.2 84% 4.9%',
      'popover-foreground': '210 40% 98%',
      primary: '292.2 84.1% 60.6%',
      'primary-foreground': '210 40% 98%',
      secondary: '217.2 32.6% 17.5%',
      'secondary-foreground': '210 40% 98%',
      muted: '217.2 32.6% 17.5%',
      'muted-foreground': '215 20.2% 65.1%',
      accent: '217.2 32.6% 17.5%',
      'accent-foreground': '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '292.2 84.1% 60.6%',
    },
  },
  pink: {
    light: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      'card-foreground': '240 10% 3.9%',
      popover: '0 0% 100%',
      'popover-foreground': '240 10% 3.9%',
      primary: '329.8 85.5% 70.2%',
      'primary-foreground': '210 40% 98%',
      secondary: '210 40% 96%',
      'secondary-foreground': '222.2 84% 4.9%',
      muted: '210 40% 96%',
      'muted-foreground': '215.4 16.3% 46.9%',
      accent: '210 40% 96%',
      'accent-foreground': '222.2 84% 4.9%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '329.8 85.5% 70.2%',
    },
    dark: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      card: '222.2 84% 4.9%',
      'card-foreground': '210 40% 98%',
      popover: '222.2 84% 4.9%',
      'popover-foreground': '210 40% 98%',
      primary: '329.8 85.5% 70.2%',
      'primary-foreground': '210 40% 98%',
      secondary: '217.2 32.6% 17.5%',
      'secondary-foreground': '210 40% 98%',
      muted: '217.2 32.6% 17.5%',
      'muted-foreground': '215 20.2% 65.1%',
      accent: '217.2 32.6% 17.5%',
      'accent-foreground': '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '329.8 85.5% 70.2%',
    },
  },
  rose: {
    light: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      card: '0 0% 100%',
      'card-foreground': '240 10% 3.9%',
      popover: '0 0% 100%',
      'popover-foreground': '240 10% 3.9%',
      primary: '346.8 77.2% 49.8%',
      'primary-foreground': '355.7 100% 97.3%',
      secondary: '210 40% 96%',
      'secondary-foreground': '222.2 84% 4.9%',
      muted: '210 40% 96%',
      'muted-foreground': '215.4 16.3% 46.9%',
      accent: '210 40% 96%',
      'accent-foreground': '222.2 84% 4.9%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '346.8 77.2% 49.8%',
    },
    dark: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      card: '222.2 84% 4.9%',
      'card-foreground': '210 40% 98%',
      popover: '222.2 84% 4.9%',
      'popover-foreground': '210 40% 98%',
      primary: '346.8 77.2% 49.8%',
      'primary-foreground': '355.7 100% 97.3%',
      secondary: '217.2 32.6% 17.5%',
      'secondary-foreground': '210 40% 98%',
      muted: '217.2 32.6% 17.5%',
      'muted-foreground': '215 20.2% 65.1%',
      accent: '217.2 32.6% 17.5%',
      'accent-foreground': '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '346.8 77.2% 49.8%',
    },
  },
};

// =============================================================================
// CONTEXT & HOOKS
// =============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  defaultColorTheme?: ColorTheme;
  storageKey?: string;
  enableSystem?: boolean;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
  defaultColorTheme = 'default',
  storageKey = 'intellispec-theme',
  enableSystem = true,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<ThemeConfig>({
    mode: defaultTheme,
    colorTheme: defaultColorTheme,
    radius: 0.5,
    fontFamily: 'inter',
  });

  // Resolve the actual theme based on system preference
  const resolvedTheme = React.useMemo(() => {
    if (config.mode === 'system' && enableSystem) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return config.mode === 'system' ? 'light' : config.mode;
  }, [config.mode, enableSystem]);

  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConfig(prevConfig => ({ ...prevConfig, ...parsed }));
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, [storageKey]);

  // Save theme to localStorage when config changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(config));
      } catch (error) {
        console.warn('Failed to save theme to localStorage:', error);
      }
    }
  }, [config, storageKey, isLoading]);

  // Listen for system theme changes
  useEffect(() => {
    if (config.mode === 'system' && enableSystem) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        // Force re-render by updating a dummy state
        setConfig(prev => ({ ...prev }));
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [config.mode, enableSystem]);

  // Apply theme variables to document root
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove old theme classes
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);

    // Get theme colors
    const colors = COLOR_THEMES[config.colorTheme][resolvedTheme];

    // Apply CSS custom properties
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    // Apply radius
    root.style.setProperty('--radius', `${config.radius}rem`);

    // Apply font family
    if (config.fontFamily === 'inter') {
      root.style.setProperty('--font-sans', 'Inter, ui-sans-serif, system-ui, sans-serif');
    } else {
      root.style.setProperty('--font-sans', 'ui-sans-serif, system-ui, sans-serif');
    }

    // Apply theme attribute for CSS selectors
    root.setAttribute('data-theme', resolvedTheme);
    root.setAttribute('data-color-theme', config.colorTheme);
  }, [config, resolvedTheme]);

  // Theme management functions
  const setMode = useCallback((mode: ThemeMode) => {
    setConfig(prev => ({ ...prev, mode }));
  }, []);

  const setColorTheme = useCallback((colorTheme: ColorTheme) => {
    setConfig(prev => ({ ...prev, colorTheme }));
  }, []);

  const setRadius = useCallback((radius: number) => {
    setConfig(prev => ({ ...prev, radius }));
  }, []);

  const setFontFamily = useCallback((fontFamily: 'inter' | 'system') => {
    setConfig(prev => ({ ...prev, fontFamily }));
  }, []);

  const value: ThemeContextType = {
    config,
    setMode,
    setColorTheme,
    setRadius,
    setFontFamily,
    resolvedTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
