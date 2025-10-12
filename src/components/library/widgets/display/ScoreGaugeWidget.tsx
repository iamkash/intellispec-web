import React from 'react';
import { Progress } from 'antd';
import { BaseWidget, WidgetMetadata, WidgetSchema, WidgetConfig, WidgetContext } from '../base';
import { ValidationResult } from '../../core/base';

export interface ScoreGaugeWidgetProps {
  value: number;
  maxValue?: number;
  title: string;
  description?: string;
  size?: number;
  strokeWidth?: number;
  showInfo?: boolean;
  format?: (percent?: number, successPercent?: number) => React.ReactNode;
  titleStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  className?: string;
}

export class ScoreGaugeWidget extends BaseWidget {
  metadata: WidgetMetadata = {
    id: 'score-gauge-widget',
    name: 'Score Gauge Widget',
    description: 'Displays score values in a gauge format with color coding',
    version: '1.0.0',
    widgetType: 'display' as any,
    dataBinding: {
      accepts: ['number', 'score'],
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
      value: { type: 'number', description: 'Current score value' },
      maxValue: { type: 'number', default: 9, description: 'Maximum possible score' },
      title: { type: 'string', description: 'Title of the gauge' },
      description: { type: 'string', description: 'Description text' },
      size: { type: 'number', default: 160, description: 'Size of the gauge' },
      strokeWidth: { type: 'number', default: 12, description: 'Width of the gauge stroke' },
      showInfo: { type: 'boolean', default: true, description: 'Show score info' }
    },
    required: ['value', 'title'],
    dataSchema: {
      input: {
        type: 'object',
        properties: {
          value: { type: 'number', description: 'Input score value' }
        },
        required: ['value']
      }
    }
  };

  render(props: ScoreGaugeWidgetProps, context?: WidgetContext): React.ReactNode {
    const {
      value,
      maxValue = 9,
      title,
      description,
      size = 160,
      strokeWidth = 12,
      showInfo = true,
      format,
      titleStyle,
      style,
      className
    } = props;

    const percent = maxValue > 0 ? (value / maxValue) * 100 : 0;
    
    // Round the value to 2 decimal places
    const roundedValue = typeof value === 'number' ? Math.round(value * 100) / 100 : value;
    const roundedPercent = Math.round(percent * 100) / 100;
    
    // Determine color based on score percentage with iOS-style colors
    let strokeColor = '#34C759'; // iOS Green for good scores
    let status: 'success' | 'exception' | 'normal' | 'active' = 'success';
    
    if (percent < 50) {
      strokeColor = '#FF3B30'; // iOS Red for poor scores
      status = 'exception';
    } else if (percent < 75) {
      strokeColor = '#FF9500'; // iOS Orange for moderate scores
      status = 'normal';
    }

    const customFormat = format || ((percent) => `${roundedValue}/${maxValue}`);

    // Detect dark theme
    const isDarkTheme = context?.theme?.isDarkMode || 
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    // iOS 17 liquid glass styling with dark theme support
    const liquidGlassStyle: React.CSSProperties = {
      background: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.25)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: isDarkTheme ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.18)',
      borderRadius: '28px',
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
      height: '280px', // Fixed height to match ProgressRingWidget
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
      borderRadius: '28px'
    };

    // Title styling using theme variables
    const modernTitleStyle: React.CSSProperties = {
      fontSize: '18px',
      fontWeight: 600,
      color: 'var(--color-text)', // Use theme variable
      marginBottom: '20px',
      textAlign: 'center',
      letterSpacing: '0.01em',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      ...titleStyle
    };

    // Description styling using theme variables
    const descriptionStyle: React.CSSProperties = {
      fontSize: '14px',
      marginTop: '16px',
      color: 'var(--color-text-secondary)', // Use theme variable
      textAlign: 'center',
      lineHeight: 1.4,
      fontWeight: 400,
      letterSpacing: '0.01em',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    };

    // Custom progress styling with enhanced shadows
    const progressStyle: React.CSSProperties = {
      filter: `drop-shadow(0 6px 12px ${strokeColor}40)`,
      position: 'relative'
    };

    // Score indicator styling
    const scoreIndicatorStyle: React.CSSProperties = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: size * 0.25, // Increased from 0.15 to 0.25 for bigger numbers
      fontWeight: 700,
      color: isDarkTheme ? 'var(--color-text)' : strokeColor, // Use theme variable in dark theme, stroke color in light theme
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      letterSpacing: '-0.02em'
    };

    return (
      <div 
        className={`score-gauge-widget ios-liquid-glass ${className || ''}`}
        style={liquidGlassStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
          e.currentTarget.style.boxShadow = isDarkTheme ? `
            0 16px 48px 0 rgba(0, 0, 0, 0.6),
            0 6px 16px 0 rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.15)
          ` : `
            0 16px 48px 0 rgba(31, 38, 135, 0.5),
            0 6px 16px 0 rgba(0, 0, 0, 0.1),
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
            <div className="widget-title" style={modernTitleStyle}>
              {title}
            </div>
          )}
          
          <div style={progressStyle}>
            <Progress
              type="dashboard"
              percent={roundedPercent}
              size={size}
              strokeWidth={strokeWidth}
              showInfo={false} // We'll show custom info
              format={customFormat}
              strokeColor={strokeColor}
              trailColor={isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}
              gapDegree={75}
              status={status}
            />
            {/* Custom score display */}
            <div style={scoreIndicatorStyle}>
              {roundedValue}
            </div>
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
      percent: { type: 'number' },
      status: { type: 'string' }
    };
  }
}

export default ScoreGaugeWidget;

// Functional component wrapper for registry registration
export const ScoreGaugeComponent: React.FC<ScoreGaugeWidgetProps> = (props) => {
  const widget = new ScoreGaugeWidget();
  return widget.render(props) as React.ReactElement;
}; 