/**
 * Activity Feed Gadget
 * 
 * A complete gadget that combines search functionality with activity feed display.
 * This gadget provides a unified interface for searching and displaying activities.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { BaseGadget, GadgetConfig, GadgetType, GadgetMetadata, GadgetSchema } from '../base';
import { ValidationResult } from '../../core/base';
import { SearchWidget } from '../../widgets/input';
import { ActivityFeedWidget, ActivityItem } from '../../widgets/display/ActivityFeedWidget';
// Note: Using CSS variables directly instead of useTheme for better compatibility

export interface ActivityFeedGadgetProps {
  // Data configuration - completely flat
  dataUrl?: string;
  dataPath?: string;
  activities?: ActivityItem[];
  // Display options - flat
  maxItems?: number;
  showTimestamp?: boolean;
  showAvatar?: boolean;
  showTags?: boolean;
  loading?: boolean;
  searchPlaceholder?: string;
  height?: number;
  maxHeight?: number;
  enableSearch?: boolean;
  enableFilters?: boolean;
  // Color mappings - flat
  typeColors?: Record<string, string>;
  statusColors?: Record<string, string>;
  priorityColors?: Record<string, string>;
}

export const ActivityFeedGadget: React.FC<ActivityFeedGadgetProps> = ({
  dataUrl,
  dataPath = 'activities',
  activities = [],
  maxItems = 10,
  showTimestamp = true,
  showAvatar = true,
  showTags = true,
  loading: externalLoading = false,
  searchPlaceholder = "Search activities...",
  height = 400,
  maxHeight,
  enableSearch = true,
  enableFilters = true,
  typeColors = {},
  statusColors = {},
  priorityColors = {}
}) => {
  // Note: theme context available but using CSS variables directly for compatibility
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [fetchedActivities, setFetchedActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch data when dataUrl changes
  useEffect(() => {
    if (dataUrl) {
      setLoading(true);
      fetch(dataUrl)
        .then(response => response.json())
        .then(data => {
          // Extract activities from the specified data path
          const pathParts = dataPath.split('.');
          let extractedData = data;
          for (const part of pathParts) {
            extractedData = extractedData?.[part];
          }
          setFetchedActivities(Array.isArray(extractedData) ? extractedData : []);
        })
        .catch(error => {
          console.error('Failed to fetch activities:', error);
          setFetchedActivities([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [dataUrl, dataPath]);

  // Combine fetched activities with provided activities
  const allActivities = useMemo(() => {
    return [...fetchedActivities, ...activities];
  }, [fetchedActivities, activities]);

  const isLoading = loading || externalLoading;

  // Filter and search logic
  const filteredActivities = useMemo(() => {
    let filtered = allActivities;

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
  }, [allActivities, searchTerm, selectedType, selectedStatus, selectedPriority, maxItems]);

  // Get unique values for filters
  const uniqueTypes = useMemo(() => 
    Array.from(new Set(allActivities.map(a => a.type).filter(Boolean))) as string[], [allActivities]);
  const uniqueStatuses = useMemo(() => 
    Array.from(new Set(allActivities.map(a => a.status).filter(Boolean))) as string[], [allActivities]);
  const uniquePriorities = useMemo(() => 
    Array.from(new Set(allActivities.map(a => a.priority).filter(Boolean))) as string[], [allActivities]);

  // Create filter configurations for SearchWidget
  const filters: Array<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
  }> = [];
  
  if (enableFilters) {
    if (uniqueTypes.length > 0) {
      filters.push({
        label: 'Type',
        value: selectedType,
        onChange: setSelectedType,
        options: [
          { value: 'all', label: 'All Types' },
          ...uniqueTypes.filter(Boolean).map(type => ({ 
            value: type, 
            label: type.charAt(0).toUpperCase() + type.slice(1)
          }))
        ]
      });
    }

    if (uniqueStatuses.length > 0) {
      filters.push({
        label: 'Status',
        value: selectedStatus,
        onChange: setSelectedStatus,
        options: [
          { value: 'all', label: 'All Status' },
          ...uniqueStatuses.filter(Boolean).map(status => ({ 
            value: status, 
            label: status.charAt(0).toUpperCase() + status.slice(1)
          }))
        ]
      });
    }

    if (uniquePriorities.length > 0) {
      filters.push({
        label: 'Priority',
        value: selectedPriority,
        onChange: setSelectedPriority,
        options: [
          { value: 'all', label: 'All Priority' },
          ...uniquePriorities.filter(Boolean).map(priority => ({ 
            value: priority, 
            label: priority.charAt(0).toUpperCase() + priority.slice(1)
          }))
        ]
      });
    }
  }

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedStatus('all');
    setSelectedPriority('all');
  };

  return (
    <div style={{ height: '100%' }}>
      <style>{`
        .activity-feed-gadget {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .activity-feed-header {
          flex-shrink: 0;
          padding: 16px;
          border-bottom: 1px solid hsl(var(--border));
        }
        
        .activity-feed-content {
          flex: 1;
          overflow: hidden;
        }
        
        .activity-feed-title {
          font-size: 18px;
          font-weight: 700;
          color: hsl(var(--foreground));
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .activity-feed-count {
          font-size: 12px;
          color: #8E8E93;
        }
      `}</style>

      <div className="activity-feed-gadget">
        <div className="activity-feed-header">
          <div className="activity-feed-title">
            <span>Activity Feed</span>
            <span className="activity-feed-count">
              {filteredActivities.length} of {allActivities.length}
            </span>
          </div>
          
          {enableSearch && (
            <SearchWidget
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              placeholder={searchPlaceholder}
              filters={filters}
              onClearAll={clearFilters}
              size="middle"
            />
          )}
        </div>

        <div className="activity-feed-content">
          <ActivityFeedWidget
            activities={filteredActivities}
            maxItems={maxItems}
            showTimestamp={showTimestamp}
            showAvatar={showAvatar}
            showTags={showTags}
            loading={isLoading}
            height={height - 140}
            maxHeight={maxHeight ? maxHeight - 80 : undefined}
            enableSearch={false} // Search is handled by SearchWidget above
            enableFilters={false} // Filters are handled by SearchWidget above
            typeColorMapping={typeColors}
            statusColorMapping={statusColors}
            priorityColorMapping={priorityColors}
            cardStyle={{ border: 'none', boxShadow: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

export class ActivityFeedGadgetClass extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'activity-feed-gadget',
    name: 'Activity Feed Gadget',
    version: '1.0.0',
    description: 'Complete activity feed with search and filtering capabilities',
    author: 'Gadget Library',
    tags: ['activity', 'feed', 'search', 'gadget'],
    category: 'display',
    gadgetType: GadgetType.DASHBOARD,
    widgetTypes: ['activity-feed', 'search'],
    dataFlow: {
      inputs: ['activities-data'],
      outputs: ['filtered-activities'],
      transformations: ['search-filter', 'data-formatting']
    },
    layout: {
      type: 'flex',
      responsive: true
    },
    interactions: {
      events: ['search-change', 'filter-change'],
      handlers: ['onSearch', 'onFilter'],
      workflows: ['data-filtering']
    }
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      dataUrl: {
        type: 'string',
        description: 'URL to fetch activity data from'
      },
      dataPath: {
        type: 'string',
        description: 'Path within the fetched data to extract activities',
        default: 'activities'
      },
      activities: {
        type: 'array',
        description: 'Array of activity items to display (optional if dataUrl is provided)'
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
      loading: {
        type: 'boolean',
        description: 'Whether to show loading state',
        default: false
      },
      searchPlaceholder: {
        type: 'string',
        description: 'Placeholder text for search input'
      },
      height: {
        type: 'number',
        description: 'Height of the gadget',
        default: 400
      },
      maxHeight: {
        type: 'number',
        description: 'Maximum height of the gadget with scroll overflow'
      },
      enableSearch: {
        type: 'boolean',
        description: 'Enable search functionality',
        default: true
      },
      enableFilters: {
        type: 'boolean',
        description: 'Enable filter functionality',
        default: true
      },
      typeColors: {
        type: 'object',
        description: 'Color mapping for activity types'
      },
      statusColors: {
        type: 'object',
        description: 'Color mapping for activity statuses'
      },
      priorityColors: {
        type: 'object',
        description: 'Color mapping for activity priorities'
      }
    },
    required: [],
    widgetSchemas: {
      'activity-feed': {
        type: 'object',
        properties: {
          activities: { type: 'array' },
          maxItems: { type: 'number' },
          showTimestamp: { type: 'boolean' },
          showAvatar: { type: 'boolean' },
          showTags: { type: 'boolean' }
        }
      },
      'search': {
        type: 'object',
        properties: {
          searchValue: { type: 'string' },
          placeholder: { type: 'string' },
          filters: { type: 'array' }
        }
      }
    }
  };

  renderBody(props: ActivityFeedGadgetProps): React.ReactNode {
    return React.createElement(ActivityFeedGadget, props);
  }

  validate(config: GadgetConfig): ValidationResult {
    const errors: string[] = [];
    
    // Basic validation - the actual data will be provided at runtime
    if (!config) {
      errors.push('Gadget configuration is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getRequiredWidgets(): string[] {
    return ['activity-feed', 'search'];
  }

  getWidgetLayout(): Record<string, any> {
    return {
      search: { position: 'top', width: '100%' },
      'activity-feed': { position: 'main', width: '100%', flex: 1 }
    };
  }

  processDataFlow(data: any): any {
    return {
      activities: data?.activities || [],
      filteredActivities: data?.filteredActivities || [],
      searchTerm: data?.searchTerm || ''
    };
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

export default ActivityFeedGadget; 