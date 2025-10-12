/**
 * AnalyticsGadget
 * 
 * A gadget that combines stats and chart widgets to display analytics data.
 * Supports both horizontal and vertical layouts.
 */

import React from 'react';
import { BaseGadget, GadgetType, GadgetMetadata, GadgetSchema, GadgetConfig, GadgetContext } from '../base';
import { ValidationResult } from '../../core/base';
import { WidgetConfig } from '../../widgets/base';

// Simple data fetcher component for analytics that doesn't use hooks
class AnalyticsDataFetcher extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      statsData: null,
      chartData: null,
      activityData: null,
      loading: false,
      error: null
    };
  }

  async componentDidMount() {
    const { statsWidget, chartWidget, activityWidget, fetchData } = this.props;
    
    this.setState({ loading: true, error: null });
    
    try {
      const promises = [];
      
      if (statsWidget?.props?.dataSource) {
        promises.push(fetchData(statsWidget.props.dataSource).then((data: any) => ({ type: 'stats', data })));
      }
      
      if (chartWidget?.props?.dataSource) {
        promises.push(fetchData(chartWidget.props.dataSource).then((data: any) => ({ type: 'chart', data })));
      }
      
      if (activityWidget?.props?.dataSource) {
        promises.push(fetchData(activityWidget.props.dataSource).then((data: any) => ({ type: 'activity', data })));
      }
      
      const results = await Promise.all(promises);
      const newState: any = { loading: false };
      
      results.forEach(result => {
        if (result.type === 'stats') newState.statsData = result.data;
        if (result.type === 'chart') newState.chartData = result.data;
        if (result.type === 'activity') newState.activityData = result.data;
      });
      
      this.setState(newState);
    } catch (error: any) {
      this.setState({ error: error.message, loading: false });
    }
  }

  render() {
    const { statsData, chartData, activityData, loading, error } = this.state;
    const { statsWidget, chartWidget, activityWidget, widgetRegistry, orientation, size, context } = this.props;

    if (loading) {
      return React.createElement(
        'div',
        { 
          style: { 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100px',
            color: '#666'
          } 
        },
        'Loading analytics...'
      );
    }

    if (error) {
      return React.createElement(
        'div',
        { 
          style: { 
            color: 'red', 
            padding: '10px',
            textAlign: 'center'
          } 
        },
        `Error: ${error}`
      );
    }

    // Get widget components
    const StatsWidgetComponent = statsWidget ? widgetRegistry.get(statsWidget.type) : null;
    const ChartWidgetComponent = chartWidget ? widgetRegistry.get(chartWidget.type) : null;
    const ActivityWidgetComponent = activityWidget ? widgetRegistry.get(activityWidget.type) : null;

    if (!StatsWidgetComponent && !ChartWidgetComponent && !ActivityWidgetComponent) {
      return React.createElement(
        'div',
        { style: { padding: '20px', textAlign: 'center', color: '#666' } },
        'No analytics widgets configured'
      );
    }

    const containerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: orientation === 'vertical' ? 'column' : 'row',
      gap: '16px',
      height: '100%',
      padding: size === 'small' ? '12px' : size === 'large' ? '24px' : '16px',
      fontFamily: context?.theme?.fontFamily || 'Arial, sans-serif'
    };

    const widgetContainerStyle: React.CSSProperties = {
      flex: orientation === 'vertical' ? '0 0 auto' : '1 1 0',
      minHeight: orientation === 'vertical' ? 'auto' : '100%'
    };

    const chartContainerStyle: React.CSSProperties = {
      flex: '1 1 auto',
      minHeight: orientation === 'vertical' ? '300px' : '100%'
    };

    return React.createElement(
      'div',
      { className: 'liquid-glass analytics-gadget', style: containerStyle },
      StatsWidgetComponent && statsWidget && React.createElement(
        'div',
        { style: widgetContainerStyle },
        React.createElement(StatsWidgetComponent, { 
          ...statsWidget.props, 
          data: statsData || statsWidget.props.data,
          ...context 
        })
      ),
      ActivityWidgetComponent && activityWidget && React.createElement(
        'div',
        { style: widgetContainerStyle },
        React.createElement(ActivityWidgetComponent, { 
          ...activityWidget.props, 
          activities: activityData || activityWidget.props.activities,
          ...context 
        })
      ),
      ChartWidgetComponent && chartWidget && React.createElement(
        'div',
        { style: chartContainerStyle },
        React.createElement(ChartWidgetComponent, { 
          ...chartWidget.props, 
          data: chartData || chartWidget.props.data,
          ...context 
        })
      )
    );
  }
}

interface AnalyticsGadgetConfig extends Omit<GadgetConfig, 'widgets'> {
  statsWidget?: WidgetConfig;
  chartWidget?: WidgetConfig;
  activityWidget?: WidgetConfig;
  theme?: 'light' | 'dark';
  orientation?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
}

export class AnalyticsGadget extends BaseGadget {
  private config: AnalyticsGadgetConfig;
  private widgetRegistry: any;

  constructor(config: AnalyticsGadgetConfig, widgetRegistry?: any, context?: GadgetContext) {
    super();
this.config = config;
    this.widgetRegistry = widgetRegistry;
  }

  metadata: GadgetMetadata = {
    id: 'analytics-gadget',
    name: 'Analytics Gadget',
    version: '1.0.0',
    description: 'Combines stats and chart widgets for analytics display',
    author: 'Gadget Library',
    tags: ['analytics', 'stats', 'chart', 'display', 'gadget'],
    category: 'analytics',
    gadgetType: GadgetType.DASHBOARD,
    widgetTypes: ['stats-card', 'bar-chart'],
    dataFlow: {
      inputs: ['stats-data', 'chart-data'],
      outputs: ['analytics-interactions'],
      transformations: ['data-formatting', 'chart-rendering']
    },
    layout: {
      type: 'flex',
      responsive: true,
      breakpoints: {
        xs: 1,
        sm: 1,
        md: 1,
        lg: 1,
        xl: 1
      }
    },
    interactions: {
      events: ['stats-click', 'chart-click', 'chart-hover'],
      handlers: ['onStatsClick', 'onChartClick', 'onChartHover'],
      workflows: ['drill-down', 'data-exploration']
    }
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      statsWidget: {
        type: 'object',
        description: 'Configuration for the stats card widget',
        properties: {
          id: { type: 'string' },
          type: { type: 'string' },
          props: { type: 'object' }
        }
      },
      chartWidget: {
        type: 'object',
        description: 'Configuration for the chart widget',
        properties: {
          id: { type: 'string' },
          type: { type: 'string' },
          props: { type: 'object' }
        }
      },
      activityWidget: {
        type: 'object',
        description: 'Configuration for the activity feed widget',
        properties: {
          id: { type: 'string' },
          type: { type: 'string' },
          props: { type: 'object' }
        }
      },
      theme: {
        type: 'string',
        description: 'Theme for the gadget',
        enum: ['light', 'dark'],
        default: 'light'
      },
      orientation: {
        type: 'string',
        description: 'Layout orientation',
        enum: ['horizontal', 'vertical'],
        default: 'vertical'
      },
      size: {
        type: 'string',
        description: 'Size of the analytics gadget',
        enum: ['small', 'medium', 'large'],
        default: 'medium'
      }
    },
    widgetSchemas: {
      'stats-card': {
        type: 'object',
        properties: {
          data: { type: 'object' },
          showIcon: { type: 'boolean' },
          showTrend: { type: 'boolean' },
          size: { type: 'string' },
          theme: { type: 'string' }
        }
      },
      'activity-feed': {
        type: 'object',
        properties: {
          activities: { type: 'array' },
          maxItems: { type: 'number' },
          showTimestamp: { type: 'boolean' },
          theme: { type: 'string' }
        }
      },
      'bar-chart': {
        type: 'object',
        properties: {
          data: { type: 'array' },
          bars: { type: 'array' },
          xAxisKey: { type: 'string' },
          width: { type: 'number' },
          height: { type: 'number' },
          showGrid: { type: 'boolean' },
          showTooltip: { type: 'boolean' },
          showLegend: { type: 'boolean' }
        }
      }
    }
  };

  renderBody(props?: any, context?: GadgetContext): React.ReactNode {
    // Use props config if available, otherwise fall back to instance config
    const config = props || this.config;
    
    // Defensive check for config
    if (!config) {
      return React.createElement(
        'div',
        { style: { color: 'red', padding: '20px', backgroundColor: 'yellow' } },
        'Error: AnalyticsGadget config is undefined'
      );
    }

    const { statsWidget, chartWidget, activityWidget, orientation = 'vertical', size = 'medium' } = config;

    // Use widget registry from instance or fallback to context
    const widgetRegistry = this.widgetRegistry || (context as any)?.widgetRegistry;
    if (!widgetRegistry) {
      return React.createElement(
        'div',
        { style: { color: 'red', padding: '20px', backgroundColor: 'yellow' } },
        'Error: Widget registry not available'
      );
    }

    // Check if any widget has a data source that needs fetching
    const hasDataSource = (statsWidget?.props?.dataSource) || 
                         (chartWidget?.props?.dataSource) || 
                         (activityWidget?.props?.dataSource);

    if (hasDataSource) {
      // Use the data fetcher component
      return React.createElement(AnalyticsDataFetcher, {
        statsWidget,
        chartWidget,
        activityWidget,
        widgetRegistry,
        orientation,
        size,
        context,
        fetchData: this.fetchData.bind(this)
      });
    }

    // If no data source, render directly
    const StatsWidgetComponent = statsWidget ? widgetRegistry.get(statsWidget.type) : null;
    const ChartWidgetComponent = chartWidget ? widgetRegistry.get(chartWidget.type) : null;
    const ActivityWidgetComponent = activityWidget ? widgetRegistry.get(activityWidget.type) : null;

    if (!StatsWidgetComponent && !ChartWidgetComponent && !ActivityWidgetComponent) {
      return React.createElement(
        'div',
        { style: { padding: '20px', textAlign: 'center', color: '#666' } },
        'No analytics widgets configured'
      );
    }

    const containerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: orientation === 'vertical' ? 'column' : 'row',
      gap: '16px',
      height: '100%',
      padding: size === 'small' ? '12px' : size === 'large' ? '24px' : '16px',
      fontFamily: context?.theme?.fontFamily || 'Arial, sans-serif'
    };

    const widgetContainerStyle: React.CSSProperties = {
      flex: orientation === 'vertical' ? '0 0 auto' : '1 1 0',
      minHeight: orientation === 'vertical' ? 'auto' : '100%'
    };

    const chartContainerStyle: React.CSSProperties = {
      flex: '1 1 auto',
      minHeight: orientation === 'vertical' ? '300px' : '100%'
    };

    return React.createElement(
      'div',
      { className: 'liquid-glass analytics-gadget', style: containerStyle },
      StatsWidgetComponent && statsWidget && React.createElement(
        'div',
        { style: widgetContainerStyle },
        React.createElement(StatsWidgetComponent, { ...statsWidget.props, ...context })
      ),
      ActivityWidgetComponent && activityWidget && React.createElement(
        'div',
        { style: widgetContainerStyle },
        React.createElement(ActivityWidgetComponent, { ...activityWidget.props, ...context })
      ),
      ChartWidgetComponent && chartWidget && React.createElement(
        'div',
        { style: chartContainerStyle },
        React.createElement(ChartWidgetComponent, { ...chartWidget.props, ...context })
      )
    );
  }

  async fetchData(dataSource: any): Promise<any> {
    if (!dataSource || !dataSource.url) {
      return null;
    }

    try {
const response = await fetch(dataSource.url, {
        method: dataSource.method || 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
return this.processDataMapping(data, dataSource.valueMapping);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      return null;
    }
  }

  private processDataMapping(data: any, mapping: any): any {
    if (!mapping) return data;

    const { dataPath, filterBy, sortBy, fields, limit } = mapping;
    
    // Navigate to the data path
    let targetData = data;
    if (dataPath) {
      targetData = data[dataPath];
    }

    // Filter data if needed
    if (filterBy && Array.isArray(targetData)) {
      targetData = targetData.filter((item: any) => {
        return Object.keys(filterBy).every(key => item[key] === filterBy[key]);
      });
    }

    // Sort data if needed
    if (sortBy && Array.isArray(targetData)) {
      targetData.sort((a: any, b: any) => {
        const aValue = a[sortBy.field];
        const bValue = b[sortBy.field];
        
        if (sortBy.order === 'desc') {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
    }

    // Limit data if needed
    if (limit && Array.isArray(targetData)) {
      targetData = targetData.slice(0, limit);
    }

    // Map fields
    if (fields && Array.isArray(targetData)) {
      targetData = targetData.map((item: any) => {
        const mappedItem: any = {};
        Object.keys(fields).forEach(targetField => {
          const sourceField = fields[targetField];
          if (item[sourceField] !== undefined) {
            mappedItem[targetField] = item[sourceField];
          }
        });
        return mappedItem;
      });
    }
return targetData;
  }

  validate(config?: GadgetConfig): ValidationResult {
    const configToValidate = config || this.config as unknown as GadgetConfig;
    const baseValidation = this.validateGadgetConfig(configToValidate);
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    const gadgetConfig = configToValidate as unknown as AnalyticsGadgetConfig;
    const errors: string[] = [];

    // Validate that at least one widget is provided
    if (!gadgetConfig.statsWidget && !gadgetConfig.chartWidget && !gadgetConfig.activityWidget) {
      errors.push('At least one widget (statsWidget, chartWidget, or activityWidget) is required');
    }

    // Validate stats widget if provided
    if (gadgetConfig.statsWidget) {
      if (!gadgetConfig.statsWidget.id) {
        errors.push('statsWidget.id is required');
      }
      if (!gadgetConfig.statsWidget.type) {
        errors.push('statsWidget.type is required');
      }
      if (!gadgetConfig.statsWidget.props) {
        errors.push('statsWidget.props is required');
      }
    }

    // Validate activity widget if provided
    if (gadgetConfig.activityWidget) {
      if (!gadgetConfig.activityWidget.id) {
        errors.push('activityWidget.id is required');
      }
      if (!gadgetConfig.activityWidget.type) {
        errors.push('activityWidget.type is required');
      }
      if (!gadgetConfig.activityWidget.props) {
        errors.push('activityWidget.props is required');
      }
    }

    // Validate chart widget if provided
    if (gadgetConfig.chartWidget) {
      if (!gadgetConfig.chartWidget.id) {
        errors.push('chartWidget.id is required');
      }
      if (!gadgetConfig.chartWidget.type) {
        errors.push('chartWidget.type is required');
      }
      if (!gadgetConfig.chartWidget.props) {
        errors.push('chartWidget.props is required');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: [...baseValidation.errors, ...errors]
    };
  }

  getRequiredWidgets(): string[] {
    return ['stats-card', 'bar-chart'];
  }

  getWidgetLayout(): Record<string, any> {
    return {
      type: 'flex',
      direction: 'vertical',
      gap: '16px'
    };
  }

  processDataFlow(data: any): any {
    // Process data flow between widgets
    return data;
  }
} 