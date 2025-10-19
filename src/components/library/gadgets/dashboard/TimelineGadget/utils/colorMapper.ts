/**
 * Color mapping utilities
 * Maps Ant Design color names to shadcn/ui theme variables
 */

export interface ThemeColors {
  border: string;
  background: string;
  text: string;
}

/**
 * Map Ant Design color name to shadcn/ui theme colors
 */
export const getThemeColors = (antdColor: string): ThemeColors => {
  switch (antdColor) {
    case 'green':
      return {
        border: 'hsl(var(--success))',
        background: 'hsl(var(--success) / 0.1)',
        text: 'hsl(var(--success))'
      };
    
    case 'blue':
      return {
        border: 'hsl(var(--primary))',
        background: 'hsl(var(--primary) / 0.1)',
        text: 'hsl(var(--primary))'
      };
    
    case 'red':
      return {
        border: 'hsl(var(--destructive))',
        background: 'hsl(var(--destructive) / 0.1)',
        text: 'hsl(var(--destructive))'
      };
    
    case 'orange':
    case 'yellow':
      return {
        border: 'hsl(var(--warning))',
        background: 'hsl(var(--warning) / 0.1)',
        text: 'hsl(var(--warning))'
      };
    
    case 'gray':
    case 'default':
    default:
      return {
        border: 'hsl(var(--muted-foreground))',
        background: 'hsl(var(--muted) / 0.5)',
        text: 'hsl(var(--muted-foreground))'
      };
  }
};

/**
 * Get connecting line color with transparency
 */
export const getLineColor = (antdColor: string): string => {
  switch (antdColor) {
    case 'green':
      return 'hsl(var(--success) / 0.3)';
    case 'blue':
      return 'hsl(var(--primary) / 0.3)';
    case 'red':
      return 'hsl(var(--destructive) / 0.3)';
    case 'orange':
    case 'yellow':
      return 'hsl(var(--warning) / 0.3)';
    case 'gray':
    case 'default':
    default:
      return 'hsl(var(--border))';
  }
};

