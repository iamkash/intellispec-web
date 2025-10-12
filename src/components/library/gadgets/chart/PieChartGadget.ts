/**
 * PieChart Gadget
 * 
 * A professional pie chart gadget that handles data fetching, processing, and 
 * orchestration for the PieChart widget with flat configuration structure.
 */

import React from 'react';
import { BaseGadget, GadgetType, GadgetMetadata, GadgetSchema, GadgetConfig, GadgetContext } from '../base';
import { ValidationResult } from '../../core/base';

export interface PieChartGadgetConfig extends Omit<GadgetConfig, 'widgets'> {
  dataUrl?: string;
  dataPath?: string;
  title?: string;
  dataKey?: string;
  nameKey?: string;
  colors?: string[];
  height?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  showPercentage?: boolean;
  animated?: boolean;
  gradient?: boolean;
  donutChart?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  labelStyle?: 'percentage' | 'value' | 'name' | 'none';
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export class PieChartGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'pie-chart-gadget',
    name: 'Pie Chart Gadget',
    version: '2.0.0',
    description: '',
    author: 'Gadget Library',
    tags: ['chart', 'pie', 'visualization', 'data', 'gadget', 'professional'],
    category: 'chart',
    gadgetType: GadgetType.CHART,
    widgetTypes: ['pie-chart'],
    dataFlow: {
      inputs: ['chart-data'],
      outputs: ['user-interactions', 'selection-events'],
      transformations: ['data-formatting', 'percentage-calc']
    },
    layout: {
      type: 'flex',
      responsive: true
    },
    interactions: {
      events: ['slice-click', 'slice-hover', 'legend-click'],
      handlers: ['onSliceClick', 'onSliceHover', 'onLegendClick'],
      workflows: ['drill-down', 'category-filter']
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
      title: {
        type: 'string',
        description: 'Chart title'
      },
      dataKey: {
        type: 'string',
        description: 'Key for slice values',
        default: 'value'
      },
      nameKey: {
        type: 'string',
        description: 'Key for slice labels',
        default: 'name'
      },
      colors: {
        type: 'array',
        description: 'Array of colors for pie slices',
        items: {
          type: 'string'
        },
        default: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#722ed1', '#13c2c2']
      },
      height: {
        type: 'number',
        description: 'Chart height in pixels',
        default: 400
      },
      showLabels: {
        type: 'boolean',
        description: 'Show labels on slices',
        default: true
      },
      showLegend: {
        type: 'boolean',
        description: 'Show legend',
        default: true
      },
      showPercentage: {
        type: 'boolean',
        description: 'Show percentage in labels',
        default: true
      },
      animated: {
        type: 'boolean',
        description: 'Enable animations',
        default: true
      },
      gradient: {
        type: 'boolean',
        description: 'Use gradient fills',
        default: true
      },
      donutChart: {
        type: 'boolean',
        description: 'Render as donut chart',
        default: false
      },
      innerRadius: {
        type: 'number',
        description: 'Inner radius for donut chart',
        default: 0
      },
      outerRadius: {
        type: 'number',
        description: 'Outer radius',
        default: 120
      },
      labelStyle: {
        type: 'string',
        description: 'Label display style',
        enum: ['percentage', 'value', 'name', 'none'],
        default: 'percentage'
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
      'pie-chart': {
        type: 'object',
        properties: {
          data: { type: 'array' },
          title: { type: 'string' },
          height: { type: 'number' },
          showLabels: { type: 'boolean' },
          showLegend: { type: 'boolean' },
          animated: { type: 'boolean' },
          gradient: { type: 'boolean' },
          donutChart: { type: 'boolean' }
        }
      }
    }
  };

  renderBody(props: any, context?: GadgetContext): React.ReactNode {
const config = props as PieChartGadgetConfig;
    const {
      dataUrl,
      dataPath,
      title,
      dataKey = 'value',
      nameKey = 'name',
      colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'],
      height = 400,
      showLabels = true,
      showLegend = true,
      showPercentage = true,
      animated = true,
      gradient = true,
      donutChart = false,
      innerRadius = 0,
      outerRadius = 120,
      labelStyle = 'percentage'
    } = config;

    // Get widget registry from context
    const widgetRegistry = (context as any)?.widgetRegistry;
    if (!widgetRegistry) {
      console.error('PieChartGadget: Widget registry not available');
      return React.createElement(
        'div',
        { style: { color: 'red', padding: '20px' } },
        'Error: Widget registry not available'
      );
    }

    // Get the pie chart widget
    const PieChartWidget = widgetRegistry.get('pie-chart');
    if (!PieChartWidget) {
      console.error('PieChartGadget: Pie chart widget not found');
      return React.createElement(
        'div', 
        { style: { color: 'red', padding: '20px' } }, 
        'Pie chart widget not found'
      );
    }

    // If we have a data URL, fetch data asynchronously
    if (dataUrl) {
      return React.createElement(PieChartDataFetcher, {
        dataUrl,
        dataPath,
        title,
        dataKey,
        nameKey,
        colors,
        height,
        showLabels,
        showLegend,
        showPercentage,
        animated,
        gradient,
        donutChart,
        innerRadius,
        outerRadius,
        labelStyle,
        PieChartWidget
      });
    }

    // If no data URL, render with empty data
return React.createElement(PieChartWidget, {
      data: [],
      title,
      dataKey,
      nameKey,
      colors,
      height,
      showLabels,
      showLegend,
      showPercentage,
      animated,
      gradient,
      donutChart,
      innerRadius,
      outerRadius,
      labelStyle
    });
  }

  validate(config: GadgetConfig): ValidationResult {
    const errors: string[] = [];
    
    // Validate base gadget config
    const baseValidation = this.validateGadgetConfig(config);
    if (!baseValidation.isValid) {
      errors.push(...baseValidation.errors);
    }

    // Validate pie chart specific config
    const pieConfig = config as PieChartGadgetConfig;
    
    if (pieConfig.height && pieConfig.height < 200) {
      errors.push('height must be at least 200 pixels');
    }

    if (pieConfig.innerRadius && pieConfig.outerRadius && 
        pieConfig.innerRadius >= pieConfig.outerRadius) {
      errors.push('innerRadius must be less than outerRadius');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getRequiredWidgets(): string[] {
    return ['pie-chart'];
  }

  getWidgetLayout(): Record<string, any> {
    return {
      type: 'single',
      responsive: true
    };
  }

  processDataFlow(data: any): any {
    // Transform data for pie chart format
    if (Array.isArray(data)) {
      return data.map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          return {
            name: item.name || item.label || item.category || 'Unknown',
            value: Number(item.value) || 0,
            color: item.color
          };
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
class PieChartDataFetcher extends React.Component<any, any> {
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
        
        // Transform data to format expected by pie chart
        const transformedData = this.transformData(processedData);
this.setState({ data: transformedData, loading: false });
      } catch (error: any) {
        console.error('PieChartDataFetcher fetch error:', error);
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
      return {
        name: item.name || item[this.props.nameKey] || item.category || item.label || 'Unknown',
        value: Number(item.value || item[this.props.dataKey]) || 0,
        color: item.color
      };
    });
  }

  render() {
    const { data, loading, error } = this.state;
    const { 
      title,
      dataKey,
      nameKey,
      colors,
      height,
      showLabels,
      showLegend,
      showPercentage,
      animated,
      gradient,
      donutChart,
      innerRadius,
      outerRadius,
      labelStyle,
      PieChartWidget 
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
        'Loading pie chart...'
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
        `Error loading pie chart: ${error}`
      );
    }
return React.createElement(PieChartWidget, {
      data,
      title,
      dataKey,
      nameKey,
      colors,
      height,
      showLabels,
      showLegend,
      showPercentage,
      animated,
      gradient,
      donutChart,
      innerRadius,
      outerRadius,
      labelStyle
    });
  }
} 