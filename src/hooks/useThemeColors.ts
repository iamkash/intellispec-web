import { useEffect, useState } from 'react';

/**
 * Get theme colors from CSS custom properties
 */
const getThemeColors = () => {
  if (typeof window === 'undefined') return {};
  
  const getThemeColor = (variable: string) => {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  };

  return {
    primary: `hsl(${getThemeColor('--primary')})`,
    primaryForeground: `hsl(${getThemeColor('--primary-foreground')})`,
    secondary: `hsl(${getThemeColor('--secondary')})`,
    accent: `hsl(${getThemeColor('--accent')})`,
    muted: `hsl(${getThemeColor('--muted')})`,
    foreground: `hsl(${getThemeColor('--foreground')})`,
    mutedForeground: `hsl(${getThemeColor('--muted-foreground')})`,
    border: `hsl(${getThemeColor('--border')})`,
    background: `hsl(${getThemeColor('--background')})`,
    card: `hsl(${getThemeColor('--card')})`,
    cardForeground: `hsl(${getThemeColor('--card-foreground')})`,
    destructive: `hsl(${getThemeColor('--destructive')})`,
    success: `hsl(${getThemeColor('--chart-2')})` || 'hsl(173 58% 39%)',
    warning: `hsl(${getThemeColor('--chart-4')})` || 'hsl(43 74% 66%)',
    chart1: `hsl(${getThemeColor('--chart-1')})` || 'hsl(12 76% 61%)',
    chart2: `hsl(${getThemeColor('--chart-2')})` || 'hsl(173 58% 39%)',
    chart3: `hsl(${getThemeColor('--chart-3')})` || 'hsl(197 37% 24%)',
    chart4: `hsl(${getThemeColor('--chart-4')})` || 'hsl(43 74% 66%)',
    chart5: `hsl(${getThemeColor('--chart-5')})` || 'hsl(27 87% 67%)'
  };
};

/**
 * Custom hook for reactive theme colors
 * Automatically updates when theme changes via CSS custom properties
 */
export const useThemeColors = () => {
  const [themeColors, setThemeColors] = useState(getThemeColors());

  useEffect(() => {
    const updateThemeColors = () => {
      setThemeColors(getThemeColors());
    };

    // Listen for theme changes via MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'class' || 
             mutation.attributeName === 'data-theme' ||
             mutation.attributeName === 'style')) {
          updateThemeColors();
        }
      });
    });

    // Observe changes to document element and body
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style']
    });
    
    if (document.body) {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class', 'data-theme', 'style']
      });
    }

    // Listen for custom theme change events
    window.addEventListener('themechange', updateThemeColors);
    
    // Also listen for storage events (in case theme is stored in localStorage)
    window.addEventListener('storage', (e) => {
      if (e.key === 'theme' || e.key === 'darkMode') {
        updateThemeColors();
      }
    });

    return () => {
      observer.disconnect();
      window.removeEventListener('themechange', updateThemeColors);
      window.removeEventListener('storage', updateThemeColors);
    };
  }, []);

  return themeColors;
};

export default useThemeColors;
