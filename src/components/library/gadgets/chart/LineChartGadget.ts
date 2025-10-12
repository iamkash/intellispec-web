/**
 * Line Chart Gadget
 * 
 * A gadget that displays data as a line chart using Chart.js.
 * Supports dynamic data fetching and various chart configurations.
 */

import React from 'react';
import { BaseGadget, GadgetType, GadgetMetadata, GadgetSchema, GadgetConfig, GadgetContext } from '../base';
import { ValidationResult } from '../../core/base';

export interface LineChartGadgetConfig extends GadgetConfig {
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
  showDots?: boolean;
  curved?: boolean;
  area?: boolean;
  gradient?: boolean;
  animated?: boolean;
  strokeWidth?: number;
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

export class LineChartGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'line-chart-gadget',
    name: 'Line Chart Gadget',
    version: '1.0.0',
    description: '',
    author: 'Gadget Library',
    tags: ['chart', 'line', 'visualization', 'data', 'gadget'],
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
      events: ['line-click', 'line-hover', 'legend-click'],
      handlers: ['onLineClick', 'onLineHover', 'onLegendClick'],
      workflows: ['drill-down', 'filtering']
    }
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Chart title',
        default: 'Line Chart'
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
        description: 'Primary color for line',
        default: '#8884d8'
      },
      height: {
        type: 'number',
        description: 'Chart height in pixels',
        default: 400
      },
      strokeWidth: {
        type: 'number',
        description: 'Line stroke width',
        default: 2
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
      showDots: {
        type: 'boolean',
        description: 'Show data points',
        default: true
      },
      curved: {
        type: 'boolean',
        description: 'Use curved lines (monotone)',
        default: true
      },
      area: {
        type: 'boolean',
        description: 'Fill area under line',
        default: false
      },
      gradient: {
        type: 'boolean',
        description: 'Use gradient fill for area',
        default: false
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
      'line-chart': {
        type: 'object',
        properties: {
          data: { type: 'array' },
          dataKey: { type: 'string' },
          xAxisKey: { type: 'string' },
          xAxisLabel: { type: 'string' },
          yAxisLabel: { type: 'string' },
          color: { type: 'string' },
          height: { type: 'number' },
          strokeWidth: { type: 'number' }
        }
      }
    }
  };

  renderBody(props: any, context?: GadgetContext): React.ReactNode {
    const config = props as LineChartGadgetConfig;
    const {
      title = 'Line Chart',
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
      showDots = true,
      curved = true,
      area = false,
      gradient = false,
      animated = true,
      strokeWidth = 2,
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

    // Get the LineChartWidget from registry
    const LineChartWidget = widgetRegistry.get('line-chart');
    if (!LineChartWidget) {
      return React.createElement(
        'div',
        { style: { color: 'red', padding: '20px' } },
        'Error: Line chart widget not found'
      );
    }

    // Transform data from raw format to LineChart widget format (Recharts)
    const rawData = (props as any).data || [];
    const transformedData = rawData.map((item: any) => ({
      name: item[nameKey] || 'Unknown', // LineChart widget expects 'name' property for x-axis
      [dataKey]: Number(item[dataKey]) || 0, // Keep original dataKey for line series
      ...item // Include other properties that might be used
    }));

    // Prepare widget props with transformed data and enhanced properties
    const widgetProps = {
      data: transformedData,
      dataKey, // LineChart widget uses dataKey for y-axis values
      xAxisKey: 'name', // LineChart widget uses 'name' for x-axis
      xAxisLabel: xAxisLabel || nameKey || 'X Axis',
      yAxisLabel: yAxisLabel || dataKey || 'Y Axis',
      title: showTitle ? title : undefined,
      height,
      color,
      strokeWidth,
      showGrid,
      showTooltip,
      showLegend,
      showDots,
      curved,
      area,
      gradient,
      animated,
      margin,
      showCard: false // Let the gadget handle container styling
    };
return React.createElement(LineChartWidget, widgetProps);
  }

  validate(config: GadgetConfig): ValidationResult {
    const errors: string[] = [];
    
    // Validate base gadget config
    const baseValidation = this.validateGadgetConfig(config);
    if (!baseValidation.isValid) {
      errors.push(...baseValidation.errors);
    }

    // Validate line chart-specific config
    const lineConfig = config as LineChartGadgetConfig;
    if (lineConfig.height && lineConfig.height < 100) {
      errors.push('Chart height must be at least 100 pixels');
    }

    if (lineConfig.size && !['small', 'medium', 'large'].includes(lineConfig.size)) {
      errors.push('Chart size must be one of: small, medium, large');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getRequiredWidgets(): string[] {
    return ['line-chart'];
  }

  getWidgetLayout(): Record<string, any> {
    return {
      type: 'flex',
      responsive: true
    };
  }

  processDataFlow(data: any): any {
    // Process and transform data for line chart display
    return this.sanitizeData(data);
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