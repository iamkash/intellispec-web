/**
 * Cascader Widget - Hierarchical selection
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Cascader, Typography, Space } from 'antd';

const { Text } = Typography;

export interface CascaderOption {
  value: string | number;
  label: string;
  children?: CascaderOption[];
  disabled?: boolean;
  loading?: boolean;
  isLeaf?: boolean;
}

export interface CascaderWidgetProps {
  value?: (string | number)[];
  defaultValue?: (string | number)[];
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  size?: 'small' | 'middle' | 'large';
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
  placeholder?: string;
  options?: CascaderOption[];
  allowClear?: boolean;
  autoFocus?: boolean;
  changeOnSelect?: boolean;
  displayRender?: (labels: string[], selectedOptions?: CascaderOption[]) => React.ReactNode;
  expandTrigger?: 'click' | 'hover';
  fieldNames?: object;
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  loadData?: (selectedOptions: CascaderOption[]) => void;
  notFoundContent?: React.ReactNode;
  open?: boolean;
  popupClassName?: string;
  popupPlacement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
  showSearch?: boolean | object;
  status?: 'error' | 'warning' | 'success';
  errorMessage?: string;
  helpText?: string;
  style?: React.CSSProperties;
  className?: string;
  width?: number | string;
  validator?: (value: (string | number)[]) => { isValid: boolean; message?: string };
  
  onChange?: (value: (string | number)[], selectedOptions?: CascaderOption[]) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onPopupVisibleChange?: (popupVisible: boolean) => void;
}

export const CascaderWidget: React.FC<CascaderWidgetProps> = ({
  value,
  defaultValue = [],
  label,
  disabled = false,
  readOnly = false,
  required = false,
  size = 'middle',
  variant,
  placeholder = "Please select...",
  options = [],
  allowClear = true,
  autoFocus = false,
  changeOnSelect = false,
  displayRender,
  expandTrigger = 'click',
  fieldNames,
  getPopupContainer,
  loadData,
  notFoundContent,
  open,
  popupClassName,
  popupPlacement = 'bottomLeft',
  showSearch = false,
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
  onPopupVisibleChange
}) => {
  const [internalValue, setInternalValue] = useState<(string | number)[]>(value || defaultValue);
  const [validationError, setValidationError] = useState<string | undefined>();

  // Sync internal state with prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = useCallback((newValue: (string | number)[], selectedOptions?: CascaderOption[]) => {
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

    onChange?.(newValue, selectedOptions);
  }, [validator, onChange]);

  const finalErrorMessage = validationError || errorMessage;

  return (
    <div className={`cascader-widget ${className || ''}`} style={{ width: '100%', ...style }}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {label && (
          <Text strong={required}>
            {label}
            {required && <span style={{ color: 'hsl(var(--destructive))' }}>*</span>}
          </Text>
        )}

        <Cascader
          value={internalValue}
          defaultValue={defaultValue}
          disabled={disabled || readOnly}
          size={size}
          variant={variant}
          placeholder={placeholder}
          options={options}
          allowClear={allowClear}
          autoFocus={autoFocus}
          changeOnSelect={changeOnSelect}
          displayRender={displayRender}
          expandTrigger={expandTrigger}
          fieldNames={fieldNames}
          getPopupContainer={getPopupContainer}
          loadData={loadData}
          notFoundContent={notFoundContent}
          open={open}
          popupClassName={popupClassName}
          popupPlacement={popupPlacement}
          showSearch={showSearch}
          status={validationError ? 'error' : (status === 'success' ? undefined : status)}
          style={{ width }}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          onPopupVisibleChange={onPopupVisibleChange}
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

export default CascaderWidget; 