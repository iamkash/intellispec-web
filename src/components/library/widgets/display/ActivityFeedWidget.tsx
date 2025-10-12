/**
 * Enhanced Activity Feed Widget with Search and iOS-inspired Design
 * 
 * Features:
 * - Search functionality across multiple fields
 * - iOS-inspired design with modern cards and animations
 * - Smooth transitions and hover effects
 * - Filter by type, status, and priority
 * - Pull-to-refresh style indicators
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Card, Avatar, Tag, Input, Select, Space, Empty, Spin, Tooltip } from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  ClearOutlined,
  SwapOutlined,
  ToolOutlined,
  SendOutlined,
  FileTextOutlined,
  ScheduleOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  // Priority icons
  ExclamationOutlined,
  WarningOutlined,
  MinusCircleOutlined,
  // Status icons
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  RocketOutlined,
  EyeOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { BaseWidget, WidgetConfig, WidgetType } from '../base';
// Note: Using CSS variables directly instead of useTheme for better compatibility

const { Option } = Select;

export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  type?: string;
  status?: string;
  priority?: string;
  user?: string;
  avatar?: string;
  icon?: string;
  metadata?: Record<string, any>;
}

export interface ColorMapping {
  [key: string]: string;
}

export interface ActivityFeedWidgetProps {
  activities: ActivityItem[];
  maxItems?: number;
  showTimestamp?: boolean;
  showAvatar?: boolean;
  showTags?: boolean;
  enableSearch?: boolean;
  enableFilters?: boolean;
  theme?: 'light' | 'dark';
  height?: number;
  maxHeight?: number;
  loading?: boolean;
  searchPlaceholder?: string;
  // Color mappings for different properties - fully configurable
  typeColorMapping?: ColorMapping;
  statusColorMapping?: ColorMapping;
  priorityColorMapping?: ColorMapping;
  // Default colors if no mapping provided
  defaultTypeColor?: string;
  defaultStatusColor?: string;
  defaultPriorityColor?: string;
  // Custom styling
  cardStyle?: React.CSSProperties;
  listStyle?: React.CSSProperties;
}

const iconMap: { [key: string]: React.ComponentType<any> } = {
  SwapOutlined,
  ToolOutlined,
  SearchOutlined,
  SendOutlined,
  FileTextOutlined,
  ScheduleOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined
};

const getActivityIcon = (iconName?: string, type?: string) => {
  if (iconName && iconMap[iconName]) {
    const IconComponent = iconMap[iconName];
    return <IconComponent />;
  }
  
  // Fallback icons based on type
  switch (type) {
    case 'checkout':
    case 'checkin':
      return <SwapOutlined />;
    case 'maintenance':
    case 'maintenance-scheduled':
      return <ToolOutlined />;
    case 'inspection':
      return <SearchOutlined />;
    case 'dispatch':
      return <SendOutlined />;
    case 'contract':
      return <FileTextOutlined />;
    case 'payment':
      return <DollarOutlined />;
    case 'gps-alert':
      return <EnvironmentOutlined />;
    case 'customer-access':
      return <UserOutlined />;
    default:
      return <ClockCircleOutlined />;
  }
};

const getPriorityIcon = (priority?: string) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return <ExclamationOutlined />;
    case 'medium':
      return <WarningOutlined />;
    case 'low':
      return <MinusCircleOutlined />;
    case 'normal':
      return <CheckCircleOutlined />;
    default:
      return <ClockCircleOutlined />;
  }
};

const getStatusIcon = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return <CheckCircleOutlined />;
    case 'in-progress':
      return <PlayCircleOutlined />;
    case 'pending':
      return <PauseCircleOutlined />;
    case 'scheduled':
      return <ScheduleOutlined />;
    case 'active':
      return <RocketOutlined />;
    case 'investigating':
      return <EyeOutlined />;
    default:
      return <ClockCircleOutlined />;
  }
};

export const ActivityFeedWidget: React.FC<ActivityFeedWidgetProps> = ({
  activities = [],
  maxItems = 10,
  showTimestamp = true,
  showAvatar = true,
  showTags = true,
  enableSearch = true,
  enableFilters = true,
  theme: propTheme,
  height = 400,
  maxHeight,
  loading = false,
  searchPlaceholder = "Search activities...",
  typeColorMapping = {},
  statusColorMapping = {},
  priorityColorMapping = {},
  defaultTypeColor = 'hsl(var(--primary))',
  defaultStatusColor = 'default',
  defaultPriorityColor = 'hsl(var(--primary))',
  cardStyle = {},
  listStyle = {}
}) => {
  // Note: theme context available but using CSS variables directly for compatibility
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Calculate effective height - use maxHeight if provided, otherwise use height
  const effectiveHeight = maxHeight || height;
  const shouldConstrainHeight = Boolean(maxHeight);

  const getTypeColor = useCallback((type?: string): string => {
    if (!type) return defaultTypeColor;
    return typeColorMapping[type] || defaultTypeColor;
  }, [typeColorMapping, defaultTypeColor]);

  const getStatusColor = useCallback((status?: string): string => {
    if (!status) return defaultStatusColor;
    
    const statusColors: { [key: string]: string } = {
      completed: 'hsl(var(--success))',
      'in-progress': 'hsl(var(--primary))',
      pending: 'hsl(var(--warning))',
      scheduled: 'hsl(var(--secondary))',
      active: 'hsl(var(--success))',
      investigating: 'hsl(var(--destructive))',
      ...statusColorMapping
    };
    
    return statusColors[status] || defaultStatusColor;
  }, [statusColorMapping, defaultStatusColor]);

  const getPriorityColor = useCallback((priority?: string): string => {
    if (!priority) return defaultPriorityColor;
    
    const priorityColors: { [key: string]: string } = {
      high: 'hsl(var(--destructive))',
      medium: 'hsl(var(--warning))',
      low: 'hsl(var(--muted-foreground))',
      normal: 'hsl(var(--success))',
      ...priorityColorMapping
    };
    
    return priorityColors[priority] || defaultPriorityColor;
  }, [priorityColorMapping, defaultPriorityColor]);

  const formatTimestamp = useCallback((timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }, []);

  // Filter and search logic
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.user?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(activity => activity.type === selectedType);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(activity => activity.status === selectedStatus);
    }

    // Priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(activity => activity.priority === selectedPriority);
    }

    return filtered.slice(0, maxItems);
  }, [activities, searchTerm, selectedType, selectedStatus, selectedPriority, maxItems]);

  // Get unique values for filters
  const uniqueTypes = useMemo(() => 
    Array.from(new Set(activities.map(a => a.type).filter(Boolean))), [activities]);
  const uniqueStatuses = useMemo(() => 
    Array.from(new Set(activities.map(a => a.status).filter(Boolean))), [activities]);
  const uniquePriorities = useMemo(() => 
    Array.from(new Set(activities.map(a => a.priority).filter(Boolean))), [activities]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedStatus('all');
    setSelectedPriority('all');
  };

  const iosCardStyle: React.CSSProperties = {
    backgroundColor: 'hsl(var(--card))',
    borderRadius: '16px',
    border: 'none',
    boxShadow: '0 2px 20px hsl(var(--shadow) / 0.08)',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    ...cardStyle
  };

  const searchBarStyle: React.CSSProperties = {
    borderRadius: '12px',
    backgroundColor: 'hsl(var(--background))',
    border: '1px solid hsl(var(--border))',
    padding: '12px 16px',
    fontSize: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    transition: 'all 0.2s ease',
  };

  const activityCardStyle: React.CSSProperties = {
    backgroundColor: 'hsl(var(--card))',
    borderRadius: '12px',
    border: 'none',
    marginBottom: '12px',
    padding: '16px',
    boxShadow: '0 1px 8px hsl(var(--shadow) / 0.04)',
    transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    cursor: 'pointer'
  };

  return (
    <div 
      style={{
        height: shouldConstrainHeight ? `${effectiveHeight}px` : '100%',
        maxHeight: shouldConstrainHeight ? `${effectiveHeight}px` : undefined,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        overflow: 'hidden'
      }}
    >
      <style>{`
        .ios-activity-card {
          background: hsl(var(--card));
          border-radius: 6px;
          border: none;
          margin-bottom: 4px;
          padding: 8px 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          cursor: pointer;
          animation: slideInUp 0.3s ease-out;
          min-height: 32px;
          display: flex;
          align-items: center;
        }
        
        .ios-activity-card:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transform: translateY(-1px);
        }
        
        .ios-search-bar .ant-input {
          border-radius: 8px;
          border: 1px solid hsl(var(--border));
          padding: 6px 12px;
          font-size: 12px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
          transition: all 0.2s ease;
        }
        
        .ios-search-bar .ant-input:focus {
          border-color: hsl(var(--primary));
          box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
        }
        
        .ios-filter-select .ant-select-selector {
          border-radius: 6px;
          border: 1px solid hsl(var(--border));
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
          font-size: 12px;
          padding: 2px 8px;
        }
        
        .ios-icon {
          transition: all 0.2s ease;
        }
        
        .ios-icon:hover {
          transform: scale(1.1);
        }
        
        .ios-timestamp {
          font-size: 10px;
          color: hsl(var(--muted-foreground));
          font-weight: 500;
        }
        
        .ios-title {
          font-size: 12px;
          font-weight: 600;
          color: hsl(var(--foreground));
          margin-bottom: 0;
          line-height: 1.2;
        }
        
        .ios-description {
          font-size: 11px;
          color: hsl(var(--muted-foreground));
          line-height: 1.2;
          margin-top: 2px;
        }
        
        .ios-avatar {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          color: white;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
          flex-shrink: 0;
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .ios-empty-state {
          text-align: center;
          padding: 40px 20px;
          color: hsl(var(--muted-foreground));
        }
        
        .ios-loading {
          text-align: center;
          padding: 40px 20px;
        }
      `}</style>

      {/* Header with Search and Filters */}
      <div style={{ marginBottom: '12px' }}>
        {enableSearch && (
          <div className="ios-search-bar" style={{ marginBottom: '10px' }}>
            <Input
              placeholder={searchPlaceholder}
              prefix={<SearchOutlined style={{ color: 'hsl(var(--muted-foreground))' }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="middle"
              allowClear
            />
          </div>
        )}

        {enableFilters && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Select
              value={selectedType}
              onChange={setSelectedType}
              style={{ minWidth: '100px' }}
              className="ios-filter-select"
              size="small"
            >
              <Option value="all">All Types</Option>
              {uniqueTypes.map(type => (
                <Option key={type} value={type}>
                  {type ? type.charAt(0).toUpperCase() + type.slice(1) : ''}
                </Option>
              ))}
            </Select>

            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              style={{ minWidth: '100px' }}
              className="ios-filter-select"
              size="small"
            >
              <Option value="all">All Status</Option>
              {uniqueStatuses.map(status => (
                <Option key={status} value={status}>
                  {status ? status.charAt(0).toUpperCase() + status.slice(1) : ''}
                </Option>
              ))}
            </Select>

            <Select
              value={selectedPriority}
              onChange={setSelectedPriority}
              style={{ minWidth: '100px' }}
              className="ios-filter-select"
              size="small"
            >
              <Option value="all">All Priority</Option>
              {uniquePriorities.map(priority => (
                <Option key={priority} value={priority}>
                  {priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : ''}
                </Option>
              ))}
            </Select>

            {(searchTerm || selectedType !== 'all' || selectedStatus !== 'all' || selectedPriority !== 'all') && (
              <button
                onClick={clearFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'hsl(var(--primary))',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ClearOutlined /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Activity List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        minHeight: 0,
        maxHeight: shouldConstrainHeight ? `${effectiveHeight - 20}px` : undefined, // Reserve minimal space for padding
        ...listStyle
      }}>
        {loading ? (
          <div className="ios-loading">
            <Spin size="large" />
            <div style={{ marginTop: '16px', color: 'hsl(var(--muted-foreground))' }}>Loading activities...</div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="ios-empty-state">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {searchTerm || selectedType !== 'all' || selectedStatus !== 'all' || selectedPriority !== 'all'
                    ? 'No activities match your filters'
                    : 'No activities available'}
                </span>
              }
            />
          </div>
        ) : (
          filteredActivities.map((activity, index) => (
            <div
              key={activity.id}
              className="ios-activity-card"
              style={{
                animationDelay: `${index * 0.05}s`
              }}
            >
              {showAvatar && (
                <div 
                  className="ios-avatar"
                  style={{
                    backgroundColor: getTypeColor(activity.type),
                    marginRight: '12px'
                  }}
                >
                  {getActivityIcon(activity.icon, activity.type)}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ios-title">{activity.title}</div>
                {activity.description && (
                  <div className="ios-description">{activity.description}</div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                {showTags && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {activity.type && (
                      <span style={{
                        fontSize: '9px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: getTypeColor(activity.type),
                        color: 'white',
                        fontWeight: '500'
                      }}>
                        {activity.type}
                      </span>
                    )}
                    {activity.priority && (
                      <span style={{
                        fontSize: '9px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: getPriorityColor(activity.priority),
                        color: 'white',
                        fontWeight: '500'
                      }}>
                        {activity.priority}
                      </span>
                    )}
                  </div>
                )}

                {showTimestamp && (
                  <div className="ios-timestamp">
                    {formatTimestamp(activity.timestamp)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export class ActivityFeedWidgetClass extends BaseWidget {
  metadata = {
    id: 'activity-feed-widget',
    name: 'Enhanced Activity Feed Widget',
    version: '2.0.0',
    description: 'iOS-inspired activity feed widget with search and filtering capabilities',
    category: 'display',
    tags: ['activity', 'feed', 'list', 'search', 'filter', 'ios', 'generic'],
    widgetType: WidgetType.DISPLAY,
    dataBinding: {
      accepts: ['activities'],
      provides: ['selectedActivity', 'filteredActivities']
    },
    styling: {
      themeable: true,
      customizable: true,
      responsive: true
    },
    interactions: {
      events: ['onClick', 'onHover', 'onSearch', 'onFilter'],
      handlers: ['handleActivityClick', 'handleActivityHover', 'handleSearch', 'handleFilter']
    }
  };

  schema = {
    type: 'object',
    properties: {
      activities: {
        type: 'array',
        description: 'Array of activity items to display'
      },
      maxItems: {
        type: 'number',
        description: 'Maximum number of activities to display',
        default: 10
      },
      showTimestamp: {
        type: 'boolean',
        description: 'Whether to show timestamps',
        default: true
      },
      showAvatar: {
        type: 'boolean', 
        description: 'Whether to show avatars',
        default: true
      },
      showTags: {
        type: 'boolean',
        description: 'Whether to show tags',
        default: true
      },
      enableSearch: {
        type: 'boolean',
        description: 'Whether to enable search functionality',
        default: true
      },
      enableFilters: {
        type: 'boolean',
        description: 'Whether to enable filter functionality',
        default: true
      },
      height: {
        type: 'number',
        description: 'Height of the widget in pixels',
        default: 400
      },
      maxHeight: {
        type: 'number',
        description: 'Maximum height of the widget in pixels with scroll overflow'
      },
      loading: {
        type: 'boolean',
        description: 'Whether to show loading state',
        default: false
      }
    },
    required: ['activities'],
    dataSchema: {
      input: {
        type: 'object',
        properties: {
          activities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                timestamp: { type: 'string' },
                type: { type: 'string' },
                status: { type: 'string' },
                priority: { type: 'string' },
                icon: { type: 'string' }
              }
            }
          }
        }
      },
      output: {
        type: 'object',
        properties: {
          selectedActivity: { type: 'object' },
          filteredActivities: { type: 'array' }
        }
      }
    }
  };

  render(props: ActivityFeedWidgetProps): React.ReactNode {
    return React.createElement(ActivityFeedWidget, props);
  }

  validate(config: WidgetConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!config.props?.activities || !Array.isArray(config.props.activities)) {
      errors.push('Activities array is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getDataRequirements(): string[] {
    return ['activities'];
  }

  getOutputSchema(): any {
    return {
      type: 'object',
      properties: {
        selectedActivity: {
          type: 'object',
          description: 'Currently selected activity'
        },
        filteredActivities: {
          type: 'array',
          description: 'List of filtered activities'
        }
      }
    };
  }
}

export default ActivityFeedWidget; 