/**
 * Generic KPI Gadget
 * 
 * A metadata-driven gadget that displays KPI metrics with aggregation support.
 * Supports complex aggregation configurations, data transformations, and dynamic KPI rendering.
 * All business logic is defined in metadata - no hardcoded calculations or field mappings.
 * 
 * This extends the basic KPIGadget to support complex workspace configurations like VOC analytics.
 */

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import WorkspaceFilterContext, { WorkspaceFilterContextValue } from '../../../../contexts/WorkspaceFilterContext';
import { ValidationResult } from '../../core/base';
import { BaseGadget, GadgetConfig, GadgetContext, GadgetMetadata, GadgetSchema, GadgetType } from '../base';

export interface KPIConfig {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  iconColor?: string;
  unit?: string;
  format?: 'number' | 'percentage' | 'currency' | 'decimal';
  decimals?: number;
  status?: 'good' | 'warning' | 'danger' | 'excellent';
  aggregationConfig?: {
    name: string;
    collection: string;
    baseFilter?: Record<string, any>;
    fieldMappings?: Record<string, string>;
    groupBy?: Record<string, any>;
    pipeline?: any[];
    postProcess?: {
      calculations?: Record<string, { formula: string }>;
    };
  };
  dataPath?: string;
  target?: {
    value: number;
    comparison: 'gte' | 'lte' | 'eq' | 'ne';
  };
  trend?: {
    enabled: boolean;
    periodComparison?: 'previous_period' | 'same_period_last_year';
  };
}

export interface GenericKPIGadgetConfig extends GadgetConfig {
  kpis: KPIConfig[];
  kpiLayout?: 'grid' | 'row' | 'column';
  columns?: number;
  showTrends?: boolean;
  showTargets?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  size?: 'small' | 'medium' | 'large';
  dataUrl?: string;
}

export default class GenericKPIGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'generic-kpi-gadget',
    name: 'Generic KPI Gadget',
    version: '1.0.0',
    description: 'Metadata-driven KPI gadget with aggregation support',
    author: 'Gadget Library',
    tags: ['kpi', 'metrics', 'dashboard', 'aggregation', 'generic'],
    category: 'dashboard',
    gadgetType: GadgetType.DASHBOARD,
    widgetTypes: ['kpi'],
    dataFlow: {
      inputs: ['filter-context', 'aggregation-data'],
      outputs: ['kpi-events', 'kpi-data'],
      transformations: ['aggregation', 'calculation', 'formatting']
    },
    layout: {
      type: 'grid',
      responsive: true
    },
    interactions: {
      events: ['kpi-click', 'kpi-hover', 'target-alert'],
      handlers: ['onKPIClick', 'onKPIHover', 'onTargetAlert'],
      workflows: ['drill-down', 'filtering', 'alerting']
    }
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      kpis: {
        type: 'array',
        description: 'Array of KPI configurations',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            icon: { type: 'string' },
            iconColor: { type: 'string' },
            unit: { type: 'string' },
            format: { 
              type: 'string',
              enum: ['number', 'percentage', 'currency', 'decimal']
            },
            decimals: { type: 'number' },
            aggregationConfig: { type: 'object' },
            dataPath: { type: 'string' },
            target: { type: 'object' },
            trend: { type: 'object' }
          },
          required: ['id', 'title']
        }
      },
      kpiLayout: {
        type: 'string',
        enum: ['grid', 'row', 'column'],
        default: 'grid'
      },
      columns: {
        type: 'number',
        description: 'Number of columns in grid layout',
        default: 6
      },
      showTrends: {
        type: 'boolean',
        default: true
      },
      showTargets: {
        type: 'boolean',
        default: true
      },
      autoRefresh: {
        type: 'boolean',
        default: true
      },
      refreshInterval: {
        type: 'number',
        default: 300000
      },
      size: {
        type: 'string',
        enum: ['small', 'medium', 'large'],
        default: 'medium'
      }
    },
    required: ['kpis'],
    widgetSchemas: {
      'kpi': {
        type: 'object',
        properties: {
          kpis: { type: 'array' },
          loading: { type: 'boolean' },
          error: { type: 'string' }
        }
      }
    }
  };

  renderBody(props: any, context?: GadgetContext): React.ReactNode {
    return React.createElement(GenericKPIGadgetComponent, { ...props, context });
  }

  validate(config: GadgetConfig): ValidationResult {
    const errors: string[] = [];
    const kpiConfig = config as GenericKPIGadgetConfig;
    
    if (!kpiConfig.kpis || !Array.isArray(kpiConfig.kpis)) {
      errors.push('kpis array is required');
    } else {
      kpiConfig.kpis.forEach((kpi, index) => {
        if (!kpi.id) {
          errors.push(`KPI at index ${index} missing required id`);
        }
        if (!kpi.title) {
          errors.push(`KPI at index ${index} missing required title`);
        }
      });
    }
    
    if (kpiConfig.columns && (kpiConfig.columns < 1 || kpiConfig.columns > 24)) {
      errors.push('columns must be between 1 and 24');
    }
    
    if (kpiConfig.refreshInterval && kpiConfig.refreshInterval < 1000) {
      errors.push('refreshInterval must be at least 1000ms');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getRequiredWidgets(): string[] {
    return ['kpi'];
  }

  getWidgetLayout(): Record<string, any> {
    return {
      type: 'grid',
      responsive: true
    };
  }

  processDataFlow(data: any): any {
    return {
      kpis: data?.kpis || [],
      loading: data?.loading || false,
      error: data?.error || null
    };
  }

  onGadgetMount(): void {
}

  onGadgetUnmount(): void {
}

  onWidgetAdd(widget: any): void {
}

  onWidgetRemove(widgetId: string): void {
}

  onDataFlowChange(connections: Map<string, string[]>): void {
}
}

// Functional component for the actual rendering logic
const GenericKPIGadgetComponent: React.FC<any> = ({ kpis, context, ...props }) => {
  // Extract KPIs from either direct prop or nested config
  const actualKpis = useMemo(() => {
    if (kpis && kpis.length > 0) return kpis;
    if (props.kpis && props.kpis.length > 0) return props.kpis;
    return props.config?.kpis || [];
  }, [kpis, props.config?.kpis, props.kpis]);
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filterContext = useContext(WorkspaceFilterContext) as WorkspaceFilterContextValue | undefined;

  // Extract value from data using dataPath
  const extractValue = useCallback((data: any, dataPath: string): any => {
    if (!dataPath || !data) return data;
    
    const parts = dataPath.split('.');
    let current = data;
    
    for (const part of parts) {
      if (part.includes('[') && part.includes(']')) {
        // Handle array access like "data[0]"
        const [arrayName, indexStr] = part.split('[');
        const index = parseInt(indexStr.replace(']', ''));
        current = current?.[arrayName]?.[index];
      } else {
        current = current?.[part];
      }
      
      if (current === undefined || current === null) {
        return null;
      }
    }
    
    return current;
  }, []);

  // Fetch KPI data with aggregation
  const fetchKPIData = useCallback(async () => {
    if (!actualKpis || actualKpis.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if we have a shared dataUrl (call once for all KPIs)
      const sharedDataUrl = props.dataUrl || props.config?.dataUrl;
      let sharedData: any = null;
      
      if (sharedDataUrl && !actualKpis.some((kpi: KPIConfig) => kpi.aggregationConfig)) {
        // Fetch shared data once for all KPIs (optimization!)
        const url = new URL(sharedDataUrl, window.location.origin);
        const response = await BaseGadget.makeAuthenticatedFetch(url.toString(), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          sharedData = await response.json();
        }
      }

      const kpiResults = await Promise.all(
        actualKpis.map(async (kpi: KPIConfig) => {
          try {
            let value: any = null;

            if (kpi.aggregationConfig) {
              // Build filters from filter context mappings
              const filters: Record<string, any> = {};

              // Apply filter context mappings
              if (kpi.aggregationConfig.fieldMappings && filterContext?.filters) {
                Object.entries(filterContext.filters).forEach(([filterKey, filterObj]) => {
                  const filterValue = filterObj?.value;
                  if (filterValue === undefined || filterValue === null || filterValue === '') {
                    return;
                  }

                  if (Array.isArray(filterValue) && filterValue.length > 0) {
                    filters[filterKey] = filterValue;
                  } else if (!Array.isArray(filterValue)) {
                    filters[filterKey] = filterValue;
                  }
                });
              }
              // Build aggregation request with correct API structure
              const aggregationRequest: any = {
                config: kpi.aggregationConfig
              };
              
              // Only add filters if there are any active filters
              const hasActiveFilters = Object.keys(filters).length > 0;
              if (hasActiveFilters) {
                aggregationRequest.filters = filters;
}

              // Call aggregation API with authentication - use window.location.origin
              const apiUrl = new URL('/api/aggregation', window.location.origin).toString();
              
              const response = await BaseGadget.makeAuthenticatedFetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(aggregationRequest)
              });
              
              if (response.ok) {
                const responseData = await response.json();
if (kpi.dataPath) {
value = extractValue(responseData, kpi.dataPath);
} else {
value = responseData;
                }
                
                // Check if we got an empty result
                if (value === null || value === undefined || (Array.isArray(responseData.data) && responseData.data.length === 0)) {
}
              } else {
                value = null;
              }
            } else if (sharedData) {
              // Use shared data fetched once for all KPIs
              
              // If response has a stats array, find the matching stat by ID
              if (Array.isArray(sharedData.stats)) {
                const stat = sharedData.stats.find((s: any) => s.id === kpi.id);
                if (stat) {
                  value = stat.value;
                } else {
                  value = null;
                }
              } else if (kpi.dataPath) {
                // Fallback to dataPath extraction for object-based responses
                value = extractValue(sharedData, kpi.dataPath);
              } else {
                value = sharedData;
              }
            } else {
              value = null;
            }

            // Determine status based on target
            let status: 'good' | 'warning' | 'danger' | undefined;
            if (kpi.target && value !== null && value !== undefined) {
              const numValue = typeof value === 'string' ? parseFloat(value) : value;
              if (!isNaN(numValue)) {
                switch (kpi.target.comparison) {
                  case 'gte':
                    status = numValue >= kpi.target.value ? 'good' : 'warning';
                    break;
                  case 'lte':
                    status = numValue <= kpi.target.value ? 'good' : 'warning';
                    break;
                  case 'eq':
                    status = numValue === kpi.target.value ? 'good' : 'warning';
                    break;
                  case 'ne':
                    status = numValue !== kpi.target.value ? 'good' : 'warning';
                    break;
                }
              }
            }

            return {
              id: kpi.id,
              title: kpi.title,
              value: value, // Pass raw value to KPIWidget for proper formatting
              icon: kpi.icon, // Pass original icon name to let KPIWidget handle it
              iconColor: kpi.iconColor, // Pass iconColor through
              description: kpi.description,
              unit: kpi.unit,
              status: kpi.status || status, // Use explicit status from config or calculated status
              target: kpi.target ? kpi.target.value : undefined,
              rawValue: value
            };
          } catch (kpiError) {
            return {
              id: kpi.id,
              title: kpi.title,
              value: 'Error',
              icon: kpi.icon,
              description: kpi.description,
              status: 'danger' as const,
              rawValue: null
            };
          }
        })
      );

      setKpiData(kpiResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch KPI data');
    } finally {
      setLoading(false);
    }
  }, [actualKpis, filterContext?.filters, extractValue, props.config?.dataUrl, props.dataUrl]); // Specific dependencies only

  // Initial load
  useEffect(() => {
    fetchKPIData();
  }, [fetchKPIData]); // Depend on fetchKPIData

  // Listen to filter changes via refreshTrigger
  useEffect(() => {
    if (filterContext?.refreshTrigger !== undefined && filterContext.refreshTrigger > 0) {
      fetchKPIData();
    }
  }, [fetchKPIData, filterContext?.refreshTrigger]); // Depend on refreshTrigger and fetcher

  // Auto refresh
  useEffect(() => {
    if (!props.autoRefresh) return;

    const interval = setInterval(() => {
      fetchKPIData();
    }, props.refreshInterval || 300000);
    return () => clearInterval(interval);
  }, [fetchKPIData, props.autoRefresh, props.refreshInterval]);

  // Get the KPI widget from registry
  const widgetRegistry = (context as any)?.widgetRegistry;
  if (!widgetRegistry) {
    return React.createElement(
      'div',
      { style: { color: 'red', padding: '20px' } },
      'Error: Widget registry not available'
    );
  }

  const KPIWidget = widgetRegistry.get('kpi');
  if (!KPIWidget) {
    return React.createElement(
      'div',
      { style: { color: 'red', padding: '20px' } },
      'Error: KPI widget not found'
    );
  }

  return React.createElement(KPIWidget, {
    kpis: kpiData,
    loading,
    error,
    columns: props.config?.columns,
    onKPIClick: (kpi: any) => {
},
    onKPIHover: (kpi: any) => {
}
  });
};
