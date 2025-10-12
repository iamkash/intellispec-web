/**
 * Workspace Filter Widget
 * 
 * Generic filter widget that renders different filter types based on metadata.
 * Supports: select, multiselect, daterange, text, number filters with dependencies.
 * Completely metadata-driven with no hardcoded business logic.
 */

import { ClearOutlined, FilterOutlined } from '@ant-design/icons';
import { Button, Card, Col, DatePicker, Input, Row, Select, Space } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FilterDefinition, useWorkspaceFilters } from '../../../../contexts/WorkspaceFilterContext';
import { BaseGadget } from '../../gadgets/base';

const { RangePicker } = DatePicker;
const { Option } = Select;

export interface WorkspaceFilterWidgetProps {
  filterDefinitions: FilterDefinition[];
  layout?: 'horizontal' | 'vertical' | 'compact';
  showClearAll?: boolean;
  showFilterCount?: boolean;
  className?: string;
}

export const WorkspaceFilterWidget: React.FC<WorkspaceFilterWidgetProps> = ({
  filterDefinitions,
  layout = 'horizontal',
  showClearAll = true,
  showFilterCount = true,
  className = ''
}) => {
  // Try to get workspace filters, but provide fallback if not available
  let filters: Record<string, any> = {};
  let setFilter = (_filterId: string, _value: any) => {};
  let clearFilter = (_filterId: string) => {};
  let clearAllFilters = () => {};
  let isLoading = false;

  try {
    const workspaceFilters = useWorkspaceFilters();
    filters = workspaceFilters.filters;
    setFilter = workspaceFilters.setFilter;
    clearFilter = workspaceFilters.clearFilter;
    clearAllFilters = workspaceFilters.clearAllFilters;
    isLoading = workspaceFilters.isLoading;
  } catch (error) {
    console.warn('WorkspaceFilterWidget: No filter context available, using fallback');
  }

  const [filterOptions, setFilterOptions] = useState<Record<string, Array<{ label: string; value: any }>>>({});
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>({});

  // Load dynamic filter options
  const loadFilterOptions = useCallback(async (filterDef: FilterDefinition) => {
    if (!filterDef.optionsUrl) return;

    setLoadingOptions(prev => ({ ...prev, [filterDef.id]: true }));
    
    try {
      // Build URL with query parameters for dependent filters
      let url = filterDef.optionsUrl;
      const urlParams = new URLSearchParams();
      
      // Add dependent filter values as query parameters
      const dependencies = Array.isArray(filterDef.dependsOn) ? filterDef.dependsOn : (filterDef.dependsOn ? [filterDef.dependsOn] : []);
      
      dependencies.forEach(depId => {
        if (filters[depId]) {
          const dependentValue = filters[depId].value;
          if (dependentValue) {
            if (Array.isArray(dependentValue)) {
              dependentValue.forEach(val => urlParams.append(depId, val));
            } else {
              urlParams.append(depId, dependentValue);
            }
          }
        }
      });
      
      // Add query parameters to URL if any exist
      if (urlParams.toString()) {
        url += (url.includes('?') ? '&' : '?') + urlParams.toString();
      }
const response = await BaseGadget.makeAuthenticatedFetch(url);
      const data = await response.json();
      
      // Handle different response formats
      let options: Array<{ label: string; value: any }> = [];
      
      if (Array.isArray(data)) {
        options = data.map((item: any) => ({
          label: (filterDef as any).labelField ? item[(filterDef as any).labelField] : (item.label || item.name || item.title || String(item.value || item)),
          value: (filterDef as any).valueField ? item[(filterDef as any).valueField] : (item.value || item.id || item)
        }));
      } else if (data.options && Array.isArray(data.options)) {
        options = data.options.map((item: any) => ({
          label: (filterDef as any).labelField ? item[(filterDef as any).labelField] : (item.label || item.name || item.title || String(item.value || item)),
          value: (filterDef as any).valueField ? item[(filterDef as any).valueField] : (item.value || item.id || item)
        }));
      } else if (data.data && Array.isArray(data.data)) {
        options = data.data.map((item: any) => ({
          label: (filterDef as any).labelField ? item[(filterDef as any).labelField] : (item.label || item.name || item.title || String(item.value || item)),
          value: (filterDef as any).valueField ? item[(filterDef as any).valueField] : (item.value || item.id || item)
        }));
      }
      
      setFilterOptions(prev => ({ ...prev, [filterDef.id]: options }));
      
      // Auto-select if only one option and autoSelectSingle is enabled
      if ((filterDef as any).autoSelectSingle && options.length === 1 && !filters[filterDef.id]) {
        const singleOption = options[0];
        const operator = filterDef.type === 'multiselect' ? 'in' : 'eq';
        
        setFilter(filterDef.id, {
          value: filterDef.type === 'multiselect' ? [singleOption.value] : singleOption.value,
          operator,
          label: singleOption.label
        });
      }
    } catch (error) {
      console.error(`Failed to load options for filter ${filterDef.id}:`, error);
    } finally {
      setLoadingOptions(prev => ({ ...prev, [filterDef.id]: false }));
    }
  }, [filters, setFilter]); // Add setFilter to dependencies

  // Load options for filters with optionsUrl
  useEffect(() => {
    filterDefinitions.forEach(filterDef => {
      if (filterDef.optionsUrl) {
        loadFilterOptions(filterDef);
      }
    });
  }, [filterDefinitions, loadFilterOptions]);

  // Use useRef to track previous filter values without causing re-renders
  const prevFiltersRef = useRef<Record<string, any>>({});

  // Reload dependent filters when their parent filter changes
  useEffect(() => {
    const changedFilters: string[] = [];
    
    // Detect which filters have actually changed
    Object.keys(filters).forEach(filterId => {
      const currentValue = filters[filterId]?.value;
      const prevValue = prevFiltersRef.current[filterId]?.value;
      
      if (JSON.stringify(currentValue) !== JSON.stringify(prevValue)) {
        changedFilters.push(filterId);
      }
    });

    // Also check for filters that were cleared
    Object.keys(prevFiltersRef.current).forEach(filterId => {
      if (!filters[filterId] && prevFiltersRef.current[filterId]) {
        changedFilters.push(filterId);
      }
    });

    // Only reload dependent filters if their parent has changed
    if (changedFilters.length > 0) {
      filterDefinitions.forEach(filterDef => {
        const dependencies = Array.isArray(filterDef.dependsOn) ? filterDef.dependsOn : (filterDef.dependsOn ? [filterDef.dependsOn] : []);
        const hasChangedDependency = dependencies.some(depId => changedFilters.includes(depId));
        
        if (filterDef.optionsUrl && dependencies.length > 0 && hasChangedDependency) {
          // Clear existing options and reload
          setFilterOptions(prev => ({ ...prev, [filterDef.id]: [] }));
          
          // Clear the dependent filter value since it may no longer be valid
          if (filters[filterDef.id]) {
            clearFilter(filterDef.id);
          }
          
          loadFilterOptions(filterDef);
        }
      });
    }

    // Update previous filters after processing
    prevFiltersRef.current = filters;
  }, [filters, filterDefinitions, loadFilterOptions, clearFilter]);

  const renderFilter = (filterDef: FilterDefinition) => {
    const currentFilter = filters[filterDef.id];
    const options = filterOptions[filterDef.id] || filterDef.options || [];
    const isLoadingThisFilter = loadingOptions[filterDef.id];

    const handleChange = (value: any) => {
      if (value === undefined || value === null || value === '') {
        clearFilter(filterDef.id);
      } else {
        const operator = filterDef.type === 'multiselect' ? 'in' : 
                        filterDef.type === 'daterange' ? 'between' : 'eq';
        
        setFilter(filterDef.id, {
          value,
          operator,
          label: filterDef.type === 'select' || filterDef.type === 'multiselect' 
            ? options.find(opt => opt.value === value)?.label 
            : undefined
        });
      }
    };

    const commonProps = {
      placeholder: filterDef.placeholder || `Select ${filterDef.label}`,
      loading: isLoadingThisFilter,
      disabled: isLoading,
      style: { width: '100%' }
    };

    switch (filterDef.type) {
      case 'select':
        return (
          <Select
            {...commonProps}
            value={currentFilter?.value}
            onChange={handleChange}
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {options.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        );

      case 'multiselect':
        return (
          <Select
            {...commonProps}
            mode="multiple"
            value={currentFilter?.value}
            onChange={handleChange}
            allowClear
            showSearch
            optionFilterProp="children"
            maxTagCount="responsive"
          >
            {options.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        );

      case 'daterange':
        return (
          <RangePicker
            value={currentFilter?.value ? [dayjs(currentFilter.value[0]), dayjs(currentFilter.value[1])] : null}
            onChange={(dates) => {
              if (dates && dates.length === 2 && dates[0] && dates[1]) {
                handleChange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
              } else {
                handleChange(null);
              }
            }}
            format="YYYY-MM-DD"
            placeholder={[filterDef.placeholder || 'Start date', 'End date']}
            disabled={isLoading || isLoadingThisFilter}
            style={{ width: '100%' }}
            presets={[
              { label: 'This Month', value: [dayjs().startOf('month'), dayjs()] },
              { label: 'This Quarter', value: [dayjs().startOf('month').subtract(dayjs().month() % 3, 'month'), dayjs()] },
              { label: 'YTD', value: [dayjs().startOf('year'), dayjs()] },
              { label: 'Last 30 Days', value: [dayjs().subtract(30, 'day'), dayjs()] },
              { label: 'Last 90 Days', value: [dayjs().subtract(90, 'day'), dayjs()] }
            ]}
          />
        );

      case 'text':
        return (
          <Input
            {...commonProps}
            value={currentFilter?.value}
            onChange={(e) => handleChange(e.target.value)}
            allowClear
          />
        );

      case 'number':
        return (
          <Input
            {...commonProps}
            type="number"
            value={currentFilter?.value}
            onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : undefined)}
            min={filterDef.validation?.min}
            max={filterDef.validation?.max}
          />
        );

      default:
        return (
          <Input
            {...commonProps}
            value={currentFilter?.value}
            onChange={(e) => handleChange(e.target.value)}
            allowClear
          />
        );
    }
  };

  const activeFilterCount = Object.keys(filters).length;

  const renderCompactLayout = () => (
    <Card 
      size="small" 
      className={className}
      title={
        <Space>
          <FilterOutlined />
          Filters
          {showFilterCount && activeFilterCount > 0 && (
            <span style={{ 
              background: 'hsl(var(--primary))', 
              color: 'hsl(var(--primary-foreground))',
              borderRadius: '10px',
              padding: '2px 8px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {activeFilterCount}
            </span>
          )}
        </Space>
      }
      extra={
        showClearAll && activeFilterCount > 0 && (
          <Button 
            type="text" 
            size="small" 
            icon={<ClearOutlined />}
            onClick={clearAllFilters}
          >
            Clear All
          </Button>
        )
      }
    >
      <Row gutter={[16, 16]}>
        {filterDefinitions.map(filterDef => (
          <Col key={filterDef.id} xs={24} sm={12} md={8} lg={6}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '4px', 
                fontSize: '12px',
                fontWeight: 500,
                color: 'hsl(var(--muted-foreground))'
              }}>
                {filterDef.label}
                {filterDef.required && <span style={{ color: 'hsl(var(--destructive))' }}>*</span>}
              </label>
              {renderFilter(filterDef)}
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );

  const renderHorizontalLayout = () => (
    <Card size="small" className={className}>
      <Row gutter={[16, 16]} align="middle">
        {filterDefinitions.map(filterDef => (
          <Col key={filterDef.id} flex="1" style={{ minWidth: '200px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '4px', 
                fontSize: '12px',
                fontWeight: 500,
                color: 'hsl(var(--muted-foreground))'
              }}>
                {filterDef.label}
                {filterDef.required && <span style={{ color: 'hsl(var(--destructive))' }}>*</span>}
              </label>
              {renderFilter(filterDef)}
            </div>
          </Col>
        ))}
        {showClearAll && (
          <Col>
            <Button 
              type="default" 
              icon={<ClearOutlined />}
              onClick={clearAllFilters}
              disabled={activeFilterCount === 0}
            >
              Clear All
            </Button>
          </Col>
        )}
      </Row>
    </Card>
  );

  const renderVerticalLayout = () => (
    <Card size="small" className={className}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {filterDefinitions.map(filterDef => (
          <div key={filterDef.id}>
            <label style={{ 
              display: 'block', 
              marginBottom: '4px', 
              fontSize: '12px',
              fontWeight: 500,
              color: 'hsl(var(--muted-foreground))'
            }}>
              {filterDef.label}
              {filterDef.required && <span style={{ color: 'hsl(var(--destructive))' }}>*</span>}
            </label>
            {renderFilter(filterDef)}
          </div>
        ))}
        {showClearAll && (
          <Button 
            type="default" 
            icon={<ClearOutlined />}
            onClick={clearAllFilters}
            disabled={activeFilterCount === 0}
            style={{ width: '100%' }}
          >
            Clear All Filters
          </Button>
        )}
      </Space>
    </Card>
  );

  switch (layout) {
    case 'compact':
      return renderCompactLayout();
    case 'vertical':
      return renderVerticalLayout();
    case 'horizontal':
    default:
      return renderHorizontalLayout();
  }
};

export default WorkspaceFilterWidget;
