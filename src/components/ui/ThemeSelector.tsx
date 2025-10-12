/**
 * Modern Theme Selector Component
 * Shadcn/ui New York Style Implementation
 * 
 * Features:
 * - Theme mode toggle (light/dark/system)
 * - Color theme selection
 * - Border radius adjustment
 * - Font family selection
 * - Professional dropdown interface
 * - Smooth animations
 */

import { Dropdown } from 'antd';
import {
    Check,
    Monitor,
    Moon,
    Palette,
    Sun
} from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { useTheme, type ColorTheme, type ThemeMode } from '../../providers/ThemeProvider';
import { HeaderThemeIcon } from './atoms/EnhancedThemeIcon';

// =============================================================================
// COMPONENT INTERFACES
// =============================================================================

interface ThemeSelectorProps {
  className?: string;
  isMobile?: boolean;
}

// Using Ant Design Dropdown - no custom interface needed

interface ColorThemeOption {
  id: ColorTheme;
  label: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

// =============================================================================
// THEME DATA
// =============================================================================

const COLOR_THEME_OPTIONS: ColorThemeOption[] = [
  {
    id: 'default',
    label: 'Default',
    description: 'Clean slate blue',
    colors: { primary: '#0f172a', secondary: '#f1f5f9', accent: '#3b82f6' }
  },
  {
    id: 'neutral',
    label: 'Neutral',
    description: 'Balanced grays',
    colors: { primary: '#171717', secondary: '#f5f5f5', accent: '#525252' }
  },
  {
    id: 'stone',
    label: 'Stone',
    description: 'Warm grays',
    colors: { primary: '#1c1917', secondary: '#f5f5f4', accent: '#78716c' }
  },
  {
    id: 'red',
    label: 'Red',
    description: 'Bold crimson',
    colors: { primary: '#dc2626', secondary: '#fee2e2', accent: '#ef4444' }
  },
  {
    id: 'orange',
    label: 'Orange',
    description: 'Vibrant orange',
    colors: { primary: '#ea580c', secondary: '#fed7aa', accent: '#f97316' }
  },
  {
    id: 'amber',
    label: 'Amber',
    description: 'Golden amber',
    colors: { primary: '#d97706', secondary: '#fef3c7', accent: '#f59e0b' }
  },
  {
    id: 'yellow',
    label: 'Yellow',
    description: 'Sunny yellow',
    colors: { primary: '#ca8a04', secondary: '#fef9c3', accent: '#eab308' }
  },
  {
    id: 'lime',
    label: 'Lime',
    description: 'Fresh lime',
    colors: { primary: '#65a30d', secondary: '#ecfccb', accent: '#84cc16' }
  },
  {
    id: 'green',
    label: 'Green',
    description: 'Nature green',
    colors: { primary: '#16a34a', secondary: '#dcfce7', accent: '#22c55e' }
  },
  {
    id: 'emerald',
    label: 'Emerald',
    description: 'Rich emerald',
    colors: { primary: '#059669', secondary: '#d1fae5', accent: '#10b981' }
  },
  {
    id: 'teal',
    label: 'Teal',
    description: 'Ocean teal',
    colors: { primary: '#0d9488', secondary: '#ccfbf1', accent: '#14b8a6' }
  },
  {
    id: 'cyan',
    label: 'Cyan',
    description: 'Electric cyan',
    colors: { primary: '#0891b2', secondary: '#cffafe', accent: '#06b6d4' }
  },
  {
    id: 'sky',
    label: 'Sky',
    description: 'Clear sky',
    colors: { primary: '#0284c7', secondary: '#e0f2fe', accent: '#0ea5e9' }
  },
  {
    id: 'blue',
    label: 'Blue',
    description: 'Classic blue',
    colors: { primary: '#2563eb', secondary: '#dbeafe', accent: '#3b82f6' }
  },
  {
    id: 'indigo',
    label: 'Indigo',
    description: 'Deep indigo',
    colors: { primary: '#4338ca', secondary: '#e0e7ff', accent: '#6366f1' }
  },
  {
    id: 'violet',
    label: 'Violet',
    description: 'Rich violet',
    colors: { primary: '#7c3aed', secondary: '#ede9fe', accent: '#8b5cf6' }
  },
  {
    id: 'purple',
    label: 'Purple',
    description: 'Royal purple',
    colors: { primary: '#9333ea', secondary: '#f3e8ff', accent: '#a855f7' }
  },
  {
    id: 'fuchsia',
    label: 'Fuchsia',
    description: 'Bright fuchsia',
    colors: { primary: '#c026d3', secondary: '#fae8ff', accent: '#d946ef' }
  },
  {
    id: 'pink',
    label: 'Pink',
    description: 'Playful pink',
    colors: { primary: '#db2777', secondary: '#fce7f3', accent: '#ec4899' }
  },
  {
    id: 'rose',
    label: 'Rose',
    description: 'Elegant rose',
    colors: { primary: '#e11d48', secondary: '#ffe4e6', accent: '#f43f5e' }
  },
];

const THEME_MODE_OPTIONS = [
  { id: 'light' as ThemeMode, label: 'Light', icon: Sun, description: 'Light theme' },
  { id: 'dark' as ThemeMode, label: 'Dark', icon: Moon, description: 'Dark theme' },
  { id: 'system' as ThemeMode, label: 'System', icon: Monitor, description: 'Follow system' },
];

const RADIUS_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 0.3, label: 'Small' },
  { value: 0.5, label: 'Medium' },
  { value: 0.75, label: 'Large' },
  { value: 1.0, label: 'Extra Large' },
];

const FONT_OPTIONS = [
  { id: 'inter' as const, label: 'Inter', description: 'Modern and clean' },
  { id: 'system' as const, label: 'System', description: 'System default' },
];

// =============================================================================
// UI COMPONENTS
// =============================================================================

// Using Ant Design Button component instead

// Using Ant Design Dropdown component instead

const ColorThemeGrid: React.FC<{
  selectedTheme: ColorTheme;
  onSelect: (theme: ColorTheme) => void;
}> = ({ selectedTheme, onSelect }) => {
  return (
    <div className="grid grid-cols-5 gap-2 p-1">
      {COLOR_THEME_OPTIONS.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={cn(
            'group relative flex h-8 w-8 items-center justify-center rounded-md border-2 transition-all',
            'hover:scale-105',
            selectedTheme === option.id
              ? 'border-ring ring-2 ring-ring ring-offset-2 ring-offset-background'
              : 'border-transparent hover:border-muted-foreground/25'
          )}
          title={`${option.label} - ${option.description}`}
        >
          <div 
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: option.colors.primary }}
          />
          {selectedTheme === option.id && (
            <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-2.5 w-2.5" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ className, isMobile = false }) => {
  const { config, setMode, setColorTheme, setRadius, setFontFamily, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const currentThemeOption = COLOR_THEME_OPTIONS.find(option => option.id === config.colorTheme);
  const currentModeOption = THEME_MODE_OPTIONS.find(option => option.id === config.mode);

  const dropdownContent = (
      <div style={{ 
        padding: '16px', 
        minWidth: '320px',
        background: 'hsl(var(--card))',
        borderRadius: '8px',
        border: '1px solid hsl(var(--border))',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          borderBottom: '1px solid hsl(var(--border))', 
          paddingBottom: '8px',
          marginBottom: '16px'
        }}>
          <Palette style={{ width: '16px', height: '16px' }} />
          <h3 style={{ 
            fontWeight: '500', 
            fontSize: '14px', 
            margin: 0,
            color: 'hsl(var(--foreground))'
          }}>Theme Settings</h3>
        </div>

        {/* Theme Mode */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ 
            fontSize: '12px', 
            fontWeight: '500', 
            color: 'hsl(var(--muted-foreground))',
            display: 'block',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Mode
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
            {THEME_MODE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = config.mode === option.id;

  return (
                <button
                  key={option.id}
                  onClick={() => setMode(option.id)}
        style={{
          display: 'flex',
                    flexDirection: 'column',
          alignItems: 'center',
                    gap: '4px',
                    padding: '8px',
                    fontSize: '12px',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    background: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--background))',
                    color: isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Icon style={{ width: '16px', height: '16px' }} />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Simple Color Theme Selection */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ 
            fontSize: '12px', 
            fontWeight: '500', 
            color: 'hsl(var(--muted-foreground))',
            display: 'block',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Color Theme
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(28px, 1fr))', gap: '6px', maxWidth: '280px' }}>
            {COLOR_THEME_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setColorTheme(option.id)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  border: config.colorTheme === option.id ? '2px solid hsl(var(--foreground))' : '1px solid hsl(var(--border))',
                  background: option.colors.primary,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title={option.label}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              />
            ))}
          </div>
        </div>

        {/* Theme Info */}
        <div style={{
          borderTop: '1px solid hsl(var(--border))',
          paddingTop: '8px',
          fontSize: '12px',
          color: 'hsl(var(--muted-foreground))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: currentThemeOption?.colors.primary
              }}
            />
            <span>
              {config.mode === 'system'
                ? `${currentModeOption?.label} (${resolvedTheme}) • ${currentThemeOption?.label}`
                : `${currentModeOption?.label} • ${currentThemeOption?.label}`
              }
            </span>
            {config.mode === 'system' && (
              <Monitor style={{ width: '12px', height: '12px', opacity: 0.6 }} />
            )}
          </div>
        </div>
      </div>
  );

  return (
    <Dropdown 
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      placement="bottomRight"
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <div style={{ display: 'inline-block' }}>
        <HeaderThemeIcon 
          className={cn('theme-selector-button', className)}
          style={{
            cursor: 'pointer'
          }}
        />
      </div>
    </Dropdown>
  );
};

export default ThemeSelector; 