# Production-Ready Theme System Documentation

> **Production Implementation**: This theme system has been streamlined for production use with a single, unified Shell component that incorporates shadcn/ui New York styling.

## Overview

This project has been enhanced with a comprehensive shadcn/ui-inspired theme system that provides professional styling, extensive customization options, and excellent developer experience.

## 🎨 Features

### Design System
- **shadcn/ui New York Theme**: Professional, clean aesthetic
- **20+ Color Themes**: From neutral grays to vibrant colors
- **Light/Dark Mode**: Automatic system detection with manual override
- **Customizable Radius**: 5 border radius options (0rem to 1rem)
- **Typography**: Inter font family with system font fallback
- **CSS Custom Properties**: Modern design token system

### Development Experience
- **Type Safety**: Full TypeScript support for all theme options
- **Hot Reloading**: Instant theme changes during development
- **Validation**: Zod schemas for runtime validation
- **Performance**: Optimized with React.memo and useCallback
- **Accessibility**: WCAG compliant color contrasts and focus management

## 🚀 Quick Start

### Basic Usage

```tsx
import { ThemeProvider } from './providers/ThemeProvider';
import { ThemeSelector } from './components/ui/ThemeSelector';

function App() {
  return (
    <ThemeProvider defaultTheme="system" defaultColorTheme="blue">
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto p-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">My App</h1>
            <ThemeSelector />
          </div>
          {/* Your content */}
        </div>
      </div>
    </ThemeProvider>
  );
}
```

### Using the Theme Hook

```tsx
import { useTheme } from './providers/ThemeProvider';

function MyComponent() {
  const { config, resolvedTheme, setColorTheme, setMode } = useTheme();
  
  return (
    <div className="card">
      <p>Current theme: {config.colorTheme}</p>
      <p>Current mode: {resolvedTheme}</p>
      <button onClick={() => setColorTheme('emerald')}>
        Switch to Emerald
      </button>
    </div>
  );
}
```

## 🎯 Available Themes

### Color Themes
- **default**: Clean slate blue (professional)
- **neutral**: Balanced grays (minimal)
- **stone**: Warm grays (organic)
- **red**: Bold crimson
- **orange**: Vibrant orange
- **amber**: Golden amber
- **yellow**: Sunny yellow
- **lime**: Fresh lime
- **green**: Nature green
- **emerald**: Rich emerald
- **teal**: Ocean teal
- **cyan**: Electric cyan
- **sky**: Clear sky
- **blue**: Classic blue
- **indigo**: Deep indigo
- **violet**: Rich violet
- **purple**: Royal purple
- **fuchsia**: Bright fuchsia
- **pink**: Playful pink
- **rose**: Elegant rose

### Theme Modes
- **light**: Light theme
- **dark**: Dark theme
- **system**: Follow system preference

## 🛠 CSS Custom Properties

The theme system uses CSS custom properties for consistent styling:

```css
/* Core colors */
--background: Theme background color
--foreground: Main text color
--card: Card background
--card-foreground: Card text color
--popover: Popover background
--popover-foreground: Popover text color
--primary: Primary brand color
--primary-foreground: Text on primary color
--secondary: Secondary background
--secondary-foreground: Secondary text color
--muted: Muted background
--muted-foreground: Muted text color
--accent: Accent background
--accent-foreground: Accent text color
--destructive: Error/danger color
--destructive-foreground: Text on destructive color
--border: Border color
--input: Input border color
--ring: Focus ring color

/* Layout */
--radius: Border radius value

/* Shadows */
--shadow-sm: Small shadow
--shadow: Default shadow
--shadow-md: Medium shadow
--shadow-lg: Large shadow
--shadow-xl: Extra large shadow
```

## 📱 Component Classes

### Utility Classes
```css
/* Animations */
.animate-in
.fade-in-0
.zoom-in-95
.slide-in-from-top-2

/* Cards */
.card
.card-header
.card-title
.card-description
.card-content
.card-footer

/* Buttons */
.btn
.btn-default
.btn-destructive
.btn-outline
.btn-secondary
.btn-ghost
.btn-link

/* Inputs */
.input
.label

/* Badges */
.badge
.badge-default
.badge-secondary
.badge-destructive
.badge-outline

/* Separators */
.separator
.separator-horizontal
.separator-vertical
```

## 🔧 Customization

### Creating Custom Themes

You can extend the theme system by adding new color themes:

```tsx
// In your ThemeProvider
const CUSTOM_THEMES = {
  'my-brand': {
    light: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      primary: '200 100% 50%', // Your brand color
      // ... other properties
    },
    dark: {
      background: '240 10% 3.9%',
      foreground: '0 0% 98%',
      primary: '200 100% 60%', // Lighter for dark mode
      // ... other properties
    },
  },
};
```

### Custom Component Styling

```tsx
import { cn } from './lib/utils';

function MyComponent({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  );
}
```

## 🎪 Theme Selector Component

The ThemeSelector component provides a professional UI for theme customization:

### Features
- **Dropdown Interface**: Clean, organized controls
- **Color Grid**: Visual color theme selection
- **Mode Toggle**: Light/dark/system options
- **Radius Slider**: Border radius customization
- **Font Selection**: Typography options
- **Real-time Preview**: Instant theme updates

### Props
```tsx
interface ThemeSelectorProps {
  className?: string;
  isMobile?: boolean;
}
```

## 🏗 Architecture

### Theme Provider Structure
```
ThemeProvider
├── Theme Configuration Management
├── Local Storage Persistence
├── System Theme Detection
├── CSS Custom Property Application
└── Context Distribution
```

### Component Hierarchy
```
App
└── ThemeProvider
    ├── Layout Components
    ├── Shell Components
    └── Theme Selector
```

## 📦 Dependencies

### Core Dependencies
```json
{
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0",
  "lucide-react": "^0.300.0",
  "class-variance-authority": "^0.7.0"
}
```

### Development Dependencies
```json
{
  "tailwindcss": "^3.3.0",
  "tailwindcss-animate": "^1.0.7",
  "postcss": "^8.4.0",
  "autoprefixer": "^10.4.0"
}
```

## 🔍 Best Practices

### Performance
- Use `React.memo` for theme-dependent components
- Leverage `useCallback` for theme handlers
- Minimize theme context re-renders

### Accessibility
- Maintain WCAG AA contrast ratios
- Provide focus indicators
- Support reduced motion preferences
- Use semantic HTML elements

### Development
- Use TypeScript for type safety
- Follow shadcn/ui naming conventions
- Test theme changes across all components
- Document custom theme extensions

## 🐛 Troubleshooting

### Common Issues

1. **Theme not applying**: Check if component is wrapped in ThemeProvider
2. **CSS variables not working**: Ensure global.css is imported
3. **Flashing on load**: Verify localStorage handling in ThemeProvider
4. **Custom colors not showing**: Check HSL format in theme definition

### Debug Tools

```tsx
// Add to any component for theme debugging
const { config, resolvedTheme } = useTheme();
console.log('Current theme config:', config);
console.log('Resolved theme:', resolvedTheme);
```

## 📚 Examples

See the `ShellDemo` component for a comprehensive example of the theme system in action, including:
- Theme switching
- Real-time updates
- Component integration
- Responsive design

## 🚀 Migration Guide

### From Old Theme System

1. Replace old ThemeProvider import:
```tsx
// Before
import { ThemeProvider } from './components/providers/ThemeProvider';

// After
import { ThemeProvider } from './providers/ThemeProvider';
```

2. Update theme usage:
```tsx
// Before
// Updated pattern - use CSS variables directly
const themeContext = useTheme(); // Access theme configuration
// Or simply use CSS variables: 'hsl(var(--foreground))'
style={{ color: theme.colors.text.primary }}

// After  
const { resolvedTheme } = useTheme();
className="text-foreground"
```

3. Replace hardcoded styles with utility classes:
```tsx
// Before
style={{ 
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '8px'
}}

// After
className="bg-card border border-border rounded-lg"
```

The new theme system provides a much more maintainable, accessible, and professional styling solution that scales with your application's needs.
