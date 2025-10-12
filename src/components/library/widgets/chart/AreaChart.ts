/**
 * AreaChart Widget - Enhanced Recharts Implementation
 * 
 * A professional data visualization widget that renders area charts using Recharts library.
 * Features professional styling with Sentra brand colors, liquid glass effects, and accessibility enhancements.
 */

import React from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ComponentSchema, ValidationResult } from '../../core/base';
import { BaseWidget, WidgetConfig, WidgetContext, WidgetMetadata, WidgetSchema, WidgetType } from '../base';

export interface AreaChartData {
  name: string;
  [key: string]: string | number;
}

export interface AreaChartConfig extends WidgetConfig {
  data: AreaChartData[];
  areas: Array<{
    dataKey: string;
    fill: string;
    stroke?: string;
    name?: string;
    stackId?: string;
    gradient?: boolean;
  }>;
  xAxisKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  curved?: boolean;
  strokeWidth?: number;
  fillOpacity?: number;
  animated?: boolean;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export class AreaChartWidget extends BaseWidget {
  metadata: WidgetMetadata = {
    id: 'area-chart',
    name: 'Area Chart',
    version: '2.1.0',
    description: 'Professional interactive area chart widget with Sentra brand styling and enhanced UX',
    author: 'Widget Library',
    tags: ['chart', 'area', 'visualization', 'data', 'recharts', 'professional', 'sentra'],
    category: 'data-visualization',
    widgetType: WidgetType.DATA,
    dataBinding: {
      accepts: ['array', 'object'],
      provides: ['chart-data', 'selection-data', 'hover-data']
    },
    styling: {
      themeable: true,
      customizable: true,
      responsive: true
    },
    interactions: {
      events: ['onAreaClick', 'onAreaHover', 'onLegendClick'],
      handlers: ['selectArea', 'highlightStack', 'exportData', 'zoomIn', 'zoomOut']
    }
  };

  schema: WidgetSchema = {
    type: 'area-chart',
    properties: {
      data: {
        type: 'array',
        description: 'Array of data points for the chart',
        items: {
          type: 'object',
          additionalProperties: true
        }
      },
      areas: {
        type: 'array',
        description: 'Configuration for each area series',
        items: {
          type: 'object',
          properties: {
            dataKey: { type: 'string' },
            fill: { type: 'string' },
            stroke: { type: 'string' },
            name: { type: 'string' },
            stackId: { type: 'string' },
            gradient: { type: 'boolean' }
          },
          required: ['dataKey', 'fill']
        }
      },
      xAxisKey: {
        type: 'string',
        description: 'Key for X-axis values',
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
      title: {
        type: 'string',
        description: 'Chart title'
      },
      subtitle: {
        type: 'string',
        description: 'Chart subtitle'
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
        description: 'Use curved lines',
        default: true
      },
      strokeWidth: {
        type: 'number',
        description: 'Stroke width for area borders',
        default: 2
      },
      fillOpacity: {
        type: 'number',
        description: 'Fill opacity for areas',
        default: 0.7
      },
      animated: {
        type: 'boolean',
        description: 'Enable animations',
        default: true
      },
      margin: {
        type: 'object',
        description: 'Chart margins',
        properties: {
          top: { type: 'number' },
          right: { type: 'number' },
          bottom: { type: 'number' },
          left: { type: 'number' }
        }
      }
    },
    required: ['data', 'areas', 'xAxisKey']
  };

  render(props: any, context?: WidgetContext): React.ReactNode {
    const config = props as AreaChartConfig;
    const {
      data = [],
      areas = [],
      xAxisKey,
      xAxisLabel = '',
      yAxisLabel = '',
      title = '',
      subtitle = '',
      height = 400,
      showGrid = true,
      showTooltip = true,
      showLegend = true,
      curved = true,
      strokeWidth = 2,
      fillOpacity = 0.7,
      animated = true,
      margin = { top: 20, right: 30, left: 20, bottom: 40 }
    } = config;

    // Robust theme detection function
    const detectDarkMode = (): boolean => {
      // Method 1: Check widget context
      if (context?.theme?.isDarkMode !== undefined) {
        return context.theme.isDarkMode;
      }
      
      // Method 2: Check DOM for data-theme attribute
      if (typeof document !== 'undefined') {
        const htmlElement = document.documentElement;
        const dataTheme = htmlElement.getAttribute('data-theme');
        if (dataTheme === 'dark') return true;
        if (dataTheme === 'light') return false;
        
        // Method 3: Check CSS variables
        const computedStyle = getComputedStyle(htmlElement);
        const bgColor = computedStyle.getPropertyValue('--bg') || computedStyle.getPropertyValue('--color-background');
        
        // If background is dark, assume dark mode
        if (bgColor && (bgColor.includes('#1') || bgColor.includes('#2') || bgColor.includes('26, 26, 26'))) {
          return true;
        }
      }
      
      // Method 4: Default fallback - check for system preference
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      return false;
    };

    const isDarkMode = detectDarkMode();

    // Sentra brand color palette
    const sentraColors = {
      primary: '#009688',
      secondary: '#00796b',
      accent: '#F7C600',
      success: '#32C766',
      warning: '#FF6A00',
      error: '#f5222d',
      dark: '#1E1E1E',
      light: '#f5f5f5',
      grid: isDarkMode ? '#2a2a2a' : '#f0f0f0',
      text: isDarkMode ? '#e0e0e0' : '#333333',
      background: isDarkMode ? '#1a1a1a' : '#ffffff',
      chartColors: [
        '#009688', '#32C766', '#F7C600', '#2196F3', '#FF6A00', '#9C27B0', '#795548', '#607D8B'
      ]
    };

    // Sanitize data
    const sanitizedData = this.sanitizeData(data);

    // Event handlers
    const handleAreaClick = (data: any, index: number) => {
      if (context?.events?.onAreaClick) {
        context.events.onAreaClick(data, index);
      }
    };

    const handleAreaHover = (data: any, index: number) => {
      if (context?.events?.onAreaHover) {
        context.events.onAreaHover(data, index);
      }
    };

    // Enhanced custom tooltip with Sentra styling
    const customTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return React.createElement('div', {
          className: 'sentra-chart-tooltip',
          style: {
            backgroundColor: isDarkMode ? 'rgba(26, 26, 26, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            border: `1px solid ${sentraColors.primary}`,
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0, 150, 136, 0.15)',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            backdropFilter: 'blur(8px)',
            minWidth: '200px'
          }
        }, [
          React.createElement('div', {
            key: 'label',
            style: { 
              fontWeight: '600', 
              marginBottom: '8px',
              color: sentraColors.text,
              fontSize: '14px'
            }
          }, `${xAxisLabel || 'Period'}: ${label}`),
          ...payload.map((entry: any, index: number) => 
            React.createElement('div', {
              key: index,
              style: { 
                color: entry.color,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px'
              }
            }, [
              React.createElement('span', {
                key: 'indicator',
                style: {
                  width: '10px',
                  height: '10px',
                  backgroundColor: entry.color,
                  borderRadius: '2px',
                  display: 'inline-block',
                  border: `2px solid ${sentraColors.background}`,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }
              }),
              React.createElement('span', {
                key: 'label',
                style: { 
                  fontWeight: '500',
                  color: sentraColors.text 
                }
              }, `${entry.name || entry.dataKey}:`),
              React.createElement('span', {
                key: 'value',
                style: { 
                  fontWeight: '600',
                  color: entry.color,
                  marginLeft: '4px'
                }
              }, typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value)
            ])
          )
        ]);
      }
      return null;
    };

    // Create gradient definitions
    const gradientDefs = areas.filter(area => area.gradient).map((area, index) => {
      const color = area.fill || sentraColors.chartColors[index % sentraColors.chartColors.length];
      return React.createElement('linearGradient', {
        key: `gradient-${area.dataKey}`,
        id: `areaGradient-${area.dataKey}`,
        x1: '0',
        y1: '0',
        x2: '0',
        y2: '1'
      }, [
        React.createElement('stop', {
          key: 'stop1',
          offset: '5%',
          stopColor: color,
          stopOpacity: 0.8
        }),
        React.createElement('stop', {
          key: 'stop2',
          offset: '95%',
          stopColor: color,
          stopOpacity: 0.1
        })
      ]);
    });

    // Create chart elements
    const chartChildren = [];
    
    // Add gradient definitions if needed
    if (gradientDefs.length > 0) {
      chartChildren.push(React.createElement('defs', { key: 'defs' }, gradientDefs));
    }
    
    // Add grid with enhanced styling
    if (showGrid) {
      chartChildren.push(React.createElement(CartesianGrid as any, { 
        key: 'grid', 
        strokeDasharray: '3 3',
        stroke: sentraColors.grid,
        strokeOpacity: 0.6
      }));
    }
    
    // Add axes with enhanced styling
    chartChildren.push(React.createElement(XAxis as any, { 
      key: 'xaxis', 
      dataKey: xAxisKey,
      tick: { 
        fontSize: 12, 
        fill: sentraColors.text,
        fontFamily: 'Inter, sans-serif',
        fontWeight: '500'
      },
      axisLine: { stroke: sentraColors.grid, strokeWidth: 1 },
      tickLine: { stroke: sentraColors.grid, strokeWidth: 1 },
      label: xAxisLabel ? { 
        value: xAxisLabel, 
        position: 'insideBottom', 
        offset: -10,
        style: { 
          textAnchor: 'middle', 
          fontSize: 13, 
          fontWeight: '600',
          fill: sentraColors.text,
          fontFamily: 'Inter, sans-serif'
        }
      } : undefined
    }));
    
    chartChildren.push(React.createElement(YAxis as any, { 
      key: 'yaxis',
      tick: { 
        fontSize: 12, 
        fill: sentraColors.text,
        fontFamily: 'Inter, sans-serif',
        fontWeight: '500'
      },
      axisLine: { stroke: sentraColors.grid, strokeWidth: 1 },
      tickLine: { stroke: sentraColors.grid, strokeWidth: 1 },
      label: yAxisLabel ? { 
        value: yAxisLabel, 
        angle: -90, 
        position: 'insideLeft',
        style: { 
          textAnchor: 'middle', 
          fontSize: 13, 
          fontWeight: '600',
          fill: sentraColors.text,
          fontFamily: 'Inter, sans-serif'
        }
      } : undefined
    }));
    
    // Add tooltip
    if (showTooltip) {
      chartChildren.push(React.createElement(Tooltip as any, { 
        key: 'tooltip',
        content: customTooltip,
        cursor: { strokeDasharray: '5 5', strokeOpacity: 0.8 }
      }));
    }
    
    // Add legend with enhanced styling
    if (showLegend) {
      chartChildren.push(React.createElement(Legend as any, { 
        key: 'legend',
        wrapperStyle: { 
          fontSize: '13px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '500',
          color: sentraColors.text,
          paddingTop: '16px'
        },
        iconType: 'rect'
      }));
    }
    
    // Add areas with enhanced styling
    areas.forEach((area, index) => {
      const color = area.fill || sentraColors.chartColors[index % sentraColors.chartColors.length];
      const strokeColor = area.stroke || color;
      
      chartChildren.push(React.createElement(Area as any, {
        key: area.dataKey,
        type: curved ? 'monotone' : 'linear',
        dataKey: area.dataKey,
        fill: area.gradient ? `url(#areaGradient-${area.dataKey})` : color,
        stroke: strokeColor,
        strokeWidth: strokeWidth,
        fillOpacity: fillOpacity,
        stackId: area.stackId,
        name: area.name || area.dataKey,
        animationDuration: animated ? 2000 : 0,
        onMouseEnter: handleAreaHover,
        onClick: handleAreaClick,
        dot: false,
        activeDot: { 
          r: 5, 
          fill: strokeColor,
          stroke: sentraColors.background,
          strokeWidth: 2,
          style: { 
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
            cursor: 'pointer'
          }
        }
      }));
    });

    // Adjust margins for better spacing
    const adjustedMargin = { 
      top: title || subtitle ? 40 : 20,
      right: 30,
      left: yAxisLabel ? 60 : 20,
      bottom: xAxisLabel ? 60 : (showLegend ? 60 : 20),
      ...margin
    };

    // Calculate available height for chart content
    const headerHeight = (title || subtitle) ? 60 : 0;
    const padding = 40; // Total padding (top + bottom)
    const availableHeight = height - headerHeight - padding;

    // Create the chart container with professional styling
    const chartContainer = React.createElement(ResponsiveContainer as any, {
      width: '100%',
      height: availableHeight
    }, React.createElement(AreaChart as any, {
      data: sanitizedData,
      margin: adjustedMargin,
      style: { backgroundColor: 'transparent' }
    }, chartChildren));

    // Professional container with liquid glass effect
    const containerStyle: React.CSSProperties = {
      width: '100%',
      height: `${height}px`,
      background: isDarkMode 
        ? 'linear-gradient(145deg, rgba(26, 26, 26, 0.95) 0%, rgba(40, 40, 40, 0.95) 100%)'
        : 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 250, 250, 0.95) 100%)',
      borderRadius: '12px',
      border: `1px solid ${isDarkMode ? 'rgba(0, 150, 136, 0.4)' : 'rgba(0, 150, 136, 0.2)'}`,
      boxShadow: isDarkMode 
        ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        : '0 8px 32px rgba(0, 150, 136, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease-in-out',
      display: 'flex',
      flexDirection: 'column'
    };

    // Header styling
    const headerStyle: React.CSSProperties = {
      textAlign: 'center',
      marginBottom: '16px',
      position: 'relative',
      zIndex: 1,
      flexShrink: 0,
      height: headerHeight ? `${headerHeight}px` : 'auto'
    };

    const titleStyle: React.CSSProperties = {
      fontSize: '18px',
      fontWeight: '600',
      color: sentraColors.text,
      marginBottom: subtitle ? '4px' : '0',
      fontFamily: 'Sora, Inter, sans-serif',
      letterSpacing: '-0.025em'
    };

    const subtitleStyle: React.CSSProperties = {
      fontSize: '14px',
      fontWeight: '400',
      color: isDarkMode ? 'rgba(224, 224, 224, 0.7)' : 'rgba(51, 51, 51, 0.7)',
      fontFamily: 'Inter, sans-serif',
      lineHeight: '1.4'
    };

    // Add decorative elements
    const decorativeElements = [
      React.createElement('div', {
        key: 'decoration-1',
        style: {
          position: 'absolute',
          top: '0',
          right: '0',
          width: '60px',
          height: '60px',
          background: `radial-gradient(circle, ${sentraColors.primary}20 0%, transparent 70%)`,
          borderRadius: '50%',
          pointerEvents: 'none'
        }
      }),
      React.createElement('div', {
        key: 'decoration-2',
        style: {
          position: 'absolute',
          bottom: '0',
          left: '0',
          width: '40px',
          height: '40px',
          background: `radial-gradient(circle, ${sentraColors.success}15 0%, transparent 70%)`,
          borderRadius: '50%',
          pointerEvents: 'none'
        }
      })
    ];

    // Build the final component
    const content = [];
    
    // Add header if title or subtitle exists
    if (title || subtitle) {
      content.push(React.createElement('div', {
        key: 'header',
        style: headerStyle
      }, [
        title && React.createElement('h3', {
          key: 'title',
          style: titleStyle
        }, title),
        subtitle && React.createElement('p', {
          key: 'subtitle',
          style: subtitleStyle
        }, subtitle)
      ]));
    }
    
    // Add chart
    content.push(React.createElement('div', {
      key: 'chart',
      style: { 
        position: 'relative',
        zIndex: 1,
        height: `${availableHeight}px`,
        flex: '1',
        minHeight: '0'
      }
    }, chartContainer));

    return React.createElement('div', {
      style: containerStyle,
      className: 'sentra-area-chart-container',
      role: 'img',
      'aria-label': `Area chart: ${title || 'Data visualization'}`
    }, [...decorativeElements, ...content]);
  }

  validate(config: WidgetConfig): ValidationResult {
    const errors: string[] = [];
    const baseValidation = this.validateWidgetConfig(config);
    
    if (!baseValidation.isValid) {
      errors.push(...baseValidation.errors);
    }

    const areaConfig = config as AreaChartConfig;

    if (!areaConfig.data || !Array.isArray(areaConfig.data)) {
      errors.push('data must be an array');
    }

    if (!areaConfig.areas || !Array.isArray(areaConfig.areas)) {
      errors.push('areas must be an array');
    } else {
      areaConfig.areas.forEach((area, index) => {
        if (!area.dataKey) {
          errors.push(`areas[${index}].dataKey is required`);
        }
        if (!area.fill) {
          errors.push(`areas[${index}].fill is required`);
        }
      });
    }

    if (!areaConfig.xAxisKey) {
      errors.push('xAxisKey is required');
    }

    if (areaConfig.strokeWidth && (areaConfig.strokeWidth < 1 || areaConfig.strokeWidth > 10)) {
      errors.push('strokeWidth must be between 1 and 10');
    }

    if (areaConfig.fillOpacity && (areaConfig.fillOpacity < 0 || areaConfig.fillOpacity > 1)) {
      errors.push('fillOpacity must be between 0 and 1');
    }

    if (areaConfig.height && areaConfig.height < 200) {
      errors.push('height must be at least 200 pixels');
    }

    return {
      isValid: errors.length === 0,
      errors: [...baseValidation.errors, ...errors],
      warnings: []
    };
  }

  getDataRequirements(): string[] {
    return ['data', 'areas', 'xAxisKey'];
  }

  getOutputSchema(): ComponentSchema {
    return {
      type: 'object',
      properties: {
        chartData: {
          type: 'array',
          description: 'Processed chart data'
        },
        selectedData: {
          type: 'object',
          description: 'Currently selected data point'
        },
        hoveredArea: {
          type: 'object',
          description: 'Currently hovered area'
        },
        visibleRange: {
          type: 'object',
          description: 'Currently visible range of the chart'
        }
      }
    };
  }

  processData(data: any): AreaChartData[] {
    const sanitized = this.sanitizeData(data);
    
    if (!Array.isArray(sanitized)) {
      return [];
    }

    return sanitized;
  }

  onEvent(event: string, data: any): void {
}

  onDataChange(data: any): void {
}

  onConfigChange(config: WidgetConfig): void {
}

  onResize(dimensions: { width: number; height: number }): void {
}

  private onAreaClick(data: any): void {
}

  private onAreaHover(data: any): void {
}
}

export const AreaChartComponent: React.FC<any> = (props) => {
  const widget = new AreaChartWidget();
  return widget.render(props) as React.ReactElement;
}; 