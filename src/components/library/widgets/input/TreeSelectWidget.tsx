/**
 * TreeSelectWidget - Hierarchical data selection component
 * 
 * A form input widget that allows users to select values from a tree structure.
 * Supports single/multiple selection, search, async loading, and custom tree data.
 * Perfect for organizational charts, file systems, category hierarchies, etc.
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { TreeSelect, Space, Tooltip, Button } from 'antd';
import { ReloadOutlined, ExpandOutlined, CompressOutlined } from '@ant-design/icons';
import { sanitizeData } from '../../../../utils/sanitizeData';

// TreeSelect option interface
export interface TreeSelectOption {
  value: string | number;
  title: string;
  children?: TreeSelectOption[];
  disabled?: boolean;
  disableCheckbox?: boolean;
  checkable?: boolean;
  selectable?: boolean;
  isLeaf?: boolean;
  icon?: React.ReactNode;
  key?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

// TreeSelect widget props
export interface TreeSelectWidgetProps {
  id: string;
  label?: string;
  placeholder?: string;
  value?: string | number | string[] | number[];
  defaultValue?: string | number | string[] | number[];
  onChange?: (value: string | number | string[] | number[], label?: any, extra?: any) => void;
  onSelect?: (value: string | number | string[] | number[], option: any) => void;
  onDeselect?: (value: string | number | string[] | number[], option: any) => void;
  onTreeExpand?: (expandedKeys: any[]) => void;
  onDropdownVisibleChange?: (visible: boolean) => void;
  onSearch?: (value: string) => void;
  onFocus?: (e: React.FocusEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;
  onClear?: () => void;
  
  // Data and configuration
  treeData: TreeSelectOption[];
  multiple?: boolean;
  treeCheckable?: boolean;
  treeCheckStrictly?: boolean;
  treeDefaultExpandAll?: boolean;
  treeDefaultExpandedKeys?: string[];
  treeExpandedKeys?: string[];
  
  // Appearance
  size?: 'small' | 'middle' | 'large';
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
  disabled?: boolean;
  allowClear?: boolean;
  showSearch?: boolean;
  searchValue?: string;
  autoClearSearchValue?: boolean;
  maxTagCount?: number | 'responsive';
  maxTagPlaceholder?: React.ReactNode | ((omittedValues: any[]) => React.ReactNode);
  
  // Dropdown configuration
  dropdownStyle?: React.CSSProperties;
  dropdownClassName?: string;
  dropdownMatchSelectWidth?: boolean | number;
  dropdownRender?: (menu: React.ReactNode) => React.ReactNode;
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
  
  // Loading and async
  loading?: boolean;
  loadData?: (node: any) => Promise<void>;
  
  // Filtering
  treeNodeFilterProp?: string;
  filterTreeNode?: boolean | ((inputValue: string, treeNode: any) => boolean);
  
  // Display
  treeNodeLabelProp?: string;
  showCheckedStrategy?: 'SHOW_ALL' | 'SHOW_PARENT' | 'SHOW_CHILD';
  
  // Custom rendering
  treeIcon?: boolean | React.ReactNode | ((props: any) => React.ReactNode);
  switcherIcon?: React.ReactNode | ((props: any) => React.ReactNode);
  
  // Validation
  required?: boolean;
  validateOnChange?: boolean;
  validator?: (value: any) => string | null;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  
  // Actions
  actions?: {
    refresh?: () => void;
    expandAll?: () => void;
    collapseAll?: () => void;
    selectAll?: () => void;
    clearAll?: () => void;
  };
}

/**
 * TreeSelectWidget Component
 * 
 * Provides hierarchical data selection with tree structure visualization.
 * Supports single/multiple selection, async loading, and comprehensive customization.
 */
export const TreeSelectWidget: React.FC<TreeSelectWidgetProps> = ({
  id,
  label,
  placeholder = "Please select",
  value,
  defaultValue,
  onChange,
  onSelect,
  onDeselect,
  onTreeExpand,
  onDropdownVisibleChange,
  onSearch,
  onFocus,
  onBlur,
  onClear,
  
  treeData,
  multiple = false,
  treeCheckable = false,
  treeCheckStrictly = false,
  treeDefaultExpandAll = false,
  treeDefaultExpandedKeys,
  treeExpandedKeys,
  
  size = 'middle',
  variant,
  disabled = false,
  allowClear = true,
  showSearch = true,
  searchValue,
  autoClearSearchValue = true,
  maxTagCount = 'responsive',
  maxTagPlaceholder,
  
  dropdownStyle,
  dropdownClassName,
  dropdownMatchSelectWidth = true,
  dropdownRender,
  placement = 'bottomLeft',
  
  loading = false,
  loadData,
  
  treeNodeFilterProp = 'title',
  filterTreeNode = true,
  
  treeNodeLabelProp = 'title',
  showCheckedStrategy = 'SHOW_CHILD',
  
  treeIcon = false,
  switcherIcon,
  
  required = false,
  validateOnChange = false,
  validator,
  
  className,
  style,
  
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  
  actions,
}) => {
  const [internalValue, setInternalValue] = useState<string | number | string[] | number[] | undefined>(value || defaultValue);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Sync internal state with prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // Sanitize tree data
  const sanitizedTreeData = useMemo(() => {
    return sanitizeData(treeData) as TreeSelectOption[];
  }, [treeData]);

  // Validation function
  const validateValue = useCallback((val: any): string | null => {
    if (required && (!val || (Array.isArray(val) && val.length === 0))) {
      return 'This field is required';
    }
    
    if (validator) {
      return validator(val);
    }
    
    return null;
  }, [required, validator]);

  // Handle value change
  const handleChange = useCallback((
    newValue: string | number | string[] | number[],
    label?: any,
    extra?: any
  ) => {
    // Always update internal state immediately for visual feedback
    setInternalValue(newValue);
    
    if (validateOnChange) {
      const error = validateValue(newValue);
      setValidationError(error);
    }
    
    onChange?.(newValue, label, extra);
  }, [onChange, validateOnChange, validateValue]);

  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    onSearch?.(value);
  }, [onSearch]);

  // Handle tree expansion
  const handleTreeExpand = useCallback((expandedKeys: any[]) => {
    setIsExpanded(expandedKeys.length > 0);
    onTreeExpand?.(expandedKeys);
  }, [onTreeExpand]);

  // Action handlers
  const handleRefresh = useCallback(() => {
    actions?.refresh?.();
  }, [actions]);

  const handleExpandAll = useCallback(() => {
    actions?.expandAll?.();
    setIsExpanded(true);
  }, [actions]);

  const handleCollapseAll = useCallback(() => {
    actions?.collapseAll?.();
    setIsExpanded(false);
  }, [actions]);

  const handleSelectAll = useCallback(() => {
    if (multiple) {
      const getAllValues = (nodes: TreeSelectOption[]): (string | number)[] => {
        const values: (string | number)[] = [];
        nodes.forEach(node => {
          if (!node.disabled) {
            values.push(node.value);
          }
          if (node.children) {
            values.push(...getAllValues(node.children));
          }
        });
        return values;
      };
      
      const allValues = getAllValues(sanitizedTreeData);
      handleChange(allValues as string[] | number[]);
    }
  }, [multiple, sanitizedTreeData, handleChange]);

  const handleClearAll = useCallback(() => {
    handleChange(multiple ? [] : undefined as any);
  }, [multiple, handleChange]);

  // Update internal value when prop changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Render action buttons
  const renderActions = useCallback(() => {
    if (!actions) return null;
    
    return (
      <Space size="small" style={{ marginBottom: 8 }}>
        {actions.refresh && (
          <Tooltip title="Refresh">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
            />
          </Tooltip>
        )}
        {actions.expandAll && (
          <Tooltip title="Expand All">
            <Button
              type="text"
              size="small"
              icon={<ExpandOutlined />}
              onClick={handleExpandAll}
              disabled={isExpanded}
            />
          </Tooltip>
        )}
        {actions.collapseAll && (
          <Tooltip title="Collapse All">
            <Button
              type="text"
              size="small"
              icon={<CompressOutlined />}
              onClick={handleCollapseAll}
              disabled={!isExpanded}
            />
          </Tooltip>
        )}
        {multiple && actions.selectAll && (
          <Button
            type="text"
            size="small"
            onClick={handleSelectAll}
          >
            Select All
          </Button>
        )}
        {actions.clearAll && (
          <Button
            type="text"
            size="small"
            onClick={handleClearAll}
          >
            Clear All
          </Button>
        )}
      </Space>
    );
  }, [actions, handleRefresh, handleExpandAll, handleCollapseAll, multiple, handleSelectAll, handleClearAll, isExpanded]);

  // Custom dropdown render
  const customDropdownRender = useCallback((menu: React.ReactNode) => {
    const content = (
      <div>
        {renderActions()}
        {menu}
      </div>
    );
    
    return dropdownRender ? dropdownRender(content) : content;
  }, [dropdownRender, renderActions]);

  return (
    <div className={className} style={style}>
      {label && (
        <label 
          htmlFor={id}
          style={{ 
            display: 'block', 
            marginBottom: 8,
            fontWeight: 500,
            color: required ? '#ff4d4f' : undefined
          }}
        >
          {label}
          {required && <span style={{ color: 'hsl(var(--destructive))' }}> *</span>}
        </label>
      )}
      <TreeSelect
        value={internalValue}
        placeholder={placeholder}
        treeData={sanitizedTreeData}
        multiple={multiple}
        treeCheckable={treeCheckable}
        treeCheckStrictly={treeCheckStrictly}
        treeDefaultExpandAll={treeDefaultExpandAll}
        treeDefaultExpandedKeys={treeDefaultExpandedKeys}
        treeExpandedKeys={treeExpandedKeys}
        
        size={size}
        variant={variant}
        disabled={disabled}
        allowClear={allowClear}
        showSearch={showSearch}
        searchValue={searchValue || searchTerm}
        autoClearSearchValue={autoClearSearchValue}
        maxTagCount={maxTagCount}
        maxTagPlaceholder={maxTagPlaceholder}
        
        dropdownStyle={dropdownStyle}
        dropdownClassName={dropdownClassName}
        dropdownMatchSelectWidth={dropdownMatchSelectWidth}
        dropdownRender={customDropdownRender as any}
        placement={placement}
        
        loading={loading}
        loadData={loadData}
        
        treeNodeFilterProp={treeNodeFilterProp}
        filterTreeNode={filterTreeNode}
        
        treeNodeLabelProp={treeNodeLabelProp}
        showCheckedStrategy={showCheckedStrategy}
        
        treeIcon={treeIcon}
        switcherIcon={switcherIcon}
        
        onChange={handleChange}
        onSelect={onSelect}
        onDeselect={onDeselect}
        onTreeExpand={handleTreeExpand}
        onDropdownVisibleChange={onDropdownVisibleChange}
        onSearch={handleSearch}
        onFocus={onFocus}
        onBlur={onBlur}
        onClear={onClear}
        
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        
        style={{ width: '100%' }}
      />
      {validationError && (
        <div style={{ color: 'hsl(var(--destructive))', fontSize: 12, marginTop: 4 }}>
          {validationError}
        </div>
      )}
    </div>
  );
};

export default TreeSelectWidget; 
