/**
 * Theme-Aware Logo Component
 * 
 * A responsive logo component that automatically switches between light and dark theme logos.
 * Follows atomic design principles and integrates with the shadcn theme system.
 * 
 * Features:
 * - Automatic theme detection using useTheme hook
 * - Responsive sizing with configurable height
 * - Accessibility compliant with proper alt text
 * - Performance optimized with React.memo
 * - TypeScript support with comprehensive prop types
 * - Fallback handling for missing images
 * 
 * Usage:
 * <ThemeLogo height={32} alt="intelliSPEC Logo" className="custom-class" />
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../../providers/ThemeProvider';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export interface ThemeLogoProps {
  /** Height of the logo in pixels (width auto-scales) */
  height?: number;
  /** Alt text for accessibility */
  alt?: string;
  /** Additional CSS classes */
  className?: string;
  /** Custom style object */
  style?: React.CSSProperties;
  /** Click handler for logo interactions */
  onClick?: () => void;
  /** Loading state callback */
  onLoad?: () => void;
  /** Error state callback */
  onError?: () => void;
}

// =============================================================================
// LOGO PATHS CONFIGURATION
// =============================================================================

const LOGO_PATHS = {
  light: '/light-logo.png',     // Light logo for light theme
  dark: '/logo-white.png'       // White logo for dark theme
} as const;

const FALLBACK_LOGO = '/logo.png'; // Fallback if theme-specific logos fail

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * ThemeLogo - Responsive, theme-aware logo component
 */
export const ThemeLogo: React.FC<ThemeLogoProps> = React.memo(({
  height = 32,
  alt = 'intelliSPEC Logo',
  className = '',
  style = {},
  onClick,
  onLoad,
  onError
}) => {
  const { resolvedTheme } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [attemptedSrc, setAttemptedSrc] = useState<string>('');

  // Select appropriate logo based on current theme
  const logoSrc = useMemo(() => {
    const themeLogo = LOGO_PATHS[resolvedTheme] || LOGO_PATHS.light;
    
    // If we've already tried this logo and it failed, use fallback
    if (imageError && attemptedSrc === themeLogo) {
      return FALLBACK_LOGO;
    }
    
    return themeLogo;
  }, [resolvedTheme, imageError, attemptedSrc]);

  // Handle image load success
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setImageError(false);
    setAttemptedSrc(''); // Reset attempted src on successful load
    onLoad?.();
  }, [onLoad]);

  // Handle image load error with fallback
  const handleError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const failedSrc = event.currentTarget.src;
    console.warn('Logo failed to load:', failedSrc);
    setIsLoading(false);
    setAttemptedSrc(failedSrc);
    
    if (!imageError) {
      console.log('Switching to fallback logo');
      setImageError(true);
    } else {
      console.error('Fallback logo also failed to load');
    }
    onError?.();
  }, [imageError, onError]);

  // Handle logo click
  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  // Reset error state when theme changes
  useEffect(() => {
    setImageError(false);
    setAttemptedSrc('');
    setIsLoading(true);
  }, [resolvedTheme]);

  // Combine styles
  const combinedStyle: React.CSSProperties = {
    height: `${height}px`,
    width: 'auto',
    maxWidth: '100%',
    objectFit: 'contain',
    transition: 'opacity 0.2s ease-in-out',
    opacity: isLoading ? 0.7 : 1,
    cursor: onClick ? 'pointer' : 'default',
    ...style
  };

  // Combine classes
  const combinedClassName = [
    'theme-logo',
    onClick && 'theme-logo--clickable',
    isLoading && 'theme-logo--loading',
    imageError && 'theme-logo--fallback',
    className
  ].filter(Boolean).join(' ');

  return (
    <img
      src={logoSrc}
      alt={alt}
      className={combinedClassName}
      style={combinedStyle}
      onClick={handleClick}
      onLoad={handleLoad}
      onError={handleError}
      draggable={false}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
    />
  );
});

ThemeLogo.displayName = 'ThemeLogo';

// =============================================================================
// PRESET VARIANTS
// =============================================================================

/**
 * Header Logo - Optimized for header usage
 */
export const HeaderLogo: React.FC<Omit<ThemeLogoProps, 'height'> & { height?: number }> = (props) => (
  <ThemeLogo height={28} {...props} />
);

/**
 * Login Logo - Optimized for login page usage
 */
export const LoginLogo: React.FC<Omit<ThemeLogoProps, 'height'> & { height?: number }> = (props) => (
  <ThemeLogo height={48} {...props} />
);

/**
 * Sidebar Logo - Optimized for sidebar usage
 */
export const SidebarLogo: React.FC<Omit<ThemeLogoProps, 'height'> & { height?: number }> = (props) => (
  <ThemeLogo height={24} {...props} />
);

// =============================================================================
// EXPORT
// =============================================================================

export default ThemeLogo;
