/**
 * Gadget Library Framework - Base Gadget System
 * 
 * This file defines the base gadget framework for creating thousands of
 * reusable gadgets that combine multiple widgets into cohesive units.
 * 
 * IMPORTANT: All gadgets MUST be rendered inside BaseGadgetContainer.
 * Gadgets can only provide content for specific container sections:
 * - Header (optional): Title, subtitle, actions
 * - Body (mandatory): Main content area
 * - Footer (optional): Status, timestamps, additional actions
 * 
 * Gadget Types:
 * - DataGadget: Combines data widgets for complex visualizations
 * - FormGadget: Combines input widgets for forms and data entry
 * - DashboardGadget: Combines display widgets for dashboards
 * - InteractiveGadget: Combines interaction widgets for complex UIs
 * - LayoutGadget: Combines layout widgets for complex layouts
 */

import React from 'react';
import { getApiFullUrl } from '../../../config/api.config';
import { FetchOptions } from '../../../utils/DataService';
import { BaseComponent, BaseRegistry, ComponentMetadata, ComponentSchema, ValidationResult } from '../core/base';
import { BaseWidget, WidgetConfig, WidgetContext } from '../widgets/base';

export enum GadgetType {
  DATA = 'data',
  FORM = 'form',
  DASHBOARD = 'dashboard',
  INTERACTIVE = 'interactive',
  LAYOUT = 'layout',
  CHART = 'chart',
  DISPLAY = 'display',
  CUSTOM = 'custom'
}

export interface GadgetMetadata extends ComponentMetadata {
  gadgetType: GadgetType;
  widgetTypes: string[];
  dataFlow?: {
    inputs: string[];
    outputs: string[];
    transformations: string[];
  };
  layout?: {
    type: 'grid' | 'flex' | 'absolute' | 'custom';
    responsive: boolean;
    breakpoints?: Record<string, any>;
  };
  interactions?: {
    events: string[];
    handlers: string[];
    workflows: string[];
  };
}

export interface GadgetSchema extends ComponentSchema {
  widgetSchemas: Record<string, ComponentSchema>;
  layoutSchema?: ComponentSchema;
  dataFlowSchema?: ComponentSchema;
  interactionSchema?: ComponentSchema;
}

export interface GadgetConfig {
  id: string;
  type: string;
  title?: string;
  dataUrl?: string;
  dataPath?: string;
  refreshInterval?: number;
  autoRefresh?: boolean;
  widgets?: WidgetConfig[];
  layout?: {
    type: string;
    props: Record<string, any>;
  };
  dataFlow?: {
    connections: Array<{
      source: string;
      target: string;
      transform?: string;
    }>;
  };
  interactions?: {
    events: Record<string, string>;
    workflows: Record<string, string[]>;
  };
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  props?: Record<string, any>;
  style?: Record<string, any>;
  authorization?: {
    roles?: string[];
    permissions?: string[];
  };
}

export interface GadgetContext extends WidgetContext {
  gadgetId?: string;
  widgets?: Record<string, BaseWidget>;
  dataFlow?: {
    connections: Map<string, string[]>;
    transformers: Map<string, Function>;
  };
  widgetRegistry?: any;
  data?: any;
  events?: Record<string, Function>;
  onAction?: (action: string, payload: any) => void;
}

export interface GadgetHeaderContent {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  status?: 'normal' | 'warning' | 'error' | 'success';
}

export interface GadgetFooterContent {
  content?: React.ReactNode;
  timestamp?: string;
  actions?: React.ReactNode;
}

export interface GadgetContainerProps {
  header?: GadgetHeaderContent;
  footer?: GadgetFooterContent;
  refreshable?: boolean;
  configurable?: boolean;
  expandable?: boolean;
  loading?: boolean;
  error?: string;
  size?: 'small' | 'medium' | 'large';
  noPadding?: boolean;
}

export interface GadgetState {
  data: any;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

export abstract class BaseGadget extends BaseComponent {
  abstract metadata: GadgetMetadata;
  abstract schema: GadgetSchema;
  
  protected state: GadgetState = {
    data: null,
    loading: false,
    error: null,
    lastFetch: null
  };
  
  protected refreshTimer: NodeJS.Timeout | null = null;

  // MANDATORY: All gadgets must provide body content
  abstract renderBody(props: any, context?: GadgetContext): React.ReactNode;
  
  // OPTIONAL: Gadgets can provide header content
  renderHeader?(props: any, context?: GadgetContext): GadgetHeaderContent | undefined;
  
  // OPTIONAL: Gadgets can provide footer content
  renderFooter?(props: any, context?: GadgetContext): GadgetFooterContent | undefined;
  
  // MANDATORY: Gadgets must provide container configuration
  getContainerProps(props: any, context?: GadgetContext): GadgetContainerProps {
    return {
      header: this.renderHeader ? this.renderHeader(props, context) : undefined,
      footer: this.renderFooter ? this.renderFooter(props, context) : undefined,
      refreshable: false,
      configurable: true,
      expandable: true,
      loading: false, // Loading state is now handled by individual components
      error: undefined, // Error state is now handled by individual components
      size: 'medium',
      noPadding: false
    };
  }
  
  // INTERNAL: Framework-only render method (maintains BaseComponent signature)
  render(props: any): React.ReactNode {
    // This method should not be called directly by the framework
    // Use renderStructured() instead for the new container pattern
    console.warn(`Direct render() called on gadget ${this.metadata.id}. Use renderStructured() instead.`);
    return this.renderBody(props);
  }

  // NEW: Framework method for structured rendering
  renderStructured(props: any, context?: GadgetContext): {
    body: React.ReactNode;
    containerProps: GadgetContainerProps;
  } {
    const config = props as GadgetConfig;
    
    try {
      // Create a React component that handles data fetching with proper hooks
      const body = this.renderBodyWithDataFetching(config, context);
      const containerProps = this.getContainerProps(props, context);
      
      return {
        body,
        containerProps
      };
    } catch (error) {
      console.error(`Error rendering gadget ${this.metadata.id}:`, error);
      return {
        body: (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: '#ff4d4f' 
          }}>
            <div>Gadget Error</div>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>
              {error instanceof Error ? error.message : String(error)}
            </div>
          </div>
        ),
        containerProps: {
          error: error instanceof Error ? error.message : String(error),
          size: 'medium'
        }
      };
        }
  }

  private renderBodyWithDataFetching(config: GadgetConfig, context?: GadgetContext): React.ReactNode {
    if (!config.dataUrl) {
      // No data URL, render directly with proper props structure
      return this.renderBody({ config, context }, context);
    }

    // Capture values at component creation time
    const dataUrl = config.dataUrl;
    const dataPath = config.dataPath;
    const metadataName = this.metadata.name;
    
    // Create a React component that handles the data fetching
    const DataFetcher: React.FC = () => {
      const [data, setData] = React.useState<any>(null);
      const [loading, setLoading] = React.useState(true);
      const [error, setError] = React.useState<string | null>(null);

      React.useEffect(() => {
        const fetchData = async () => {
          try {
            setLoading(true);
            setError(null);
            
            // Check for new record - skip data fetching if id=new
            const urlParams = new URLSearchParams(window.location.search);
            const idParam = urlParams.get('id') || '';
            
            if (idParam === 'new' || !idParam) {
setData(null);
              setLoading(false);
              return;
            }
            
            //console.log(`[${metadataName}] Fetching data from:`, dataUrl);
            
            const options: FetchOptions = {
              path: dataPath,
              cache: true,
              transform: (data) => this.processDataFlow(data)
            };

            // Temporary simple fetch for debugging
            //console.log(`[DEBUG] Trying simple fetch for: ${dataUrl}`);
            let usedUrl = dataUrl!;
            // Dev convenience: if running on port 3000 and hitting /api/*, hit backend directly to avoid proxy 404s
            try {
              const isDevHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
              const isCRADevPort = window.location.port === '3000';
              if (isDevHost && isCRADevPort && usedUrl.startsWith('/api/')) {
                usedUrl = `${window.location.protocol}//localhost:4000${usedUrl}`;
              }
            } catch {
              // ignore env detection errors
            }

            let simpleResponse = await BaseGadget.makeAuthenticatedFetch(usedUrl);
            //console.log(`[DEBUG] Simple fetch response:`, simpleResponse.status, simpleResponse.statusText);

            let contentType = simpleResponse.headers.get('content-type') || '';

            // Fallback: in dev, proxy may be inactive. If 404 or non-JSON on /api/*, retry against localhost:4000
            const shouldTryFallback = usedUrl.startsWith('/api/');
            if ((!simpleResponse.ok || !contentType.includes('application/json')) && shouldTryFallback) {
              // Try localhost then 127.0.0.1 as fallbacks
              const candidates = [
                `${window.location.protocol}//localhost:4000${usedUrl}`,
                `${window.location.protocol}//127.0.0.1:4000${usedUrl}`
              ];
              for (const candidate of candidates) {
                try {
                  const resp = await BaseGadget.makeAuthenticatedFetch(candidate);
                  const ct = resp.headers.get('content-type') || '';
                  if (resp.ok && ct.includes('application/json')) {
                    usedUrl = candidate;
                    simpleResponse = resp;
                    contentType = ct;
                    break;
                  }
                } catch {
                  // keep trying
                }
              }
            }

            if (!simpleResponse.ok) {
              throw new Error(`HTTP ${simpleResponse.status}: ${simpleResponse.statusText}`);
            }
            if (!contentType.includes('application/json')) {
              const text = await simpleResponse.text();
              const snippet = text.slice(0, 120).replace(/\n/g, ' ');
              throw new Error(`Expected JSON but received '${contentType}'. Response starts with: ${snippet}`);
            }

            const jsonData = await simpleResponse.json();
            //console.log(`[DEBUG] Raw JSON data:`, jsonData);
            
            let processedData = Array.isArray(jsonData) ? jsonData : (jsonData && Array.isArray((jsonData as any).items) ? (jsonData as any).items : jsonData);

            // Optional server-driven prefix filtering via query param
            let requestedPrefix: string | null = null;
            try {
              const url = new URL(dataUrl!, window.location.origin);
              requestedPrefix = url.searchParams.get('prefix');
              if (requestedPrefix && Array.isArray(processedData)) {
                processedData = processedData.filter((it: any) => typeof it?.id === 'string' && it.id.startsWith(requestedPrefix!));
              }
            } catch {
              // ignore URL parse errors
            }

            // Dev-only seeding: if API returns empty but browser localStorage has matching items, seed the API and refetch once
            if (
              Array.isArray(processedData) && processedData.length === 0 &&
              requestedPrefix && typeof window !== 'undefined' &&
              (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
              window.location.port === '3000'
            ) {
              try {
                const localItems: any[] = [];
                for (let i = 0; i < localStorage.length; i++) {
                  const key = localStorage.key(i) as string;
                  if (!key || !key.startsWith(requestedPrefix)) continue;
                  const raw = localStorage.getItem(key);
                  if (!raw) continue;
                  try {
                    const parsed = JSON.parse(raw);
                    if (parsed && typeof parsed === 'object' && parsed.id) localItems.push(parsed);
                  } catch {}
                }
                if (localItems.length > 0) {
                  const postOne = async (payload: any) => {
                    const smallPayload = (() => {
                      try {
                        const minimal = {
                          id: String(payload?.id || ''),
                          gadgetId: String(payload?.gadgetId || ''),
                          configId: String(payload?.configId || ''),
                          timestamp: String(payload?.timestamp || new Date().toISOString()),
                          data: {
                            currentStep: Number(payload?.data?.currentStep || 0),
                            completedSteps: Array.isArray(payload?.data?.completedSteps) ? payload.data.completedSteps : []
                          }
                        };
                        return minimal;
                      } catch { return payload; }
                    })();
                    const tryUrl = async (base: string) => {
                      const u = `${base}/api/wizard`;
                      const r = await fetch(u, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(smallPayload) });
                      if (!r.ok) throw new Error(String(r.status));
                    };
                    try {
                      await tryUrl('');
                    } catch {
                      const origin = `${window.location.protocol}//localhost:4000`;
                      await tryUrl(origin);
                    }
                  };
                  await Promise.allSettled(localItems.map(postOne));

                  // Re-fetch once after seeding
                  const refetch = await BaseGadget.makeAuthenticatedFetch(usedUrl);
                  const ct2 = refetch.headers.get('content-type') || '';
                  if (refetch.ok && ct2.includes('application/json')) {
                    const jd2 = await refetch.json();
                    processedData = Array.isArray(jd2) ? jd2 : (jd2 && Array.isArray((jd2 as any).items) ? (jd2 as any).items : jd2);
                    if (requestedPrefix && Array.isArray(processedData)) {
                      processedData = processedData.filter((it: any) => typeof it?.id === 'string' && it.id.startsWith(requestedPrefix!));
                    }
                  }
                }
              } catch {
                // ignore seeding errors
              }
            }
            if (dataPath) {
              //console.log(`[DEBUG] Extracting path: ${dataPath}`);
              // Simple path extraction (e.g., "kpis" from {"kpis": [...])
              const pathParts = dataPath.split('.');
              for (const part of pathParts) {
                if (processedData && typeof processedData === 'object' && part in processedData) {
                  processedData = processedData[part];
                } else {
                  console.warn(`[DEBUG] Path part "${part}" not found in data`);
                  break;
                }
              }
              //console.log(`[DEBUG] Data after path extraction:`, processedData);
            }
            
            const response = { data: processedData };
            
            //console.log(`[${metadataName}] Data fetched successfully:`, response);
            
            setData(response.data);
          } catch (err) {
            console.error(`[${metadataName}] Failed to fetch data:`, err);
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
          } finally {
            setLoading(false);
          }
        };

        fetchData();
      }, [dataUrl, dataPath, metadataName]); // Use captured values as dependencies

      if (loading) {
        return React.createElement('div', 
          { style: { textAlign: 'center', padding: '20px', color: '#666' } },
          'Loading...'
        );
      }

      if (error) {
        return React.createElement('div', 
          { style: { textAlign: 'center', padding: '20px', color: 'red' } },
          `Error: ${error}`
        );
      }

      const body = this.renderBody({ config: { ...config, data }, context }, context);
      // Ensure we always return a valid React element
      return body as React.ReactElement || React.createElement('div', null, 'No content');
    };

    return React.createElement(DataFetcher);
  }

  abstract validate(config: GadgetConfig): ValidationResult;
  
  // Gadget-specific methods
  abstract getRequiredWidgets(): string[];
  abstract getWidgetLayout(): Record<string, any>;
  abstract processDataFlow(data: any): any;

  // Widget management
  protected widgets: Map<string, BaseWidget> = new Map();
  
  // Data flow management
  protected dataConnections: Map<string, string[]> = new Map();
  protected dataTransformers: Map<string, Function> = new Map();
  
  // Lifecycle hooks
  onGadgetMount?(): void;
  onGadgetUnmount?(): void;
  onWidgetAdd?(widget: BaseWidget): void;
  onWidgetRemove?(widgetId: string): void;
  onDataFlowChange?(connections: Map<string, string[]>): void;

  /**
   * Centralized HTTP method with authentication for all gadgets
   */
  protected async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    return BaseGadget.makeAuthenticatedFetch(url, options);
  }

  /**
   * Get tenant ID from authenticated user - log out if unavailable
   */
  static getTenantIdForRequest(url: string, options?: RequestInit): string {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');

    // Check if user is authenticated
    if (!userStr || !token) {
      console.warn('⚠️ No authentication data found');
      return 'default-tenant';
    }

    // Get tenant ID from authenticated user
    try {
      const user = JSON.parse(userStr);
      const tenantId = user.tenantId || user.tenant_id || user.orgId || user.organizationId || user.companyId || user.tenantSlug;

      if (tenantId) {
return tenantId;
      } else {
        console.error('❌ User authenticated but no tenant ID found');
        console.error('User data:', user);

        // For debugging, return default tenant
        console.warn('⚠️ Using default-tenant for debugging (no tenant ID in user data)');
        return 'default-tenant';
      }
    } catch (error) {
      console.error('❌ Failed to parse user authentication data:', error);
      console.error('Raw user string:', userStr);

      // For debugging, return default tenant
      console.warn('⚠️ Using default-tenant for debugging (parse error)');
      return 'default-tenant';
    }
  }

  /**
   * Force logout when tenant ID is unavailable
   */
  static forceLogout(): void {
// Clear all authentication data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');

    // Clear any other auth-related data
    localStorage.removeItem('userId');
    localStorage.removeItem('tenantId');

    // Redirect to login page (if available)
    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
window.location.href = '/login';
    }
  }

  /**
   * Static method for authenticated fetch - can be used in functional components
   * 
   * IMPORTANT: This method automatically resolves API URLs using the centralized apiConfig.
   * All relative URLs (e.g., /api/inspections) will be converted to absolute URLs
   * pointing to the correct API server (e.g., http://localhost:4000/api/inspections).
   */
  static async makeAuthenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    // Convert relative URLs to absolute using centralized config
    // This ensures all /api/* calls go to the correct API server (port 4000)
    const resolvedUrl = getApiFullUrl(url);
    
    // Log for debugging in development
    if (process.env.NODE_ENV === 'development' && url !== resolvedUrl) {
      console.log(`[BaseGadget] URL resolved: ${url} → ${resolvedUrl}`);
    }
    
    // Include JWT token for authentication
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    // Only add Content-Type for requests with a body
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Get tenant ID (will logout if unavailable)
    let tenantId: string;
    try {
      tenantId = BaseGadget.getTenantIdForRequest(url, options || {});
      headers['x-tenant-id'] = tenantId;
    } catch (error) {
      console.error('❌ Failed to get tenant ID:', error);
      // Return a rejected promise to prevent the request from proceeding
      return Promise.reject(error);
    }

    // Add user ID for consistency
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const userId = user.userId || user.id || user.sub || user.userId;
        if (userId) {
          headers['x-user-id'] = userId;
        }
      } catch (error) {
        console.warn('Failed to parse user data for user ID header:', error);
      }
    }

    // Use the resolved URL (converted from relative to absolute if needed)
    return fetch(resolvedUrl, {
      ...options,
      headers
    });
  }

  /**
   * Fetch data from the configured URL
   */
  protected async fetchData(config: GadgetConfig): Promise<void> {
    if (!config.dataUrl) return;

    this.setState({ loading: true, error: null });

    try {
      //console.log(`[${this.metadata.name}] Fetching data from:`, config.dataUrl);
      
      const options: FetchOptions = {
        path: config.dataPath,
        cache: true,
        transform: (data) => this.processDataFlow(data)
      };

      // Use centralized authenticated fetch instead of dataService
      const response = await this.makeAuthenticatedRequest(config.dataUrl);
      const data = await response.json();
      const processedData = this.processDataFlow(data);
      
      //console.log(`[${this.metadata.name}] Data fetched successfully:`, response);
      
      this.setState({
        data: { data: processedData, status: response.status, statusText: response.statusText },
        loading: false,
        error: null,
        lastFetch: Date.now()
      });
    } catch (error) {
      console.error(`[${this.metadata.name}] Failed to fetch data:`, error);
      
      this.setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch data'
      });
    }
  }

  /**
   * Set up auto-refresh if configured
   */
  protected setupAutoRefresh(config: GadgetConfig): void {
    if (config.autoRefresh && config.refreshInterval && config.refreshInterval > 0) {
      this.refreshTimer = setInterval(() => {
        this.fetchData(config);
      }, config.refreshInterval);
    }
  }

  /**
   * Update internal state
   */
  protected setState(newState: Partial<GadgetState>): void {
    this.state = { ...this.state, ...newState };
  }

  /**
   * Cleanup resources
   */
  protected cleanup(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // Widget management methods
  addWidget(widget: BaseWidget): void {
    this.widgets.set(widget.metadata.id, widget);
    this.onWidgetAdd?.(widget);
  }
  
  removeWidget(widgetId: string): void {
    this.widgets.delete(widgetId);
    this.onWidgetRemove?.(widgetId);
  }
  
  getWidget(widgetId: string): BaseWidget | undefined {
    return this.widgets.get(widgetId);
  }

  getAllWidgets(): BaseWidget[] {
    return Array.from(this.widgets.values());
  }

  // Data flow methods
  connectWidgets(sourceId: string, targetId: string, transformer?: Function): void {
    if (!this.dataConnections.has(sourceId)) {
      this.dataConnections.set(sourceId, []);
    }
    this.dataConnections.get(sourceId)!.push(targetId);
    
    if (transformer) {
      this.dataTransformers.set(`${sourceId}->${targetId}`, transformer);
    }
    
    this.onDataFlowChange?.(this.dataConnections);
  }
  
  disconnectWidgets(sourceId: string, targetId: string): void {
    const connections = this.dataConnections.get(sourceId);
    if (connections) {
      const index = connections.indexOf(targetId);
      if (index > -1) {
        connections.splice(index, 1);
        this.dataTransformers.delete(`${sourceId}->${targetId}`);
      }
    }

    this.onDataFlowChange?.(this.dataConnections);
  }
  
  propagateData(sourceId: string, data: any): void {
    const connections = this.dataConnections.get(sourceId);
    if (!connections) return;
    
    connections.forEach(targetId => {
      const transformer = this.dataTransformers.get(`${sourceId}->${targetId}`);
      const processedData = transformer ? transformer(data) : data;
      
      const targetWidget = this.getWidget(targetId);
      if (targetWidget && targetWidget.onDataChange) {
        targetWidget.onDataChange(processedData);
      }
    });
  }

  // Validation methods
  protected validateGadgetConfig(config: GadgetConfig): ValidationResult {
    const errors: string[] = [];

    // Validate base config
    if (!config.id) errors.push('Gadget ID is required');
    if (!config.type) errors.push('Gadget type is required');
    
    // Validate required widgets if they exist
    if (config.widgets) {
      const requiredWidgets = this.getRequiredWidgets();
      const providedWidgets = config.widgets.map(w => w.type);
      
      requiredWidgets.forEach(required => {
        if (!providedWidgets.includes(required)) {
          errors.push(`Required widget type '${required}' is missing`);
        }
      });
      
      // Validate widget configurations
      config.widgets.forEach(widgetConfig => {
        if (!widgetConfig.id) {
          errors.push('Widget ID is required');
        }
        if (!widgetConfig.type) {
          errors.push('Widget type is required');
        }
      });
    }
    
    // Validate data flow if it exists
    if (config.dataFlow) {
      config.dataFlow.connections.forEach(connection => {
        if (!connection.source || !connection.target) {
          errors.push('Data flow connections must have source and target');
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  protected renderWidgets(config: GadgetConfig, context?: GadgetContext): React.ReactNode[] {
    if (!config.widgets) return [];
    
    return config.widgets.map(widgetConfig => {
      const widget = this.getWidget(widgetConfig.id);
      if (!widget) {
        return React.createElement('div', { key: widgetConfig.id }, `Widget not found: ${widgetConfig.id}`);
      }
      
      return React.createElement(
        'div',
        { 
          key: widgetConfig.id, 
          className: `gadget-widget widget-${widgetConfig.type}` 
        },
        widget.render(widgetConfig.props, context)
      );
    });
  }
  
  protected applyLayout(widgets: React.ReactNode[], layout: any): React.ReactNode {
    const layoutType = layout?.type || 'flex';
    const layoutProps = layout?.props || {};
    
    switch (layoutType) {
      case 'grid':
        return React.createElement('div', { className: 'gadget-grid-layout', style: layoutProps }, ...widgets);
      case 'flex':
        return React.createElement('div', { className: 'gadget-flex-layout', style: layoutProps }, ...widgets);
      case 'absolute':
        return React.createElement('div', { className: 'gadget-absolute-layout', style: layoutProps }, ...widgets);
      default:
        return React.createElement('div', { className: 'gadget-custom-layout', style: layoutProps }, ...widgets);
    }
  }

  /**
   * Sanitize data to prevent XSS attacks
   */
  protected sanitizeData(data: any): any {
    if (typeof data === 'string') {
      return data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeData(value);
      }
      return sanitized;
    }
    
    return data;
  }
}

// Gadget Registry
export class GadgetRegistry extends BaseRegistry<BaseGadget> {
  private typeIndex = new Map<GadgetType, Set<string>>();
  private widgetTypeIndex = new Map<string, Set<string>>();

  register(gadget: BaseGadget): void {
    super.register(gadget);
    
    // Index by gadget type
    if (!this.typeIndex.has(gadget.metadata.gadgetType)) {
      this.typeIndex.set(gadget.metadata.gadgetType, new Set());
    }
    this.typeIndex.get(gadget.metadata.gadgetType)!.add(gadget.metadata.id);
    
    // Index by widget types
    gadget.metadata.widgetTypes.forEach(widgetType => {
      if (!this.widgetTypeIndex.has(widgetType)) {
        this.widgetTypeIndex.set(widgetType, new Set());
      }
      this.widgetTypeIndex.get(widgetType)!.add(gadget.metadata.id);
    });
  }

  unregister(id: string): void {
    const gadget = this.get(id);
    if (gadget) {
      // Remove from type indices
      const typeSet = this.typeIndex.get(gadget.metadata.gadgetType);
      if (typeSet) {
        typeSet.delete(id);
        if (typeSet.size === 0) {
          this.typeIndex.delete(gadget.metadata.gadgetType);
        }
      }
      
      // Remove from widget type indices
      gadget.metadata.widgetTypes.forEach(widgetType => {
        const widgetSet = this.widgetTypeIndex.get(widgetType);
        if (widgetSet) {
          widgetSet.delete(id);
          if (widgetSet.size === 0) {
            this.widgetTypeIndex.delete(widgetType);
          }
        }
      });
    }
    
    super.unregister(id);
  }

  getByType(type: GadgetType): BaseGadget[] {
    const ids = this.typeIndex.get(type) || new Set();
    return Array.from(ids).map(id => this.get(id)!).filter(Boolean);
  }

  getByWidgetType(widgetType: string): BaseGadget[] {
    const ids = this.widgetTypeIndex.get(widgetType) || new Set();
    return Array.from(ids).map(id => this.get(id)!).filter(Boolean);
  }

  findCompatibleGadgets(widgetTypes: string[]): BaseGadget[] {
    const compatibleIds = new Set<string>();
    
    widgetTypes.forEach(widgetType => {
      const ids = this.widgetTypeIndex.get(widgetType) || new Set();
      ids.forEach(id => compatibleIds.add(id));
    });
    
    return Array.from(compatibleIds).map(id => this.get(id)!).filter(Boolean);
  }
}

// Global gadget registry instance
export const gadgetRegistry = new GadgetRegistry();

// Gadget Factory
export class GadgetFactory {
  static createGadget(type: string, config: GadgetConfig, context?: GadgetContext): React.ReactNode {
    const gadget = gadgetRegistry.get(type);
    if (!gadget) {
      throw new Error(`Gadget type '${type}' not found`);
    }

    const validation = gadget.validate(config);
    
    if (!validation.isValid) {
      throw new Error(`Invalid gadget configuration: ${validation.errors.join(', ')}`);
    }

    return gadget.render(config);
  }

  static validateGadgetConfig(type: string, config: GadgetConfig): ValidationResult {
    const gadget = gadgetRegistry.get(type);
    if (!gadget) {
      return { isValid: false, errors: [`Gadget type '${type}' not found`] };
    }

    return gadget.validate(config);
  }

  static getGadgetSchema(type: string): GadgetSchema | undefined {
    const gadget = gadgetRegistry.get(type);
    return gadget?.schema;
  }

  static getAvailableGadgets(): GadgetMetadata[] {
    return gadgetRegistry.getAll().map((gadget: BaseGadget) => gadget.metadata);
  }

  static getGadgetsForWidgets(widgetTypes: string[]): GadgetMetadata[] {
    return gadgetRegistry.findCompatibleGadgets(widgetTypes).map((gadget: BaseGadget) => gadget.metadata);
  }
}