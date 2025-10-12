import React from 'react';
import { Card, Statistic } from 'antd';
import { BaseWidget, WidgetMetadata, WidgetSchema, WidgetConfig, WidgetContext } from '../base';
import { ValidationResult } from '../../core/base';

export interface StatCardWidgetProps {
  value: number;
  title: string;
  description?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  precision?: number;
  valueStyle?: React.CSSProperties;
  icon?: React.ReactNode;
  color?: string;
  size?: 'small' | 'default' | 'large';
  style?: React.CSSProperties;
  className?: string;
}

export class StatCardWidget extends BaseWidget {
  metadata: WidgetMetadata = {
    id: 'stat-card-widget',
    name: 'Statistic Card Widget',
    description: 'Displays numeric values in a card format with statistics',
    version: '1.0.0',
    widgetType: 'display' as any,
    dataBinding: {
      accepts: ['number', 'count'],
      provides: []
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
      value: { type: 'number', description: 'Numeric value to display' },
      title: { type: 'string', description: 'Title of the statistic' },
      description: { type: 'string', description: 'Description text' },
      prefix: { type: 'string', description: 'Prefix to show before value' },
      suffix: { type: 'string', description: 'Suffix to show after value' },
      precision: { type: 'number', description: 'Number of decimal places' },
      color: { type: 'string', description: 'Color theme for the card' },
      size: { type: 'string', enum: ['small', 'default', 'large'], default: 'default', description: 'Size of the card' }
    },
    required: ['value', 'title'],
    dataSchema: {
      input: {
        type: 'object',
        properties: {
          value: { type: 'number', description: 'Input value' }
        },
        required: ['value']
      }
    }
  };

  render(props: StatCardWidgetProps, context?: WidgetContext): React.ReactNode {
    const {
      value,
      title,
      description,
      prefix,
      suffix,
      precision,
      valueStyle,
      icon,
      color = '#007AFF',
      size = 'default',
      style,
      className
    } = props;

    const cardSize = size === 'small' ? 'small' : size === 'large' ? 'default' : 'default';
    const statSize = size === 'small' ? 'small' : size === 'large' ? 'large' : 'default';

    // Detect dark theme
    const isDarkTheme = context?.theme?.isDarkMode || 
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    // iOS 17 liquid glass styling with dark theme support
    const liquidGlassStyle: React.CSSProperties = {
      background: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.25)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: isDarkTheme ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.18)',
      borderRadius: '20px',
      boxShadow: isDarkTheme ? `
        0 8px 32px 0 rgba(0, 0, 0, 0.5),
        0 2px 8px 0 rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1)
      ` : `
        0 8px 32px 0 rgba(31, 38, 135, 0.37),
        0 2px 8px 0 rgba(0, 0, 0, 0.06),
        inset 0 1px 0 rgba(255, 255, 255, 0.2)
      `,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      ...style
    };

    // Gradient overlay for enhanced glass effect
    const gradientOverlay: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: isDarkTheme ? `linear-gradient(135deg, 
        rgba(255, 255, 255, 0.05) 0%, 
        rgba(255, 255, 255, 0.02) 50%, 
        rgba(255, 255, 255, 0.05) 100%)` : `linear-gradient(135deg, 
        rgba(255, 255, 255, 0.1) 0%, 
        rgba(255, 255, 255, 0.05) 50%, 
        rgba(255, 255, 255, 0.1) 100%)`,
      pointerEvents: 'none',
      borderRadius: '20px'
    };

    // Icon styling with modern iOS design
    const iconStyle: React.CSSProperties = {
      fontSize: size === 'small' ? '24px' : size === 'large' ? '36px' : '28px',
      color: color,
      marginBottom: '12px',
      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
    };

    // Round the value to 2 decimal places
    const roundedValue = typeof value === 'number' ? Math.round(value * 100) / 100 : value;

    // Value styling with modern typography - much larger and bolder for Yes/No/N/A stats
    const modernValueStyle: React.CSSProperties = {
      color: isDarkTheme ? 'var(--color-text)' : color, // Use theme variable in dark theme, original color in light theme
      fontSize: size === 'small' ? '36px' : size === 'large' ? '48px' : '42px', // Much larger numbers
      fontWeight: 900, // Extra bold
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      letterSpacing: '-0.02em',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
      lineHeight: 1.1, // Tighter line height for larger text
      ...valueStyle
    };

    // Title styling using theme variables
    const titleStyle: React.CSSProperties = {
      fontSize: size === 'small' ? '13px' : size === 'large' ? '16px' : '14px',
      fontWeight: 600,
      color: 'var(--color-text)', // Use theme variable
      letterSpacing: '0.01em',
      marginBottom: '4px'
    };

    // Description styling using theme variables
    const descriptionStyle: React.CSSProperties = {
      fontSize: size === 'small' ? '11px' : size === 'large' ? '14px' : '12px',
      color: 'var(--color-text-secondary)', // Use theme variable
      lineHeight: 1.4,
      fontWeight: 400,
      letterSpacing: '0.01em'
    };

    return (
      <div 
        className={`stat-card-widget ios-liquid-glass ${className || ''}`}
        style={liquidGlassStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.boxShadow = isDarkTheme ? `
            0 12px 40px 0 rgba(0, 0, 0, 0.6),
            0 4px 12px 0 rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.15)
          ` : `
            0 12px 40px 0 rgba(31, 38, 135, 0.45),
            0 4px 12px 0 rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.25)
          `;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = liquidGlassStyle.boxShadow as string;
        }}
      >
        {/* Gradient overlay */}
        <div style={gradientOverlay} />
        
        {/* Content */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          padding: size === 'small' ? '16px' : size === 'large' ? '28px' : '20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: size === 'small' ? '120px' : size === 'large' ? '180px' : '140px'
        }}>
          {icon && (
            <div style={iconStyle}>
              {icon}
            </div>
          )}
          
          <div>
            <div className="widget-title" style={titleStyle}>{title}</div>
            <Statistic
              value={roundedValue}
              prefix={prefix}
              suffix={suffix}
              precision={precision}
              valueStyle={modernValueStyle}
            />
          </div>
          
          {description && (
            <div style={descriptionStyle}>
              {description}
            </div>
          )}
        </div>
      </div>
    );
  }

  validate(config: WidgetConfig): ValidationResult {
    return this.validateWidgetConfig(config);
  }

  getDataRequirements(): string[] {
    return ['value'];
  }

  getOutputSchema(): any {
    return {
      value: { type: 'number' },
      title: { type: 'string' }
    };
  }
}

export default StatCardWidget;

// Functional component wrapper for registry registration
export const StatCardComponent: React.FC<StatCardWidgetProps> = (props) => {
  const widget = new StatCardWidget();
  return widget.render(props) as React.ReactElement;
}; 