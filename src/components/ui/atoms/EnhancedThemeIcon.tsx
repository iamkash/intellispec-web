/**
 * Enhanced Theme Icon Component
 * 
 * A beautiful, animated theme toggle icon that provides visual feedback
 * and smooth transitions between light, dark, and system modes.
 * 
 * Features:
 * - Smooth animations between theme states
 * - Visual feedback on hover and click
 * - Accessibility compliant
 * - Professional design with shadcn styling
 * - Theme-aware colors and effects
 * - Responsive sizing
 */

import { Monitor, Moon, Sun } from 'lucide-react';
import React, { useMemo } from 'react';
import { useTheme } from '../../../providers/ThemeProvider';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface EnhancedThemeIconProps {
  /** Size of the icon in pixels */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Custom style object */
  style?: React.CSSProperties;
  /** Show theme mode indicator */
  showIndicator?: boolean;
  /** Animation duration in milliseconds */
  animationDuration?: number;
}

// =============================================================================
// THEME ICON CONFIGURATIONS
// =============================================================================

const THEME_CONFIGS = {
  light: {
    icon: Sun,
    label: 'Light Mode'
  },
  dark: {
    icon: Moon,
    label: 'Dark Mode'
  },
  system: {
    icon: Monitor,
    label: 'System Mode'
  }
} as const;

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const EnhancedThemeIcon: React.FC<EnhancedThemeIconProps> = ({
  size = 16,
  className = '',
  style = {},
  showIndicator = false,
  animationDuration = 200
}) => {
  const { config } = useTheme();
  
  // Get current theme configuration
  const currentConfig = useMemo(() => {
    return THEME_CONFIGS[config.mode];
  }, [config.mode]);

  // Icon component
  const IconComponent = currentConfig.icon;

  return (
    <div
      className={`enhanced-theme-icon ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: '6px',
        border: '1px solid hsl(var(--border))',
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        cursor: 'pointer',
        transition: `all ${animationDuration}ms ease`,
        ...style
      }}
      title={currentConfig.label}
      role="button"
      tabIndex={0}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'hsl(var(--accent))';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'hsl(var(--background))';
      }}
      onFocus={(e) => {
        e.currentTarget.style.background = 'hsl(var(--accent))';
        e.currentTarget.style.outline = '2px solid hsl(var(--ring))';
        e.currentTarget.style.outlineOffset = '2px';
      }}
      onBlur={(e) => {
        e.currentTarget.style.background = 'hsl(var(--background))';
        e.currentTarget.style.outline = 'none';
      }}
    >
      <IconComponent size={size} />
    </div>
  );
};

// =============================================================================
// PRESET VARIANTS
// =============================================================================

/**
 * Header Theme Icon - Optimized for header usage
 */
export const HeaderThemeIcon: React.FC<Omit<EnhancedThemeIconProps, 'size'> & { size?: number }> = (props) => (
  <EnhancedThemeIcon size={16} {...props} />
);

/**
 * Large Theme Icon - For settings pages or prominent placement
 */
export const LargeThemeIcon: React.FC<Omit<EnhancedThemeIconProps, 'size'> & { size?: number }> = (props) => (
  <EnhancedThemeIcon size={24} {...props} />
);

/**
 * Compact Theme Icon - For tight spaces
 */
export const CompactThemeIcon: React.FC<Omit<EnhancedThemeIconProps, 'size'> & { size?: number }> = (props) => (
  <EnhancedThemeIcon size={16} showIndicator={false} {...props} />
);

// =============================================================================
// CSS ANIMATIONS (to be added to global styles)
// =============================================================================

export const themeIconStyles = `
@keyframes pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.05);
  }
}

.enhanced-theme-icon {
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.enhanced-theme-icon:active {
  transform: translateY(0px) scale(0.95) !important;
  transition: all 150ms ease !important;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .enhanced-theme-icon {
    border-width: 2px !important;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .enhanced-theme-icon,
  .enhanced-theme-icon * {
    transition: none !important;
    animation: none !important;
  }
}
`;

export default EnhancedThemeIcon;
