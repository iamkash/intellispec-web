/**
 * StatsCard Widget - Display Key Metrics
 * 
 * A display widget that shows key performance metrics with icons,
 * values, and trend indicators.
 */

import React from 'react';
import { BaseWidget, WidgetType, WidgetMetadata, WidgetSchema, WidgetConfig, WidgetContext } from '../base';
import { ValidationResult, ComponentSchema } from '../../core/base';

export interface StatsCardData {
  title: string;
  value: string | number;
  icon?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'stable';
    color?: string;
  };
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

export interface StatsCardConfig extends WidgetConfig {
  data: StatsCardData;
  showIcon?: boolean;
  showTrend?: boolean;
  size?: 'small' | 'medium' | 'large';
  theme?: 'light' | 'dark';
}

export class StatsCardWidget extends BaseWidget {
  metadata: WidgetMetadata = {
    id: 'stats-card',
    name: 'Stats Card',
    version: '1.0.0',
    description: 'Display key metrics with icons and trend indicators',
    author: 'Widget Library',
    tags: ['stats', 'metrics', 'display', 'card', 'kpi'],
    category: 'display',
    widgetType: WidgetType.DISPLAY,
    dataBinding: {
      accepts: ['object', 'number', 'string'],
      provides: ['stats-data']
    },
    styling: {
      themeable: true,
      customizable: true,
      responsive: true
    },
    interactions: {
      events: ['click', 'hover'],
      handlers: ['onClick', 'onHover']
    }
  };

  schema: WidgetSchema = {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        description: 'Stats data to display',
        properties: {
          title: { type: 'string' },
          value: { type: 'string' }, // Changed from array to string
          icon: { type: 'string' },
          trend: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              direction: { type: 'string', enum: ['up', 'down', 'stable'] },
              color: { type: 'string' }
            }
          },
          color: { type: 'string', enum: ['primary', 'success', 'warning', 'error', 'info'] }
        },
        required: ['title', 'value']
      },
      showIcon: {
        type: 'boolean',
        description: 'Whether to show icon',
        default: true
      },
      showTrend: {
        type: 'boolean',
        description: 'Whether to show trend indicator',
        default: true
      },
      size: {
        type: 'string',
        description: 'Card size',
        enum: ['small', 'medium', 'large'],
        default: 'medium'
      },
      theme: {
        type: 'string',
        description: 'Card theme',
        enum: ['light', 'dark'],
        default: 'light'
      }
    },
    required: ['data']
  };

  render(props: any, context?: WidgetContext): React.ReactNode {
    const config = props as StatsCardConfig;
    const {
      data,
      showIcon = true,
      showTrend = true,
      size = 'medium',
      theme = 'light'
    } = config;

    // Sanitize data and provide defaults if undefined
    const defaultData = { title: 'No Data', value: 0 };
    const sanitizedData = this.sanitizeData(data || defaultData);

    // Color mapping
    const colorMap: Record<string, string> = {
      primary: '#1890ff',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#13c2c2'
    };

    // Size mapping
    const sizeMap = {
      small: { padding: '12px', fontSize: '14px', iconSize: '16px' },
      medium: { padding: '16px', fontSize: '16px', iconSize: '20px' },
    large: { padding: '10px', fontSize: '18px', iconSize: '24px' }
    };

    const sizeStyles = sizeMap[size];
    const cardColor = sanitizedData.color && colorMap[sanitizedData.color] ? colorMap[sanitizedData.color] : colorMap.primary;
    const secondaryTextColor = theme === 'dark' ? '#cccccc' : '#666666';

    const handleClick = () => {
      if (context?.events?.onClick) {
        context.events.onClick(sanitizedData);
      }
    };

    const handleHover = () => {
      if (context?.events?.onHover) {
        context.events.onHover(sanitizedData);
      }
    };

    return React.createElement(
      'div',
      {
        className: 'stats-card-widget liquid-glass',
        style: {
          padding: sizeStyles.padding,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          fontFamily: context?.theme?.fontFamily || 'Arial, sans-serif',
          minWidth: '200px',
        },
        onClick: handleClick,
        onMouseEnter: handleHover
      },
      // Header with icon and title
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px'
          }
        },
        showIcon && sanitizedData.icon && React.createElement(
          'div',
          {
            style: {
              marginRight: '8px',
              fontSize: sizeStyles.iconSize,
              color: cardColor
            }
          },
          sanitizedData.icon
        ),
        React.createElement(
          'div',
          {
            style: {
              fontSize: sizeStyles.fontSize,
              fontWeight: '500',
              color: secondaryTextColor
            }
          },
          sanitizedData.title
        )
      ),
      // Value
      React.createElement(
        'div',
        {
          style: {
            fontSize: size === 'large' ? '32px' : size === 'medium' ? '28px' : '24px',
            fontWeight: 'bold',
            color: cardColor,
            marginBottom: '8px'
          }
        },
        sanitizedData.value
      ),
      // Trend indicator
      showTrend && sanitizedData.trend && React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            fontSize: '12px',
            color: sanitizedData.trend.color || 
                   (sanitizedData.trend.direction === 'up' ? '#52c41a' : 
                    sanitizedData.trend.direction === 'down' ? '#ff4d4f' : '#666666')
          }
        },
        React.createElement(
          'span',
          {
            style: {
              marginRight: '4px'
            }
          },
          sanitizedData.trend.direction === 'up' ? '↗' : 
          sanitizedData.trend.direction === 'down' ? '↘' : '→'
        ),
        sanitizedData.trend.value
      )
    );
  }

  validate(config: WidgetConfig): ValidationResult {
    const baseValidation = this.validateWidgetConfig(config);
    if (!baseValidation.isValid) {
      return baseValidation;
    }

    const statsConfig = config as StatsCardConfig;
    const errors: string[] = [];

    // Validate data
    if (!statsConfig.data) {
      errors.push('Data is required');
    } else {
      if (!statsConfig.data.title) {
        errors.push('Data title is required');
      }
      if (statsConfig.data.value === undefined || statsConfig.data.value === null) {
        errors.push('Data value is required');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: [...baseValidation.errors, ...errors]
    };
  }

  getDataRequirements(): string[] {
    return ['object'];
  }

  getOutputSchema(): ComponentSchema {
    return {
      type: 'object',
      properties: {
        clicked: {
          type: 'boolean',
          description: 'Whether the card was clicked'
        },
        hovered: {
          type: 'boolean',
          description: 'Whether the card is being hovered'
        }
      }
    };
  }

  processData(data: any): StatsCardData {
    if (typeof data === 'object' && data !== null) {
      return {
        title: data.title || 'Untitled',
        value: data.value || 0,
        icon: data.icon,
        trend: data.trend,
        color: data.color
      };
    }
    
    return {
      title: 'Value',
      value: data || 0
    };
  }

  onEvent(event: string, data: any): void {
    switch (event) {
      case 'click':
        
        break;
      case 'hover':
        
        break;
    }
  }

  onDataChange(data: any): void {
    const processedData = this.processData(data);
    
  }

  onConfigChange(config: WidgetConfig): void {
    
  }

  onResize(dimensions: { width: number; height: number }): void {
    
  }
}

// Functional component wrapper for registry registration
export const StatsCardComponent: React.FC<StatsCardConfig> = (props) => {
  const widget = new StatsCardWidget();
  return widget.render(props) as React.ReactElement;
}; 
