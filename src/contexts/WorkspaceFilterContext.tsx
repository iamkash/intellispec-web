/**
 * Workspace Filter Context
 * 
 * Provides workspace-level filter state management that propagates to all gadgets.
 * Completely generic and metadata-driven - no hardcoded filter logic.
 */

import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

export interface FilterValue {
  value: any;
  label?: string;
  operator?: 'eq' | 'in' | 'between' | 'gte' | 'lte' | 'like' | 'exists';
}

export interface WorkspaceFilters {
  [key: string]: FilterValue;
}

export interface FilterDefinition {
  id: string;
  type: 'select' | 'multiselect' | 'daterange' | 'text' | 'number';
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: any;
  options?: Array<{ label: string; value: any }>;
  optionsUrl?: string;
  labelField?: string; // Field to use for display labels when using optionsUrl
  valueField?: string; // Field to use for values when using optionsUrl
  dependsOn?: string | string[]; // ID(s) of parent filter(s) that this filter depends on
  autoSelectSingle?: boolean; // Automatically select if only one option is available
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  dependencies?: string[]; // Other filter IDs this depends on
  refreshTrigger?: boolean; // Whether changing this filter should trigger refresh
}

export interface WorkspaceFilterContextValue {
  filters: WorkspaceFilters;
  filterDefinitions: FilterDefinition[];
  setFilter: (filterId: string, value: FilterValue) => void;
  clearFilter: (filterId: string) => void;
  clearAllFilters: () => void;
  getFilterQuery: () => Record<string, any>; // Convert filters to API query params
  isLoading: boolean;
  refreshTrigger: number; // Increments when filters change to trigger gadget refresh
}

const WorkspaceFilterContext = createContext<WorkspaceFilterContextValue | undefined>(undefined);

export interface WorkspaceFilterProviderProps {
  children: ReactNode;
  filterDefinitions: FilterDefinition[];
  onFiltersChange?: (filters: WorkspaceFilters) => void;
}

export const WorkspaceFilterProvider: React.FC<WorkspaceFilterProviderProps> = ({
  children,
  filterDefinitions,
  onFiltersChange
}) => {
  const [filters, setFilters] = useState<WorkspaceFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Initialize default filter values
  useEffect(() => {
    const defaultFilters: WorkspaceFilters = {};
    filterDefinitions.forEach(def => {
      if (def.defaultValue !== undefined) {
        defaultFilters[def.id] = {
          value: def.defaultValue,
          operator: def.type === 'multiselect' ? 'in' : 'eq'
        };
      }
    });
    
    if (Object.keys(defaultFilters).length > 0) {
      setFilters(defaultFilters);
    }
  }, [filterDefinitions]);

  const setFilter = useCallback((filterId: string, filterValue: FilterValue) => {
setFilters(prev => {
      const newFilters = { ...prev, [filterId]: filterValue };
      
      // Clear dependent filters when a dependency changes
      const filterDef = filterDefinitions.find(def => def.id === filterId);
      if (filterDef) {
        filterDefinitions.forEach(def => {
          if (def.dependencies?.includes(filterId)) {
            delete newFilters[def.id];
          }
        });
      }
return newFilters;
    });

    // Trigger refresh if this filter requires it
    const filterDef = filterDefinitions.find(def => def.id === filterId);
    if (filterDef?.refreshTrigger !== false) {
      setRefreshTrigger(prev => {
        const newTrigger = prev + 1;
return newTrigger;
      });
    }
  }, [filterDefinitions]);

  const clearFilter = useCallback((filterId: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[filterId];
      
      // Clear dependent filters
      const filterDef = filterDefinitions.find(def => def.id === filterId);
      if (filterDef) {
        filterDefinitions.forEach(def => {
          if (def.dependencies?.includes(filterId)) {
            delete newFilters[def.id];
          }
        });
      }
      
      return newFilters;
    });
    
    setRefreshTrigger(prev => prev + 1);
  }, [filterDefinitions]);

  const clearAllFilters = useCallback(() => {
setFilters({});
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const getFilterQuery = useCallback((): Record<string, any> => {
    const query: Record<string, any> = {};
    
    Object.entries(filters).forEach(([filterId, filterValue]) => {
      const filterDef = filterDefinitions.find(def => def.id === filterId);
      if (!filterDef || !filterValue.value) return;
      
      const { value, operator = 'eq' } = filterValue;
      
      switch (operator) {
        case 'eq':
          query[filterId] = value;
          break;
        case 'in':
          query[`${filterId}__in`] = Array.isArray(value) ? value.join(',') : value;
          break;
        case 'between':
          if (Array.isArray(value) && value.length === 2) {
            query[`${filterId}__gte`] = value[0];
            query[`${filterId}__lte`] = value[1];
          }
          break;
        case 'gte':
          query[`${filterId}__gte`] = value;
          break;
        case 'lte':
          query[`${filterId}__lte`] = value;
          break;
        case 'like':
          query[`${filterId}__like`] = value;
          break;
        case 'exists':
          query[`${filterId}__exists`] = value;
          break;
        default:
          query[filterId] = value;
      }
    });
    
    return query;
  }, [filters, filterDefinitions]);

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange?.(filters);
  }, [filters]); // Removed onFiltersChange from deps to prevent loops

  const contextValue: WorkspaceFilterContextValue = {
    filters,
    filterDefinitions,
    setFilter,
    clearFilter,
    clearAllFilters,
    getFilterQuery,
    isLoading,
    refreshTrigger
  };

  return (
    <WorkspaceFilterContext.Provider value={contextValue}>
      {children}
    </WorkspaceFilterContext.Provider>
  );
};

export const useWorkspaceFilters = (): WorkspaceFilterContextValue => {
  const context = useContext(WorkspaceFilterContext);
  if (!context) {
    throw new Error('useWorkspaceFilters must be used within a WorkspaceFilterProvider');
  }
  return context;
};

// Optional version that returns a default state if not within provider
export const useOptionalWorkspaceFilters = (): WorkspaceFilterContextValue => {
  const context = useContext(WorkspaceFilterContext);
  if (!context) {
    return {
      filters: {},
      filterDefinitions: [],
      setFilter: () => {},
      clearFilter: () => {},
      clearAllFilters: () => {},
      getFilterQuery: () => ({}),
      isLoading: false,
      refreshTrigger: 0
    };
  }
  return context;
};

export default WorkspaceFilterContext;
