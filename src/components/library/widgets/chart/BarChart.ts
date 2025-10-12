/**
 * BarChart Widget - Enhanced Recharts Implementation
 * 
 * A professional data visualization widget that renders bar charts using Recharts library.
 * Features professional styling with Sentra brand colors, liquid glass effects, and accessibility enhancements.
 */

import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ComponentSchema, ValidationResult } from '../../core/base';
import { BaseWidget, WidgetConfig, WidgetContext, WidgetMetadata, WidgetSchema, WidgetType } from '../base';

export interface BarChartData {
  name: string;
  [key: string]: string | number;
}

export interface BarChartConfig extends WidgetConfig {
  data: BarChartData[];
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
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  animated?: boolean;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export class BarChartWidget extends BaseWidget {
  metadata: WidgetMetadata = {
    id: 'bar-chart',
    name: 'Bar Chart',
    version: '2.1.0',
    description: 'Professional interactive bar chart widget with Sentra brand styling and enhanced UX',
    author: 'Widget Library',
    tags: ['chart', 'bar', 'visualization', 'data', 'recharts', 'professional', 'sentra'],
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
      events: ['onBarClick', 'onBarHover', 'onLegendClick', 'onAreaHover'],
      handlers: ['selectBar', 'highlightBar', 'exportData', 'zoomIn', 'zoomOut']
    }
  };

  schema: WidgetSchema = {
    type: 'bar-chart',
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
        description: 'Bar color (hex or named color)',
        default: '#009688'
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
    const config = props as BarChartConfig;
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
      showGrid = true,
      showTooltip = true,
      showLegend = true,
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

    // Sanitize data
    const sanitizedData = this.sanitizeData(data);

    // Data validation
    if (!Array.isArray(sanitizedData) || sanitizedData.length === 0) {
      return React.createElement(
        'div',
        {
          style: {
            height: `${height}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: sentraColors.text,
            fontSize: '16px',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }
        },
        'No data available'
      );
    }

    // Event handlers
    const handleBarClick = (data: any, index: number) => {
// Emit event to parent gadget
    };

    const handleBarHover = (data: any, index: number) => {
// Emit event to parent gadget
    };

    // Custom tooltip with professional styling
    const customTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return React.createElement(
          'div',
          {
            style: {
              background: isDarkMode ? 'rgba(26, 26, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              border: `1px solid ${isDarkMode ? '#333' : '#e0e0e0'}`,
              borderRadius: '8px',
              padding: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              fontSize: '14px',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              color: sentraColors.text,
              minWidth: '120px'
            }
          },
          React.createElement(
            'div',
            {
              style: {
                marginBottom: '8px',
                fontWeight: '600',
                fontSize: '16px'
              }
            },
            label
          ),
          payload.map((entry: any, index: number) =>
            React.createElement(
              'div',
              {
                key: index,
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '4px'
                }
              },
              React.createElement(
                'div',
                {
                  style: {
                    width: '12px',
                    height: '12px',
                    backgroundColor: entry.color,
                    borderRadius: '2px',
                    marginRight: '8px'
                  }
                }
              ),
              React.createElement(
                'span',
                {
                  style: {
                    marginRight: '8px',
                    fontWeight: '500'
                  }
                },
                entry.name || dataKey
              ),
              React.createElement(
                'span',
                {
                  style: {
                    fontWeight: '700',
                    color: entry.color
                  }
                },
                typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value
              )
            )
          )
        );
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
          fill: 'rgba(0, 150, 136, 0.1)'
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
        iconType: 'rect'
      }));
    }
    
    // Add bar
    chartChildren.push(React.createElement(Bar as any, {
      key: 'bar',
      dataKey: dataKey,
      fill: color || sentraColors.primary,
      onClick: handleBarClick,
      onMouseEnter: handleBarHover,
      animationDuration: animated ? 800 : 0,
      animationEasing: 'ease-in-out',
      radius: [4, 4, 0, 0] // Rounded top corners
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
    }, React.createElement(BarChart as any, {
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
      className: 'sentra-bar-chart-container',
      role: 'img',
      'aria-label': `Bar chart: ${title || 'Data visualization'}`
    }, [...decorativeElements, ...content]);
  }

  validate(config: WidgetConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const barConfig = config as BarChartConfig;

    // Required fields
    if (!barConfig.data || !Array.isArray(barConfig.data)) {
      errors.push('Data must be an array');
    }

    if (!barConfig.dataKey) {
      errors.push('dataKey is required');
    }

    if (!barConfig.xAxisKey) {
      errors.push('xAxisKey is required');
    }

    // Validate data structure
    if (barConfig.data && Array.isArray(barConfig.data) && barConfig.data.length > 0) {
      const firstItem = barConfig.data[0];
      if (barConfig.dataKey && !(barConfig.dataKey in firstItem)) {
        errors.push(`dataKey "${barConfig.dataKey}" not found in data`);
      }
      if (barConfig.xAxisKey && !(barConfig.xAxisKey in firstItem)) {
        errors.push(`xAxisKey "${barConfig.xAxisKey}" not found in data`);
      }
    }

    // Validate numeric values
    if (barConfig.height && (typeof barConfig.height !== 'number' || barConfig.height <= 0)) {
      errors.push('Height must be a positive number');
    }

    // Validate color format
    if (barConfig.color && typeof barConfig.color === 'string') {
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!colorRegex.test(barConfig.color) && !['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'].includes(barConfig.color)) {
        warnings.push('Color should be a valid hex code or named color');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  getDataRequirements(): string[] {
    return ['data', 'dataKey', 'xAxisKey'];
  }

  getOutputSchema(): ComponentSchema {
    return {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          description: 'Chart data points'
        },
        selectedBar: {
          type: 'object',
          description: 'Currently selected bar data'
        },
        hoveredBar: {
          type: 'object',
          description: 'Currently hovered bar data'
        }
      }
    };
  }

  processData(data: any): BarChartData[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map(item => ({
      name: item.name || 'Unknown',
      ...item
    }));
  }

  sanitizeData(data: any): BarChartData[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map(item => {
      if (typeof item === 'object' && item !== null) {
        return item as BarChartData;
      }
      return { name: String(item), value: Number(item) || 0 };
    });
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

export const BarChartComponent: React.FC<any> = (props) => {
  const widget = new BarChartWidget();
  return widget.render(props) as React.ReactElement;
}; 