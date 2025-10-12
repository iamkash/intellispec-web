/**
 * Search Widget - Basic search and filter functionality
 * 
 * Used by ActivityFeedGadget to provide search and filter capabilities
 */

import React from 'react';
import { Input, Select, Button, Space, Tag } from 'antd';
import { SearchOutlined, FilterOutlined, ClearOutlined } from '@ant-design/icons';

const { Option } = Select;

export interface SearchWidgetProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  placeholder?: string;
  filters?: Array<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ label: string; value: string; }>;
  }>;
  onClearAll?: () => void;
  size?: 'small' | 'middle' | 'large';
  style?: React.CSSProperties;
  className?: string;
}

export const SearchWidget: React.FC<SearchWidgetProps> = ({
  searchValue = '',
  onSearchChange,
  placeholder = "Search...",
  filters = [],
  onClearAll,
  size = 'middle',
  style,
  className
}) => {
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange?.(e.target.value);
  };

  const hasActiveFilters = filters.some(filter => filter.value && filter.value !== '');

  return (
    <div 
      className={`search-widget ${className || ''}`}
      style={{
        padding: '16px',
        background: '#fff',
        border: '1px solid #f0f0f0',
        borderRadius: '6px',
        marginBottom: '16px',
        ...style
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Search Input */}
        <Input
          placeholder={placeholder}
          value={searchValue}
          onChange={handleSearch}
          prefix={<SearchOutlined />}
          allowClear
          size={size}
        />

        {/* Filter Controls */}
        {filters.length > 0 && (
          <Space wrap>
            <FilterOutlined style={{ color: '#666' }} />
            {filters.map((filter, index) => (
              <Select
                key={index}
                placeholder={filter.label}
                value={filter.value}
                onChange={filter.onChange}
                style={{ minWidth: 120 }}
                allowClear
                size={size}
              >
                {filter.options.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            ))}
            
            {/* Clear All Button */}
            {(hasActiveFilters || searchValue) && (
              <Button
                icon={<ClearOutlined />}
                onClick={onClearAll}
                size={size}
                type="text"
              >
                Clear All
              </Button>
            )}
          </Space>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div>
            <Space wrap>
              {filters.map((filter, index) => {
                if (!filter.value || filter.value === '') {
                  return null;
                }
                return (
                  <Tag
                    key={index}
                    closable
                    onClose={() => filter.onChange('')}
                    color="blue"
                  >
                    {filter.label}: {filter.value}
                  </Tag>
                );
              })}
            </Space>
          </div>
        )}
      </Space>
    </div>
  );
};

export default SearchWidget; 