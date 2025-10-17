/**
 * Stats Gadget
 * 
 * A gadget that displays multiple statistics in a grid layout.
 * This gadget extends BaseGadget and uses automatic data fetching.
 */

import React from 'react';
import { BaseGadget, GadgetType, GadgetMetadata, GadgetSchema, GadgetConfig } from '../base';
import { ValidationResult } from '../../core/base';
import { Card, Row, Col } from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  MinusOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ProjectOutlined,
  UserOutlined,
  SettingOutlined,
  DashboardOutlined,
  BarChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';

export interface StatsGadgetConfig extends Omit<GadgetConfig, 'layout'> {
  title?: string;
  maxItems?: number;
  layout?: 'grid' | 'horizontal';
  showTrends?: boolean;
  showIcons?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export interface StatItem {
  id: string;
  title: string;
  value: string | number;
  description?: string;
  icon?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'stable';
  };
  color?: string;
}

export class StatsGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'stats-gadget',
    name: 'Stats Gadget',
    version: '2.0.0',
    description: 'Display multiple statistics in a grid layout with automatic data fetching',
    author: 'Gadget Library',
    tags: ['stats', 'metrics', 'kpi', 'gadget'],
    category: 'dashboard',
    gadgetType: GadgetType.DASHBOARD,
    widgetTypes: ['stats-display'],
    dataFlow: {
      inputs: ['stats-data'],
      outputs: ['user-interactions'],
      transformations: ['data-formatting']
    },
    layout: {
      type: 'grid',
      responsive: true
    },
    interactions: {
      events: ['stats-click'],
      handlers: ['onStatsClick'],
      workflows: ['drill-down']
    }
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Stats gadget title',
        default: 'Statistics'
      },
      maxItems: {
        type: 'number',
        description: 'Maximum number of stats to display',
        default: 4
      },
      layout: {
        type: 'string',
        description: 'Layout type for stats',
        enum: ['grid', 'horizontal'],
        default: 'grid'
      },
      showTrends: {
        type: 'boolean',
        description: 'Whether to show trend indicators',
        default: true
      },
      showIcons: {
        type: 'boolean',
        description: 'Whether to show icons',
        default: true
      },
      size: {
        type: 'string',
        description: 'Size of the stats cards',
        enum: ['small', 'medium', 'large'],
        default: 'medium'
      }
    },
    required: [],
    widgetSchemas: {
      'stats-display': {
        type: 'object',
        properties: {
          data: { type: 'array' },
          showTrends: { type: 'boolean' },
          showIcons: { type: 'boolean' },
          size: { type: 'string' }
        }
      }
    }
  };

  validate(config: GadgetConfig): ValidationResult {
    const errors: string[] = [];
    
    // Validate base gadget config
    const baseValidation = this.validateGadgetConfig(config);
    if (!baseValidation.isValid) {
      errors.push(...baseValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getRequiredWidgets(): string[] {
    return ['stats-display'];
  }

  getWidgetLayout(): Record<string, any> {
    return {
      type: 'grid',
      responsive: true
    };
  }

  processDataFlow(data: any): any {
    return this.sanitizeData(data);
  }

  // Function to get icon component based on icon name
  private getIconComponent(iconName?: string) {
    if (!iconName) return null;
    
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      'TeamOutlined': TeamOutlined,
      'SafetyCertificateOutlined': SafetyCertificateOutlined,
      'CheckCircleOutlined': CheckCircleOutlined,
      'ProjectOutlined': ProjectOutlined,
      'UserOutlined': UserOutlined,
      'SettingOutlined': SettingOutlined,
      'DashboardOutlined': DashboardOutlined,
      'BarChartOutlined': BarChartOutlined,
      'PieChartOutlined': PieChartOutlined
    };
    
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent /> : null;
  }

  renderBody(props: any): React.ReactNode {
    const config = props as StatsGadgetConfig;
    const data = props.data || [];
console.log('StatsGadget renderBody - data:', data);

    // Ensure data is an array
    const statsData = Array.isArray(data) ? data : [];
    const maxItems = config.maxItems || 4;
    const showTrends = config.showTrends !== false;
    const showIcons = config.showIcons !== false;
    const size = config.size || 'medium';

    // Limit items based on maxItems
    const displayData = statsData.slice(0, maxItems);

    if (displayData.length === 0) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          color: '#666',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          margin: '16px'
        }}>
          <div style={{ fontSize: '16px', marginBottom: '8px' }}>No Data</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>0</div>
        </div>
      );
    }

    const getTrendIcon = (trend?: { direction: string }) => {
      if (!trend) return null;
      
      switch (trend.direction) {
        case 'up':
          return <ArrowUpOutlined style={{ color: '#52c41a' }} />;
        case 'down':
          return <ArrowDownOutlined style={{ color: '#ff4d4f' }} />;
        case 'stable':
          return <MinusOutlined style={{ color: '#666' }} />;
        default:
          return null;
      }
    };

    const getCardPadding = () => {
      switch (size) {
        case 'small':
          return '12px';
        case 'large':
          return '10px';
        default:
          return '16px';
      }
    };

    // Dynamic responsive grid based on number of items and container size
    const getResponsiveCols = (itemCount: number) => {
      // For narrow containers (like position 8), always use single column
      // This ensures cards get maximum width and text doesn't get truncated
      return { xs: 24, sm: 24, md: 24, lg: 24, xl: 24, xxl: 24 };
    };

    const responsiveCols = getResponsiveCols(displayData.length);

    const renderStatCard = (stat: StatItem, index: number) => (
      <Col 
        key={stat.id || index} 
        xs={responsiveCols.xs} 
        sm={responsiveCols.sm} 
        md={responsiveCols.md} 
        lg={responsiveCols.lg} 
        xl={responsiveCols.xl} 
        xxl={responsiveCols.xxl} 
        style={{ marginBottom: '12px' }}
      >
        <Card 
          style={{ 
            textAlign: 'center',
            border: '1px solid #f0f0f0',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            minHeight: '120px'
          }}
          bodyStyle={{ 
            padding: getCardPadding(),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Title Section */}
          <div style={{ 
            marginBottom: '12px',
            width: '100%'
          }}>
            {showIcons && stat.icon && (
              <div style={{ 
                fontSize: '18px', 
                marginBottom: '6px',
                color: '#666'
              }}>
                {this.getIconComponent(stat.icon)}
              </div>
            )}
            <div style={{ 
              fontSize: '14px', 
              color: '#666',
              fontWeight: '500',
              textAlign: 'center',
              wordBreak: 'break-word',
              lineHeight: '1.3',
              minHeight: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              whiteSpace: 'normal',
              overflowWrap: 'break-word',
              writingMode: 'horizontal-tb',
              textOrientation: 'mixed'
            }}>
              {stat.title}
            </div>
          </div>

          {/* Value Section */}
          <div style={{ 
            fontSize: size === 'large' ? '28px' : size === 'small' ? '20px' : '24px',
            fontWeight: 'bold',
            color: stat.color || '#1890ff',
            marginBottom: '8px',
            lineHeight: '1'
          }}>
            {stat.value}
          </div>

          {/* Trend Section */}
          {showTrends && stat.trend && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '4px',
              fontSize: '12px',
              marginBottom: '6px'
            }}>
              {getTrendIcon(stat.trend)}
              <span style={{ 
                color: stat.trend.direction === 'up' ? '#52c41a' : 
                       stat.trend.direction === 'down' ? '#ff4d4f' : '#666'
              }}>
                {stat.trend.value}
              </span>
            </div>
          )}

          {/* Description Section */}
          {stat.description && (
            <div style={{ 
              fontSize: '12px', 
              color: '#999', 
              textAlign: 'center',
              wordBreak: 'break-word',
              lineHeight: '1.3',
              maxWidth: '100%',
              whiteSpace: 'normal',
              overflowWrap: 'break-word',
              writingMode: 'horizontal-tb',
              textOrientation: 'mixed'
            }}>
              {stat.description}
            </div>
          )}
        </Card>
      </Col>
    );

    return (
      <div style={{ padding: '12px' }}>
        {config.title && (
          <h3 style={{ 
            marginBottom: '12px', 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#262626'
          }}>
            {config.title}
          </h3>
        )}
        <Row gutter={[12, 12]} style={{ margin: 0 }}>
          {displayData.map(renderStatCard)}
        </Row>
      </div>
    );
  }

  onGadgetMount(): void {
}

  onGadgetUnmount(): void {
}

  onWidgetAdd(widget: any): void {
}

  onWidgetRemove(widgetId: string): void {
}

  onDataFlowChange(connections: Map<string, string[]>): void {
}
} 
