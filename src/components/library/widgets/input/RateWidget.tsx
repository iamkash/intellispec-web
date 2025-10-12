/**
 * Rate Widget - Star rating input
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Rate, Typography, Space } from 'antd';
import { StarOutlined, HeartOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface RateWidgetProps {
  value?: number;
  defaultValue?: number;
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  allowHalf?: boolean;
  allowClear?: boolean;
  autoFocus?: boolean;
  character?: React.ReactNode;
  count?: number;
  tooltips?: string[];
  status?: 'error' | 'warning' | 'success';
  errorMessage?: string;
  helpText?: string;
  style?: React.CSSProperties;
  className?: string;
  validator?: (value: number) => { isValid: boolean; message?: string };
  
  onChange?: (value: number) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onHoverChange?: (value: number) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const RateWidget: React.FC<RateWidgetProps> = ({
  value,
  defaultValue = 0,
  label,
  disabled = false,
  readOnly = false,
  required = false,
  allowHalf = false,
  allowClear = true,
  autoFocus = false,
  character = <StarOutlined />,
  count = 5,
  tooltips = [],
  status,
  errorMessage,
  helpText,
  style,
  className,
  validator,
  onChange,
  onBlur,
  onFocus,
  onHoverChange,
  onKeyDown
}) => {
  const [internalValue, setInternalValue] = useState(value || defaultValue);
  const [validationError, setValidationError] = useState<string | undefined>();

  // Sync internal state with prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = useCallback((newValue: number) => {
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
  }, [validator, onChange]);

  const finalErrorMessage = validationError || errorMessage;

  return (
    <div className={`rate-widget ${className || ''}`} style={{ width: '100%', ...style }}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {label && (
          <Text strong={required}>
            {label}
            {required && <span style={{ color: 'hsl(var(--destructive))' }}>*</span>}
          </Text>
        )}

        <Rate
          value={internalValue}
          defaultValue={defaultValue}
          disabled={disabled || readOnly}
          allowHalf={allowHalf}
          allowClear={allowClear}
          autoFocus={autoFocus}
          character={character}
          count={count}
          tooltips={tooltips}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          onHoverChange={onHoverChange}
          onKeyDown={onKeyDown}
        />

        {internalValue > 0 && (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {internalValue} of {count} stars
          </Text>
        )}

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

export default RateWidget; 