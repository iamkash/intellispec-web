/**
 * ResourceTreeGadget - Hierarchical Resource Tree Component
 * 
 * A flexible, metadata-driven tree component for displaying hierarchical data structures
 * like company → site → asset group → asset. Supports multi-level nesting, drag-drop,
 * context menus, and real-time updates.
 * 
 * Features:
 * - Multi-level hierarchical data display
 * - Drag and drop for reorganization
 * - Context menus with custom actions
 * - Search and filtering capabilities
 * - Real-time data updates
 * - Customizable node types and icons
 * - Tenant-aware data isolation
 * 
 * Usage:
 * ```json
 * {
 *   "type": "resource-tree-gadget",
 *   "config": {
 *     "title": "Company Assets",
 *     "rootLabel": "Company",
 *     "treeData": {
 *       "dataUrl": "/api/documents",
 *       "endpoints": {
 *         "sites": "?type=site",
 *         "assetGroups": "?type=asset_group", 
 *         "assets": "?type=asset"
 *       }
 *     },
 *     "nodeTypes": [
 *       {
 *         "type": "site",
 *         "icon": "ApartmentOutlined",
 *         "color": "#1890ff",
 *         "actions": ["view", "edit", "add_group", "delete"]
 *       }
 *     ]
 *   }
 * }
 * ```
 */

import {
    ApartmentOutlined,
    AppstoreAddOutlined,
    AppstoreOutlined,
    BankOutlined,
    BuildOutlined,
    CarOutlined,
    DatabaseOutlined,
    DeleteOutlined,
    EditOutlined,
    EyeOutlined,
    HomeOutlined,
    LaptopOutlined,
    MoreOutlined,
    PlusCircleOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    ToolOutlined,
    UndoOutlined
} from '@ant-design/icons';
import { Button, Dropdown, Input, Space, Tooltip, Tree, message } from 'antd';
import type { MenuProps } from 'antd/es/menu';
import type { DataNode as AntDataNode } from 'antd/es/tree';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { ValidationResult } from '../../core/base';
import { BaseGadget, GadgetConfig, GadgetMetadata, GadgetSchema, GadgetType } from '../base';

// Extended DataNode to include custom data
interface DataNode extends AntDataNode {
  data?: any;
}

// Icon mapping for dynamic icons
const ICON_MAP: Record<string, React.ComponentType> = {
  ApartmentOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  BuildOutlined,
  ToolOutlined,
  CarOutlined,
  LaptopOutlined,
  HomeOutlined,
  BankOutlined,
  PlusCircleOutlined,
  AppstoreAddOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UndoOutlined,
  MoreOutlined,
};

// Interfaces
interface ResourceNode {
  id: string;
  name: string;
  type: string;
  parent_id?: string;
  site_id?: string;
  asset_group_id?: string;
  status?: string;
  deleted?: boolean;
  children?: ResourceNode[];
  [key: string]: any;
}

interface NodeType {
  type: string;
  icon: string;
  color: string;
  actions: string[];
}

interface ContextMenuItem {
  key: string;
  label: string;
  icon: string;
  danger?: boolean;
  showForDeleted?: boolean;
}

interface TreeDataConfig {
  dataUrl: string;
  endpoints: {
    companies?: string;
    sites: string;
    assetGroups: string;
    assets: string;
  };
}

interface ResourceTreeConfig {
  title?: string;
  rootLabel?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  allowDragDrop?: boolean;
  showIcons?: boolean;
  expandOnSelect?: boolean;
  multiSelect?: boolean;
  treeData: TreeDataConfig;
  nodeTypes: NodeType[];
  contextMenu?: {
    enabled: boolean;
    items: ContextMenuItem[];
  };
  showDeleted?: boolean;
}

// Zod Schema
const ResourceTreeGadgetConfigSchema = z.object({
  id: z.string().min(1, 'Gadget ID is required'),
  type: z.literal('resource-tree-gadget'),
  title: z.string().optional().default('Resource Tree'),
  position: z.union([z.number(), z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    w: z.number().min(1),
    h: z.number().min(1)
  })]),
  config: z.object({
    title: z.string().optional().default('Resource Tree'),
    rootLabel: z.string().optional().default('Root'),
    showSearch: z.boolean().optional().default(true),
    searchPlaceholder: z.string().optional().default('Search...'),
    allowDragDrop: z.boolean().optional().default(false),
    showIcons: z.boolean().optional().default(true),
    expandOnSelect: z.boolean().optional().default(true),
    multiSelect: z.boolean().optional().default(false),
    showDeleted: z.boolean().optional().default(false),
    treeData: z.object({
      dataUrl: z.string().url('Invalid data URL'),
      endpoints: z.object({
        sites: z.string(),
        assetGroups: z.string(),
        assets: z.string()
      })
    }),
    nodeTypes: z.array(z.object({
      type: z.string(),
      icon: z.string(),
      color: z.string(),
      actions: z.array(z.string())
    })),
    contextMenu: z.object({
      enabled: z.boolean(),
      items: z.array(z.object({
        key: z.string(),
        label: z.string(),
        icon: z.string(),
        danger: z.boolean().optional(),
        showForDeleted: z.boolean().optional()
      }))
    }).optional()
  })
});

export const ResourceTreeGadgetSchema = ResourceTreeGadgetConfigSchema;

interface ResourceTreeGadgetProps {
  config: ResourceTreeConfig;
  context?: any;
}

export class ResourceTreeGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'resource-tree-gadget',
    name: 'Resource Tree',
    description: 'Hierarchical tree view for managing resources like sites, asset groups, and assets',
    version: '1.0.0',
    author: 'intelliSPEC Team',
    category: 'Display',
    tags: ['tree', 'hierarchy', 'assets', 'management'],
    gadgetType: GadgetType.DISPLAY,
    widgetTypes: [],
    dataFlow: {
      inputs: ['tree-data'],
      outputs: ['node-selection'],
      transformations: ['hierarchy-build']
    },
    layout: {
      type: 'grid',
      responsive: true
    },
    interactions: {
      events: ['node-select', 'context-menu'],
      handlers: ['onNodeSelect', 'onContextAction'],
      workflows: ['asset-management']
    }
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      rootLabel: { type: 'string' },
      showSearch: { type: 'boolean' },
      allowDragDrop: { type: 'boolean' },
      treeData: {
        type: 'object',
        properties: {
          dataUrl: { type: 'string' },
          endpoints: { type: 'object' }
        }
      }
    },
    widgetSchemas: {}
  };

  validate(config: GadgetConfig): ValidationResult {
    const errors: string[] = [];
    
    try {
      ResourceTreeGadgetConfigSchema.parse({ ...config, type: 'resource-tree-gadget' });
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
    return <ResourceTreeComponent config={config || props} context={context} {...otherProps} />;
  }
}

const ResourceTreeComponent: React.FC<ResourceTreeGadgetProps> = ({ config, context }) => {
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextNode, setContextNode] = useState<any>(null);

  // ✅ LAZY LOADING: Load only root nodes (companies) initially
  const loadRootNodes = useCallback(async () => {
    if (!config.treeData?.dataUrl) return;

    try {
      setLoading(true);
      console.log('🌳 Loading root nodes (companies only)...');

      // ✅ ONLY load companies on initial render
      const response = await BaseGadget.makeAuthenticatedFetch(
        `${config.treeData.dataUrl}${config.treeData.endpoints.companies}${config.showDeleted ? '&deleted=all' : ''}`
      );

      const companies = await response.json();
      const nodeTypeMap = new Map((config.nodeTypes || []).map(nt => [nt.type, nt]));

      // ✅ Create company nodes WITHOUT children (lazy loading)
      const companyNodes: DataNode[] = (companies.data || []).map((company: ResourceNode) => ({
        key: `company-${company.id}`,
        title: renderNodeTitle(company, nodeTypeMap.get('company')),
        isLeaf: false,
        data: { ...company, nodeType: 'company' },
        children: undefined // ✅ undefined = not loaded yet (triggers loadData)
      }));

      setTreeData(companyNodes);
      console.log(`✅ Loaded ${companyNodes.length} companies`);

    } catch (error) {
      console.error('❌ Error loading root nodes:', error);
      message.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, [config.treeData, config.nodeTypes, config.showDeleted]);

  // ✅ LAZY LOADING: Load child nodes on expand
  const loadChildNodes = useCallback(async (node: DataNode): Promise<DataNode[]> => {
    const nodeData = node.data as ResourceNode;
    const nodeType = nodeData.nodeType;
    const nodeTypeMap = new Map((config.nodeTypes || []).map(nt => [nt.type, nt]));

    console.log(`🔍 Loading children for ${nodeType}: ${nodeData.name || nodeData.id}`);

    try {
      let endpoint = '';
      let childNodeType = '';
      let childrenData: ResourceNode[] = [];

      // ✅ Determine what to load based on parent type
      if (nodeType === 'company') {
        // Load sites for this company
        endpoint = `${config.treeData.dataUrl}?type=site&company_id=${nodeData.id}${config.showDeleted ? '&deleted=all' : ''}`;
        childNodeType = 'site';
      } else if (nodeType === 'site') {
        // Load asset groups for this site
        endpoint = `${config.treeData.dataUrl}?type=asset_group&site_id=${nodeData.id}${config.showDeleted ? '&deleted=all' : ''}`;
        childNodeType = 'asset_group';
      } else if (nodeType === 'asset_group') {
        // Load assets for this group
        endpoint = `${config.treeData.dataUrl}?type=asset&asset_group_id=${nodeData.id}${config.showDeleted ? '&deleted=all' : ''}`;
        childNodeType = 'asset';
      } else {
        // Leaf node (asset) - no children
        return [];
      }

      // ✅ Fetch children
      const response = await BaseGadget.makeAuthenticatedFetch(endpoint);
      const result = await response.json();
      childrenData = result.data || [];

      console.log(`✅ Loaded ${childrenData.length} ${childNodeType}s for ${nodeData.name || nodeData.id}`);

      // ✅ Build child nodes
      const isLeafType = childNodeType === 'asset';
      const childNodes: DataNode[] = childrenData.map((child: ResourceNode) => ({
        key: `${childNodeType}-${child.id}`,
        title: renderNodeTitle(child, nodeTypeMap.get(childNodeType)),
        isLeaf: isLeafType,
        data: { ...child, nodeType: childNodeType },
        children: isLeafType ? undefined : undefined // undefined = lazy load on expand
      }));

      return childNodes;

    } catch (error) {
      console.error(`❌ Error loading children for ${nodeType}:`, error);
      message.error(`Failed to load ${nodeType} children`);
      return [];
    }
  }, [config.treeData, config.nodeTypes, config.showDeleted]);

  // Build tree structure from flat data
  const buildTreeStructure = (
    companies: ResourceNode[],
    sites: ResourceNode[],
    groups: ResourceNode[],
    assets: ResourceNode[],
    nodeTypes: NodeType[]
  ): DataNode[] => {
    const nodeTypeMap = new Map(nodeTypes.map(nt => [nt.type, nt]));
    
    // If no companies, start with sites as top level (backward compatibility)
    if (!companies || companies.length === 0) {
      const siteNodes: DataNode[] = sites.map(site => ({
        key: `site-${site.id}`,
        title: renderNodeTitle(site, nodeTypeMap.get('site')),
        isLeaf: false,
        data: { ...site, nodeType: 'site' },
        children: []
      }));

      // Add asset groups to sites
      groups.forEach(group => {
        const siteNode = siteNodes.find(node => 
          (node as any).data?.id === group.site_id
        );
        
        if (siteNode) {
          const groupNode: DataNode = {
            key: `group-${group.id}`,
            title: renderNodeTitle(group, nodeTypeMap.get('asset_group')),
            isLeaf: false,
            data: { ...group, nodeType: 'asset_group' },
            children: []
          };
          
          if (!siteNode.children) siteNode.children = [];
          siteNode.children.push(groupNode);
        }
      });

      // Add assets to groups
      assets.forEach(asset => {
        for (const siteNode of siteNodes) {
          if (siteNode.children) {
            const groupNode = siteNode.children.find(node => 
              (node as any).data?.id === asset.asset_group_id
            );
            
            if (groupNode) {
              const assetNode: DataNode = {
                key: `asset-${asset.id}`,
                title: renderNodeTitle(asset, nodeTypeMap.get('asset')),
                isLeaf: true,
                data: { ...asset, nodeType: 'asset' }
              };
              
              if (!groupNode.children) groupNode.children = [];
              groupNode.children.push(assetNode);
              break;
            }
          }
        }
      });

      return siteNodes;
    }
    
    // Build full hierarchy: companies → sites → asset groups → assets
    const companyNodes: DataNode[] = companies.map(company => ({
      key: `company-${company.id}`,
      title: renderNodeTitle(company, nodeTypeMap.get('company')),
      isLeaf: false,
      data: { ...company, nodeType: 'company' },
      children: []
    }));

    // Add sites to companies
    sites.forEach(site => {
      const companyNode = companyNodes.find(node => 
        (node as any).data?.id === site.company_id
      );
      
      if (companyNode) {
        const siteNode: DataNode = {
          key: `site-${site.id}`,
          title: renderNodeTitle(site, nodeTypeMap.get('site')),
          isLeaf: false,
          data: { ...site, nodeType: 'site' },
          children: []
        };
        
        if (!companyNode.children) companyNode.children = [];
        companyNode.children.push(siteNode);
      }
    });

    // Add asset groups to sites
    groups.forEach(group => {
      for (const companyNode of companyNodes) {
        if (companyNode.children) {
          const siteNode = companyNode.children.find(node => 
            (node as any).data?.id === group.site_id
          );
          
          if (siteNode) {
            const groupNode: DataNode = {
              key: `group-${group.id}`,
              title: renderNodeTitle(group, nodeTypeMap.get('asset_group')),
              isLeaf: false,
              data: { ...group, nodeType: 'asset_group' },
              children: []
            };
            
            if (!siteNode.children) siteNode.children = [];
            siteNode.children.push(groupNode);
            break;
          }
        }
      }
    });

    // Add assets to groups
    assets.forEach(asset => {
      for (const companyNode of companyNodes) {
        if (companyNode.children) {
          for (const siteNode of companyNode.children) {
            if (siteNode.children) {
              const groupNode = siteNode.children.find(node => 
                (node as any).data?.id === asset.asset_group_id
              );
              
              if (groupNode) {
                const assetNode: DataNode = {
                  key: `asset-${asset.id}`,
                  title: renderNodeTitle(asset, nodeTypeMap.get('asset')),
                  isLeaf: true,
                  data: { ...asset, nodeType: 'asset' }
                };
                
                if (!groupNode.children) groupNode.children = [];
                groupNode.children.push(assetNode);
                break;
              }
            }
          }
        }
      }
    });

    return companyNodes;
  };

  // Render node title with icon, styling, and inline action buttons
  const renderNodeTitle = (node: ResourceNode, nodeType?: NodeType) => {
    const IconComponent = nodeType?.icon ? ICON_MAP[nodeType.icon] : null;
    const isDeleted = node.deleted;

    // Create action buttons based on node type
    const createActionButtons = (nodeData: ResourceNode, nodeTypeName: string) => {
      const buttons = [];
      
      // Edit button (always available)
      buttons.push(
        <Tooltip key="edit" title={`Edit ${nodeTypeName}`}>
          <Button 
            type="text" 
            size="small"
            icon={<EditOutlined />} 
            onClick={(e) => {
              e.stopPropagation();
              if (context?.onAction) {
                context.onAction('contextAction', {
                  action: 'edit',
                  node: { ...nodeData, nodeType: nodeTypeName }
                });
              }
            }}
            style={{ padding: '2px 4px', height: '20px' }}
          />
        </Tooltip>
      );
      
      // Delete/Restore button
      if (isDeleted) {
        buttons.push(
          <Tooltip key="restore" title={`Restore ${nodeTypeName}`}>
            <Button 
              type="text" 
              size="small"
              icon={<UndoOutlined />} 
              onClick={(e) => {
                e.stopPropagation();
                if (context?.onAction) {
                  context.onAction('contextAction', {
                    action: 'restore',
                    node: { ...nodeData, nodeType: nodeTypeName }
                  });
                }
              }}
              style={{ padding: '2px 4px', height: '20px', color: '#52c41a' }}
            />
          </Tooltip>
        );
      } else {
        buttons.push(
          <Tooltip key="delete" title={`Delete ${nodeTypeName}`}>
            <Button 
              type="text" 
              size="small"
              icon={<DeleteOutlined />} 
              onClick={(e) => {
                e.stopPropagation();
                if (context?.onAction) {
                  context.onAction('contextAction', {
                    action: 'delete',
                    node: { ...nodeData, nodeType: nodeTypeName }
                  });
                }
              }}
              style={{ padding: '2px 4px', height: '20px', color: '#ff4d4f' }}
              danger
            />
          </Tooltip>
        );
      }
      
      // Add child buttons based on node type
      if (nodeTypeName === 'company') {
        buttons.push(
          <Tooltip key="add-site" title="Add Site">
            <Button 
              type="text" 
              size="small"
              icon={<PlusCircleOutlined />} 
              onClick={(e) => {
                e.stopPropagation();
                if (context?.onAction) {
                  context.onAction('contextAction', {
                    action: 'add_site',
                    node: { ...nodeData, nodeType: 'company' }
                  });
                }
              }}
              style={{ padding: '2px 4px', height: '20px', color: '#1890ff' }}
            />
          </Tooltip>
        );
      } else if (nodeTypeName === 'site') {
        buttons.push(
          <Tooltip key="add-group" title="Add Asset Group">
            <Button 
              type="text" 
              size="small"
              icon={<AppstoreAddOutlined />} 
              onClick={(e) => {
                e.stopPropagation();
                if (context?.onAction) {
                  context.onAction('contextAction', {
                    action: 'add_group',
                    node: { ...nodeData, nodeType: 'site' }
                  });
                }
              }}
              style={{ padding: '2px 4px', height: '20px', color: '#52c41a' }}
            />
          </Tooltip>
        );
      } else if (nodeTypeName === 'asset_group') {
        buttons.push(
          <Tooltip key="add-asset" title="Add Asset">
            <Button 
              type="text" 
              size="small"
              icon={<PlusOutlined />} 
              onClick={(e) => {
                e.stopPropagation();
                if (context?.onAction) {
                  context.onAction('contextAction', {
                    action: 'add_asset',
                    node: { ...nodeData, nodeType: 'asset_group' }
                  });
                }
              }}
              style={{ padding: '2px 4px', height: '20px', color: '#722ed1' }}
            />
          </Tooltip>
        );
      }
      
      return (
        <Space size={2} style={{ marginLeft: 8 }}>
          {buttons}
        </Space>
      );
    };

    return (
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          width: '100%',
          opacity: isDeleted ? 0.6 : 1,
          textDecoration: isDeleted ? 'line-through' : 'none'
        }}
        onContextMenu={(e) => handleContextMenu(e, node)}
      >
        <Space size="small">
          {config.showIcons && IconComponent && (
            <span style={{ color: nodeType?.color || '#1890ff', fontSize: '14px' }}>
              {React.createElement(IconComponent)}
            </span>
          )}
          <span>{node.name}</span>
          {isDeleted && <span style={{ color: '#ff4d4f', fontSize: '12px' }}>(Deleted)</span>}
          {node.status && node.status !== 'active' && (
            <span style={{ 
              color: getStatusColor(node.status), 
              fontSize: '12px' 
            }}>
              ({node.status})
            </span>
          )}
        </Space>
        
        {/* Action buttons - only show on hover */}
        <div className="tree-node-actions" style={{ opacity: 0, transition: 'opacity 0.2s' }}>
          {createActionButtons(node, node.nodeType || nodeType?.type || 'item')}
        </div>
      </div>
    );
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      inactive: '#d9d9d9',
      maintenance: '#faad14',
      repair: '#ff7a45',
      under_construction: '#52c41a',
      missing: '#ff4d4f',
      retired: '#8c8c8c'
    };
    return colorMap[status] || '#1890ff';
  };

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent, node: ResourceNode) => {
    if (!config.contextMenu?.enabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setContextNode(node);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuVisible(true);
  };

  // Handle context menu click
  const handleContextMenuClick = (menuItem: ContextMenuItem) => {
    
    // Emit action to parent context
    if (context?.onAction) {
      context.onAction('contextAction', {
        action: menuItem.key,
        node: contextNode,
        nodeType: contextNode?.nodeType
      });
    } else {
      console.error('❌ No context.onAction available for context menu');
    }
    
    setContextMenuVisible(false);
    setContextNode(null);
  };


  // ✅ BACKEND SEARCH: Search across hierarchy with auto-expand
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Perform search on backend
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      console.log(`🔍 Searching hierarchy for: "${query}"`);

      const response = await BaseGadget.makeAuthenticatedFetch(
        `${config.treeData.dataUrl.replace('/documents', '')}/search/hierarchy?q=${encodeURIComponent(query)}`
      );

      const result = await response.json();
      console.log(`✅ Found ${result.results.length} matches`);

      setSearchResults(result.results || []);

      // ✅ Auto-expand tree to show results
      if (result.results.length > 0) {
        await expandToShowResults(result.results);
      }

    } catch (error) {
      console.error('❌ Search failed:', error);
      message.error('Search failed');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [config.treeData]);

  // Auto-expand tree to show search results
  const expandToShowResults = async (results: any[]) => {
    const keysToExpand = new Set<React.Key>();

    for (const result of results) {
      // ✅ Expand all parents in the path
      for (const parentId of result.path || []) {
        // Determine node type from ID prefix or lookup
        const nodeType = getNodeTypeFromId(parentId);
        keysToExpand.add(`${nodeType}-${parentId}`);

        // ✅ Load children if not loaded yet
        const node = findNodeByKey(`${nodeType}-${parentId}`, treeData);
        if (node && node.children === undefined) {
          await loadChildNodes(node);
        }
      }

      // ✅ Add the result node itself
      keysToExpand.add(`${result.nodeType}-${result.id}`);
    }

    setExpandedKeys(Array.from(keysToExpand));
    setAutoExpandParent(true);
  };

  // Helper: Get node type from ID (or use heuristics)
  const getNodeTypeFromId = (id: string): string => {
    if (id.startsWith('comp_')) return 'company';
    if (id.startsWith('site_')) return 'site';
    if (id.startsWith('asset_group_') || id.includes('-')) return 'asset_group';
    if (id.startsWith('asset_')) return 'asset';
    // Fallback: check in tree data
    return 'company'; // Default
  };

  // Helper: Find node by key in tree
  const findNodeByKey = (key: string, nodes: DataNode[]): DataNode | null => {
    for (const node of nodes) {
      if (node.key === key) return node;
      if (node.children) {
        const found = findNodeByKey(key, node.children);
        if (found) return found;
      }
    }
    return null;
  };

  // ✅ Debounced search - wait for user to stop typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue && searchValue.trim().length > 2) {
        performSearch(searchValue);
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchValue, performSearch]);

  // Filter tree data based on search results (highlight matched nodes)
  const filteredTreeData = useMemo(() => {
    if (!searchValue || searchResults.length === 0) return treeData;

    // ✅ For search, show full tree but highlight matched nodes
    // The tree will be auto-expanded to show results via expandToShowResults
    return treeData;
  }, [treeData, searchValue, searchResults]);

  // Handle tree operations
  const onExpand = (expandedKeysValue: React.Key[]) => {
    setExpandedKeys(expandedKeysValue);
    setAutoExpandParent(false);
  };

  const onSelect = (selectedKeysValue: React.Key[], info: any) => {
    setSelectedKeys(selectedKeysValue);
    
    // Emit selection to parent context
    if (context?.onAction && info.node?.data) {
      context.onAction('nodeSelect', {
        node: info.node.data,
        nodeType: info.node.data.nodeType
      });
    }
  };

  // Load data on mount and config changes
  // ✅ Initial load - only companies
  useEffect(() => {
    loadRootNodes();
  }, [loadRootNodes]);

  // ✅ Listen for refresh events
  useEffect(() => {
    const handleRefresh = () => {
      loadRootNodes();
    };

    window.addEventListener('asset-data-refresh', handleRefresh);
    return () => window.removeEventListener('asset-data-refresh', handleRefresh);
  }, [loadRootNodes]);

  // ✅ Old auto-expand removed - now using backend search with smart expansion

  // Context menu items - filtered based on node type
  const getContextMenuItems = (node: any): MenuProps['items'] => {
    if (!config.contextMenu?.items || !node) return [];

    const nodeType = node.nodeType;
    const allowedActions: Record<string, string[]> = {
      company: ['view', 'edit', 'add_site', 'delete', 'restore'],
      site: ['view', 'edit', 'add_group', 'delete', 'restore'],
      asset_group: ['view', 'edit', 'add_asset', 'delete', 'restore'],
      asset: ['view', 'edit', 'delete', 'restore']
    };

    const nodeAllowedActions = allowedActions[nodeType] || ['view', 'edit', 'delete', 'restore'];
    
    return config.contextMenu.items
      .filter(item => {
        // Show restore only for deleted items
        if (item.key === 'restore') return node.deleted;
        // Hide delete for deleted items
        if (item.key === 'delete') return !node.deleted;
        // Show only allowed actions for this node type
        return nodeAllowedActions.includes(item.key);
      })
      .map(item => ({
        key: item.key,
        label: item.label,
        icon: React.createElement(ICON_MAP[item.icon] || MoreOutlined),
        danger: item.danger,
        onClick: () => handleContextMenuClick(item)
      }));
  };

  const contextMenuItems = getContextMenuItems(contextNode);

  return (
    <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* CSS for hover effects */}
      <style>
        {`
          .ant-tree-node-content-wrapper:hover .tree-node-actions {
            opacity: 1 !important;
          }
          .tree-node-actions {
            display: flex;
            align-items: center;
          }
          .tree-node-actions .ant-btn {
            border: none;
            box-shadow: none;
          }
          .tree-node-actions .ant-btn:hover {
            background-color: rgba(0, 0, 0, 0.06);
          }
        `}
      </style>
      
      {/* Header */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>{config.title}</h3>
        <Space>
          {/* Always show Add Company button */}
          <Tooltip title="Add New Company">
            <Button 
              type="primary" 
              size="small"
              icon={<PlusOutlined />} 
              onClick={() => {
                if (context?.onAction) {
                  context.onAction('add-company', {});
                } else {
                  console.error('❌ No context.onAction available in header');
                }
              }}
            >
              Add Company
            </Button>
          </Tooltip>
          
          <Tooltip title="Refresh Tree">
            <Button 
              type="text" 
              icon={<ReloadOutlined />} 
              onClick={loadRootNodes}
              loading={loading}
            />
          </Tooltip>
        </Space>
      </div>

      {/* Search */}
      {config.showSearch && (
        <div style={{ marginBottom: '16px' }}>
          <Input
            placeholder={config.searchPlaceholder}
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            allowClear
            suffix={
              isSearching ? (
                <span style={{ fontSize: '12px', color: '#1890ff' }}>Searching...</span>
              ) : searchResults.length > 0 ? (
                <span style={{ fontSize: '12px', color: '#52c41a' }}>
                  {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
                </span>
              ) : null
            }
          />
        </div>
      )}

      {/* Tree */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Debug info */}
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
          Debug: Tree items: {filteredTreeData.length}, Loading: {loading ? 'Yes' : 'No'}, Context menu enabled: {config.contextMenu?.enabled ? 'Yes' : 'No'}
        </div>
        
        {filteredTreeData.length === 0 && !loading ? (
          <div 
            style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              color: '#666',
              border: '2px dashed #d9d9d9',
              borderRadius: '8px',
              margin: '20px 0',
              cursor: 'pointer'
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (context?.onAction) {
                context.onAction('add-company', {});
              }
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>
              🏢
            </div>
            <h4 style={{ margin: '0 0 8px 0', color: '#666' }}>No Companies Yet</h4>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>
              Start by creating your first company to organize your assets
            </p>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => {
                if (context?.onAction) {
                  context.onAction('add-company', {});
                } else {
                  console.error('❌ No context.onAction available');
                }
              }}
            >
              Create First Company
            </Button>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', opacity: 0.7 }}>
              Right-click here to add a company
            </p>
          </div>
        ) : (
          <Tree
            treeData={filteredTreeData}
            expandedKeys={expandedKeys}
            selectedKeys={selectedKeys}
            autoExpandParent={autoExpandParent}
            onExpand={onExpand}
            onSelect={onSelect}
            onRightClick={({ event, node }) => {
              handleContextMenu(event as any, node as any);
            }}
            loadData={async (node: any) => {
              // ✅ LAZY LOADING: Load children when node is expanded
              const children = await loadChildNodes(node);
              
              // ✅ Update tree data with loaded children
              const updateNodeChildren = (nodes: DataNode[]): DataNode[] => {
                return nodes.map(n => {
                  if (n.key === node.key) {
                    return { ...n, children };
                  }
                  if (n.children) {
                    return { ...n, children: updateNodeChildren(n.children) };
                  }
                  return n;
                });
              };
              
              setTreeData(prevData => updateNodeChildren(prevData));
            }}
            showLine={{ showLeafIcon: false }}
            showIcon={false}
            draggable={config.allowDragDrop}
            blockNode
            height={400}
          />
        )}
      </div>

      {/* Context Menu */}
      {config.contextMenu?.enabled && (
        <Dropdown
          menu={{ items: contextMenuItems }}
          open={contextMenuVisible}
          onOpenChange={setContextMenuVisible}
        >
          <div 
            style={{ 
              position: 'fixed', 
              left: contextMenuPosition.x, 
              top: contextMenuPosition.y,
              width: 1,
              height: 1,
              pointerEvents: 'none'
            }} 
          />
        </Dropdown>
      )}
    </div>
  );
};

export default ResourceTreeGadget;
