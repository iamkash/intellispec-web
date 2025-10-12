import * as Icons from '@ant-design/icons';
import { AppstoreOutlined, BarsOutlined, ClockCircleOutlined, FilterOutlined, HeartFilled, HeartOutlined, SearchOutlined, SortAscendingOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Col, Empty, Input, Row, Select, Skeleton, Space, Tag, Tooltip, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { BaseGadget, GadgetConfig, GadgetContext, GadgetMetadata, GadgetSchema, GadgetType } from '../base';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface MenuItem {
  key: string;
  label: string;
  description: string;
  icon: string;
  type: string;
  workspace: string;
  route?: string;
  category: string;
  tags: string[];
}

interface MegaMenuGadgetConfig extends GadgetConfig {
  dataUrl: string;
  dataPath: string;
  title?: string;
  itemType?: string;
  modulePath?: string;
  workspacePath?: string;
  showDescriptions: boolean;
  enableSearch: boolean;
  enableCategoryFilter: boolean;
  enableTagFilter: boolean;
  enableFavorites: boolean;
  enableSorting: boolean;
  enableViewToggle: boolean;
  searchFields: string[];
  cardSize: 'small' | 'medium' | 'large';
}

/**
 * Generic Mega Menu Gadget - Framework Level Component
 *
 * A fully configurable mega menu component that can display any type of menu items
 * (calculators, documents, tools, reports, etc.) across different modules.
 *
 * Configuration Examples:
 *
 * 1. For Calculators:
 * {
 *   "dataUrl": "/api/calculators?module=inspect",
 *   "itemType": "calculators",
 *   "modulePath": "intelliINSPECT",
 *   "workspacePath": "calculators"
 * }
 *
 * 2. For Documents:
 * {
 *   "dataUrl": "/api/documents?type=reports",
 *   "itemType": "documents",
 *   "modulePath": "documents",
 *   "workspacePath": "reports"
 * }
 *
 * 3. For Custom Tools:
 * {
 *   "dataUrl": "/api/tools",
 *   "itemType": "tools",
 *   "modulePath": "tools",
 *   "workspacePath": "utilities"
 * }
 *
 * Required Properties:
 * - dataUrl: API endpoint for menu data
 *
 * Optional Properties:
 * - modulePath: Used for workspace path construction (fallback)
 * - workspacePath: Used for workspace path construction (fallback)
 *
 * Navigation: Uses the proper workspace navigation system like ActionPanelGadget
 * - Handles cross-module navigation automatically
 * - Uses context.onAction for same-module navigation
 * - Falls back to direct URL for cross-module navigation
 */
export class MegaMenuGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'mega-menu-gadget',
    name: 'Mega Menu Gadget',
    description: 'Advanced searchable mega menu with filtering capabilities',
    category: 'dashboard',
    tags: ['menu', 'search', 'filter', 'mega', 'navigation'],
    version: '1.0.0',
    author: 'System',
    gadgetType: GadgetType.DASHBOARD,
    widgetTypes: [],
    dataFlow: {
      inputs: ['calculators-data'],
      outputs: ['navigation-events'],
      transformations: ['data-filtering']
    }
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      dataUrl: { type: 'string', format: 'uri' },
      dataPath: { type: 'string' },
      title: { type: 'string' },
      itemType: { type: 'string' },
      modulePath: { type: 'string' },
      workspacePath: { type: 'string' },
      showDescriptions: { type: 'boolean', default: true },
      enableSearch: { type: 'boolean', default: true },
      enableCategoryFilter: { type: 'boolean', default: true },
      enableTagFilter: { type: 'boolean', default: true },
      enableFavorites: { type: 'boolean', default: true },
      enableSorting: { type: 'boolean', default: true },
      enableViewToggle: { type: 'boolean', default: true },
      searchFields: {
        type: 'array',
        items: { type: 'string' },
        default: ['label', 'description', 'tags']
      },
      cardSize: {
        type: 'string',
        enum: ['small', 'medium', 'large'],
        default: 'medium'
      }
    },
    required: ['dataUrl'],
    widgetSchemas: {}
  };

  renderBody(props: any, context?: GadgetContext): React.ReactNode {
    return React.createElement(MegaMenuComponent, {
      config: props.config || props,
      context
    });
  }

  getRequiredWidgets(): string[] {
    return []; // This gadget doesn't require any specific widgets
  }

  getWidgetLayout(): Record<string, any> {
    return {
      type: 'grid',
      responsive: true
    };
  }

  processDataFlow(data: any): any {
    return data; // Pass through data as-is
  }

  validate(config: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!config.dataUrl) {
      errors.push('dataUrl is required');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

interface MegaMenuComponentProps {
  config: MegaMenuGadgetConfig;
  context?: GadgetContext;
}

const MegaMenuComponent: React.FC<MegaMenuComponentProps> = ({ config, context }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  // Load favorites from localStorage
  const loadFavorites = () => {
    try {
      const stored = localStorage.getItem(`${config.itemType || 'menu'}-favorites`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Save favorites to localStorage
  const saveFavorites = (favorites: string[]) => {
    try {
      localStorage.setItem(`${config.itemType || 'menu'}-favorites`, JSON.stringify(favorites));
    } catch (error) {
      console.warn('Failed to save favorites to localStorage:', error);
    }
  };

  // Load user preferences from localStorage
  const loadUserPreferences = () => {
    try {
      const stored = localStorage.getItem('calculator-preferences');
      return stored ? JSON.parse(stored) : {
        viewMode: 'grid' as 'grid' | 'list',
        sortBy: 'name' as 'name' | 'category' | 'recent' | 'favorites'
      };
    } catch {
      return {
        viewMode: 'grid' as 'grid' | 'list',
        sortBy: 'name' as 'name' | 'category' | 'recent' | 'favorites'
      };
    }
  };

  // Save user preferences to localStorage
  const saveUserPreferences = (preferences: { viewMode: 'grid' | 'list', sortBy: 'name' | 'category' | 'recent' | 'favorites' }) => {
    try {
      localStorage.setItem('calculator-preferences', JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save preferences to localStorage:', error);
    }
  };

  const preferences = loadUserPreferences();

  const [favorites, setFavorites] = useState<string[]>(loadFavorites());
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(preferences.viewMode);
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'recent' | 'favorites'>(preferences.sortBy);
  const [sortKey, setSortKey] = useState(0); // Force re-render key

  const [searchDebounce, setSearchDebounce] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Dynamic icon loading function (supports any icon from database)
  const getIconComponent = (iconName: string) => {
    try {
      // Get icon component dynamically from the Icons module
      const IconComponent = (Icons as any)[iconName];

      if (IconComponent) {
        // Return the actual icon component with proper styling
        return React.createElement(IconComponent, {
          style: { fontSize: '28px', color: 'hsl(var(--foreground))' }
        });
      } else {
        // Fallback to a default icon if the specified icon doesn't exist
        console.warn(`Icon "${iconName}" not found, using fallback`);
        return React.createElement(Icons.CalculatorOutlined, {
          style: { fontSize: '28px', color: 'hsl(var(--foreground))' }
        });
      }
    } catch (error) {
      console.warn(`Failed to render icon: ${iconName}`, error);
      // Ultimate fallback
      return React.createElement(Icons.QuestionCircleOutlined, {
        style: { fontSize: '28px', color: 'hsl(var(--foreground))' }
      });
    }
  };

  // Skeleton loader for cards
  const SkeletonCard = () => (
    <Card style={{ minHeight: '280px', borderRadius: '16px', position: 'relative', paddingTop: '8px' }}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Skeleton.Avatar size={56} shape="square" style={{ borderRadius: '8px' }} />
          <div style={{ flex: 1 }}>
            <Skeleton.Input style={{ width: '85%', height: '18px' }} active />
            <Skeleton.Input style={{ width: '65%', height: '14px', marginTop: '6px' }} active />
          </div>
        </div>
        <Skeleton paragraph={{ rows: 2, width: ['100%', '90%'] }} active />
        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <Space>
            <Skeleton.Input style={{ width: '60px', height: '24px' }} active />
            <Skeleton.Input style={{ width: '40px', height: '24px' }} active />
          </Space>
        </div>
      </Space>
    </Card>
  );

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchText);
      setIsSearching(false);
    }, 300);

    if (searchText !== searchDebounce) {
      setIsSearching(true);
    }

    return () => clearTimeout(timer);
  }, [searchText, searchDebounce]);

  // Fetch calculators data
  useEffect(() => {
    const fetchCalculators = async () => {
      try {
        setLoading(true);
        const response = await fetch(config.dataUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Navigate to data path if specified
        let calculatorData = data;
        if (config.dataPath) {
          const pathParts = config.dataPath.split('.');
          for (const part of pathParts) {
            calculatorData = calculatorData?.[part];
          }
        }

        if (Array.isArray(calculatorData)) {
          setMenuItems(calculatorData);
        }
      } catch (error) {
        console.error('Error fetching calculators:', error);
      } finally {
        setLoading(false);
      }
    };

    if (config.dataUrl) {
      fetchCalculators();
    }
  }, [config.dataUrl, config.dataPath]);

  // Get unique categories and tags
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(menuItems.map(item => item.category)));
    return uniqueCategories.sort();
  }, [menuItems]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    menuItems.forEach(item => {
      item.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [menuItems]);

  // Sort menu items based on sortBy
  const sortedMenuItems = useMemo(() => {
    let sorted = [...menuItems];

    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.label.localeCompare(b.label));
        break;
      case 'category':
        sorted.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'recent':
        // Sort by recent items first, then by name
        sorted.sort((a, b) => {
          const aRecent = recentItems.includes(a.key);
          const bRecent = recentItems.includes(b.key);
          if (aRecent && !bRecent) return -1;
          if (!aRecent && bRecent) return 1;
          return a.label.localeCompare(b.label);
        });
        break;
      case 'favorites':
        // Sort by favorites first, then by name
        sorted.sort((a, b) => {
          const aFav = favorites.includes(a.key);
          const bFav = favorites.includes(b.key);
          if (aFav && !bFav) return -1;
          if (!aFav && bFav) return 1;
          return a.label.localeCompare(b.label);
        });
        break;
      default:
        break;
    }

    return sorted;
  }, [menuItems, sortBy, recentItems, sortKey]);

  // Filter menu items based on search and filters
  const filteredMenuItems = useMemo(() => {
    return sortedMenuItems.filter(item => {
      // Favorites filter
      if (showOnlyFavorites && !favorites.includes(item.key)) {
        return false;
      }

      // Search filter
      if (searchText && config.searchFields?.length) {
        const searchLower = searchText.toLowerCase();
        const matchesSearch = config.searchFields.some(field => {
          if (field === 'tags' && item.tags) {
            return item.tags.some(tag => tag.toLowerCase().includes(searchLower));
          }
          const value = item[field as keyof MenuItem];
          return typeof value === 'string' && value.toLowerCase().includes(searchLower);
        });
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory && item.category !== selectedCategory) {
        return false;
      }

      // Tags filter
      if (selectedTags.length > 0) {
        const hasMatchingTag = selectedTags.some(tag => item.tags?.includes(tag));
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }, [sortedMenuItems, searchDebounce, selectedCategory, selectedTags, config.searchFields, sortKey, showOnlyFavorites, favorites]);

  const handleMenuItemClick = (menuItem: MenuItem) => {
    if (menuItem.workspace) {
      // Track recent items for premium UX
      setRecentItems(prev => {
        const filtered = prev.filter(id => id !== menuItem.key);
        return [menuItem.key, ...filtered].slice(0, 5); // Keep only 5 recent items
      });

      // Use the proper navigation system like ActionPanelGadget
      if (context && (context as any).onAction) {
console.log('🔗 Navigating to workspace:', menuItem.workspace);

        // Determine the current module from current workspace query
        const workspacePath = menuItem.workspace;
        const moduleIdFromItem = workspacePath.split('/')[0];
// Check if we need to switch modules by comparing workspace paths
        const currentWorkspace = window.location.search.includes('workspace=')
          ? new URLSearchParams(window.location.search).get('workspace')
          : '';
        const currentModuleId = currentWorkspace ? currentWorkspace.split('/')[0] : '';

        const desiredModuleId = (config as any)?.modulePath || moduleIdFromItem;
if (currentModuleId !== desiredModuleId) {
console.log('🎯 Navigating from', currentModuleId, 'to', desiredModuleId);
// Build module-correct dynamic-calculator target for calculators
          let workspaceForUrl = menuItem.workspace;
          let extraParams = '';
          if (menuItem.workspace?.includes('/calculators/')) {
            const parts = menuItem.workspace.split('/');
            const calculatorId = parts[parts.length - 1];
            const moduleIdForCalc = desiredModuleId;
            const workspacePathName = (config as any)?.workspacePath || 'calculators';
            workspaceForUrl = `${moduleIdForCalc}/${workspacePathName}/dynamic-calculator`;
            extraParams = `&calculatorId=${encodeURIComponent(calculatorId)}`;
          }
          // Use clean URL construction - base URL with workspace (and calculatorId if present)
          const baseUrl = window.location.origin + window.location.pathname;
          const cleanUrl = `${baseUrl}?workspace=${encodeURIComponent(workspaceForUrl)}${extraParams}`;
window.location.href = cleanUrl;
          return;
        }

        // Handle workspace navigation using the proper action system within same module
        // For calculators, route to the module's dynamic calculator workspace
        let targetWorkspace = menuItem.workspace;
        if (menuItem.workspace?.includes('/calculators/')) {
          const parts = menuItem.workspace.split('/');
          const calculatorId = parts[parts.length - 1];
          const moduleIdForCalc = desiredModuleId || currentModuleId || parts[0];
          const workspacePathName = (config as any)?.workspacePath || 'calculators';
          targetWorkspace = `${moduleIdForCalc}/${workspacePathName}/dynamic-calculator`;
          (context as any).onAction('navigate', {
            workspace: targetWorkspace,
            route: menuItem.route,
            key: menuItem.key,
            label: menuItem.label,
            type: menuItem.type || 'item',
            params: { calculatorId }
          });
        } else {
          (context as any).onAction('navigate', {
            workspace: targetWorkspace,
            route: menuItem.route,
            key: menuItem.key,
            label: menuItem.label,
            type: menuItem.type || 'item'
          });
        }
      } else {
        // Fallback to direct URL navigation if context is not available
const baseUrl = window.location.origin + window.location.pathname;
        const cleanUrl = `${baseUrl}?workspace=${encodeURIComponent(menuItem.workspace)}`;
window.location.href = cleanUrl;
      }
    }
  };

  const getCardSize = () => {
    switch (config.cardSize) {
      case 'small': return 6;
      case 'large': return 8;
      default: return 6;
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '24px',
        backgroundColor: 'hsl(var(--background))',
        borderRadius: '20px',
        boxShadow: 'inset 0 1px 3px hsl(var(--foreground) / 0.05)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          padding: '16px',
          background: 'linear-gradient(135deg, hsl(var(--muted) / 0.3) 0%, hsl(var(--muted) / 0.1) 100%)',
          borderRadius: '12px',
          border: '1px solid hsl(var(--border) / 0.5)'
        }}>
          <div>
            <Skeleton.Input style={{ width: '200px', height: '24px' }} active />
            <Skeleton.Input style={{ width: '150px', height: '16px', marginTop: '8px' }} active />
          </div>
          <Space>
            <Skeleton.Button active size="small" />
            <Skeleton.Button active size="small" />
            <Skeleton.Input style={{ width: '120px', height: '24px' }} active />
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <SkeletonCard />
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .mega-menu-card {
            animation: fadeInUp 0.6s ease-out forwards;
            opacity: 0;
            transform: translateY(20px);
          }
          .mega-menu-card:nth-child(1) { animation-delay: 0.1s; }
          .mega-menu-card:nth-child(2) { animation-delay: 0.2s; }
          .mega-menu-card:nth-child(3) { animation-delay: 0.3s; }
          .mega-menu-card:nth-child(4) { animation-delay: 0.4s; }
          .mega-menu-card:nth-child(5) { animation-delay: 0.5s; }
          .mega-menu-card:nth-child(6) { animation-delay: 0.6s; }

          @keyframes fadeInUp {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .mega-menu-card:hover {
            transform: translateY(-6px) scale(1.02);
            box-shadow: 0 20px 40px hsl(var(--foreground) / 0.15);
            border-color: hsl(var(--primary) / 0.4);
          }
          .mega-menu-card:hover .icon-container {
            transform: scale(1.08);
            background-color: hsl(var(--primary) / 0.15);
            border-color: hsl(var(--primary) / 0.3);
            box-shadow: 0 8px 20px hsl(var(--primary) / 0.2);
          }

          .mega-menu-card:hover .card-title {
            color: hsl(var(--primary));
            transform: translateX(2px);
          }

          .icon-container {
            backdrop-filter: blur(10px);
          }

          /* List view hover effects */
          .ant-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            border-color: hsl(var(--primary) / 0.4);
          }

          .ant-card:hover .icon-container {
            transform: scale(1.05);
            background-color: hsl(var(--primary) / 0.12);
            border-color: hsl(var(--primary) / 0.25);
            box-shadow: 0 6px 16px hsl(var(--primary) / 0.15);
          }
        `
      }} />
      <div style={{
        padding: '24px',
        backgroundColor: 'hsl(var(--background))',
        borderRadius: '20px',
        boxShadow: 'inset 0 1px 3px hsl(var(--foreground) / 0.05)'
      }}>
      {/* Premium Header with Stats and Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        padding: '16px',
        background: 'linear-gradient(135deg, hsl(var(--muted) / 0.3) 0%, hsl(var(--muted) / 0.1) 100%)',
        borderRadius: '12px',
        border: '1px solid hsl(var(--border) / 0.5)'
      }}>
        <div>
          <Title level={4} style={{
            margin: 0,
            color: 'hsl(var(--foreground))',
            fontSize: '20px',
            fontWeight: 700
          }}>
            {config.title || 'Menu Items'}
          </Title>
          <Text style={{
            color: 'hsl(var(--muted-foreground))',
            fontSize: '14px'
          }}>
            {filteredMenuItems.length} of {menuItems.length} {config.itemType || 'items'}
            {selectedCategory && ` • ${selectedCategory}`}
            {selectedTags.length > 0 && ` • ${selectedTags.length} tags`}
            {showOnlyFavorites && ` • favorites only`}
          </Text>
        </div>
        <Space>
          {config.enableViewToggle && (
            <>
              <Tooltip title="Grid View">
                <Button
                  type={viewMode === 'grid' ? 'primary' : 'text'}
                  icon={<AppstoreOutlined />}
                  onClick={() => {
                  setViewMode('grid');
                  saveUserPreferences({ viewMode: 'grid', sortBy });
                }}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="List View">
                <Button
                  type={viewMode === 'list' ? 'primary' : 'text'}
                  icon={<BarsOutlined />}
                  onClick={() => {
                  setViewMode('list');
                  saveUserPreferences({ viewMode: 'list', sortBy });
                }}
                  size="small"
                />
              </Tooltip>
            </>
          )}
          {config.enableFavorites && (
            <Tooltip title={showOnlyFavorites ? `Show all ${config.itemType || 'items'}` : "Show only favorites"}>
              <Button
                type={showOnlyFavorites ? 'primary' : 'text'}
                icon={<HeartFilled style={{ color: showOnlyFavorites ? '#ff4d4f' : undefined }} />}
                onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                size="small"
              />
            </Tooltip>
          )}
          {config.enableSorting && (
            <Select
              value={sortBy}
              onChange={(value) => {
                setSortBy(value);
                setSortKey(prev => prev + 1); // Force re-render
                saveUserPreferences({ viewMode, sortBy: value });
              }}
              size="small"
              style={{ width: '120px' }}
              suffixIcon={<SortAscendingOutlined />}
            >
              <Option value="name">Name</Option>
              <Option value="category">Category</Option>
              <Option value="favorites">Favorites</Option>
              <Option value="recent">Recent</Option>
            </Select>
          )}
        </Space>
      </div>

      {/* Search and Filter Controls */}
      <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: '24px' }}>
        {config.enableSearch && (
          <Input
            placeholder={`Search ${config.itemType || 'items'}...`}
            prefix={isSearching ? <ClockCircleOutlined spin /> : <SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            size="large"
            allowClear
            style={{
              borderRadius: '12px',
              border: '2px solid hsl(var(--border))',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px hsl(var(--foreground) / 0.04)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'hsl(var(--primary) / 0.5)';
              e.target.style.boxShadow = '0 4px 12px hsl(var(--primary) / 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'hsl(var(--border))';
              e.target.style.boxShadow = '0 2px 8px hsl(var(--foreground) / 0.04)';
            }}
          />
        )}

        <Space wrap>
          {config.enableCategoryFilter && categories.length > 0 && (
            <Select
              placeholder="Filter by category"
              value={selectedCategory}
              onChange={setSelectedCategory}
              allowClear
              style={{ minWidth: '200px' }}
              suffixIcon={<FilterOutlined />}
            >
              {categories.map(category => (
                <Option key={category} value={category}>{category}</Option>
              ))}
            </Select>
          )}

          {config.enableTagFilter && allTags.length > 0 && (
            <Select
              mode="multiple"
              placeholder="Filter by tags"
              value={selectedTags}
              onChange={setSelectedTags}
              allowClear
              style={{ minWidth: '250px' }}
              suffixIcon={<FilterOutlined />}
            >
              {allTags.map(tag => (
                <Option key={tag} value={tag}>{tag}</Option>
              ))}
            </Select>
          )}
        </Space>
      </Space>

      {/* Results Summary */}
      <div style={{ marginBottom: '16px' }}>
        <Text type="secondary">
          Showing {filteredMenuItems.length} of {menuItems.length} {config.itemType || 'items'}
            {selectedCategory && ` in ${selectedCategory}`}
            {selectedTags.length > 0 && ` with tags: ${selectedTags.join(', ')}`}
            {sortBy !== 'name' && ` • sorted by ${sortBy}`}
        </Text>
      </div>

      {/* Menu Items - Dynamic Layout */}
      {filteredMenuItems.length === 0 ? (
        <Empty
          description={`No ${config.itemType || 'items'} found matching your criteria`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : viewMode === 'list' ? (
        // List View
        <div style={{ padding: '20px 0' }}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {filteredMenuItems.map((menuItem) => (
              <Card
                key={menuItem.key}
                hoverable
                onClick={() => handleMenuItemClick(menuItem)}
                style={{
                  borderRadius: '12px',
                  border: '1px solid hsl(var(--border))',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: 'hsl(var(--background))',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                }}
                bodyStyle={{
                  padding: '16px',
                  backgroundColor: 'hsl(var(--background))'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="icon-container" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: 'hsl(var(--muted) / 0.6)',
                    border: '2px solid hsl(var(--border))',
                    boxShadow: '0 4px 12px hsl(var(--foreground) / 0.08)',
                      transition: 'all 0.3s ease',
                      flexShrink: 0
                    }}>
                    {getIconComponent(menuItem.icon)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <Title level={5} style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: 600,
                        color: 'hsl(var(--foreground))',
                        lineHeight: '1.3'
                      }}>
                        {menuItem.label}
                      </Title>
                      <Space>
                        <Tooltip title={favorites.includes(menuItem.key) ? "Remove from favorites" : "Add to favorites"}>
                          <Button
                            type="text"
                            size="small"
                            icon={favorites.includes(menuItem.key) ?
                              <HeartFilled style={{ color: '#ff4d4f' }} /> :
                              <HeartOutlined />
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              setFavorites(prev => {
                                const newFavorites = prev.includes(menuItem.key)
                                  ? prev.filter(id => id !== menuItem.key)
                                  : [...prev, menuItem.key];
                                saveFavorites(newFavorites);
                                return newFavorites;
                              });
                            }}
                            style={{ borderRadius: '6px' }}
                          />
                        </Tooltip>
                        {recentItems.includes(menuItem.key) && (
                          <Tooltip title="Recently used">
                            <Badge dot>
                              <ClockCircleOutlined style={{ color: 'hsl(var(--primary))' }} />
                            </Badge>
                          </Tooltip>
                        )}
                      </Space>
                    </div>
                    {config.showDescriptions && menuItem.description && (
                      <Paragraph
                        style={{
                          margin: '4px 0 8px 0',
                          fontSize: '14px',
                          lineHeight: '1.4',
                          color: 'hsl(var(--muted-foreground))',
                          fontWeight: 400
                        }}
                        ellipsis={{ rows: 1, tooltip: menuItem.description }}
                      >
                        {menuItem.description}
                      </Paragraph>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Tag
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          backgroundColor: 'hsl(var(--primary) / 0.12)',
                          borderColor: 'hsl(var(--primary) / 0.3)',
                          color: 'hsl(var(--primary))',
                          padding: '2px 8px'
                        }}
                      >
                        {menuItem.category}
                      </Tag>
                      {menuItem.tags?.slice(0, 2).map(tag => (
                        <Tag
                          key={tag}
                          style={{
                            fontSize: '11px',
                            borderRadius: '6px',
                            backgroundColor: 'hsl(var(--muted) / 0.1)',
                            borderColor: 'hsl(var(--border))',
                            color: 'hsl(var(--muted-foreground))',
                            padding: '2px 8px'
                          }}
                        >
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        </div>
      ) : (
        // Grid View
        <div style={{
          padding: '20px 0'
        }}>
          <Row gutter={[16, 16]}>
            {filteredMenuItems.map((menuItem, index) => (
              <Col xs={24} sm={12} md={getCardSize()} key={menuItem.key}>
              <Card
                hoverable
                onClick={() => handleMenuItemClick(menuItem)}
                className="mega-menu-card"
                style={{
                  minHeight: '280px',
                  cursor: 'pointer',
                  borderRadius: '16px',
                  border: '1px solid hsl(var(--border))',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: 'hsl(var(--background))',
                  boxShadow: '0 4px 16px hsl(var(--foreground) / 0.08)',
                  position: 'relative',
                  overflow: 'visible',
                  display: 'flex',
                  flexDirection: 'column',
                  paddingTop: '8px'
                }}
                bodyStyle={{
                  padding: '8px 20px 16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  backgroundColor: 'hsl(var(--background))'
                }}
                extra={
                  config.enableFavorites ? (
                    <div style={{ position: 'absolute', top: '12px', right: '16px', zIndex: 10 }}>
                      <Space>
                        <Tooltip title={favorites.includes(menuItem.key) ? "Remove from favorites" : "Add to favorites"}>
                          <Button
                            type="text"
                            size="small"
                            icon={favorites.includes(menuItem.key) ?
                              <HeartFilled style={{ color: '#ff4d4f' }} /> :
                              <HeartOutlined />
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              setFavorites(prev => {
                                const newFavorites = prev.includes(menuItem.key)
                                  ? prev.filter(id => id !== menuItem.key)
                                  : [...prev, menuItem.key];
                                saveFavorites(newFavorites);
                                return newFavorites;
                              });
                            }}
                            style={{
                              borderRadius: '6px',
                              transition: 'all 0.2s ease',
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          />
                        </Tooltip>
                        {recentItems.includes(menuItem.key) && (
                          <Tooltip title="Recently used">
                            <Badge dot>
                              <ClockCircleOutlined style={{ color: 'hsl(var(--primary))' }} />
                            </Badge>
                          </Tooltip>
                        )}
                      </Space>
                    </div>
                  ) : null
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid hsl(var(--border) / 0.6)',
                    position: 'relative',
                    minHeight: '56px'
                  }}>
                    <div style={{
                      position: 'absolute',
                      bottom: '-1px',
                      left: '0',
                      width: '60px',
                      height: '3px',
                      background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.6))',
                      borderRadius: '2px'
                    }}></div>
                    <div className="icon-container" style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '56px',
                      height: '56px',
                      borderRadius: '8px',
                      backgroundColor: 'hsl(var(--muted) / 0.6)',
                      border: '1px solid hsl(var(--border))',
                      boxShadow: '0 3px 12px hsl(var(--foreground) / 0.08)',
                      transition: 'all 0.3s ease',
                      flexShrink: 0
                    }}>
                      {getIconComponent(menuItem.icon)}
                    </div>
                    <Title level={5} className="card-title" style={{
                      margin: 0,
                      flex: 1,
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'hsl(var(--foreground))',
                      lineHeight: '1.2',
                      letterSpacing: '-0.025em',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: '20px'
                    }}>
                      {menuItem.label}
                    </Title>
                  </div>

                  {config.showDescriptions && menuItem.description && (
                    <div style={{
                      marginTop: '2px',
                      marginBottom: '6px',
                      flex: 1,
                      display: 'flex',
                      alignItems: 'flex-start'
                    }}>
                      <Paragraph
                        style={{
                          margin: 0,
                          fontSize: '13px',
                          lineHeight: '1.4',
                          color: 'hsl(var(--muted-foreground))',
                          fontWeight: 400,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                        ellipsis={{ rows: 2, tooltip: menuItem.description }}
                      >
                        {menuItem.description}
                      </Paragraph>
                    </div>
                  )}

                  <div style={{
                    marginTop: config.showDescriptions && menuItem.description ? 'auto' : '6px',
                    paddingTop: '6px',
                    borderTop: '1px solid hsl(var(--border) / 0.4)',
                    backgroundColor: 'hsl(var(--muted) / 0.01)',
                    margin: '0 -20px -16px -20px',
                    padding: '6px 20px 10px 20px',
                    borderRadius: '0 0 16px 16px'
                  }}>
                    <Space size="small" wrap>
                      <Tag
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '6px',
                          backgroundColor: 'hsl(var(--primary) / 0.12)',
                          borderColor: 'hsl(var(--primary) / 0.3)',
                          color: 'hsl(var(--primary))',
                          padding: '2px 8px',
                          letterSpacing: '0.025em',
                          textTransform: 'uppercase'
                        }}
                      >
                        {menuItem.category}
                      </Tag>
                      {menuItem.tags?.slice(0, 2).map(tag => (
                        <Tag
                          key={tag}
                          style={{
                            fontSize: '11px',
                            borderRadius: '6px',
                            backgroundColor: 'hsl(var(--muted) / 0.1)',
                            borderColor: 'hsl(var(--border))',
                            color: 'hsl(var(--muted-foreground))',
                            padding: '2px 8px'
                          }}
                        >
                          {tag}
                        </Tag>
                      ))}
                      {menuItem.tags && menuItem.tags.length > 2 && (
                        <Tag
                          style={{
                            fontSize: '11px',
                            borderRadius: '6px',
                            backgroundColor: 'hsl(var(--muted) / 0.1)',
                            borderColor: 'hsl(var(--border))',
                            color: 'hsl(var(--muted-foreground))',
                            padding: '2px 8px'
                          }}
                        >
                          +{menuItem.tags.length - 2} more
                        </Tag>
                      )}
                    </Space>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
          </Row>
        </div>
      )}
      </div>
    </>
  );
};

export default MegaMenuGadget;
