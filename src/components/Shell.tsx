/**
 * Production-Grade Metadata-Driven Shell Component
 * Built with shadcn/ui New York styling and modern theme system
 * 
 * Features:
 * - Full shadcn/ui integration
 * - Modern CSS custom properties
 * - Professional animations
 * - Responsive design
 * - Accessibility compliant
 * - Type-safe metadata
 */

import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { z } from 'zod';
import { cn } from '../lib/utils';
import { useTheme } from '../providers/ThemeProvider';

// Import available widgets
import { StatsCardComponent } from './library/widgets/display/StatsCard';
import ActivityFeedWidget from './library/widgets/display/ActivityFeedWidget';

// =============================================================================
// TYPE DEFINITIONS & SCHEMAS
// =============================================================================

interface GridPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WidgetConfig {
  id: string;
  type: string;
  title?: string;
  position: GridPosition;
  config: Record<string, any>;
  dataSource?: DataSource;
  style?: React.CSSProperties;
  className?: string;
}

interface DataSource {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  transform?: string;
}

interface LayoutConfig {
  type: string;
  columns?: number;
  gap?: string;
  responsive?: boolean;
  padding?: string;
  maxWidth?: string;
}

interface GlobalConfig {
  apiBaseUrl?: string;
  refreshInterval?: number;
  theme?: Record<string, any>;
  locale?: string;
  timezone?: string;
  features?: Record<string, boolean>;
}

interface ShellMetadata {
  id: string;
  title: string;
  description?: string;
  theme?: string;
  layout: LayoutConfig;
  widgets: WidgetConfig[];
  globalConfig?: GlobalConfig;
  version?: string;
  lastModified?: string;
}

interface WidgetRegistryEntry {
  component: React.ComponentType<any>;
  displayName?: string;
  description?: string;
  category?: string;
  version?: string;
  loader?: () => Promise<{ default: React.ComponentType<any> }>;
}

interface WidgetContext {
  theme: string;
  locale: string;
  globalConfig?: GlobalConfig;
  onAction?: (action: string, payload?: any) => void;
}

interface ShellProps {
  metadataUrl: string;
  onError?: (error: Error) => void;
  onLoad?: (metadata: ShellMetadata) => void;
  onWidgetLoad?: (widgetId: string, widgetType: string) => void;
  onWidgetError?: (widgetId: string, error: Error) => void;
  className?: string;
  style?: React.CSSProperties;
  loadingComponent?: React.ComponentType;
  errorComponent?: React.ComponentType<{ error: Error; retry: () => void }>;
  fallbackComponent?: React.ComponentType<{ widgetId: string; widgetType: string }>;
}

interface WidgetWrapperProps {
  widget: WidgetConfig;
  context: WidgetContext;
  onLoad?: (widgetId: string, widgetType: string) => void;
  onError?: (widgetId: string, error: Error) => void;
  fallbackComponent?: React.ComponentType<{ widgetId: string; widgetType: string }>;
}

interface WidgetState {
  loading: boolean;
  error: Error | null;
  data: any;
}

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const DataSourceSchema = z.object({
  url: z.string().url(),
  method: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.any().optional(),
  transform: z.string().optional(),
});

const GridPositionSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().min(1).max(12),
  height: z.number().min(1),
});

const WidgetConfigSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  title: z.string().optional(),
  position: GridPositionSchema,
  config: z.record(z.string(), z.any()),
  dataSource: DataSourceSchema.optional(),
  style: z.any().optional(),
  className: z.string().optional(),
});

const GlobalConfigSchema = z.object({
  apiBaseUrl: z.string().optional(),
  refreshInterval: z.number().optional(),
  theme: z.record(z.string(), z.any()).optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
  features: z.record(z.string(), z.boolean()).optional(),
});

const LayoutConfigSchema = z.object({
  type: z.string(),
  columns: z.number().optional(),
  gap: z.string().optional(),
  responsive: z.boolean().optional(),
  padding: z.string().optional(),
  maxWidth: z.string().optional(),
});

const ShellMetadataSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  theme: z.string().optional(),
  layout: LayoutConfigSchema,
  widgets: z.array(WidgetConfigSchema),
  globalConfig: GlobalConfigSchema.optional(),
  version: z.string().optional(),
  lastModified: z.string().optional(),
});

// =============================================================================
// WIDGET REGISTRY
// =============================================================================

class WidgetRegistry {
  private static registry: Map<string, WidgetRegistryEntry> = new Map();

  static register(
    type: string,
    component: React.ComponentType<any>,
    options?: {
      displayName?: string;
      description?: string;
      category?: string;
      version?: string;
    }
  ): void {
    this.registry.set(type, {
      component,
      displayName: options?.displayName || component.displayName || type,
      description: options?.description,
      category: options?.category,
      version: options?.version,
    });
  }

  static registerAsync(
    type: string,
    loader: () => Promise<{ default: React.ComponentType<any> }>,
    options?: {
      displayName?: string;
      description?: string;
      category?: string;
      version?: string;
    }
  ): void {
    const LazyComponent = React.lazy(loader);
    this.registry.set(type, {
      component: LazyComponent,
      displayName: options?.displayName || type,
      description: options?.description,
      category: options?.category,
      version: options?.version,
      loader,
    });
  }

  static get(type: string): React.ComponentType<any> | null {
    const entry = this.registry.get(type);
    return entry?.component || null;
  }

  static has(type: string): boolean {
    return this.registry.has(type);
  }

  static getTypes(): string[] {
    return Array.from(this.registry.keys());
  }

  static getMetadata(type: string): Omit<WidgetRegistryEntry, 'component'> | null {
    const entry = this.registry.get(type);
    if (!entry) return null;
    
    const { component, ...metadata } = entry;
    return metadata;
  }

  static clear(): void {
    this.registry.clear();
  }
}

// =============================================================================
// CONTEXT & HOOKS
// =============================================================================

const WidgetContextProvider = createContext<WidgetContext | null>(null);

const useWidgetContext = (): WidgetContext => {
  const context = useContext(WidgetContextProvider);
  if (!context) {
    throw new Error('useWidgetContext must be used within a WidgetContextProvider');
  }
  return context;
};

const useMetadata = (url: string, onError?: (error: Error) => void, onLoad?: (metadata: ShellMetadata) => void) => {
  const [metadata, setMetadata] = useState<ShellMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetadata = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const validatedData = ShellMetadataSchema.parse(data);
      
      setMetadata(validatedData);
      onLoad?.(validatedData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [url, onError, onLoad]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  return { metadata, loading, error, refetch: fetchMetadata };
};

const useWidgetData = (dataSource?: DataSource, globalConfig?: GlobalConfig) => {
  const [state, setState] = useState<WidgetState>({
    loading: false,
    error: null,
    data: null,
  });

  const fetchData = useCallback(async () => {
    if (!dataSource) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const baseUrl = globalConfig?.apiBaseUrl || '';
      const url = dataSource.url.startsWith('http') ? dataSource.url : `${baseUrl}${dataSource.url}`;

      const response = await fetch(url, {
        method: dataSource.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...dataSource.headers,
        },
        body: dataSource.body ? JSON.stringify(dataSource.body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let data = await response.json();

      if (dataSource.transform) {
        try {
          // eslint-disable-next-line no-new-func
          const transformFn = new Function('data', `return ${dataSource.transform}`);
          data = transformFn(data);
        } catch (transformError) {
          console.warn('Data transformation failed:', transformError);
        }
      }

      setState(prev => ({ ...prev, loading: false, data }));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch widget data');
      setState(prev => ({ ...prev, loading: false, error }));
    }
  }, [dataSource, globalConfig]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
};

// =============================================================================
// COMPONENTS
// =============================================================================

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const ErrorDisplay: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 max-w-md">
      <h3 className="text-sm font-medium text-destructive mb-2">
        Error Loading Content
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        {error.message}
      </p>
      <button
        onClick={retry}
        className="inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-3"
      >
        Retry
      </button>
    </div>
  </div>
);

const WidgetFallback: React.FC<{ widgetId: string; widgetType: string }> = ({ widgetId, widgetType }) => (
  <div className="flex flex-col items-center justify-center min-h-[150px] p-6 text-center">
    <div className="rounded-lg border-2 border-dashed border-muted p-4 max-w-sm">
      <div className="w-12 h-12 bg-muted rounded-lg mb-3 mx-auto flex items-center justify-center text-2xl">
        ⚠️
      </div>
      <h4 className="text-sm font-medium text-foreground mb-1">
        Widget Not Found
      </h4>
      <p className="text-xs text-muted-foreground mb-1">
        Widget "{widgetType}" is not registered
      </p>
      <p className="text-xs text-muted-foreground/60">
        ID: {widgetId}
      </p>
    </div>
  </div>
);

const WidgetWrapper: React.FC<WidgetWrapperProps> = ({
  widget,
  context,
  onLoad,
  onError,
  fallbackComponent: FallbackComponent = WidgetFallback,
}) => {
  const { data, loading, error, refetch } = useWidgetData(widget.dataSource, context.globalConfig);

  const WidgetComponent = useMemo(() => {
    return WidgetRegistry.get(widget.type);
  }, [widget.type]);

  const handleError = useCallback((error: Error) => {
    onError?.(widget.id, error);
  }, [widget.id, onError]);

  const handleLoad = useCallback(() => {
    onLoad?.(widget.id, widget.type);
  }, [widget.id, widget.type, onLoad]);

  useEffect(() => {
    if (WidgetComponent && !loading && !error) {
      handleLoad();
    }
  }, [WidgetComponent, loading, error, handleLoad]);

  useEffect(() => {
    if (error) {
      handleError(error);
    }
  }, [error, handleError]);

  const widgetProps = useMemo(() => ({
    ...widget.config,
    data: data || widget.config.data,
    loading,
    error,
    refetch,
    context,
    widgetId: widget.id,
    title: widget.title,
  }), [widget.config, widget.id, widget.title, data, loading, error, refetch, context]);

  if (!WidgetComponent) {
    return <FallbackComponent widgetId={widget.id} widgetType={widget.type} />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay error={error} retry={refetch} />;
  }

  return (
    <div
      style={widget.style}
      className={cn("w-full h-full overflow-hidden", widget.className)}
    >
      <React.Suspense fallback={<LoadingSpinner />}>
        <WidgetComponent {...widgetProps} />
      </React.Suspense>
    </div>
  );
};

const WidgetGrid: React.FC<{
  widgets: WidgetConfig[];
  layout: LayoutConfig;
  context: WidgetContext;
  onWidgetLoad?: (widgetId: string, widgetType: string) => void;
  onWidgetError?: (widgetId: string, error: Error) => void;
  fallbackComponent?: React.ComponentType<{ widgetId: string; widgetType: string }>;
}> = ({ widgets, layout, context, onWidgetLoad, onWidgetError, fallbackComponent }) => {
  
  const renderWidget = (widget: WidgetConfig) => (
    <WidgetWrapper
      key={widget.id}
      widget={widget}
      context={context}
      onLoad={onWidgetLoad}
      onError={onWidgetError}
      fallbackComponent={fallbackComponent}
    />
  );

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${layout.columns || 12}, 1fr)`,
    gap: layout.gap || '1rem',
    padding: layout.padding || '1rem',
    maxWidth: layout.maxWidth || '100%',
    margin: '0 auto',
    minHeight: '100%',
  };

  return (
    <div style={gridStyle} className="widget-grid" role="main">
      {widgets.map((widget) => (
        <div
          key={widget.id}
          style={{
            gridColumn: `${widget.position.x + 1} / span ${widget.position.width}`,
            gridRow: `${widget.position.y + 1} / span ${widget.position.height}`,
            minHeight: `${widget.position.height * 100}px`,
          }}
          className="widget-container"
        >
          {renderWidget(widget)}
        </div>
      ))}
    </div>
  );
};

// =============================================================================
// MAIN SHELL COMPONENT
// =============================================================================

export const Shell: React.FC<ShellProps> = React.memo(({
  metadataUrl,
  onError,
  onLoad,
  onWidgetLoad,
  onWidgetError,
  className,
  style,
  loadingComponent: LoadingComponent = LoadingSpinner,
  errorComponent: ErrorComponent = ErrorDisplay,
  fallbackComponent,
}) => {
  const { metadata, loading, error, refetch } = useMetadata(metadataUrl, onError, onLoad);
  const { resolvedTheme } = useTheme();

  const context = useMemo((): WidgetContext => ({
    theme: metadata?.theme || resolvedTheme,
    locale: 'en',
    globalConfig: metadata?.globalConfig,
  }), [metadata, resolvedTheme]);

  if (loading) {
    return (
      <div className={cn("min-h-screen bg-background text-foreground", className)} style={style}>
        <LoadingComponent />
      </div>
    );
  }

  if (error || !metadata) {
    return (
      <div className={cn("min-h-screen bg-background text-foreground", className)} style={style}>
        <ErrorComponent error={error || new Error('Failed to load metadata')} retry={refetch} />
      </div>
    );
  }

  return (
    <WidgetContextProvider.Provider value={context}>
      <div 
        className={cn("min-h-screen bg-background text-foreground", className)} 
        style={style}
      >
        <WidgetGrid
          widgets={metadata.widgets}
          layout={metadata.layout}
          context={context}
          onWidgetLoad={onWidgetLoad}
          onWidgetError={onWidgetError}
          fallbackComponent={fallbackComponent}
        />
      </div>
    </WidgetContextProvider.Provider>
  );
});

Shell.displayName = 'Shell';

// =============================================================================
// EXPORTS
// =============================================================================

export default Shell;
export { WidgetRegistry, useWidgetContext, type ShellProps, type WidgetConfig, type ShellMetadata };

// =============================================================================
// WIDGET REGISTRATION
// =============================================================================

// Register default widgets with the Shell WidgetRegistry
WidgetRegistry.register('stats-card', StatsCardComponent, {
  displayName: 'Stats Card',
  description: 'Display statistics with trend indicators',
  category: 'display',
});

WidgetRegistry.register('activity-feed', ActivityFeedWidget, {
  displayName: 'Activity Feed',
  description: 'Show recent activity and events',
  category: 'display',
});

// Sample usage and metadata example in comments...
/*
// Example usage:
<Shell
  metadataUrl="/api/dashboard-config"
  onError={(error) => console.error('Dashboard error:', error)}
  onLoad={(metadata) => console.log('Dashboard loaded:', metadata)}
  onWidgetLoad={(id, type) => console.log('Widget loaded:', id, type)}
  onWidgetError={(id, error) => console.error('Widget error:', id, error)}
  className="custom-shell"
/>

// Sample metadata JSON:
{
  "id": "modern-dashboard",
  "title": "Modern Dashboard",
  "description": "A beautiful, modern dashboard with shadcn/ui styling",
  "layout": {
    "type": "grid",
    "columns": 12,
    "gap": "1rem",
    "responsive": true,
    "padding": "1rem"
  },
  "widgets": [
    {
      "id": "stats-1",
      "type": "stats-card",
      "title": "Total Revenue",
      "position": { "x": 0, "y": 0, "width": 3, "height": 2 },
      "config": {
        "value": "$12,345",
        "change": "+5.2%",
        "trend": "up"
      }
    }
  ],
  "globalConfig": {
    "apiBaseUrl": "https://api.example.com",
    "refreshInterval": 30000
  }
}
*/
