/**
 * Checkbox Widget - Multiple selection checkbox functionality
 * 
 * A reusable checkbox widget that provides multiple selection with validation,
 * custom layouts, indeterminate state, and advanced styling capabilities.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Checkbox, Typography, Space, Card, Button, Tooltip, Divider } from 'antd';
import { CheckOutlined, ClearOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface CheckboxOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  description?: string;
  icon?: React.ReactNode;
  color?: string;
  tooltip?: string;
}

export interface CheckboxWidgetProps {
  /** Selected values */
  value?: Array<string | number>;
  /** Default selected values */
  defaultValue?: Array<string | number>;
  /** Checkbox label */
  label?: string;
  /** Available options */
  options: CheckboxOption[];
  /** Whether checkbox is disabled */
  disabled?: boolean;
  /** Whether checkbox is read-only */
  readOnly?: boolean;
  /** Whether checkbox is required */
  required?: boolean;
  /** Checkbox size */
  size?: 'small' | 'middle' | 'large';
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Use card style */
  cardStyle?: boolean;
  /** Allow clear all */
  allowClear?: boolean;
  /** Show select all option */
  showSelectAll?: boolean;
  /** Select all text */
  selectAllText?: string;
  /** Show option count */
  showCount?: boolean;
  /** Show selected count */
  showSelectedCount?: boolean;
  /** Custom option width */
  optionWidth?: number | string;
  /** Custom option height */
  optionHeight?: number | string;
  /** Options per row (for grid layout) */
  optionsPerRow?: number;
  /** Maximum selections allowed */
  maxSelections?: number;
  /** Minimum selections required */
  minSelections?: number;
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
  /** Width of the checkbox group */
  width?: number | string;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Custom option render */
  optionRender?: (option: CheckboxOption, isSelected: boolean) => React.ReactNode;
  /** Custom validation function */
  validator?: (value: Array<string | number>) => { isValid: boolean; message?: string };
  /** Enable keyboard navigation */
  enableKeyboardNav?: boolean;
  /** Show selection indicator */
  showSelectionIndicator?: boolean;
  /** Animation settings */
  animation?: {
    enabled: boolean;
    duration: number;
    type: 'fade' | 'slide' | 'scale';
  };
  /** Group options by category */
  groupBy?: (option: CheckboxOption) => string;
  /** Show group headers */
  showGroupHeaders?: boolean;
  
  // Event handlers
  /** On value change */
  onChange?: (value: Array<string | number>) => void;
  /** On blur */
  onBlur?: (e: React.FocusEvent<HTMLDivElement>) => void;
  /** On focus */
  onFocus?: (e: React.FocusEvent<HTMLDivElement>) => void;
  /** On option click */
  onOptionClick?: (option: CheckboxOption, checked: boolean) => void;
  /** On select all */
  onSelectAll?: (selected: boolean) => void;
  /** On clear all */
  onClearAll?: () => void;
  /** On key down */
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

export const CheckboxWidget: React.FC<CheckboxWidgetProps> = ({
  value,
  defaultValue = [],
  label,
  options = [],
  disabled = false,
  readOnly = false,
  required = false,
  size = 'middle',
  direction = 'vertical',
  cardStyle = false,
  allowClear = false,
  showSelectAll = false,
  selectAllText = 'Select All',
  showCount = false,
  showSelectedCount = false,
  optionWidth,
  optionHeight,
  optionsPerRow,
  maxSelections,
  minSelections,
  status,
  errorMessage,
  helpText,
  style,
  className,
  width = '100%',
  autoFocus = false,
  optionRender,
  validator,
  enableKeyboardNav = true,
  showSelectionIndicator = false,
  animation = { enabled: false, duration: 200, type: 'fade' },
  groupBy,
  showGroupHeaders = true,
  onChange,
  onBlur,
  onFocus,
  onOptionClick,
  onSelectAll,
  onClearAll,
  onKeyDown
}) => {
  const [internalValue, setInternalValue] = useState<Array<string | number>>(value !== undefined ? value : defaultValue);
  const [validationError, setValidationError] = useState<string | undefined>();
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Sync internal state with prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = useCallback((checkedValues: Array<string | number>) => {
    // Check max selections
    if (maxSelections && checkedValues.length > maxSelections) {
      return;
    }

    // Always update internal state immediately for visual feedback
    setInternalValue(checkedValues);

    // Validate input
    if (validator) {
      const validation = validator(checkedValues);
      if (!validation.isValid) {
        setValidationError(validation.message);
      } else {
        setValidationError(undefined);
      }
    }

    // Check min selections
    if (minSelections && checkedValues.length < minSelections) {
      setValidationError(`Please select at least ${minSelections} option${minSelections !== 1 ? 's' : ''}`);
    }

    onChange?.(checkedValues);
  }, [validator, onChange, maxSelections, minSelections]);

  const handleOptionChange = useCallback((optionValue: string | number, checked: boolean) => {
    let newValues: Array<string | number>;
    
    if (checked) {
      newValues = [...internalValue, optionValue];
    } else {
      newValues = internalValue.filter(val => val !== optionValue);
    }

    const option = options.find(opt => opt.value === optionValue);
    if (option) {
      onOptionClick?.(option, checked);
    }

    handleChange(newValues);
  }, [internalValue, options, onOptionClick, handleChange]);

  const handleSelectAll = useCallback(() => {
    const allSelected = internalValue.length === options.filter(opt => !opt.disabled).length;
    const newValues = allSelected ? [] : options.filter(opt => !opt.disabled).map(opt => opt.value);
    
    onSelectAll?.(!allSelected);
    handleChange(newValues);
  }, [internalValue, options, onSelectAll, handleChange]);

  const handleClearAll = useCallback(() => {
    handleChange([]);
    onClearAll?.();
  }, [handleChange, onClearAll]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!enableKeyboardNav) return;

    const enabledOptions = options.filter(option => !option.disabled);
    
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev <= 0 ? enabledOptions.length - 1 : prev - 1
        );
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev >= enabledOptions.length - 1 ? 0 : prev + 1
        );
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < enabledOptions.length) {
          const selectedOption = enabledOptions[focusedIndex];
          if (selectedOption && !selectedOption.disabled) {
            const isChecked = internalValue.includes(selectedOption.value);
            handleOptionChange(selectedOption.value, !isChecked);
          }
        }
        break;
      case 'Escape':
        if (allowClear) {
          handleClearAll();
        }
        break;
    }
    
    onKeyDown?.(e);
  }, [enableKeyboardNav, options, focusedIndex, internalValue, allowClear, handleOptionChange, handleClearAll, onKeyDown]);

  const getGridStyle = useMemo(() => {
    if (!optionsPerRow) return {};
    
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${optionsPerRow}, 1fr)`,
      gap: '8px'
    };
  }, [optionsPerRow]);

  const getOptionStyle = useCallback((option: CheckboxOption, isSelected: boolean) => {
    const baseStyle: React.CSSProperties = {
      width: optionWidth,
      height: optionHeight,
      transition: animation.enabled ? `all ${animation.duration}ms ease-in-out` : 'none',
      transform: animation.enabled && animation.type === 'scale' && isSelected ? 'scale(1.05)' : 'scale(1)',
      opacity: animation.enabled && animation.type === 'fade' ? (isSelected ? 1 : 0.8) : 1,
    };

    if (cardStyle) {
      return {
        ...baseStyle,
        padding: '12px',
        border: `2px solid ${isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
        borderRadius: '6px',
        backgroundColor: isSelected ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--background))',
        cursor: option.disabled ? 'not-allowed' : 'pointer',
        opacity: option.disabled ? 0.5 : baseStyle.opacity,
      };
    }

    return baseStyle;
  }, [optionWidth, optionHeight, animation, cardStyle]);

  const renderOption = useCallback((option: CheckboxOption, index: number) => {
    const isSelected = internalValue.includes(option.value);
    const isFocused = focusedIndex === index;
    const optionStyle = getOptionStyle(option, isSelected);

    if (optionRender) {
      return optionRender(option, isSelected);
    }

    const content = (
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
        {showSelectionIndicator && isSelected && (
          <CheckOutlined style={{ color: '#1890ff' }} />
        )}
      </div>
    );

    if (cardStyle) {
      return (
        <Card
          key={option.value}
          size="small"
          style={{
            ...optionStyle,
            cursor: option.disabled ? 'not-allowed' : 'pointer',
            borderColor: isFocused ? 'hsl(var(--ring))' : (isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))'),
            boxShadow: isFocused ? '0 0 0 2px hsl(var(--ring) / 0.2)' : 'none',
          }}
          bodyStyle={{ padding: '8px' }}
          onClick={() => {
            if (!option.disabled && !readOnly) {
              handleOptionChange(option.value, !isSelected);
            }
          }}
        >
          <Checkbox
            checked={isSelected}
            disabled={option.disabled || readOnly}
            onChange={() => {}} // Handled by card click
            style={{ pointerEvents: 'none' }}
          />
          {content}
        </Card>
      );
    }

    return (
      <Checkbox
        key={option.value}
        value={option.value}
        disabled={option.disabled || readOnly}
        style={optionStyle}
        checked={isSelected}
        onChange={(e) => handleOptionChange(option.value, e.target.checked)}
        autoFocus={autoFocus && index === 0}
      >
        {content}
      </Checkbox>
    );
  }, [internalValue, focusedIndex, optionRender, getOptionStyle, showSelectionIndicator, cardStyle, readOnly, handleOptionChange, autoFocus]);

  const groupedOptions = useMemo(() => {
    if (!groupBy) {
      return { '': options };
    }

    const groups: { [key: string]: CheckboxOption[] } = {};
    options.forEach(option => {
      const groupKey = groupBy(option);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(option);
    });

    return groups;
  }, [options, groupBy]);

  const renderCheckboxGroup = () => {
    if (cardStyle) {
      return (
        <div
          style={{
            ...getGridStyle,
            display: optionsPerRow ? 'grid' : 'flex',
            flexDirection: direction === 'horizontal' ? 'row' : 'column',
            gap: '8px',
            width
          }}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
            <div key={groupName}>
              {showGroupHeaders && groupName && (
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>{groupName}</Text>
                  <Divider style={{ margin: '4px 0' }} />
                </div>
              )}
              {groupOptions.map((option, index) => (
                <Tooltip key={option.value} title={option.tooltip}>
                  <div>{renderOption(option, index)}</div>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div onKeyDown={handleKeyDown} tabIndex={0}>
        <Checkbox.Group
          value={internalValue}
          onChange={handleChange}
          disabled={disabled || readOnly}
          style={{ width }}
        >
          <Space direction={direction} style={getGridStyle}>
            {Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
              <div key={groupName}>
                {showGroupHeaders && groupName && (
                  <div style={{ marginBottom: '8px' }}>
                    <Text strong>{groupName}</Text>
                    <Divider style={{ margin: '4px 0' }} />
                  </div>
                )}
                <Space direction={direction} style={getGridStyle}>
                  {groupOptions.map((option, index) => (
                    <Tooltip key={option.value} title={option.tooltip}>
                      {renderOption(option, index)}
                    </Tooltip>
                  ))}
                </Space>
              </div>
            ))}
          </Space>
        </Checkbox.Group>
      </div>
    );
  };

  const isAllSelected = useMemo(() => {
    const enabledOptions = options.filter(opt => !opt.disabled);
    return enabledOptions.length > 0 && enabledOptions.every(opt => internalValue.includes(opt.value));
  }, [options, internalValue]);

  const isIndeterminate = useMemo(() => {
    const enabledOptions = options.filter(opt => !opt.disabled);
    const selectedCount = enabledOptions.filter(opt => internalValue.includes(opt.value)).length;
    return selectedCount > 0 && selectedCount < enabledOptions.length;
  }, [options, internalValue]);

  const finalErrorMessage = validationError || errorMessage;

  return (
    <div 
      className={`checkbox-widget ${className || ''}`}
      style={{
        width: '100%',
        ...style
      }}
      onBlur={onBlur}
      onFocus={onFocus}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* Label and Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {label && (
              <Text strong={required}>
                {label}
                {required && <span style={{ color: 'hsl(var(--destructive))' }}>*</span>}
                {showCount && (
                  <span style={{ marginLeft: '8px', color: '#666', fontSize: '12px' }}>
                    ({options.length} option{options.length !== 1 ? 's' : ''})
                  </span>
                )}
                {showSelectedCount && (
                  <span style={{ marginLeft: '8px', color: '#1890ff', fontSize: '12px' }}>
                    ({internalValue.length} selected)
                  </span>
                )}
              </Text>
            )}
            
            {/* Select All Checkbox */}
            {showSelectAll && (
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onChange={handleSelectAll}
                disabled={disabled || readOnly}
              >
                {selectAllText}
              </Checkbox>
            )}
          </div>
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {allowClear && internalValue.length > 0 && (
              <Button
                size="small"
                icon={<ClearOutlined />}
                onClick={handleClearAll}
                disabled={disabled || readOnly}
                type="text"
                title="Clear all selections"
              />
            )}
          </div>
        </div>

        {/* Maximum selections warning */}
        {maxSelections && internalValue.length >= maxSelections && (
          <Text type="warning" style={{ fontSize: '12px' }}>
            Maximum {maxSelections} selection{maxSelections !== 1 ? 's' : ''} allowed
          </Text>
        )}

        {/* Checkbox Group */}
        {renderCheckboxGroup()}

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

export default CheckboxWidget; 
