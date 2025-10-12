/**
 * PieChart Widget - Enhanced Recharts Implementation
 * 
 * A professional data visualization widget that renders pie charts using Recharts library.
 * Features professional styling with Sentra brand colors, liquid glass effects, and accessibility enhancements.
 */

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BaseWidget, WidgetType, WidgetMetadata, WidgetSchema, WidgetConfig, WidgetContext } from '../base';
import { ValidationResult, ComponentSchema } from '../../core/base';

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

export interface PieChartConfig extends WidgetConfig {
  data: PieChartData[];
  colors?: string[];
  dataKey?: string;
  nameKey?: string;
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showTooltip?: boolean;
  showLegend?: boolean;
  showLabels?: boolean;
  animated?: boolean;
  gradient?: boolean;
  donutChart?: boolean;
  labelStyle?: 'percentage' | 'value' | 'name' | 'none';
}

export class PieChartWidget extends BaseWidget {
  metadata: WidgetMetadata = {
    id: 'pie-chart',
    name: 'Pie Chart',
    version: '2.1.0',
    description: 'Professional interactive pie chart widget with Sentra brand styling and enhanced UX',
    author: 'Widget Library',
    tags: ['chart', 'pie', 'visualization', 'data', 'recharts', 'professional', 'sentra'],
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
      events: ['onSliceClick', 'onSliceHover', 'onLegendClick'],
      handlers: ['selectSlice', 'highlightSlice', 'exportData', 'drillDown']
    }
  };

  schema: WidgetSchema = {
    type: 'pie-chart',
    properties: {
      data: {
        type: 'array',
        description: 'Array of data points for the chart',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            value: { type: 'number' },
            color: { type: 'string' }
          },
          required: ['name', 'value']
        }
      },
      colors: {
        type: 'array',
        description: 'Array of colors for pie slices',
        items: { type: 'string' },
        default: ['#009688', '#32C766', '#F7C600', '#2196F3', '#FF6A00', '#9C27B0']
      },
      dataKey: {
        type: 'string',
        description: 'Key for data values',
        default: 'value'
      },
      nameKey: {
        type: 'string',
        description: 'Key for slice names',
        default: 'name'
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
      innerRadius: {
        type: 'number',
        description: 'Inner radius for donut chart',
        default: 0
      },
      outerRadius: {
        type: 'number',
        description: 'Outer radius of pie chart',
        default: 120
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
      showLabels: {
        type: 'boolean',
        description: 'Show labels on slices',
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
      labelStyle: {
        type: 'string',
        description: 'Label display style',
        enum: ['percentage', 'value', 'name', 'none'],
        default: 'percentage'
      }
    },
    required: ['data']
  };

  render(props: any, context?: WidgetContext): React.ReactNode {
    const config = props as PieChartConfig;
    const {
      data = [],
      colors = ['#009688', '#32C766', '#F7C600', '#2196F3', '#FF6A00', '#9C27B0'],
      dataKey = 'value',
      nameKey = 'name',
      title = '',
      subtitle = '',
      height = 400,
      innerRadius = 0,
      outerRadius = 120,
      showTooltip = true,
      showLegend = true,
      showLabels = true,
      animated = true,
      gradient = true,
      donutChart = false,
      labelStyle = 'percentage'
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
      chartColors: colors.length > 0 ? colors : [
        '#009688', '#32C766', '#F7C600', '#2196F3', '#FF6A00', '#9C27B0', '#795548', '#607D8B'
      ]
    };

    // Sanitize data
    const sanitizedData = this.sanitizeData(data);

    // Calculate total for percentage
    const total = sanitizedData.reduce((sum: number, item: any) => sum + (Number(item.value) || 0), 0);

    // Event handlers
    const handleSliceClick = (data: any, index: number) => {
      if (context?.events?.onSliceClick) {
        context.events.onSliceClick(data, index);
      }
    };

    const handleSliceHover = (data: any, index: number) => {
      if (context?.events?.onSliceHover) {
        context.events.onSliceHover(data, index);
      }
    };

    // Enhanced custom tooltip with Sentra styling
    const customTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0';
        
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
            minWidth: '180px'
          }
        }, [
          React.createElement('div', {
            key: 'name',
            style: { 
              fontWeight: '600', 
              marginBottom: '8px',
              color: sentraColors.text,
              fontSize: '14px'
            }
          }, data.name),
          React.createElement('div', {
            key: 'value',
            style: { 
              color: payload[0].color,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }
          }, [
            React.createElement('span', {
              key: 'indicator',
              style: {
                width: '12px',
                height: '12px',
                backgroundColor: payload[0].color,
                borderRadius: '2px',
                display: 'inline-block',
                border: `2px solid ${sentraColors.background}`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }
            }),
            React.createElement('span', {
              key: 'text',
              style: { 
                fontWeight: '500',
                color: sentraColors.text 
              }
            }, `${data.value.toLocaleString()} (${percentage}%)`)
          ])
        ]);
      }
      return null;
    };

    // Enhanced custom label formatter
    const renderCustomizedLabel = (entry: any) => {
      if (!showLabels || labelStyle === 'none') return null;
      
      const { cx, cy, midAngle, innerRadius, outerRadius, value, name } = entry;
      const RADIAN = Math.PI / 180;
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';

      let labelText = '';
      switch (labelStyle) {
        case 'percentage':
          labelText = `${percentage}%`;
          break;
        case 'value':
          labelText = value.toLocaleString();
          break;
        case 'name':
          labelText = name;
          break;
        default:
          labelText = `${percentage}%`;
      }

      // Only show label if percentage is large enough to be readable
      if (parseFloat(percentage) < 5) return null;

      return React.createElement('text', {
        x,
        y,
        fill: '#ffffff',
        textAnchor: x > cx ? 'start' : 'end',
        dominantBaseline: 'central',
        fontSize: '12px',
        fontWeight: '600',
        fontFamily: 'Inter, sans-serif',
        style: {
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))'
        }
      }, labelText);
    };

    // Create gradient definitions for modern look
    const gradientDefs = gradient ? sentraColors.chartColors.map((color, index) => {
      const gradientId = `pieGradient${index}`;
      return React.createElement('linearGradient', {
        key: gradientId,
        id: gradientId,
        x1: '0',
        y1: '0',
        x2: '1',
        y2: '1'
      }, [
        React.createElement('stop', {
          key: 'stop1',
          offset: '0%',
          stopColor: color,
          stopOpacity: 1
        }),
        React.createElement('stop', {
          key: 'stop2',
          offset: '100%',
          stopColor: color,
          stopOpacity: 0.8
        })
      ]);
    }) : [];

    // Calculate radius values for better proportions
    const finalInnerRadius = donutChart ? Math.max(innerRadius || 60, 60) : innerRadius;
    const finalOuterRadius = outerRadius;

    // Create chart elements
    const chartChildren = [];
    
    // Add gradient definitions if needed
    if (gradientDefs.length > 0) {
      chartChildren.push(React.createElement('defs', { key: 'defs' }, gradientDefs));
    }

    // Add pie with enhanced styling
    chartChildren.push(React.createElement(
      Pie as any,
      {
        key: 'pie',
        data: sanitizedData,
        cx: '50%',
        cy: '50%',
        labelLine: false,
        label: renderCustomizedLabel,
        outerRadius: finalOuterRadius,
        innerRadius: finalInnerRadius,
        fill: '#8884d8',
        dataKey,
        nameKey,
        animationBegin: 0,
        animationDuration: animated ? 1200 : 0,
        onMouseEnter: handleSliceHover,
        onClick: handleSliceClick,
        stroke: sentraColors.background,
        strokeWidth: 2
      },
      ...sanitizedData.map((entry: any, index: number) => {
        const color = entry.color || sentraColors.chartColors[index % sentraColors.chartColors.length];
        const fillColor = gradient ? `url(#pieGradient${index % sentraColors.chartColors.length})` : color;
        
        return React.createElement(Cell as any, {
          key: `cell-${index}`,
          fill: fillColor,
          stroke: sentraColors.background,
          strokeWidth: 2,
          style: {
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }
        });
      })
    ));
    
    // Add tooltip
    if (showTooltip) {
      chartChildren.push(React.createElement(Tooltip as any, { 
        key: 'tooltip',
        content: customTooltip,
        cursor: false
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
          paddingTop: '20px'
        },
        iconType: 'rect',
        align: 'center',
        verticalAlign: 'bottom'
      }));
    }

    // Calculate available height for chart content
    const headerHeight = (title || subtitle) ? 60 : 0;
    const padding = 40; // Total padding (top + bottom)
    const availableHeight = height - headerHeight - padding;

    // Create the chart container with professional styling
    const chartContainer = React.createElement(ResponsiveContainer as any, {
      width: '100%',
      height: availableHeight
    }, React.createElement(PieChart as any, {
      margin: { top: 20, right: 30, left: 20, bottom: showLegend ? 60 : 20 },
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
          background: `radial-gradient(circle, ${sentraColors.warning}15 0%, transparent 70%)`,
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
      className: 'sentra-pie-chart-container',
      role: 'img',
      'aria-label': `Pie chart: ${title || 'Data visualization'}`
    }, [...decorativeElements, ...content]);
  }

  validate(config: WidgetConfig): ValidationResult {
    const errors: string[] = [];
    const baseValidation = this.validateWidgetConfig(config);
    
    if (!baseValidation.isValid) {
      errors.push(...baseValidation.errors);
    }

    const pieConfig = config as PieChartConfig;

    if (!pieConfig.data || !Array.isArray(pieConfig.data)) {
      errors.push('data must be an array');
    } else {
      pieConfig.data.forEach((item, index) => {
        if (!item.name) {
          errors.push(`data[${index}].name is required`);
        }
        if (typeof item.value !== 'number') {
          errors.push(`data[${index}].value must be a number`);
        }
      });
    }

    if (pieConfig.height && pieConfig.height < 200) {
      errors.push('height must be at least 200 pixels');
    }

    if (pieConfig.width && pieConfig.width < 200) {
      errors.push('width must be at least 200 pixels');
    }

    if (pieConfig.innerRadius && pieConfig.outerRadius && 
        pieConfig.innerRadius >= pieConfig.outerRadius) {
      errors.push('innerRadius must be less than outerRadius');
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
        chartData: {
          type: 'array',
          description: 'Processed chart data'
        },
        selectedSlice: {
          type: 'object',
          description: 'Currently selected slice'
        },
        hoveredSlice: {
          type: 'object',
          description: 'Currently hovered slice'
        },
        totalValue: {
          type: 'number',
          description: 'Total value of all slices'
        }
      }
    };
  }

  processData(data: any): PieChartData[] {
    const sanitized = this.sanitizeData(data);
    
    if (!Array.isArray(sanitized)) {
      return [];
    }

    return sanitized.map((item: any) => {
      if (typeof item === 'object' && item !== null) {
        return {
          name: item.name || item.label || 'Unknown',
          value: Number(item.value) || 0,
          color: item.color
        };
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

  private onSliceClick(data: any): void {
}

  private onSliceHover(data: any): void {
}
}

export const PieChartComponent: React.FC<any> = (props) => {
  const widget = new PieChartWidget();
  return widget.render(props) as React.ReactElement;
}; 