/**
 * Bar Chart Gadget
 * 
 * A gadget that displays data as a bar chart using Chart.js.
 * Supports dynamic data fetching and various chart configurations.
 */

import React from 'react';
import { BaseGadget, GadgetType, GadgetMetadata, GadgetSchema, GadgetConfig, GadgetContext } from '../base';
import { ValidationResult } from '../../core/base';

export interface BarChartGadgetConfig extends GadgetConfig {
  title?: string;
  dataKey?: string;
  nameKey?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  color?: string;
  height?: number;
  showTitle?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  animated?: boolean;
  size?: 'small' | 'medium' | 'large';
  autoRefresh?: boolean;
  refreshInterval?: number;
  responsive?: boolean;
  minHeight?: number;
  maxHeight?: number;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export class BarChartGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'bar-chart-gadget',
    name: 'Bar Chart Gadget',
    version: '1.0.0',
    description: '',
    author: 'Gadget Library',
    tags: ['chart', 'bar', 'visualization', 'data', 'gadget'],
    category: 'chart',
    gadgetType: GadgetType.DASHBOARD,
    widgetTypes: ['chart'],
    dataFlow: {
      inputs: ['chart-data'],
      outputs: ['chart-events'],
      transformations: ['data-formatting', 'aggregation']
    },
    layout: {
      type: 'flex',
      responsive: true
    },
    interactions: {
      events: ['bar-click', 'bar-hover', 'legend-click'],
      handlers: ['onBarClick', 'onBarHover', 'onLegendClick'],
      workflows: ['drill-down', 'filtering']
    }
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Chart title',
        default: 'Bar Chart'
      },
      dataKey: {
        type: 'string',
        description: 'Key for data values (Y-axis)',
        default: 'value'
      },
      nameKey: {
        type: 'string',
        description: 'Key for data labels (X-axis)',
        default: 'name'
      },
      xAxisLabel: {
        type: 'string',
        description: 'Label for X-axis',
        default: ''
      },
      yAxisLabel: {
        type: 'string',
        description: 'Label for Y-axis',
        default: ''
      },
      color: {
        type: 'string',
        description: 'Primary color for bars',
        default: '#8884d8'
      },
      height: {
        type: 'number',
        description: 'Chart height in pixels',
        default: 400
      },
      showTitle: {
        type: 'boolean',
        description: 'Whether to show chart title',
        default: true
      },
      showGrid: {
        type: 'boolean',
        description: 'Show grid lines',
        default: true
      },
      showTooltip: {
        type: 'boolean',
        description: 'Show tooltip on hover',
        default: true
      },
      showLegend: {
        type: 'boolean',
        description: 'Show legend',
        default: true
      },
      animated: {
        type: 'boolean',
        description: 'Enable animations',
        default: true
      },
      size: {
        type: 'string',
        description: 'Chart size preset',
        enum: ['small', 'medium', 'large'],
        default: 'medium'
      },
      autoRefresh: {
        type: 'boolean',
        description: 'Enable automatic data refresh',
        default: true
      },
      refreshInterval: {
        type: 'number',
        description: 'Refresh interval in milliseconds',
        default: 300000
      }
    },
    required: [],
    widgetSchemas: {
      'bar-chart': {
        type: 'object',
        properties: {
          data: { type: 'array' },
          dataKey: { type: 'string' },
          xAxisKey: { type: 'string' },
          xAxisLabel: { type: 'string' },
          yAxisLabel: { type: 'string' },
          color: { type: 'string' },
          height: { type: 'number' }
        }
      }
    }
  };

  renderBody(props: any, context?: GadgetContext): React.ReactNode {
    const config = props as BarChartGadgetConfig;
    const {
      title = 'Bar Chart',
      dataKey = 'value',
      nameKey = 'name',
      xAxisLabel = '',
      yAxisLabel = '',
      color = '#8884d8',
      height = 400,
      showTitle = true,
      showGrid = true,
      showTooltip = true,
      showLegend = true,
      animated = true,
      margin = { top: 20, right: 30, left: 20, bottom: 20 }
    } = config;
// Get widget registry from context
    const widgetRegistry = (context as any)?.widgetRegistry;
    if (!widgetRegistry) {
      return React.createElement(
        'div',
        { style: { color: 'red', padding: '20px' } },
        'Error: Widget registry not available'
      );
    }

    // Get the BarChartWidget from registry
    const BarChartWidget = widgetRegistry.get('bar-chart');
    if (!BarChartWidget) {
      return React.createElement(
        'div',
        { style: { color: 'red', padding: '20px' } },
        'Error: Bar chart widget not found'
      );
    }

    // Transform data from raw format to BarChart widget format (Recharts)
    const rawData = (props as any).data || [];
    const transformedData = rawData.map((item: any) => ({
      name: item[nameKey] || 'Unknown', // BarChart widget expects 'name' property for x-axis
      [dataKey]: Number(item[dataKey]) || 0, // Keep original dataKey for bar series
      ...item // Include other properties that might be used
    }));

    // Prepare widget props with transformed data and enhanced properties
    const widgetProps = {
      data: transformedData,
      dataKey, // BarChart widget uses dataKey for y-axis values
      xAxisKey: 'name', // BarChart widget uses 'name' for x-axis
      xAxisLabel,
      yAxisLabel,
      color,
      height,
      showGrid,
      showTooltip,
      showLegend,
      animated,
      margin,
      title: showTitle ? title : undefined
    };
return React.createElement(BarChartWidget, widgetProps);
  }

  validate(config: GadgetConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const barConfig = config as BarChartGadgetConfig;

    // Validate required fields
    if (!barConfig.dataKey) {
      errors.push('dataKey is required');
    }

    if (!barConfig.nameKey) {
      errors.push('nameKey is required');
    }

    // Validate numeric values
    if (barConfig.height && (typeof barConfig.height !== 'number' || barConfig.height <= 0)) {
      errors.push('Height must be a positive number');
    }

    if (barConfig.refreshInterval && (typeof barConfig.refreshInterval !== 'number' || barConfig.refreshInterval <= 0)) {
      errors.push('Refresh interval must be a positive number');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  getRequiredWidgets(): string[] {
    return ['bar-chart'];
  }

  getWidgetLayout(): Record<string, any> {
    return {
      'bar-chart': {
        type: 'full',
        responsive: true
      }
    };
  }

  processDataFlow(data: any): any {
    return data;
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