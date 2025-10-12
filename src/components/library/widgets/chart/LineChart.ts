/**
 * LineChart Widget - Enhanced Recharts Implementation
 * 
 * A professional data visualization widget that renders line charts using Recharts library.
 * Features professional styling with Sentra brand colors, liquid glass effects, and accessibility enhancements.
 */

import React from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ComponentSchema, ValidationResult } from '../../core/base';
import { BaseWidget, WidgetConfig, WidgetContext, WidgetMetadata, WidgetSchema, WidgetType } from '../base';

export interface LineChartData {
  name: string;
  [key: string]: string | number;
}

export interface LineChartConfig extends WidgetConfig {
  data: LineChartData[];
  dataKey: string;
  nameKey?: string;
  xAxisKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  showDots?: boolean;
  curved?: boolean;
  area?: boolean;
  gradient?: boolean;
  animated?: boolean;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export class LineChartWidget extends BaseWidget {
  metadata: WidgetMetadata = {
    id: 'line-chart',
    name: 'Line Chart',
    version: '2.1.0',
    description: 'Professional interactive line chart widget with Sentra brand styling and enhanced UX',
    author: 'Widget Library',
    tags: ['chart', 'line', 'visualization', 'data', 'recharts', 'professional', 'sentra'],
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
      events: ['onPointClick', 'onPointHover', 'onLegendClick', 'onAreaHover'],
      handlers: ['selectPoint', 'highlightLine', 'exportData', 'zoomIn', 'zoomOut']
    }
  };

  schema: WidgetSchema = {
    type: 'line-chart',
    properties: {
      data: {
        type: 'array',
        description: 'Array of data points for the chart',
        items: {
          type: 'object',
          additionalProperties: true
        }
      },
      dataKey: {
        type: 'string',
        description: 'Key for Y-axis data values'
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
        default: 300
      },
      color: {
        type: 'string',
        description: 'Line color (hex or named color)',
        default: '#009688'
      },
      strokeWidth: {
        type: 'number',
        description: 'Line stroke width',
        default: 3
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
        description: 'Show dots on data points',
        default: true
      },
      curved: {
        type: 'boolean',
        description: 'Use curved lines',
        default: true
      },
      area: {
        type: 'boolean',
        description: 'Fill area under line',
        default: false
      },
      gradient: {
        type: 'boolean',
        description: 'Use gradient fill',
        default: false
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
    required: ['data', 'dataKey', 'xAxisKey']
  };

  render(props: any, context?: WidgetContext): React.ReactNode {
    const config = props as LineChartConfig;
    const {
      data = [],
      dataKey,
      xAxisKey,
      xAxisLabel = '',
      yAxisLabel = '',
      title = '',
      subtitle = '',
      height = 400,
      color = '#009688',
      strokeWidth = 3,
      showGrid = true,
      showTooltip = true,
      showLegend = true,
      showDots = true,
      curved = true,
      area = false,
      gradient = false,
      animated = true,
      margin = { top: 20, right: 30, left: 20, bottom: 20 }
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
      background: isDarkMode ? '#1a1a1a' : '#ffffff'
    };

    // Use Sentra color or fallback to provided color
    const lineColor = color === '#009688' ? sentraColors.primary : color;

    // Sanitize data
    const sanitizedData = this.sanitizeData(data);

    // Event handlers
    const handlePointClick = (data: any, index: number) => {
      if (context?.events?.onPointClick) {
        context.events.onPointClick(data, index);
      }
    };

    const handlePointHover = (data: any, index: number) => {
      if (context?.events?.onPointHover) {
        context.events.onPointHover(data, index);
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
            backdropFilter: 'blur(8px)'
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
                  borderRadius: '50%',
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
              }, `${yAxisLabel || entry.dataKey}:`),
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

    // Create chart elements
    const chartChildren = [];
    
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
        cursor: { 
          stroke: lineColor, 
          strokeWidth: 2, 
          strokeDasharray: '5 5',
          strokeOpacity: 0.8
        }
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
        iconType: 'line'
      }));
    }
    
    // Add gradient definition if needed
    if (gradient || area) {
      chartChildren.unshift(React.createElement('defs', { key: 'defs' }, [
        React.createElement('linearGradient', {
          key: 'gradient',
          id: 'lineGradient',
          x1: '0',
          y1: '0',
          x2: '0',
          y2: '1'
        }, [
          React.createElement('stop', {
            key: 'stop1',
            offset: '5%',
            stopColor: lineColor,
            stopOpacity: 0.8
          }),
          React.createElement('stop', {
            key: 'stop2',
            offset: '95%',
            stopColor: lineColor,
            stopOpacity: 0.1
          })
        ])
      ]));
    }
    
    // Add line with enhanced styling
    chartChildren.push(React.createElement(Line as any, {
      key: 'line',
      type: curved ? 'monotone' : 'linear',
      dataKey,
      stroke: lineColor,
      strokeWidth,
      dot: showDots ? { 
        fill: lineColor, 
        strokeWidth: 2, 
        r: 5,
        stroke: sentraColors.background,
        onMouseEnter: handlePointHover,
        onClick: handlePointClick,
        style: { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }
      } : false,
      activeDot: { 
        r: 7, 
        fill: lineColor,
        stroke: sentraColors.background,
        strokeWidth: 3,
        style: { 
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
          cursor: 'pointer'
        }
      },
      fill: area ? (gradient ? 'url(#lineGradient)' : lineColor) : 'none',
      fillOpacity: area ? 0.6 : 0,
      animationDuration: animated ? 2000 : 0,
      name: yAxisLabel || dataKey
    }));

    // Adjust margins for better spacing
    const adjustedMargin = { 
      top: title || subtitle ? 40 : 20,
      right: 30,
      left: yAxisLabel ? 60 : 20,
      bottom: xAxisLabel ? 60 : (showLegend ? 50 : 20),
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
    }, React.createElement(LineChart as any, {
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
          background: `radial-gradient(circle, ${sentraColors.accent}15 0%, transparent 70%)`,
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
      className: 'sentra-line-chart-container',
      role: 'img',
      'aria-label': `Line chart: ${title || 'Data visualization'}`
    }, [...decorativeElements, ...content]);
  }

  validate(config: WidgetConfig): ValidationResult {
    const errors: string[] = [];
    const baseValidation = this.validateWidgetConfig(config);
    
    if (!baseValidation.isValid) {
      errors.push(...baseValidation.errors);
    }

    const lineConfig = config as LineChartConfig;
    
    if (!lineConfig.data || !Array.isArray(lineConfig.data)) {
      errors.push('Data must be an array');
    }
    
    if (!lineConfig.dataKey) {
      errors.push('dataKey is required');
    }
    
    if (!lineConfig.xAxisKey) {
      errors.push('xAxisKey is required');
    }

    if (lineConfig.strokeWidth && (lineConfig.strokeWidth < 1 || lineConfig.strokeWidth > 10)) {
      errors.push('strokeWidth must be between 1 and 10');
    }

    if (lineConfig.height && lineConfig.height < 200) {
      errors.push('height must be at least 200 pixels');
    }

    return {
      isValid: errors.length === 0,
      errors: [...baseValidation.errors, ...errors]
    };
  }

  getDataRequirements(): string[] {
    return ['data'];
  }

  getOutputSchema(): ComponentSchema {
    return {
      type: 'object',
      properties: {
        selectedPoints: {
          type: 'array',
          description: 'Currently selected data points'
        },
        visibleRange: {
          type: 'object',
          description: 'Currently visible range of the chart'
        },
        hoveredPoint: {
          type: 'object',
          description: 'Currently hovered data point'
        },
        chartData: {
          type: 'array',
          description: 'Processed chart data'
        }
      }
    };
  }

  processData(data: any): LineChartData[] {
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
} 

// Functional component wrapper for registry registration
export const LineChartComponent: React.FC<any> = (props) => {
  const widget = new LineChartWidget();
  return widget.render(props) as React.ReactElement;
}; 