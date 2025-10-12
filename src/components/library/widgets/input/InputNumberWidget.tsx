/**
 * InputNumber Widget - Numeric input with increment/decrement controls
 */

import React, { useState, useCallback, useEffect } from 'react';
import { InputNumber, Typography, Space, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface InputNumberWidgetProps {
  value?: number;
  defaultValue?: number;
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  size?: 'small' | 'middle' | 'large';
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  placeholder?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  addonBefore?: React.ReactNode;
  addonAfter?: React.ReactNode;
  controls?: boolean;
  keyboard?: boolean;
  stringMode?: boolean;
  formatter?: (value: number | string | undefined) => string;
  parser?: (displayValue: string | undefined) => number;
  status?: 'error' | 'warning' | 'success';
  errorMessage?: string;
  helpText?: string;
  style?: React.CSSProperties;
  className?: string;
  width?: number | string;
  autoFocus?: boolean;
  validator?: (value: number) => { isValid: boolean; message?: string };
  showResetButton?: boolean;
  
  onChange?: (value: number | null) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onPressEnter?: () => void;
  onStep?: (value: number, info: { offset: number | string; type: 'up' | 'down' }) => void;
  onReset?: () => void;
}

export const InputNumberWidget: React.FC<InputNumberWidgetProps> = ({
  value,
  defaultValue,
  label,
  disabled = false,
  readOnly = false,
  required = false,
  size = 'middle',
  variant,
  min,
  max,
  step = 1,
  precision,
  placeholder,
  prefix,
  suffix,
  addonBefore,
  addonAfter,
  controls = true,
  keyboard = true,
  stringMode = false,
  formatter,
  parser,
  status,
  errorMessage,
  helpText,
  style,
  className,
  width = '100%',
  autoFocus = false,
  validator,
  showResetButton = false,
  onChange,
  onBlur,
  onFocus,
  onPressEnter,
  onStep,
  onReset
}) => {
  const [internalValue, setInternalValue] = useState<number | null>(
    value !== undefined ? value : (defaultValue !== undefined ? defaultValue : null)
  );
  const [validationError, setValidationError] = useState<string | undefined>();

  // Always use internal value for immediate display, update from props when they change
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = useCallback((newValue: number | null) => {
    if (newValue !== null) {
      // Always update internal state immediately for responsive UI
      setInternalValue(newValue);

      if (validator) {
        const validation = validator(newValue);
        if (!validation.isValid) {
          setValidationError(validation.message);
        } else {
          setValidationError(undefined);
        }
      }
    }

    onChange?.(newValue);
  }, [value, validator, onChange]);

  const handleReset = useCallback(() => {
    const resetValue = defaultValue !== undefined ? defaultValue : null;
    setInternalValue(resetValue);
    onChange?.(resetValue);
    onReset?.();
  }, [defaultValue, onChange, onReset]);

  const finalErrorMessage = validationError || errorMessage;

  return (
    <div className={`input-number-widget ${className || ''}`} style={{ width: '100%', ...style }}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* Label */}
          {label && (
            <Text strong={required}>
              {label}
              {required && <span style={{ color: 'hsl(var(--destructive))' }}>*</span>}
            </Text>
          )}

        {/* Input with optional reset button */}
        <div style={{ position: 'relative', width: '100%' }}>
        <InputNumber
          value={internalValue === null ? undefined : internalValue}
          disabled={disabled || readOnly}
          size={size}
          variant={variant}
          min={min}
          max={max}
          step={step}
          precision={precision}
          placeholder={placeholder}
          prefix={prefix}
          suffix={suffix}
          addonBefore={addonBefore}
          addonAfter={addonAfter}
          controls={controls}
          keyboard={keyboard}
          stringMode={stringMode}
          formatter={formatter}
          parser={parser}
          status={validationError ? 'error' : (status === 'success' ? undefined : status)}
          style={{ width }}
          autoFocus={autoFocus}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          onPressEnter={onPressEnter}
          onStep={onStep}
        />
          {showResetButton && (
            <Button 
              size="small" 
              icon={<ReloadOutlined />} 
              onClick={handleReset} 
              type="text" 
              style={{ 
                position: 'absolute', 
                right: '8px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                zIndex: 1
              }} 
            />
          )}
        </div>

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

export default InputNumberWidget; 