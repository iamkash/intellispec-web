/**
 * AutoComplete Widget - Text input with search suggestions
 */

import React, { useState, useCallback, useEffect } from 'react';
import { AutoComplete, Typography, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface AutoCompleteOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface AutoCompleteWidgetProps {
  value?: string;
  defaultValue?: string;
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  size?: 'small' | 'middle' | 'large';
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
  placeholder?: string;
  options?: AutoCompleteOption[];
  dataSource?: string[];
  allowClear?: boolean;
  autoFocus?: boolean;
  backfill?: boolean;
  filterOption?: boolean | ((inputValue: string, option?: AutoCompleteOption) => boolean);
  defaultOpen?: boolean;
  open?: boolean;
  notFoundContent?: React.ReactNode;
  status?: 'error' | 'warning' | 'success';
  errorMessage?: string;
  helpText?: string;
  style?: React.CSSProperties;
  className?: string;
  width?: number | string;
  validator?: (value: string) => { isValid: boolean; message?: string };
  
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onSelect?: (value: string, option: AutoCompleteOption) => void;
  onSearch?: (value: string) => void;
  onDropdownVisibleChange?: (open: boolean) => void;
}

export const AutoCompleteWidget: React.FC<AutoCompleteWidgetProps> = ({
  value,
  defaultValue,
  label,
  disabled = false,
  readOnly = false,
  required = false,
  size = 'middle',
  variant,
  placeholder = "Enter text...",
  options = [],
  dataSource = [],
  allowClear = true,
  autoFocus = false,
  backfill = false,
  filterOption = true,
  defaultOpen = false,
  open,
  notFoundContent,
  status,
  errorMessage,
  helpText,
  style,
  className,
  width = '100%',
  validator,
  onChange,
  onBlur,
  onFocus,
  onSelect,
  onSearch,
  onDropdownVisibleChange
}) => {
  const [internalValue, setInternalValue] = useState<string | undefined>(
    value !== undefined ? value : defaultValue
  );
  const [validationError, setValidationError] = useState<string | undefined>();

  // Sync internal state with prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const currentValue = internalValue;

  const handleChange = useCallback((newValue: string) => {
    // Always update internal state immediately for visual feedback
    setInternalValue(newValue);

    if (validator) {
      const validation = validator(newValue);
      if (!validation.isValid) {
        setValidationError(validation.message);
      } else {
        setValidationError(undefined);
      }
    }

    onChange?.(newValue);
  }, [value, validator, onChange]);

  const handleSelect = useCallback((selectedValue: string, option: any) => {
    const selectedOption = options.find(opt => opt.value === selectedValue);
    if (selectedOption) {
      onSelect?.(selectedValue, selectedOption);
    }
  }, [options, onSelect]);

  const getOptions = () => {
    if (options.length > 0) {
      return options;
    }
    return dataSource.map(item => ({ value: item, label: item }));
  };

  const finalErrorMessage = validationError || errorMessage;

  return (
    <div className={`auto-complete-widget ${className || ''}`} style={{ width: '100%', ...style }}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {label && (
          <Text strong={required}>
            {label}
            {required && <span style={{ color: 'hsl(var(--destructive))' }}>*</span>}
          </Text>
        )}

        <AutoComplete
          value={currentValue}
          disabled={disabled || readOnly}
          size={size}
          variant={variant}
          placeholder={placeholder}
          options={getOptions()}
          allowClear={allowClear}
          autoFocus={autoFocus}
          backfill={backfill}
          filterOption={filterOption}
          defaultOpen={defaultOpen}
          open={open}
          notFoundContent={notFoundContent}
          status={validationError ? 'error' : (status === 'success' ? undefined : status)}
          style={{ width }}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          onSelect={handleSelect}
          onSearch={onSearch}
          onDropdownVisibleChange={onDropdownVisibleChange}
        />

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

export default AutoCompleteWidget; 