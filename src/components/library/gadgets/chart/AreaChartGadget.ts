/**
 * AreaChart Gadget
 * 
 * A professional area chart gadget that handles data fetching, processing, and 
 * orchestration for the AreaChart widget with flat configuration structure.
 */

import React from 'react';
import { BaseGadget, GadgetType, GadgetMetadata, GadgetSchema, GadgetConfig, GadgetContext } from '../base';
import { ValidationResult } from '../../core/base';

export interface AreaChartGadgetConfig extends Omit<GadgetConfig, 'widgets'> {
  dataUrl?: string;
  dataPath?: string;
  dataKeys: string[];
  areaColors?: string[];
  areaNames?: string[];
  useGradient?: boolean;
  xAxisKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  title?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  curved?: boolean;
  strokeWidth?: number;
  fillOpacity?: number;
  animated?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  marginTop?: number;
  marginRight?: number;
  marginLeft?: number;
  marginBottom?: number;
}

export class AreaChartGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'area-chart-gadget',
    name: 'Area Chart Gadget',
    version: '2.0.0',
    description: '',
    author: 'Gadget Library',
    tags: ['chart', 'area', 'visualization', 'data', 'gadget', 'professional'],
    category: 'chart',
    gadgetType: GadgetType.CHART,
    widgetTypes: ['area-chart'],
    dataFlow: {
      inputs: ['chart-data'],
      outputs: ['user-interactions', 'selection-events'],
      transformations: ['data-formatting', 'area-stacking']
    },
    layout: {
      type: 'flex',
      responsive: true
    },
    interactions: {
      events: ['area-click', 'area-hover', 'legend-click'],
      handlers: ['onAreaClick', 'onAreaHover', 'onLegendClick'],
      workflows: ['drill-down', 'filter-data']
    }
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      dataUrl: {
        type: 'string',
        description: 'URL to fetch chart data from'
      },
      dataPath: {
        type: 'string',
        description: 'Path to data within the response object'
      },
      dataKeys: {
        type: 'array',
        description: 'Array of data keys for each area',
        items: {
          type: 'string'
        }
      },
      areaColors: {
        type: 'array',
        description: 'Array of colors for each area',
        items: {
          type: 'string'
        }
      },
      areaNames: {
        type: 'array',
        description: 'Array of names for each area',
        items: {
          type: 'string'
        }
      },
      useGradient: {
        type: 'boolean',
        description: 'Enable gradient fills for areas',
        default: false
      },
      xAxisKey: {
        type: 'string',
        description: 'Key for X-axis values',
        default: 'name'
      },
      xAxisLabel: {
        type: 'string',
        description: 'Label for X-axis'
      },
      yAxisLabel: {
        type: 'string',
        description: 'Label for Y-axis'
      },
      title: {
        type: 'string',
        description: 'Chart title'
      },
      height: {
        type: 'number',
        description: 'Chart height in pixels',
        default: 400
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
      curved: {
        type: 'boolean',
        description: 'Use curved lines (monotone)',
        default: true
      },
      strokeWidth: {
        type: 'number',
        description: 'Area stroke width',
        default: 2
      },
      fillOpacity: {
        type: 'number',
        description: 'Area fill opacity',
        default: 0.7
      },
      animated: {
        type: 'boolean',
        description: 'Enable animations',
        default: true
      },
      marginTop: {
        type: 'number',
        description: 'Top margin in pixels',
        default: 0
      },
      marginRight: {
        type: 'number',
        description: 'Right margin in pixels',
        default: 0
      },
      marginLeft: {
        type: 'number',
        description: 'Left margin in pixels',
        default: 0
      },
      marginBottom: {
        type: 'number',
        description: 'Bottom margin in pixels',
        default: 0
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
    required: ['dataKeys', 'xAxisKey'],
    widgetSchemas: {
      'area-chart': {
        type: 'object',
        properties: {
          data: { type: 'array' },
          areas: { type: 'array' },
          xAxisKey: { type: 'string' },
          xAxisLabel: { type: 'string' },
          yAxisLabel: { type: 'string' },
          title: { type: 'string' },
          height: { type: 'number' },
          showGrid: { type: 'boolean' },
          showTooltip: { type: 'boolean' },
          showLegend: { type: 'boolean' },
          curved: { type: 'boolean' },
          strokeWidth: { type: 'number' },
          fillOpacity: { type: 'number' },
          animated: { type: 'boolean' }
        }
      }
    }
  };

  renderBody(props: any, context?: GadgetContext): React.ReactNode {
const config = props as AreaChartGadgetConfig;
    const {
      dataUrl,
      dataPath,
      dataKeys,
      areaColors = [],
      areaNames = [],
      useGradient = false,
      xAxisKey,
      xAxisLabel,
      yAxisLabel,
      title,
      height = 400,
      showGrid = true,
      showTooltip = true,
      showLegend = true,
      curved = true,
      strokeWidth = 2,
      fillOpacity = 0.6,
      animated = true,
      marginTop = 20,
      marginRight = 30,
      marginLeft = 20,
      marginBottom = 40
    } = config;

    // Get widget registry from context
    const widgetRegistry = (context as any)?.widgetRegistry;
    if (!widgetRegistry) {
      console.error('AreaChartGadget: Widget registry not available');
      return React.createElement(
        'div',
        { style: { color: 'red', padding: '20px' } },
        'Error: Widget registry not available'
      );
    }

    // Get the area chart widget
    const AreaChartWidget = widgetRegistry.get('area-chart');
    if (!AreaChartWidget) {
      console.error('AreaChartGadget: Area chart widget not found');
      return React.createElement(
        'div', 
        { style: { color: 'red', padding: '20px' } }, 
        'Area chart widget not found'
      );
    }

    // Convert flat configuration to areas array format expected by widget
    const defaultColors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#8c8c8c', '#13c2c2'];
    const areas = dataKeys.map((dataKey, index) => ({
      dataKey,
      fill: areaColors[index] || defaultColors[index % defaultColors.length],
      stroke: areaColors[index] || defaultColors[index % defaultColors.length],
      name: areaNames[index] || dataKey,
      gradient: useGradient
    }));

    // Convert flat margin properties to margin object
    const margin = {
      top: marginTop,
      right: marginRight,
      left: marginLeft,
      bottom: marginBottom
    };

    // If we have a data URL, fetch data asynchronously
    if (dataUrl) {
      return React.createElement(AreaChartDataFetcher, {
        dataUrl,
        dataPath,
        areas,
        xAxisKey,
        xAxisLabel,
        yAxisLabel,
        title,
        height,
        showGrid,
        showTooltip,
        showLegend,
        curved,
        strokeWidth,
        fillOpacity,
        animated,
        margin,
        AreaChartWidget
      });
    }

    // If no data URL, render with empty data
return React.createElement(AreaChartWidget, {
      data: [],
      areas,
      xAxisKey,
      xAxisLabel,
      yAxisLabel,
      title,
      height,
      showGrid,
      showTooltip,
      showLegend,
      curved,
      strokeWidth,
      fillOpacity,
      animated,
      margin
    });
  }

  validate(config: GadgetConfig): ValidationResult {
    const errors: string[] = [];
    
    // Validate base gadget config
    const baseValidation = this.validateGadgetConfig(config);
    if (!baseValidation.isValid) {
      errors.push(...baseValidation.errors);
    }

    // Validate area chart specific config
    const areaConfig = config as AreaChartGadgetConfig;
    
    if (!areaConfig.dataKeys || !Array.isArray(areaConfig.dataKeys)) {
      errors.push('dataKeys configuration is required and must be an array');
    } else if (areaConfig.dataKeys.length === 0) {
      errors.push('dataKeys array must contain at least one data key');
    }

    if (!areaConfig.xAxisKey) {
      errors.push('xAxisKey is required');
    }

    if (areaConfig.height && areaConfig.height < 200) {
      errors.push('height must be at least 200 pixels');
    }

    if (areaConfig.strokeWidth && (areaConfig.strokeWidth < 1 || areaConfig.strokeWidth > 10)) {
      errors.push('strokeWidth must be between 1 and 10');
    }

    if (areaConfig.fillOpacity && (areaConfig.fillOpacity < 0 || areaConfig.fillOpacity > 1)) {
      errors.push('fillOpacity must be between 0 and 1');
    }

    // Validate array lengths match if provided
    if (areaConfig.areaColors && areaConfig.areaColors.length !== areaConfig.dataKeys.length) {
      errors.push('areaColors array length must match dataKeys array length');
    }

    if (areaConfig.areaNames && areaConfig.areaNames.length !== areaConfig.dataKeys.length) {
      errors.push('areaNames array length must match dataKeys array length');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getRequiredWidgets(): string[] {
    return ['area-chart'];
  }

  getWidgetLayout(): Record<string, any> {
    return {
      type: 'single',
      responsive: true
    };
  }

  processDataFlow(data: any): any {
    // Transform data for area chart format
    if (Array.isArray(data)) {
      return data.map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          return item;
        }
        return { name: String(item), value: Number(item) || 0 };
      });
    }
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

// Data fetcher component for async data loading
class AreaChartDataFetcher extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      data: [],
      loading: false,
      error: null
    };
  }

  async componentDidMount() {
const { dataUrl } = this.props;
    
    if (dataUrl) {
this.setState({ loading: true, error: null });
      
      try {
        const response = await fetch(dataUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const rawData = await response.json();
// Process data based on dataPath
        let processedData = rawData;
        if (this.props.dataPath) {
          processedData = rawData[this.props.dataPath];
        }
        
        // Transform data to format expected by area chart
        const transformedData = this.transformData(processedData);
this.setState({ data: transformedData, loading: false });
      } catch (error: any) {
        console.error('AreaChartDataFetcher fetch error:', error);
        this.setState({ error: error.message, loading: false });
      }
    }
  }

  transformData(data: any): any[] {
    if (!Array.isArray(data)) {
return [];
    }

    // Transform each data item to ensure it has the right format
    return data.map((item: any) => {
      // For area charts, we need to ensure the data structure matches what Recharts expects
      // Each item should have a name/key field and numeric values for each area
      return {
        name: item.name || item[this.props.xAxisKey] || item.label || 'Unknown',
        ...item
      };
    });
  }

  render() {
    const { data, loading, error } = this.state;
    const { 
      areas, 
      xAxisKey, 
      xAxisLabel, 
      yAxisLabel, 
      title, 
      height, 
      showGrid, 
      showTooltip, 
      showLegend, 
      curved, 
      strokeWidth, 
      fillOpacity, 
      animated, 
      margin, 
      AreaChartWidget 
    } = this.props;

    if (loading) {
      return React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: `${height}px`,
            color: '#666'
          }
        },
        'Loading area chart...'
      );
    }

    if (error) {
      return React.createElement(
        'div',
        {
          style: {
            color: 'red',
            padding: '20px',
            textAlign: 'center'
          }
        },
        `Error loading area chart: ${error}`
      );
    }
return React.createElement(AreaChartWidget, {
      data,
      areas,
      xAxisKey,
      xAxisLabel,
      yAxisLabel,
      title,
      height,
      showGrid,
      showTooltip,
      showLegend,
      curved,
      strokeWidth,
      fillOpacity,
      animated,
      margin
    });
  }
} 