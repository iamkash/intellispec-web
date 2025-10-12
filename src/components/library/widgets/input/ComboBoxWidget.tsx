/**
 * ComboBox Widget - Dropdown selection functionality
 * 
 * A reusable combo box/dropdown widget that provides single or multiple selection
 * with search, filtering, and custom option rendering capabilities.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Select, Typography, Space, Tag } from 'antd';
import { SearchOutlined, DownOutlined, LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option, OptGroup } = Select;

export interface ComboBoxOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  description?: string;
  icon?: React.ReactNode;
  color?: string;
  group?: string;
}

export interface ComboBoxWidgetProps {
  /** Selected value(s) */
  value?: string | number | Array<string | number>;
  /** Default value(s) */
  defaultValue?: string | number | Array<string | number>;
  /** Placeholder text */
  placeholder?: string;
  /** ComboBox label */
  label?: string;
  /** Available options */
  options: ComboBoxOption[];
  /** Whether combobox is disabled */
  disabled?: boolean;
  /** Whether combobox is read-only */
  readOnly?: boolean;
  /** Whether combobox is required */
  required?: boolean;
  /** Allow multiple selection */
  mode?: 'multiple' | 'tags';
  /** ComboBox size */
  size?: 'small' | 'middle' | 'large';
  /** ComboBox variant */
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
  /** Allow search/filter */
  showSearch?: boolean;
  /** Allow clear selection */
  allowClear?: boolean;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Maximum number of selected items to show */
  maxTagCount?: number;
  /** Custom max tag placeholder */
  maxTagPlaceholder?: React.ReactNode | ((omittedValues: any[]) => React.ReactNode);
  /** Maximum number of options to show */
  maxOptionsCount?: number;
  /** Filter options based on search */
  filterOption?: boolean | ((inputValue: string, option: ComboBoxOption) => boolean);
  /** Custom search function */
  onSearch?: (value: string) => void;
  /** Show arrow icon */
  showArrow?: boolean;
  /** Suffix icon */
  suffixIcon?: React.ReactNode;
  /** Remove icon */
  removeIcon?: React.ReactNode;
  /** Clear icon */
  clearIcon?: React.ReactNode;
  /** Validation status */
  status?: 'error' | 'warning' | 'success';
  /** Error message */
  errorMessage?: string;
  /** Help text */
  helpText?: string;
  /** Custom styling */
  style?: React.CSSProperties;
  /** Custom CSS class */
  className?: string;
  /** Width of the combobox */
  width?: number | string;
  /** Dropdown width */
  dropdownMatchSelectWidth?: boolean;
  /** Dropdown style */
  dropdownStyle?: React.CSSProperties;
  /** Dropdown class name */
  dropdownClassName?: string;
  /** Virtual scrolling for large datasets */
  virtual?: boolean;
  /** Custom option render */
  optionRender?: (option: ComboBoxOption, isSelected: boolean) => React.ReactNode;
  /** Custom value render */
  tagRender?: (props: { label: React.ReactNode; value: string | number; disabled: boolean; onClose: () => void }) => React.ReactElement;
  /** Custom validation function */
  validator?: (value: string | number | Array<string | number>) => { isValid: boolean; message?: string };
  
  // Event handlers
  /** On value change */
  onChange?: (value: string | number | Array<string | number>) => void;
  /** On blur */
  onBlur?: () => void;
  /** On focus */
  onFocus?: () => void;
  /** On dropdown open/close */
  onDropdownVisibleChange?: (open: boolean) => void;
  /** On option select */
  onSelect?: (value: string | number, option: ComboBoxOption) => void;
  /** On option deselect */
  onDeselect?: (value: string | number, option: ComboBoxOption) => void;
  /** On clear */
  onClear?: () => void;
}

export const ComboBoxWidget: React.FC<ComboBoxWidgetProps> = ({
  value,
  defaultValue,
  placeholder = "Select an option...",
  label,
  options = [],
  disabled = false,
  readOnly = false,
  required = false,
  mode,
  size = 'middle',
  variant,
  showSearch = true,
  allowClear = true,
  autoFocus = false,
  loading = false,
  maxTagCount,
  maxTagPlaceholder,
  maxOptionsCount,
  filterOption = true,
  onSearch,
  showArrow = true,
  suffixIcon,
  removeIcon,
  clearIcon,
  status,
  errorMessage,
  helpText,
  style,
  className,
  width = '100%',
  dropdownMatchSelectWidth = true,
  dropdownStyle,
  dropdownClassName,
  virtual = false,
  optionRender,
  tagRender,
  validator,
  onChange,
  onBlur,
  onFocus,
  onDropdownVisibleChange,
  onSelect,
  onDeselect,
  onClear
}) => {
  const [internalValue, setInternalValue] = useState(value !== undefined ? value : defaultValue);
  const [validationError, setValidationError] = useState<string | undefined>();
  const [searchValue, setSearchValue] = useState('');

  // Sync internal state with prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // Ensure correct empty value semantics for single vs multi-select
  useEffect(() => {
    if (mode && (internalValue === null || internalValue === undefined)) {
      setInternalValue([]);
    }
  }, [mode, internalValue]);

  const normalizedValue = useMemo(() => {
    if (mode) {
      if (internalValue === null || internalValue === undefined) return [];
      return Array.isArray(internalValue) ? internalValue : [internalValue];
    }
    return internalValue === null || internalValue === undefined ? undefined : internalValue;
  }, [internalValue, mode]);

  const handleChange = useCallback((newValue: string | number | Array<string | number>) => {
    // Always update internal state immediately for visual feedback
    if (mode) {
      // For multi-select modes, coerce to array
      const coerced = newValue === null || newValue === undefined
        ? []
        : (Array.isArray(newValue) ? newValue : [newValue]);
      setInternalValue(coerced);
      // Skip validation on change for required to avoid double messages; defer to form-level
      if (validator) {
        const validation = validator(coerced);
        if (!validation.isValid) setValidationError(validation.message); else setValidationError(undefined);
      } else {
        setValidationError(undefined);
      }
      onChange?.(coerced);
      return;
    }
    setInternalValue(newValue);
    setValidationError(undefined);

    onChange?.(newValue);
  }, [validator, onChange, mode]);

  const handleSearch = useCallback((searchValue: string) => {
    setSearchValue(searchValue);
    onSearch?.(searchValue);
  }, [onSearch]);

  const handleSelect = useCallback((selectedValue: string | number, option: any) => {
    const selectedOption = options.find(opt => opt.value === selectedValue);
    if (selectedOption) {
      onSelect?.(selectedValue, selectedOption);
    }
  }, [options, onSelect]);

  const handleDeselect = useCallback((deselectedValue: string | number) => {
    const deselectedOption = options.find(opt => opt.value === deselectedValue);
    if (deselectedOption) {
      onDeselect?.(deselectedValue, deselectedOption);
    }
  }, [options, onDeselect]);

  // Group options by group property
  const groupedOptions = useMemo(() => {
    const groups: { [key: string]: ComboBoxOption[] } = {};
    const ungrouped: ComboBoxOption[] = [];

    options.forEach(option => {
      if (option.group) {
        if (!groups[option.group]) {
          groups[option.group] = [];
        }
        groups[option.group].push(option);
      } else {
        ungrouped.push(option);
      }
    });

    return { groups, ungrouped };
  }, [options]);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!showSearch || !searchValue) {
      return options;
    }

    if (typeof filterOption === 'function') {
      return options.filter(option => filterOption(searchValue, option));
    }

    if (filterOption) {
      return options.filter(option => 
        option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    return options;
  }, [options, searchValue, showSearch, filterOption]);

  const displayedOptions = maxOptionsCount 
    ? filteredOptions.slice(0, maxOptionsCount)
    : filteredOptions;

  const renderOption = (option: ComboBoxOption, isSelected: boolean) => {
    if (optionRender) {
      return optionRender(option, isSelected);
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {option.icon && <span>{option.icon}</span>}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
            {option.label}
          </div>
          {option.description && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {option.description}
            </div>
          )}
        </div>
        {option.color && (
          <Tag color={option.color} style={{ margin: 0 }}>
            {option.color}
          </Tag>
        )}
      </div>
    );
  };

  const renderOptions = () => {
    const { groups, ungrouped } = groupedOptions;

    const elements: React.ReactNode[] = [];

    // Render ungrouped options
    if (ungrouped.length > 0) {
      ungrouped.forEach(option => {
        if (displayedOptions.includes(option)) {
          const isSelected = Array.isArray(internalValue) 
            ? internalValue.includes(option.value)
            : internalValue === option.value;
          
          elements.push(
            <Option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              title={option.description}
            >
              {renderOption(option, isSelected)}
            </Option>
          );
        }
      });
    }

    // Render grouped options
    Object.entries(groups).forEach(([groupName, groupOptions]) => {
      const filteredGroupOptions = groupOptions.filter(option => 
        displayedOptions.includes(option)
      );

      if (filteredGroupOptions.length > 0) {
        elements.push(
          <OptGroup key={groupName} label={groupName}>
            {filteredGroupOptions.map(option => {
              const isSelected = Array.isArray(internalValue) 
                ? internalValue.includes(option.value)
                : internalValue === option.value;
              
              return (
                <Option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  title={option.description}
                >
                  {renderOption(option, isSelected)}
                </Option>
              );
            })}
          </OptGroup>
        );
      }
    });

    return elements;
  };

  const selectStatus = validationError ? 'error' : (status === 'success' ? undefined : status);

  const finalErrorMessage = validationError || errorMessage;

  return (
    <div 
      className={`combo-box-widget ${className || ''}`}
      style={{
        width: '100%',
        ...style
      }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* Label */}
        {label && (
          <Text strong={required}>
            {label}
            {required && <span style={{ color: 'hsl(var(--destructive))' }}>*</span>}
          </Text>
        )}

        {/* ComboBox */}
        <Select
          value={normalizedValue}
          placeholder={placeholder}
          disabled={disabled || readOnly}
          mode={mode}
          size={size}
          variant={variant}
          showSearch={showSearch}
          allowClear={allowClear}
          autoFocus={autoFocus}
          loading={loading}
          maxTagCount={maxTagCount}
          maxTagPlaceholder={maxTagPlaceholder}
          suffixIcon={loading ? <LoadingOutlined /> : suffixIcon}
          removeIcon={removeIcon}
          clearIcon={clearIcon}
          status={selectStatus}
          style={{ width }}
          popupMatchSelectWidth={dropdownMatchSelectWidth}
          styles={{ popup: { root: dropdownStyle } }}
          classNames={{ popup: { root: dropdownClassName } }}
          virtual={virtual}
          tagRender={tagRender}
          filterOption={false} // We handle filtering manually
          onSearch={handleSearch}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          onOpenChange={onDropdownVisibleChange}
          onSelect={handleSelect}
          onDeselect={handleDeselect}
          onClear={onClear}
        >
          {renderOptions()}
        </Select>

        {/* Help Text and Error Message */}
        {(helpText || finalErrorMessage) && (
          <div>
            {finalErrorMessage && (
              <Text type="danger" style={{ fontSize: '12px' }}>
                {finalErrorMessage}
              </Text>
            )}
            {helpText && !finalErrorMessage && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {helpText}
              </Text>
            )}
          </div>
        )}
      </Space>
    </div>
  );
};

export default ComboBoxWidget; 