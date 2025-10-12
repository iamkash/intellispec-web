/**
 * StatsGridGadget - Statistics Grid Display Component
 * 
 * A flexible statistics display gadget that renders KPI cards in a grid layout.
 * Supports real-time data updates, custom formatting, colors, and icons.
 * 
 * Features:
 * - Grid layout with configurable columns
 * - Real-time data fetching and updates
 * - Custom icons and colors for each stat
 * - Multiple data formats (number, currency, percentage)
 * - Auto-refresh capabilities
 * - Responsive design
 * 
 * Usage:
 * ```json
 * {
 *   "type": "stats-grid-gadget",
 *   "config": {
 *     "layout": "horizontal",
 *     "cardSize": "small",
 *     "stats": [
 *       {
 *         "id": "total-sites",
 *         "title": "Total Sites",
 *         "dataUrl": "/api/documents/stats?type=site",
 *         "dataPath": "site.total",
 *         "icon": "ApartmentOutlined",
 *         "color": "blue",
 *         "format": "number"
 *       }
 *     ]
 *   }
 * }
 * ```
 */

import {
  ApartmentOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  ExclamationCircleOutlined,
  FallOutlined,
  RiseOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { Alert, Card, Col, Row, Spin, Statistic } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { ValidationResult } from '../../core/base';
import { BaseGadget, GadgetConfig, GadgetMetadata, GadgetSchema, GadgetType } from '../base';

// Icon mapping for dynamic icons
const ICON_MAP: Record<string, React.ComponentType> = {
  ApartmentOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  ToolOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  FallOutlined
};

// Color mapping
const COLOR_MAP: Record<string, string> = {
  blue: '#1890ff',
  green: '#52c41a',
  red: '#ff4d4f',
  orange: '#fa8c16',
  purple: '#722ed1',
  cyan: '#13c2c2',
  gold: '#faad14',
  lime: '#a0d911'
};

// Interfaces
interface StatConfig {
  id: string;
  title: string;
  dataUrl: string;
  dataPath: string;
  icon?: string;
  color?: string;
  format?: 'number' | 'currency' | 'percentage';
  suffix?: string;
  prefix?: string;
  trend?: {
    enabled: boolean;
    dataPath?: string;
    showIcon?: boolean;
  };
}

interface StatsGridConfig {
  layout?: 'horizontal' | 'vertical' | 'grid';
  columns?: number;
  cardSize?: 'small' | 'medium' | 'large';
  showIcons?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  stats: StatConfig[];
}

// Zod Schema
const StatsGridGadgetConfigSchema = z.object({
  id: z.string().min(1, 'Gadget ID is required'),
  type: z.literal('stats-grid-gadget'),
  title: z.string().optional().default('Statistics'),
  position: z.union([z.number(), z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    w: z.number().min(1),
    h: z.number().min(1)
  })]),
  config: z.object({
    layout: z.enum(['horizontal', 'vertical', 'grid']).optional().default('horizontal'),
    columns: z.number().min(1).max(8).optional().default(4),
    cardSize: z.enum(['small', 'medium', 'large']).optional().default('medium'),
    showIcons: z.boolean().optional().default(true),
    autoRefresh: z.boolean().optional().default(true),
    refreshInterval: z.number().min(1000).optional().default(300000),
    stats: z.array(z.object({
      id: z.string(),
      title: z.string(),
      dataUrl: z.string().url(),
      dataPath: z.string(),
      icon: z.string().optional(),
      color: z.string().optional(),
      format: z.enum(['number', 'currency', 'percentage']).optional().default('number'),
      suffix: z.string().optional(),
      prefix: z.string().optional(),
      trend: z.object({
        enabled: z.boolean(),
        dataPath: z.string().optional(),
        showIcon: z.boolean().optional().default(true)
      }).optional()
    })).min(1, 'At least one stat is required')
  })
});

export const StatsGridGadgetSchema = StatsGridGadgetConfigSchema;

interface StatsGridGadgetProps {
  config: StatsGridConfig;
  context?: any;
}

interface StatData {
  value: number | string;
  trend?: number;
  loading: boolean;
  error?: string;
}

export class StatsGridGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'stats-grid-gadget',
    name: 'Statistics Grid',
    description: 'Grid layout for displaying key performance indicators and statistics',
    version: '1.0.0',
    author: 'intelliSPEC Team',
    category: 'Dashboard',
    tags: ['stats', 'kpi', 'grid', 'dashboard'],
    gadgetType: GadgetType.DASHBOARD,
    widgetTypes: [],
    dataFlow: {
      inputs: ['stats-data'],
      outputs: ['kpi-events'],
      transformations: ['data-formatting']
    },
    layout: {
      type: 'grid',
      responsive: true
    },
    interactions: {
      events: ['stat-click'],
      handlers: ['onStatClick'],
      workflows: ['analytics']
    }
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      layout: { type: 'string', enum: ['horizontal', 'vertical', 'grid'] },
      columns: { type: 'number' },
      cardSize: { type: 'string', enum: ['small', 'medium', 'large'] },
      stats: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            dataUrl: { type: 'string' },
            dataPath: { type: 'string' }
          }
        }
      }
    },
    widgetSchemas: {}
  };

  validate(config: GadgetConfig): ValidationResult {
    const errors: string[] = [];
    
    try {
      StatsGridGadgetConfigSchema.parse({ ...config, type: 'stats-grid-gadget' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(err => `${err.path.join('.')}: ${err.message}`));
      } else {
        errors.push(`Validation error: ${error}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getRequiredWidgets(): string[] {
    return [];
  }

  getWidgetLayout(): Record<string, any> {
    return {
      type: 'grid',
      responsive: true
    };
  }

  processDataFlow(data: any): any {
    return data;
  }

  renderBody(props: any): React.ReactElement {
    return <StatsGridComponent {...props} />;
  }
}

const StatsGridComponent: React.FC<StatsGridGadgetProps> = ({ config, context }) => {
  const [statsData, setStatsData] = useState<Record<string, StatData>>({});
  const [globalLoading, setGlobalLoading] = useState(true);

  // Initialize stats data
  useEffect(() => {
    const initialData: Record<string, StatData> = {};
    config.stats.forEach(stat => {
      initialData[stat.id] = {
        value: 0,
        loading: true,
        error: undefined
      };
    });
    setStatsData(initialData);
  }, [config.stats]);

  // Fetch stat data
  const fetchStatData = useCallback(async (stat: StatConfig) => {
    try {
const response = await BaseGadget.makeAuthenticatedFetch(stat.dataUrl);
      const data = await response.json();
      
      // Extract value using data path
      const value = getNestedValue(data, stat.dataPath);
      const trendValue = stat.trend?.dataPath ? getNestedValue(data, stat.trend.dataPath) : undefined;
setStatsData(prev => ({
        ...prev,
        [stat.id]: {
          value: value ?? 0,
          trend: trendValue,
          loading: false,
          error: undefined
        }
      }));
      
    } catch (error) {
      console.error(`❌ Error fetching stat ${stat.id}:`, error);
      setStatsData(prev => ({
        ...prev,
        [stat.id]: {
          value: 0,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load data'
        }
      }));
    }
  }, []);

  // Get nested value from object using dot notation
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Load all stats data
  const loadAllStats = useCallback(async () => {
    setGlobalLoading(true);
    
    // Load all stats in parallel
    await Promise.all(
      config.stats.map(stat => fetchStatData(stat))
    );
    
    setGlobalLoading(false);
  }, [config.stats, fetchStatData]);

  // Auto-refresh setup
  useEffect(() => {
    loadAllStats();
    
    if (config.autoRefresh && config.refreshInterval) {
      const interval = setInterval(loadAllStats, config.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [loadAllStats, config.autoRefresh, config.refreshInterval]);

  // Format value based on format type
  const formatValue = (value: number | string, stat: StatConfig): string | number => {
    if (typeof value === 'string') return value;
    
    switch (stat.format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  // Get column span based on layout and stats count
  const getColumnSpan = () => {
    if (config.layout === 'horizontal') {
      return 24 / Math.min(config.stats.length, 6);
    }
    if (config.layout === 'grid') {
      return 24 / (config.columns || 4);
    }
    return 24; // vertical
  };

  // Render single stat card
  const renderStatCard = (stat: StatConfig) => {
    const data = statsData[stat.id];
    const IconComponent = stat.icon ? ICON_MAP[stat.icon] : undefined;
    const color = stat.color ? COLOR_MAP[stat.color] || stat.color : COLOR_MAP.blue;
    
    const cardHeight = {
      small: 80,
      medium: 100,
      large: 120
    }[config.cardSize || 'medium'];

    return (
      <Col 
        key={stat.id} 
        span={getColumnSpan()}
        style={{ marginBottom: config.layout === 'vertical' ? '16px' : '0' }}
      >
        <Card
          size="small"
          style={{ 
            height: cardHeight,
            textAlign: 'center'
          }}
          bodyStyle={{ 
            padding: '12px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          {data?.loading ? (
            <Spin size="small" />
          ) : data?.error ? (
            <Alert 
              message="Error" 
              description={data.error}
              type="error" 
              showIcon
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {config.showIcons && IconComponent && (
                <span style={{ color, fontSize: '20px' }}>
                  {React.createElement(IconComponent)}
                </span>
              )}
              <div>
                <Statistic
                  title={stat.title}
                  value={formatValue(data?.value || 0, stat)}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  valueStyle={{ 
                    fontSize: config.cardSize === 'small' ? '16px' : '20px',
                    color 
                  }}
                />
                {stat.trend?.enabled && data?.trend !== undefined && (
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>
                    {stat.trend.showIcon && (
                      data.trend > 0 ? 
                        <RiseOutlined style={{ color: '#52c41a', marginRight: '4px' }} /> :
                        <FallOutlined style={{ color: '#ff4d4f', marginRight: '4px' }} />
                    )}
                    <span style={{ color: data.trend > 0 ? '#52c41a' : '#ff4d4f' }}>
                      {data.trend > 0 ? '+' : ''}{data.trend}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </Col>
    );
  };

  if (globalLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <Row gutter={[16, 16]}>
        {config.stats.map(renderStatCard)}
      </Row>
    </div>
  );
};

export default StatsGridGadget;
