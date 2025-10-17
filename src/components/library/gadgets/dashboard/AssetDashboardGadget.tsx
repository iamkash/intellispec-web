/**
 * AssetDashboardGadget - Dynamic Asset Details Dashboard
 * 
 * A context-aware dashboard that displays detailed information, KPIs, and actions
 * for selected assets, asset groups, or sites. Adapts content based on the selected
 * node type and provides relevant metrics and quick actions.
 * 
 * Features:
 * - Context-aware content based on selected node
 * - Dynamic KPI cards with real-time data
 * - Quick action buttons for common operations
 * - Customizable sections and layouts
 * - Placeholder state when no selection
 * - Responsive design with grid layouts
 * 
 * Usage:
 * ```json
 * {
 *   "type": "asset-dashboard-gadget",
 *   "config": {
 *     "title": "Asset Details & KPIs",
 *     "showPlaceholder": true,
 *     "sections": [
 *       {
 *         "id": "basic-info",
 *         "title": "Basic Information", 
 *         "type": "info-cards",
 *         "columns": 2
 *       }
 *     ]
 *   }
 * }
 * ```
 */

import {
  BarChartOutlined,
  CalendarOutlined,
  DollarOutlined,
  EditOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  SelectOutlined,
  ToolOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Button, Card, Col, Descriptions, Empty, Row, Statistic, Tag } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { ValidationResult } from '../../core/base';
import { BaseGadget, GadgetConfig, GadgetMetadata, GadgetSchema, GadgetType } from '../base';

// Interfaces
interface AssetNode {
  id: string;
  name: string;
  nodeType: 'site' | 'asset_group' | 'asset';
  status?: string;
  description?: string;
  [key: string]: any;
}

interface DashboardSection {
  id: string;
  title: string;
  type: 'info-cards' | 'kpi-grid' | 'chart-grid' | 'action-buttons';
  columns: number;
}

interface AssetDashboardConfig {
  title?: string;
  showPlaceholder?: boolean;
  placeholderText?: string;
  placeholderIcon?: string;
  sections: DashboardSection[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Zod Schema
const AssetDashboardGadgetConfigSchema = z.object({
  id: z.string().min(1, 'Gadget ID is required'),
  type: z.literal('asset-dashboard-gadget'),
  title: z.string().optional().default('Asset Dashboard'),
  position: z.union([z.number(), z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    w: z.number().min(1),
    h: z.number().min(1)
  })]),
  config: z.object({
    title: z.string().optional().default('Asset Dashboard'),
    showPlaceholder: z.boolean().optional().default(true),
    placeholderText: z.string().optional().default('Select an item to view details'),
    placeholderIcon: z.string().optional().default('SelectOutlined'),
    autoRefresh: z.boolean().optional().default(true),
    refreshInterval: z.number().min(1000).optional().default(60000),
    sections: z.array(z.object({
      id: z.string(),
      title: z.string(),
      type: z.enum(['info-cards', 'kpi-grid', 'chart-grid', 'action-buttons']),
      columns: z.number().min(1).max(6)
    }))
  })
});

export const AssetDashboardGadgetSchema = AssetDashboardGadgetConfigSchema;

interface AssetDashboardGadgetProps {
  config: AssetDashboardConfig;
  context?: any;
  selectedNode?: AssetNode;
}

export class AssetDashboardGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'asset-dashboard-gadget',
    name: 'Asset Dashboard',
    description: 'Dynamic dashboard for displaying asset details, KPIs, and actions',
    version: '1.0.0',
    author: 'intelliSPEC Team',
    category: 'Dashboard',
    tags: ['asset', 'dashboard', 'kpi', 'details'],
    gadgetType: GadgetType.DASHBOARD,
    widgetTypes: [],
    dataFlow: {
      inputs: ['asset-data'],
      outputs: ['action-events'],
      transformations: ['node-details']
    },
    layout: {
      type: 'grid',
      responsive: true
    },
    interactions: {
      events: ['quick-action'],
      handlers: ['onQuickAction'],
      workflows: ['asset-management']
    }
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      showPlaceholder: { type: 'boolean' },
      sections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            type: { type: 'string' },
            columns: { type: 'number' }
          }
        }
      }
    },
    widgetSchemas: {}
  };

  validate(config: GadgetConfig): ValidationResult {
    const errors: string[] = [];
    
    try {
      AssetDashboardGadgetConfigSchema.parse({ ...config, type: 'asset-dashboard-gadget' });
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
    // Extract config from the new props structure
    const { config, context, ...otherProps } = props;
    
    // Pass props in the expected format
    return <AssetDashboardComponent config={config || props} context={context} {...otherProps} />;
  }
}

const AssetDashboardComponent: React.FC<AssetDashboardGadgetProps> = ({ config, context, selectedNode }) => {
  const [nodeData, setNodeData] = useState<AssetNode | null>(null);
  const [kpiData, setKpiData] = useState<Record<string, any>>({});
  const [, setLoading] = useState(false);

  // Load detailed node data and KPIs
  const loadNodeDetails = useCallback(async (node: AssetNode) => {
    if (!node) return;

    try {
      setLoading(true);
      // Load additional data based on node type
      const promises = [];

      if (node.nodeType === 'site') {
        // Load site-specific KPIs
        promises.push(
          BaseGadget.makeAuthenticatedFetch(`/api/documents/stats?type=asset_group&site_id=${node.id}`),
          BaseGadget.makeAuthenticatedFetch(`/api/documents/stats?type=asset&site_id=${node.id}`)
        );
      } else if (node.nodeType === 'asset_group') {
        // Load asset group-specific KPIs
        promises.push(
          BaseGadget.makeAuthenticatedFetch(`/api/documents/stats?type=asset&asset_group_id=${node.id}`)
        );
      } else if (node.nodeType === 'asset') {
        // Load asset-specific details
        promises.push(
          BaseGadget.makeAuthenticatedFetch(`/api/documents/${node.id}?type=asset`)
        );
      }

      const results = await Promise.all(promises);
      const data = await Promise.all(results.map(r => r.json()));

      const newKpiData: Record<string, any> = {};
      
      if (node.nodeType === 'site') {
        newKpiData.assetGroups = data[0]?.asset_group?.total || 0;
        newKpiData.totalAssets = data[1]?.asset?.total || 0;
        newKpiData.activeAssets = data[1]?.asset?.active || 0;
        newKpiData.inRepair = data[1]?.asset?.in_repair || 0;
      } else if (node.nodeType === 'asset_group') {
        newKpiData.totalAssets = data[0]?.asset?.total || 0;
        newKpiData.activeAssets = data[0]?.asset?.active || 0;
        newKpiData.inRepair = data[0]?.asset?.in_repair || 0;
      } else if (node.nodeType === 'asset') {
        newKpiData.assetDetails = data[0] || {};
      }

      setKpiData(newKpiData);

    } catch (error) {
      console.error('❌ Error loading node details:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update selected node when context changes
  useEffect(() => {
    // Listen for node selection events from context
    if (context?.eventBus) {
      const handleNodeSelect = (event: any) => {
        if (event.node) {
          setNodeData(event.node);
          loadNodeDetails(event.node);
        }
      };

      context.eventBus.on('nodeSelect', handleNodeSelect);
      return () => context.eventBus.off('nodeSelect', handleNodeSelect);
    }
  }, [context, loadNodeDetails]);

  // Render basic information section
  const renderBasicInfo = (section: DashboardSection) => {
    if (!nodeData) return null;

    const getStatusColor = (status?: string) => {
      const colorMap: Record<string, string> = {
        active: 'green',
        inactive: 'default',
        maintenance: 'orange',
        repair: 'red',
        under_construction: 'blue',
        missing: 'red',
        retired: 'default'
      };
      return colorMap[status || 'active'] || 'default';
    };

    return (
      <Card title={section.title} size="small" style={{ marginBottom: '16px' }}>
        <Descriptions column={section.columns} size="small">
          <Descriptions.Item label="Name">{nodeData.name}</Descriptions.Item>
          <Descriptions.Item label="Type">
            <Tag color="blue">{nodeData.nodeType.replace('_', ' ').toUpperCase()}</Tag>
          </Descriptions.Item>
          {nodeData.status && (
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(nodeData.status)}>
                {nodeData.status.replace('_', ' ').toUpperCase()}
              </Tag>
            </Descriptions.Item>
          )}
          {nodeData.description && (
            <Descriptions.Item label="Description" span={2}>
              {nodeData.description}
            </Descriptions.Item>
          )}
          {nodeData.nodeType === 'site' && (
            <>
              {nodeData.address && (
                <Descriptions.Item label="Address" span={2}>
                  <EnvironmentOutlined style={{ marginRight: '4px' }} />
                  {[
                    nodeData.address.street,
                    nodeData.address.city,
                    nodeData.address.state,
                    nodeData.address.zip
                  ].filter(Boolean).join(', ')}
                </Descriptions.Item>
              )}
              {nodeData.contact?.manager && (
                <Descriptions.Item label="Manager">
                  <UserOutlined style={{ marginRight: '4px' }} />
                  {nodeData.contact.manager}
                </Descriptions.Item>
              )}
            </>
          )}
          {nodeData.nodeType === 'asset' && (
            <>
              {nodeData.manufacturer && (
                <Descriptions.Item label="Manufacturer">{nodeData.manufacturer}</Descriptions.Item>
              )}
              {nodeData.model && (
                <Descriptions.Item label="Model">{nodeData.model}</Descriptions.Item>
              )}
              {nodeData.serial_number && (
                <Descriptions.Item label="Serial">{nodeData.serial_number}</Descriptions.Item>
              )}
              {nodeData.purchase_date && (
                <Descriptions.Item label="Purchase Date">
                  <CalendarOutlined style={{ marginRight: '4px' }} />
                  {new Date(nodeData.purchase_date).toLocaleDateString()}
                </Descriptions.Item>
              )}
              {nodeData.purchase_cost && (
                <Descriptions.Item label="Purchase Cost">
                  <DollarOutlined style={{ marginRight: '4px' }} />
                  ${nodeData.purchase_cost.toLocaleString()}
                </Descriptions.Item>
              )}
            </>
          )}
        </Descriptions>
      </Card>
    );
  };

  // Render KPI grid section
  const renderKpiGrid = (section: DashboardSection) => {
    if (!nodeData || Object.keys(kpiData).length === 0) return null;

    const kpis = [];

    if (nodeData.nodeType === 'site') {
      kpis.push(
        { title: 'Asset Groups', value: kpiData.assetGroups, icon: <BarChartOutlined />, color: '#1890ff' },
        { title: 'Total Assets', value: kpiData.totalAssets, icon: <InfoCircleOutlined />, color: '#52c41a' },
        { title: 'Active Assets', value: kpiData.activeAssets, icon: <InfoCircleOutlined />, color: '#52c41a' },
        { title: 'In Repair', value: kpiData.inRepair, icon: <ToolOutlined />, color: '#fa8c16' }
      );
    } else if (nodeData.nodeType === 'asset_group') {
      kpis.push(
        { title: 'Total Assets', value: kpiData.totalAssets, icon: <InfoCircleOutlined />, color: '#52c41a' },
        { title: 'Active Assets', value: kpiData.activeAssets, icon: <InfoCircleOutlined />, color: '#52c41a' },
        { title: 'In Repair', value: kpiData.inRepair, icon: <ToolOutlined />, color: '#fa8c16' }
      );
    }

    return (
      <Card title={section.title} size="small" style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          {kpis.map((kpi, index) => (
            <Col key={index} span={24 / section.columns}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic
                  title={kpi.title}
                  value={kpi.value}
                  prefix={kpi.icon}
                  valueStyle={{ color: kpi.color }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  // Render quick actions section
  const renderQuickActions = (section: DashboardSection) => {
    if (!nodeData) return null;

    const getActionsForNodeType = (nodeType: string) => {
      const commonActions = [
        { key: 'view', label: 'View Details', icon: <EyeOutlined />, type: 'default' },
        { key: 'edit', label: 'Edit', icon: <EditOutlined />, type: 'primary' }
      ];

      if (nodeType === 'site') {
        return [
          ...commonActions,
          { key: 'add_group', label: 'Add Asset Group', icon: <BarChartOutlined />, type: 'default' }
        ];
      } else if (nodeType === 'asset_group') {
        return [
          ...commonActions,
          { key: 'add_asset', label: 'Add Asset', icon: <InfoCircleOutlined />, type: 'default' }
        ];
      } else if (nodeType === 'asset') {
        return [
          ...commonActions,
          { key: 'maintenance', label: 'Schedule Maintenance', icon: <ToolOutlined />, type: 'default' }
        ];
      }

      return commonActions;
    };

    const actions = getActionsForNodeType(nodeData.nodeType);

    return (
      <Card title={section.title} size="small" style={{ marginBottom: '16px' }}>
        <Row gutter={[8, 8]}>
          {actions.map((action, index) => (
            <Col key={action.key} span={24 / section.columns}>
              <Button
                type={action.type as any}
                icon={action.icon}
                block
                onClick={() => {
if (context?.onAction) {
                    context.onAction('quickAction', {
                      action: action.key,
                      node: nodeData,
                      nodeType: nodeData.nodeType
                    });
                  }
                }}
              >
                {action.label}
              </Button>
            </Col>
          ))}
        </Row>
      </Card>
    );
  };

  // Render section based on type
  const renderSection = (section: DashboardSection) => {
    switch (section.type) {
      case 'info-cards':
        return renderBasicInfo(section);
      case 'kpi-grid':
        return renderKpiGrid(section);
      case 'action-buttons':
        return renderQuickActions(section);
      case 'chart-grid':
        return (
          <Card title={section.title} size="small" style={{ marginBottom: '16px' }}>
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              Charts coming soon...
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  // Show placeholder when no node is selected
  if (!nodeData && config.showPlaceholder) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '40px'
      }}>
        <Empty
          image={<SelectOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />}
          description={
            <span style={{ color: '#666', fontSize: '16px' }}>
              {config.placeholderText}
            </span>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>{config.title}</h3>
        {nodeData && (
          <Tag color="blue">{nodeData.nodeType.replace('_', ' ').toUpperCase()}</Tag>
        )}
      </div>

      {config.sections.map(section => (
        <div key={section.id}>
          {renderSection(section)}
        </div>
      ))}
    </div>
  );
};

export default AssetDashboardGadget;
