import React, { useState, useMemo } from 'react';
import { Card, Input, Select, Space, Button, Tag, Progress, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
// Note: Using CSS variables directly instead of useTheme for better compatibility

const { Search } = Input;
const { Option } = Select;

export interface CardItem {
  id: string;
  title: string;
  description: string;
  status: string;
  priority?: string;
  progress?: number;
  client?: string;
  industry?: string;
  location?: string;
  value?: string;
  assignedTo?: string;
  tags?: string[];
  image?: string;
  dueDate?: string;
  timestamp?: string;
  lastActivity?: string;
}

export interface CardSelectorWidgetProps {
  data: CardItem[];
  title?: string;
  maxItems?: number;
  showSearch?: boolean;
  showFilters?: boolean;
  searchPlaceholder?: string;
  cardLayout?: 'grid' | 'list';
  showActionButtons?: boolean;
  actionButtons?: Array<{
    key: string;
    label: string;
    type: 'link' | 'primary' | 'default';
    route: string;
  }>;
  cardConfig?: {
    showImage?: boolean;
    showStatus?: boolean;
    showProgress?: boolean;
    showClient?: boolean;
    showIndustry?: boolean;
    showDueDate?: boolean;
    showTags?: boolean;
  };
  onCardClick?: (item: CardItem) => void;
  onActionClick?: (action: string, item?: CardItem) => void;
}

export const CardSelectorWidget: React.FC<CardSelectorWidgetProps> = ({
  data = [],
  title = 'Cards',
  maxItems = 6,
  showSearch = true,
  showFilters = true,
  searchPlaceholder = 'Search...',
  cardLayout = 'grid',
  showActionButtons = false,
  actionButtons = [],
  cardConfig = {},
  onCardClick,
  onActionClick
}) => {
  // Note: theme context available but using CSS variables directly for compatibility
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');

  // Get unique values for filters
  const statuses = useMemo(() => Array.from(new Set(data.map(item => item.status))), [data]);
  const priorities = useMemo(() => Array.from(new Set(data.map(item => item.priority).filter(Boolean))), [data]);
  const industries = useMemo(() => Array.from(new Set(data.map(item => item.industry).filter(Boolean))), [data]);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return data
      .filter(item => {
        const matchesSearch = !searchTerm || 
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;
        const matchesIndustry = industryFilter === 'all' || item.industry === industryFilter;
        
        return matchesSearch && matchesStatus && matchesPriority && matchesIndustry;
      })
      .slice(0, maxItems);
  }, [data, searchTerm, statusFilter, priorityFilter, industryFilter, maxItems]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'in progress': return 'processing';
      case 'planning': return 'warning';
      case 'on hold': return 'error';
      case 'review': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const renderCard = (item: CardItem) => (
    <Card
      key={item.id}
      hoverable
      style={{
        marginBottom: cardLayout === 'list' ? 16 : 0,
        cursor: 'pointer',
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px',
        transition: 'all 0.2s'
      }}
      onClick={() => onCardClick?.(item)}
      actions={showActionButtons ? [
        <Tooltip title="View Details">
          <EyeOutlined key="view" onClick={(e) => {
            e.stopPropagation();
            onActionClick?.('view', item);
          }} />
        </Tooltip>,
        <Tooltip title="Edit">
          <EditOutlined key="edit" onClick={(e) => {
            e.stopPropagation();
            onActionClick?.('edit', item);
          }} />
        </Tooltip>
      ] : undefined}
    >
      <div style={{ display: 'flex', flexDirection: cardLayout === 'list' ? 'row' : 'column', gap: 12 }}>
        {cardConfig.showImage && item.image && (
          <div style={{ 
            width: cardLayout === 'list' ? 120 : '100%', 
            height: cardLayout === 'list' ? 80 : 120,
            backgroundImage: `url(${item.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '6px',
            flexShrink: 0
          }} />
        )}
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <h4 style={{ 
              margin: 0, 
              fontSize: '16px', 
              fontWeight: 600,
              color: 'hsl(var(--foreground))',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {item.title}
            </h4>
            {cardConfig.showStatus && (
              <Tag color={getStatusColor(item.status)} style={{ marginLeft: 8, flexShrink: 0 }}>
                {item.status}
              </Tag>
            )}
          </div>
          
          <p style={{ 
            margin: '0 0 8px 0', 
            fontSize: '14px', 
            color: 'hsl(var(--muted-foreground))',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {item.description}
          </p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {cardConfig.showClient && item.client && (
              <Tag color="blue" style={{ fontSize: '12px' }}>
                {item.client}
              </Tag>
            )}
            {cardConfig.showIndustry && item.industry && (
              <Tag color="purple" style={{ fontSize: '12px' }}>
                {item.industry}
              </Tag>
            )}
            {item.priority && (
              <Tag color={getPriorityColor(item.priority)} style={{ fontSize: '12px' }}>
                {item.priority}
              </Tag>
            )}
          </div>
          
          {cardConfig.showProgress && item.progress !== undefined && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>Progress</span>
                <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>{item.progress}%</span>
              </div>
              <Progress 
                percent={item.progress} 
                size="small" 
                showInfo={false}
                strokeColor={'hsl(var(--primary))'}
              />
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
            {cardConfig.showDueDate && item.dueDate && (
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                Due: {new Date(item.dueDate).toLocaleDateString()}
              </span>
            )}
            {item.value && (
              <span style={{ 
                color: 'hsl(var(--primary))', 
                fontWeight: 600,
                fontSize: '14px'
              }}>
                {item.value}
              </span>
            )}
          </div>
          
          {cardConfig.showTags && item.tags && item.tags.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {item.tags.slice(0, 3).map((tag, index) => (
                <Tag key={index} style={{ fontSize: '11px', marginBottom: 4 }}>
                  {tag}
                </Tag>
              ))}
              {item.tags.length > 3 && (
                <Tag style={{ fontSize: '11px', marginBottom: 4 }}>
                  +{item.tags.length - 3} more
                </Tag>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 12
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '18px', 
          fontWeight: 600,
          color: 'hsl(var(--foreground))'
        }}>
          {title}
        </h3>
        
        {showActionButtons && actionButtons.length > 0 && (
          <Space>
            {actionButtons.map(button => (
              <Button
                key={button.key}
                type={button.type}
                size="small"
                onClick={() => onActionClick?.(button.key)}
              >
                {button.label}
              </Button>
            ))}
          </Space>
        )}
      </div>
      
      {(showSearch || showFilters) && (
        <div style={{ 
          display: 'flex', 
          gap: 12, 
          marginBottom: 16,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {showSearch && (
            <Search
              placeholder={searchPlaceholder}
              allowClear
              style={{ width: 250 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          )}
          
          {showFilters && (
            <Space>
              {statuses.length > 0 && (
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: 120 }}
                  size="small"
                >
                  <Option value="all">All Status</Option>
                  {statuses.map(status => (
                    <Option key={status} value={status}>{status}</Option>
                  ))}
                </Select>
              )}
              
              {priorities.length > 0 && (
                <Select
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                  style={{ width: 120 }}
                  size="small"
                >
                  <Option value="all">All Priority</Option>
                  {priorities.map(priority => (
                    <Option key={priority} value={priority}>{priority}</Option>
                  ))}
                </Select>
              )}
              
              {industries.length > 0 && (
                <Select
                  value={industryFilter}
                  onChange={setIndustryFilter}
                  style={{ width: 150 }}
                  size="small"
                >
                  <Option value="all">All Industries</Option>
                  {industries.map(industry => (
                    <Option key={industry} value={industry}>{industry}</Option>
                  ))}
                </Select>
              )}
            </Space>
          )}
        </div>
      )}
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: cardLayout === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr',
        gap: 16
      }}>
        {filteredData.map(renderCard)}
      </div>
      
      {filteredData.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'hsl(var(--muted-foreground))'
        }}>
          <p>No items found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}; 
