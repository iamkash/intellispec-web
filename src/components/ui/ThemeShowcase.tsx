/**
 * Theme Showcase Component
 * 
 * A comprehensive demonstration of the shadcn/ui theme system
 * showing all available color themes, modes, and styling options.
 */

import React from 'react';
import { useTheme, type ColorTheme } from '../../providers/ThemeProvider';
import { cn } from '../../lib/utils';
import { 
  Palette, 
  Sun, 
  Moon, 
  Monitor,
  Sparkles,
  Star,
  Heart,
  Zap
} from 'lucide-react';

const COLOR_THEMES: { id: ColorTheme; label: string; description: string }[] = [
  { id: 'default', label: 'Default', description: 'Clean slate blue' },
  { id: 'neutral', label: 'Neutral', description: 'Balanced grays' },
  { id: 'stone', label: 'Stone', description: 'Warm grays' },
  { id: 'red', label: 'Red', description: 'Bold crimson' },
  { id: 'orange', label: 'Orange', description: 'Vibrant orange' },
  { id: 'amber', label: 'Amber', description: 'Golden amber' },
  { id: 'yellow', label: 'Yellow', description: 'Sunny yellow' },
  { id: 'lime', label: 'Lime', description: 'Fresh lime' },
  { id: 'green', label: 'Green', description: 'Nature green' },
  { id: 'emerald', label: 'Emerald', description: 'Rich emerald' },
  { id: 'teal', label: 'Teal', description: 'Ocean teal' },
  { id: 'cyan', label: 'Cyan', description: 'Electric cyan' },
  { id: 'sky', label: 'Sky', description: 'Clear sky' },
  { id: 'blue', label: 'Blue', description: 'Classic blue' },
  { id: 'indigo', label: 'Indigo', description: 'Deep indigo' },
  { id: 'violet', label: 'Violet', description: 'Rich violet' },
  { id: 'purple', label: 'Purple', description: 'Royal purple' },
  { id: 'fuchsia', label: 'Fuchsia', description: 'Bright fuchsia' },
  { id: 'pink', label: 'Pink', description: 'Playful pink' },
  { id: 'rose', label: 'Rose', description: 'Elegant rose' },
];

export const ThemeShowcase: React.FC = () => {
  const { config, resolvedTheme, setColorTheme, setMode } = useTheme();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Palette className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Theme Showcase</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore our comprehensive theme system with 20+ professional color themes,
          light/dark modes, and modern design components.
        </p>
      </div>

      {/* Current Theme Info */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Current Configuration</div>
          <div className="card-description">
            Your active theme settings
          </div>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary mx-auto mb-2"></div>
              <div className="text-sm font-medium text-foreground">{config.colorTheme}</div>
              <div className="text-xs text-muted-foreground">Color Theme</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2">
                {resolvedTheme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </div>
              <div className="text-sm font-medium text-foreground">{resolvedTheme}</div>
              <div className="text-xs text-muted-foreground">Mode</div>
            </div>
            <div className="text-center">
              <div 
                className="w-12 h-12 bg-accent mx-auto mb-2"
                style={{ borderRadius: `${config.radius}rem` }}
              ></div>
              <div className="text-sm font-medium text-foreground">{config.radius}rem</div>
              <div className="text-xs text-muted-foreground">Radius</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                <span className="text-xs font-bold">Aa</span>
              </div>
              <div className="text-sm font-medium text-foreground">{config.fontFamily}</div>
              <div className="text-xs text-muted-foreground">Font</div>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Mode Selector */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Theme Modes</div>
          <div className="card-description">
            Switch between light, dark, and system preference
          </div>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 'light' as const, label: 'Light', icon: Sun },
              { id: 'dark' as const, label: 'Dark', icon: Moon },
              { id: 'system' as const, label: 'System', icon: Monitor },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={cn(
                  "flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-colors",
                  config.mode === id
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/50 hover:bg-accent"
                )}
              >
                <Icon className="h-8 w-8" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Color Theme Grid */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Color Themes</div>
          <div className="card-description">
            Choose from 20+ professionally designed color palettes
          </div>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {COLOR_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setColorTheme(theme.id)}
                className={cn(
                  "group flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all hover:scale-105",
                  config.colorTheme === theme.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-accent"
                )}
              >
                <div className="relative">
                  <div 
                    className="w-12 h-12 rounded-full border-2 border-background shadow-lg"
                    style={{ 
                      backgroundColor: theme.id === 'default' ? '#0f172a' : 
                                     theme.id === 'neutral' ? '#171717' :
                                     theme.id === 'stone' ? '#1c1917' :
                                     theme.id === 'red' ? '#dc2626' :
                                     theme.id === 'orange' ? '#ea580c' :
                                     theme.id === 'amber' ? '#d97706' :
                                     theme.id === 'yellow' ? '#ca8a04' :
                                     theme.id === 'lime' ? '#65a30d' :
                                     theme.id === 'green' ? '#16a34a' :
                                     theme.id === 'emerald' ? '#059669' :
                                     theme.id === 'teal' ? '#0d9488' :
                                     theme.id === 'cyan' ? '#0891b2' :
                                     theme.id === 'sky' ? '#0284c7' :
                                     theme.id === 'blue' ? '#2563eb' :
                                     theme.id === 'indigo' ? '#4338ca' :
                                     theme.id === 'violet' ? '#7c3aed' :
                                     theme.id === 'purple' ? '#9333ea' :
                                     theme.id === 'fuchsia' ? '#c026d3' :
                                     theme.id === 'pink' ? '#db2777' :
                                     '#e11d48'
                    }}
                  />
                  {config.colorTheme === theme.id && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Star className="h-3 w-3 text-primary-foreground fill-current" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-foreground">{theme.label}</div>
                  <div className="text-xs text-muted-foreground">{theme.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Component Examples */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Component Examples</div>
          <div className="card-description">
            See how the theme system affects various UI components
          </div>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Buttons */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Buttons</h4>
              <div className="space-y-2">
                <button className="w-full btn btn-default h-9 px-4 py-2">Primary Button</button>
                <button className="w-full btn btn-secondary h-9 px-4 py-2">Secondary Button</button>
                <button className="w-full btn btn-outline h-9 px-4 py-2">Outline Button</button>
                <button className="w-full btn btn-ghost h-9 px-4 py-2">Ghost Button</button>
              </div>
            </div>

            {/* Badges */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Badges</h4>
              <div className="flex flex-wrap gap-2">
                <span className="badge badge-default">Default</span>
                <span className="badge badge-secondary">Secondary</span>
                <span className="badge badge-destructive">Destructive</span>
                <span className="badge badge-outline">Outline</span>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Nested Card</h4>
              <div className="card">
                <div className="card-header">
                  <div className="card-title text-base">Card Title</div>
                  <div className="card-description">Card description text</div>
                </div>
                <div className="card-content">
                  <p className="text-sm text-muted-foreground">
                    This is a sample card showing theme integration.
                  </p>
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Form Elements</h4>
              <div className="space-y-2">
                <input 
                  className="input" 
                  placeholder="Enter text here..." 
                />
                <select className="input">
                  <option>Select option</option>
                  <option>Option 1</option>
                  <option>Option 2</option>
                </select>
              </div>
            </div>

            {/* Icons */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Icons</h4>
              <div className="flex gap-4">
                <Sparkles className="h-6 w-6 text-primary" />
                <Heart className="h-6 w-6 text-destructive" />
                <Zap className="h-6 w-6 text-yellow-500" />
                <Star className="h-6 w-6 text-amber-500 fill-current" />
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Typography</h4>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">Heading Text</h3>
                <p className="text-sm text-foreground">Regular text content</p>
                <p className="text-xs text-muted-foreground">Muted secondary text</p>
                <code className="text-sm bg-muted px-2 py-1 rounded">Code snippet</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Benefits */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Why This Theme System?</div>
          <div className="card-description">
            Professional benefits and technical advantages
          </div>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-3">Design Benefits</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Professional shadcn/ui aesthetics</li>
                <li>✓ Consistent spacing and typography</li>
                <li>✓ Accessible color contrasts (WCAG AA)</li>
                <li>✓ Mobile-first responsive design</li>
                <li>✓ Modern animations and interactions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">Developer Benefits</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Type-safe theme configuration</li>
                <li>✓ CSS custom properties for performance</li>
                <li>✓ Hot-reloadable theme changes</li>
                <li>✓ Extensible architecture</li>
                <li>✓ Zero runtime theme switching</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeShowcase;
