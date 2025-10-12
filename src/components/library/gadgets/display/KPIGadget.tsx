/**
 * KPI Gadget
 * 
 * A gadget that displays KPI metrics with proper class-based architecture.
 * This follows the standard gadget pattern extending BaseGadget.
 */

import React from 'react';
import { BaseGadget, GadgetType, GadgetMetadata, GadgetSchema, GadgetConfig, GadgetContext } from '../base';
import { ValidationResult } from '../../core/base';

export interface KPIGadgetConfig extends GadgetConfig {
  dataUrl: string;
  dataPath?: string;
  refreshInterval?: number;
  maxItems?: number;
  autoRefresh?: boolean;
}

export class KPIGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'kpi-gadget',
    name: 'KPI Gadget',
    version: '1.0.0',
    description: '',
    author: 'Gadget Library',
    tags: ['kpi', 'metrics', 'dashboard'],
    category: 'dashboard',
    gadgetType: GadgetType.DASHBOARD,
    widgetTypes: ['kpi'],
    dataFlow: {
      inputs: ['kpi-data'],
      outputs: ['kpi-events'],
      transformations: ['data-formatting']
    },
    layout: {
      type: 'flex',
      responsive: true
    },
    interactions: {
      events: ['kpi-click', 'kpi-hover'],
      handlers: ['onKPIClick', 'onKPIHover'],
      workflows: ['kpi-interaction']
    }
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      dataUrl: {
        type: 'string',
        description: 'URL to fetch KPI data from'
      },
      dataPath: {
        type: 'string',
        description: 'Path within the fetched data to extract KPIs',
        default: 'kpis'
      },
      maxItems: {
        type: 'number',
        description: 'Maximum number of KPIs to display',
        default: 8
      },
      refreshInterval: {
        type: 'number',
        description: 'Auto-refresh interval in milliseconds',
        default: 60000
      },
      autoRefresh: {
        type: 'boolean',
        description: 'Whether to auto-refresh data',
        default: true
      }
    },
    required: ['dataUrl'],
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
    const config = props as KPIGadgetConfig;
    const data = props.data || [];
    
    // removed debug logs
    
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
      kpis: data,
      loading: false,
      error: null,
      onKPIClick: (kpi: any) => {
        
      },
      onKPIHover: (kpi: any) => {
        
      }
    });
  }

  validate(config: GadgetConfig): ValidationResult {
    const errors: string[] = [];
    const kpiConfig = config as KPIGadgetConfig;
    
    if (!kpiConfig.dataUrl) {
      errors.push('dataUrl is required for KPI gadget');
    }
    
    if (kpiConfig.maxItems && kpiConfig.maxItems < 1) {
      errors.push('maxItems must be at least 1');
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
      type: 'flex',
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
