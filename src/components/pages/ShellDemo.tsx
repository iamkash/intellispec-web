import React from 'react';
import { Shell, type ShellMetadata } from '../Shell';
import { ThemeSelector } from '../ui/ThemeSelector';
import { useTheme } from '../../providers/ThemeProvider';

/**
 * ShellDemo Component
 * 
 * A comprehensive demo page showcasing the production-ready Shell component 
 * with shadcn/ui theming system. Demonstrates the modern theme system
 * with live switching capabilities.
 */
export const ShellDemo: React.FC = () => {
  const { config, resolvedTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Header with theme controls */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Shell Component Demo
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Explore the modern, metadata-driven shell component with shadcn/ui theming
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ThemeSelector />
            </div>
          </div>
        </div>
      </div>

      {/* Theme info banner */}
      <div className="bg-muted/50 border-b border-border">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">
                Current theme: <span className="font-medium text-foreground">{config.colorTheme}</span>
              </span>
            </div>
            <div className="text-muted-foreground">
              Mode: <span className="font-medium text-foreground">{resolvedTheme}</span>
            </div>
            <div className="text-muted-foreground">
              Radius: <span className="font-medium text-foreground">{config.radius}rem</span>
            </div>
            <div className="text-muted-foreground">
              Font: <span className="font-medium text-foreground">{config.fontFamily}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shell container */}
      <div className="container mx-auto px-6 py-8">
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              Production Shell Component
            </div>
            <div className="card-description">
              Modern metadata-driven shell with shadcn/ui styling and comprehensive theme system
            </div>
          </div>
          <div className="card-content">
            <Shell
              metadataUrl="/data/shell-demo-metadata.json"
              onError={(error) => {
                console.error('Shell Demo Error:', error);
              }}
              onLoad={(metadata) => {
}}
              onWidgetLoad={(widgetId, widgetType) => {
}}
              onWidgetError={(widgetId, error) => {
                console.error('Widget error:', widgetId, error);
              }}
              className="min-h-[600px] rounded-lg border border-border bg-background"
            />
          </div>
        </div>

        {/* Feature showcase */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="card-header">
              <div className="card-title text-base">Theme System</div>
            </div>
            <div className="card-content">
              <p className="text-sm text-muted-foreground">
                Professional color themes, light/dark mode, and customizable styling options with 20+ preset colors.
              </p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <div className="card-title text-base">Metadata-Driven</div>
            </div>
            <div className="card-content">
              <p className="text-sm text-muted-foreground">
                Dynamic UI generation from JSON configuration with type-safe validation using Zod schemas.
              </p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <div className="card-title text-base">Accessibility</div>
            </div>
            <div className="card-content">
              <p className="text-sm text-muted-foreground">
                ARIA compliance, semantic HTML, keyboard navigation, and screen reader support built-in.
              </p>
            </div>
          </div>
        </div>

        {/* Technical details */}
        <div className="mt-8 card">
          <div className="card-header">
            <div className="card-title">Technical Implementation</div>
            <div className="card-description">
              Modern design system features and capabilities
            </div>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-foreground mb-3">Design System</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• shadcn/ui New York theme system</li>
                  <li>• CSS custom properties for design tokens</li>
                  <li>• 20+ professional color themes</li>
                  <li>• Responsive design with mobile optimization</li>
                  <li>• Smooth animations and micro-interactions</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-3">Framework Features</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Type-safe metadata with Zod validation</li>
                  <li>• Widget registry with lazy loading</li>
                  <li>• Extensible plugin architecture</li>
                  <li>• XSS protection and content sanitization</li>
                  <li>• i18n ready with locale support</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Production features */}
        <div className="mt-8 card">
          <div className="card-header">
            <div className="card-title">Production-Ready Features</div>
            <div className="card-description">
              Enterprise-grade capabilities for production deployment
            </div>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-foreground mb-3">Performance</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• React.memo optimization for component re-renders</li>
                  <li>• Lazy loading support for widgets</li>
                  <li>• Efficient state management with useMemo</li>
                  <li>• Optimized bundle size with code splitting</li>
                  <li>• Minimal re-renders with useCallback</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-3">Reliability</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Comprehensive error boundaries</li>
                  <li>• Type-safe props with TypeScript</li>
                  <li>• Schema validation with Zod</li>
                  <li>• Graceful fallback components</li>
                  <li>• Retry mechanisms for failed requests</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};