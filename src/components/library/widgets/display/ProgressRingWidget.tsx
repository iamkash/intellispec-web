import React from 'react';
import { Progress } from 'antd';
import { BaseWidget, WidgetMetadata, WidgetSchema, WidgetConfig, WidgetContext } from '../base';
import { ValidationResult } from '../../core/base';

export interface ProgressRingWidgetProps {
  value: number;
  maxValue?: number;
  size?: number;
  strokeWidth?: number;
  showInfo?: boolean;
  format?: (percent?: number, successPercent?: number) => React.ReactNode;
  strokeColor?: string;
  trailColor?: string;
  type?: 'circle' | 'dashboard';
  gapDegree?: number;
  gapPosition?: 'top' | 'bottom' | 'left' | 'right';
  title?: string;
  description?: string;
  status?: 'success' | 'exception' | 'normal' | 'active';
  style?: React.CSSProperties;
  className?: string;
}

export class ProgressRingWidget extends BaseWidget {
  metadata: WidgetMetadata = {
    id: 'progress-ring-widget',
    name: 'Progress Ring Widget',
    description: 'Displays percentage values in a circular progress ring format',
    version: '1.0.0',
    widgetType: 'display' as any,
    dataBinding: {
      accepts: ['number', 'percentage'],
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
      value: { type: 'number', description: 'Current value' },
      maxValue: { type: 'number', default: 100, description: 'Maximum value' },
      size: { type: 'number', default: 120, description: 'Size of the progress ring' },
      strokeWidth: { type: 'number', default: 8, description: 'Width of the progress stroke' },
      showInfo: { type: 'boolean', default: true, description: 'Show percentage info' },
      strokeColor: { type: 'string', default: '#007AFF', description: 'Color of the progress stroke' },
      trailColor: { type: 'string', default: 'rgba(0, 122, 255, 0.1)', description: 'Color of the trail' },
      type: { type: 'string', enum: ['circle', 'dashboard'], default: 'circle', description: 'Type of progress' },
      title: { type: 'string', description: 'Title to display' },
      description: { type: 'string', description: 'Description text' },
      status: { type: 'string', enum: ['success', 'exception', 'normal', 'active'], default: 'normal', description: 'Status of the progress' }
    },
    required: ['value'],
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

  render(props: ProgressRingWidgetProps, context?: WidgetContext): React.ReactNode {
    const {
      value,
      maxValue = 100,
      size = 120,
      strokeWidth = 8,
      showInfo = true,
      format,
      strokeColor = '#007AFF',
      trailColor = 'rgba(0, 122, 255, 0.1)',
      type = 'circle',
      gapDegree,
      gapPosition,
      title,
      description,
      status = 'normal',
      style,
      className
    } = props;

    const percent = maxValue > 0 ? (value / maxValue) * 100 : 0;
    
    // Round the value to 2 decimal places
    const roundedValue = typeof value === 'number' ? Math.round(value * 100) / 100 : value;
    const roundedPercent = Math.round(percent * 100) / 100;

    // Detect dark theme
    const isDarkTheme = context?.theme?.isDarkMode || 
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    // iOS 17 liquid glass styling with dark theme support
    const liquidGlassStyle: React.CSSProperties = {
      background: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.25)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: isDarkTheme ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.18)',
      borderRadius: '24px',
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
      padding: '28px',
      height: '280px', // Fixed height to match ScoreGaugeWidget
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
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
      borderRadius: '24px'
    };

    // Title styling using theme variables
    const titleStyle: React.CSSProperties = {
      fontSize: '16px',
      fontWeight: 600,
      color: 'var(--color-text)', // Use theme variable
      marginBottom: '16px',
      textAlign: 'center',
      letterSpacing: '0.01em',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    };

    // Description styling using theme variables
    const descriptionStyle: React.CSSProperties = {
      fontSize: '13px',
      marginTop: '12px',
      color: 'var(--color-text-secondary)', // Use theme variable
      textAlign: 'center',
      lineHeight: 1.4,
      fontWeight: 400,
      letterSpacing: '0.01em',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    };

    // Custom progress styling
    const progressStyle: React.CSSProperties = {
      filter: 'drop-shadow(0 4px 8px rgba(0, 122, 255, 0.2))'
    };

    // Custom format function to show rounded values using theme variables
    const customFormat = format || ((percent) => (
      <span style={{ 
        color: isDarkTheme ? 'var(--color-text)' : 'inherit',
        fontWeight: 600,
        fontSize: '16px'
      }}>
        {roundedValue}%
      </span>
    ));

    return (
      <div 
        className={`progress-ring-widget ios-liquid-glass ${className || ''}`}
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          height: '100%',
          justifyContent: 'space-between'
        }}>
          {title && (
            <div className="widget-title" style={titleStyle}>
              {title}
            </div>
          )}
          
          <div style={progressStyle}>
            <Progress
              type={type}
              percent={roundedPercent}
              size={size}
              strokeWidth={strokeWidth}
              showInfo={showInfo}
              format={customFormat}
              strokeColor={strokeColor}
              trailColor={isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : trailColor}
              gapDegree={gapDegree}
              gapPosition={gapPosition}
              status={status}
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
      percent: { type: 'number' },
      status: { type: 'string' }
    };
  }
}

export default ProgressRingWidget;

// Functional component wrapper for registry registration
export const ProgressRingComponent: React.FC<ProgressRingWidgetProps> = (props) => {
  const widget = new ProgressRingWidget();
  return widget.render(props) as React.ReactElement;
};