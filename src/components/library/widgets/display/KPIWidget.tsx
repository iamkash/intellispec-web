/**
 * KPIWidget - Enhanced presentation component for rendering Executive KPI metrics
 * 
 * This widget renders KPI cards with:
 * - Title display
 * - Value (supports both string and number formats)
 * - Icon display (from Ant Design icons)
 * - Trend indicators with proper formatting
 * - Professional styling and animations
 */

import { ArrowDownOutlined, ArrowUpOutlined, CheckCircleOutlined, MinusOutlined, TrophyOutlined, WarningOutlined } from '@ant-design/icons';
import { Col, Progress, Row } from 'antd';
import React, { useEffect, useState } from 'react';
import { useThemeColors } from '../../../../hooks/useThemeColors';

export interface KPIData {
  id: string;
  title: string;
  value: string | number | undefined;
  icon?: string;
  iconColor?: string; // Custom color for the icon
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'stable';
    percentage?: number;
  };
  description?: string;
  category?: string;
  priority?: number;
  target?: number;
  status?: 'good' | 'warning' | 'danger' | 'excellent';
  unit?: string;
  progress?: number; // 0-100 percentage for progress indicator
  subtitle?: string; // Additional context
  lastUpdated?: string; // Timestamp
  changeFromPrevious?: {
    value: number;
    period: string; // e.g., "vs last month"
  };
}

export interface KPIWidgetProps {
  kpis: KPIData[];
  onKPIClick?: (kpi: KPIData) => void;
  onKPIHover?: (kpi: KPIData) => void;
  loading?: boolean;
  error?: string;
  columns?: number; // Number of KPIs per row
}

// Helper functions moved outside components
const formatValue = (value: string | number | undefined, unit?: string): { value: string; unit: string } => {
  if (value === undefined || value === null) {
    return { value: 'N/A', unit: '' };
  }
  
  if (typeof value === 'string') {
    return { value: value, unit: unit || '' }; // Already formatted
  }
  
  // Format the number without unit
  const formattedNumber = value.toLocaleString();
  
  // Handle special units
  if (unit === '%') return { value: formattedNumber, unit: '%' };
  if (unit === '$') return { value: formattedNumber, unit: '$' }; // $ goes before
  if (unit === 'count') return { value: formattedNumber, unit: '' };
  
  return { value: formattedNumber, unit: unit || '' };
};

// Get theme colors from CSS custom properties (fallback function)
const getThemeColors = () => {
  if (typeof window === 'undefined') return {};
  
  const getThemeColor = (variable: string) => {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  };

  return {
    primary: `hsl(${getThemeColor('--primary')})`,
    secondary: `hsl(${getThemeColor('--secondary')})`,
    accent: `hsl(${getThemeColor('--accent')})`,
    muted: `hsl(${getThemeColor('--muted')})`,
    foreground: `hsl(${getThemeColor('--foreground')})`,
    mutedForeground: `hsl(${getThemeColor('--muted-foreground')})`,
    border: `hsl(${getThemeColor('--border')})`,
    background: `hsl(${getThemeColor('--background')})`,
    card: `hsl(${getThemeColor('--card')})`,
    cardForeground: `hsl(${getThemeColor('--card-foreground')})`,
    destructive: `hsl(${getThemeColor('--destructive')})`,
    success: `hsl(${getThemeColor('--chart-2')})` || 'hsl(173 58% 39%)',
    warning: `hsl(${getThemeColor('--chart-4')})` || 'hsl(43 74% 66%)'
  };
};

const getStatusColor = (status?: string, themeColors?: any): string => {
  const colors = themeColors || getThemeColors();
  switch (status) {
    case 'excellent': return 'hsl(142 76% 36%)'; // Darker green for excellence
    case 'good': return colors.success || 'hsl(173 58% 39%)';
    case 'warning': return colors.warning || 'hsl(43 74% 66%)';
    case 'danger': return colors.destructive || 'hsl(0 84% 60%)';
    default: return colors.primary || 'hsl(221 83% 53%)';
  }
};

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'excellent': return <TrophyOutlined />;
    case 'good': return <CheckCircleOutlined />;
    case 'warning': return <WarningOutlined />;
    case 'danger': return <WarningOutlined />;
    default: return null;
  }
};

const getTrendColor = (direction?: string, themeColors?: any): string => {
  const colors = themeColors || getThemeColors();
  switch (direction) {
    case 'up': return colors.success || 'hsl(173 58% 39%)';
    case 'down': return colors.destructive || 'hsl(0 84% 60%)';
    case 'stable': return colors.primary || 'hsl(221 83% 53%)';
    default: return colors.mutedForeground || 'hsl(215 16% 47%)';
  }
};

const getTrendIcon = (direction?: string) => {
  switch (direction) {
    case 'up': return <ArrowUpOutlined />;
    case 'down': return <ArrowDownOutlined />;
    case 'stable': return <MinusOutlined />;
    default: return null;
  }
};

const getIcon = (iconName?: string) => {
  if (!iconName) return null;
  
  try {
    
    
    // First try Ant Design icons
    try {
      const AntIcon = require('@ant-design/icons')[iconName];
      if (AntIcon) {
        
        return React.createElement(AntIcon);
      }
    } catch (antError) {
      // Continue to next library
    }
    
    // Then try react-icons Font Awesome
    try {
      const FaIcon = require('react-icons/fa')[iconName];
      if (FaIcon) {
        
        return React.createElement(FaIcon);
      }
    } catch (faError) {
      // Continue to next library
    }
    
    // Try other react-icons libraries
    try {
      const ReactIcon = require('react-icons/md')[iconName] || 
                       require('react-icons/hi')[iconName] ||
                       require('react-icons/bs')[iconName] ||
                       require('react-icons/ai')[iconName];
      
      if (ReactIcon) {
        
        return React.createElement(ReactIcon);
      }
    } catch (reactError) {
      // Continue
    }
    
    console.warn(`❌ Icon ${iconName} not found in any icon library`);
    return null;
  } catch (error) {
    console.warn(`❌ Error loading icon ${iconName}:`, error);
    return null;
  }
};

// Animation hook for value counting
const useCountAnimation = (endValue: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(endValue * easeOutCubic));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    if (endValue > 0) {
      animationFrame = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [endValue, duration]);
  
  return count;
};

// Individual KPI Card Component
const KPICard: React.FC<{
  kpi: KPIData;
  onKPIClick?: (kpi: KPIData) => void;
  onKPIHover?: (kpi: KPIData) => void;
  span?: number; // Column span in 24-grid system for desktop
}> = ({ kpi, onKPIClick, onKPIHover, span = 6 }) => {
  const themeColors = useThemeColors();
  const numericValue = typeof kpi.value === 'number' ? kpi.value : (typeof kpi.value === 'string' ? parseFloat(kpi.value) || 0 : 0);
  const animatedValue = useCountAnimation(numericValue, 1200);

  return (
    <Col 
      xs={24}  // Full width on mobile (< 576px)
      sm={12}  // 2 columns on tablets (≥ 576px)
      md={12}  // 2 columns on medium screens (≥ 768px)
      lg={span} // Use calculated span on large screens (≥ 992px)
      xl={span} // Use calculated span on extra large (≥ 1200px)
      xxl={span} // Use calculated span on 2xl+ (≥ 1600px)
      style={{ display: 'flex' }}
    >
      <div
        onClick={() => onKPIClick?.(kpi)}
        onMouseEnter={() => onKPIHover?.(kpi)}
        style={{
          border: `1px solid ${themeColors.border || 'hsl(214 32% 91%)'}`,
          borderRadius: '12px',
          backgroundColor: themeColors.card || 'hsl(0 0% 100%)',
          color: themeColors.cardForeground || 'hsl(222 84% 5%)',
          height: '180px',
          width: '100%',
          cursor: 'pointer',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)';
          e.currentTarget.style.borderColor = getStatusColor(kpi.status);
          e.currentTarget.style.borderWidth = '2px';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)';
          e.currentTarget.style.borderColor = themeColors.border || 'hsl(214 32% 91%)';
          e.currentTarget.style.borderWidth = '1px';
        }}
      >
        {/* Simple status indicator dot only */}
        {kpi.status && (
          <div style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(kpi.status, themeColors),
            boxShadow: `0 0 0 2px ${themeColors.card || 'hsl(0 0% 100%)'}`,
            animation: kpi.status === 'danger' ? 'pulse 2s infinite' : 'none'
          }} />
        )}

        {/* Header with title and icon */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ 
              fontSize: '14px', 
              color: themeColors.mutedForeground || 'hsl(215 16% 47%)',
              fontWeight: 500,
              lineHeight: '1.3',
              marginBottom: '4px'
            }}>
              {kpi.title}
            </div>
            {kpi.subtitle && (
              <div style={{ 
                fontSize: '12px', 
                color: themeColors.mutedForeground || 'hsl(215 16% 47%)',
                opacity: 0.8,
                lineHeight: '1.2'
              }}>
                {kpi.subtitle}
              </div>
            )}
          </div>
          {/* Always show KPI icon in header */}
          {kpi.icon && (
            <div style={{ 
              fontSize: '24px', 
              color: kpi.iconColor || getStatusColor(kpi.status, themeColors),
              display: 'flex',
              alignItems: 'center',
              opacity: 0.9
            }}>
              {getIcon(kpi.icon)}
            </div>
          )}
        </div>
        
        {/* Main value with animation */}
        <div style={{ 
          fontSize: '28px', 
          fontWeight: 'bold',
          marginBottom: '16px',
          fontFamily: 'Inter, system-ui, sans-serif',
          lineHeight: '1.1',
          color: themeColors.cardForeground || 'hsl(222 84% 5%)',
          display: 'flex',
          alignItems: 'baseline',
          gap: '4px'
        }}>
          {(() => {
            const formatted = typeof kpi.value === 'number' ? 
              formatValue(animatedValue, kpi.unit) : 
              formatValue(kpi.value, kpi.unit);
            
            return (
              <>
                {/* Currency symbol before value */}
                {formatted.unit === '$' && (
                  <span style={{
                    fontSize: '20px',
                    fontWeight: 'normal',
                    opacity: 0.8
                  }}>$</span>
                )}
                
                {/* Main value */}
                <span>{formatted.value}</span>
                
                {/* Unit after value (except for $) */}
                {formatted.unit && formatted.unit !== '$' && (
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 'normal',
                    color: themeColors.mutedForeground || 'hsl(215 16% 47%)',
                    opacity: 0.8,
                    marginLeft: '2px'
                  }}>
                    {formatted.unit}
                  </span>
                )}
              </>
            );
          })()}
          
          {kpi.changeFromPrevious && (
            <span style={{
              fontSize: '14px',
              fontWeight: 'normal',
              color: kpi.changeFromPrevious.value >= 0 ? 
                getTrendColor('up', themeColors) : getTrendColor('down', themeColors),
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              marginLeft: '8px'
            }}>
              {kpi.changeFromPrevious.value >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              {Math.abs(kpi.changeFromPrevious.value)}%
            </span>
          )}
        </div>

        {/* Progress bar if available */}
        {kpi.progress !== undefined && (
          <div style={{ marginBottom: '12px' }}>
            <Progress
              percent={kpi.progress}
              showInfo={false}
              strokeColor={getStatusColor(kpi.status, themeColors)}
              trailColor={themeColors.muted || 'hsl(210 40% 98%)'}
              strokeWidth={6}
              style={{ marginBottom: '4px' }}
            />
            <div style={{
              fontSize: '11px',
              color: themeColors.mutedForeground || 'hsl(215 16% 47%)',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>Progress</span>
              <span>{kpi.progress}%</span>
            </div>
          </div>
        )}
      
        {/* Footer section */}
        <div style={{ marginTop: 'auto' }}>
          {/* Trend and target row */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            {/* Trend indicator */}
            {kpi.trend && (
              <div style={{ 
                fontSize: '12px', 
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: getTrendColor(kpi.trend.direction, themeColors),
                backgroundColor: `${getTrendColor(kpi.trend.direction, themeColors)}15`,
                padding: '4px 8px',
                borderRadius: '12px',
                fontWeight: 500
              }}>
                {getTrendIcon(kpi.trend.direction)}
                <span>{kpi.trend.value}</span>
                {kpi.trend.percentage && (
                  <span style={{ opacity: 0.8 }}>
                    ({kpi.trend.percentage > 0 ? '+' : ''}{kpi.trend.percentage}%)
                  </span>
                )}
              </div>
            )}
            
            {/* Alert icon at bottom (only for warnings/danger) */}
            {(kpi.status === 'warning' || kpi.status === 'danger') && (
              <div style={{
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                color: '#ef4444', // Red stoplight color for alerts
                animation: kpi.status === 'danger' ? 'pulse 2s infinite' : 'none'
              }}>
                {getStatusIcon(kpi.status)}
              </div>
            )}
          </div>

          {/* Target vs actual */}
          {kpi.target && (
            <div style={{ 
              fontSize: '11px', 
              color: themeColors.mutedForeground || 'hsl(215 16% 47%)',
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px'
            }}>
              <span>
                Target: {(() => {
                  const targetFormatted = formatValue(kpi.target, kpi.unit);
                  return targetFormatted.unit === '$' ? 
                    `$${targetFormatted.value}` : 
                    `${targetFormatted.value}${targetFormatted.unit}`;
                })()}
              </span>
              {typeof kpi.value === 'number' && kpi.target && (
                <span style={{ 
                  color: kpi.value >= kpi.target ? getTrendColor('up', themeColors) : getTrendColor('down', themeColors),
                  fontWeight: 500
                }}>
                  {((kpi.value / kpi.target) * 100).toFixed(0)}%
                </span>
              )}
            </div>
          )}
          
          {/* Description or last updated */}
          <div style={{ 
            fontSize: '10px', 
            color: themeColors.mutedForeground || 'hsl(215 16% 47%)',
            opacity: 0.7,
            lineHeight: '1.3'
          }}>
            {kpi.lastUpdated ? `Updated ${kpi.lastUpdated}` : kpi.description}
          </div>
        </div>
      </div>
    </Col>
  );
};

export const KPIWidget: React.FC<KPIWidgetProps> = ({
  kpis,
  onKPIClick,
  onKPIHover,
  loading = false,
  error,
  columns = 4
}) => {
  // Add CSS animations for alerts
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
        20%, 40%, 60%, 80% { transform: translateX(2px); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const themeColors = useThemeColors();
  
  // Calculate span based on columns (24-column grid system)
  const span = Math.floor(24 / columns);

  if (error) {
    return (
      <div style={{ 
        textAlign: 'center', 
        color: themeColors.destructive || 'hsl(0 84% 60%)',
        padding: '40px 20px',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        Error loading KPIs: {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        color: themeColors.mutedForeground || 'hsl(215 16% 47%)',
        padding: '40px 20px',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        Loading KPIs...
      </div>
    );
  }

  return (
    <Row gutter={[16, 16]} style={{ height: '100%', display: 'flex', alignItems: 'stretch' }}>
      {kpis.map((kpi) => (
        <KPICard
          key={kpi.id}
          kpi={kpi}
          onKPIClick={onKPIClick}
          onKPIHover={onKPIHover}
          span={span}
        />
      ))}
    </Row>
  );
};

export default KPIWidget; 
