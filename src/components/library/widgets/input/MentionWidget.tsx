/**
 * Mention Widget - @ mentions functionality
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Mentions, Typography, Space } from 'antd';

const { Text } = Typography;

export interface MentionWidgetProps {
  value?: string;
  defaultValue?: string;
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  size?: 'small' | 'middle' | 'large';
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
  autoFocus?: boolean;
  autoSize?: boolean | { minRows?: number; maxRows?: number };
  placeholder?: string;
  prefix?: string | string[];
  split?: string;
  validateSearch?: (text: string, props: any) => boolean;
  filterOption?: false | ((input: string, option: any) => boolean);
  notFoundContent?: React.ReactNode;
  placement?: 'top' | 'bottom';
  rows?: number;
  status?: 'error' | 'warning' | 'success';
  errorMessage?: string;
  helpText?: string;
  style?: React.CSSProperties;
  className?: string;
  validator?: (value: string) => { isValid: boolean; message?: string };
  
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onResize?: (size: { width: number; height: number }) => void;
  onSearch?: (text: string, prefix: string) => void;
  onSelect?: (option: any, prefix: string) => void;
}

export const MentionWidget: React.FC<MentionWidgetProps> = ({
  value,
  defaultValue = '',
  label,
  disabled = false,
  readOnly = false,
  required = false,
  size = 'middle',
  variant,
  autoFocus = false,
  autoSize = false,
  placeholder = "Input @ to mention people",
  prefix = '@',
  split = ' ',
  validateSearch,
  filterOption = false,
  notFoundContent,
  placement = 'bottom',
  rows = 1,
  status,
  errorMessage,
  helpText,
  style,
  className,
  validator,
  onChange,
  onBlur,
  onFocus,
  onResize,
  onSearch,
  onSelect
}) => {
  const [internalValue, setInternalValue] = useState(value !== undefined ? value : defaultValue);
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

  const finalErrorMessage = validationError || errorMessage;

  return (
    <div className={`mention-widget ${className || ''}`} style={{ width: '100%', ...style }}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {label && (
          <Text strong={required}>
            {label}
            {required && <span style={{ color: 'hsl(var(--destructive))' }}>*</span>}
          </Text>
        )}

        <Mentions
          value={currentValue}
          defaultValue={defaultValue}
          disabled={disabled || readOnly}
          variant={variant}
          autoFocus={autoFocus}
          autoSize={autoSize}
          placeholder={placeholder}
          prefix={prefix}
          split={split}
          validateSearch={validateSearch}
          filterOption={filterOption}
          notFoundContent={notFoundContent}
          placement={placement}
          rows={rows}
          status={validationError ? 'error' : (status === 'success' ? undefined : status)}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          onResize={onResize}
          onSearch={onSearch}
          onSelect={onSelect}
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

export default MentionWidget; 