/**
 * Input Field Widget - Basic text input functionality
 * 
 * A reusable input field widget that provides text input with validation,
 * formatting, and event handling capabilities.
 */

import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Input, Space, Typography } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';

const { Text } = Typography;

export interface InputFieldWidgetProps {
  /** Input value */
  value?: string;
  /** Default value */
  defaultValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Input label */
  label?: string;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Whether input is read-only */
  readOnly?: boolean;
  /** Whether input is required */
  required?: boolean;
  /** Input type */
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url';
  /** Input size */
  size?: 'small' | 'middle' | 'large';
  /** Input variant */
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
  /** Maximum length */
  maxLength?: number;
  /** Show character count */
  showCount?: boolean;
  /** Allow clear button */
  allowClear?: boolean;
  /** Prefix icon or text */
  prefix?: React.ReactNode;
  /** Suffix icon or text */
  suffix?: React.ReactNode;
  /** Add-on before input */
  addonBefore?: React.ReactNode;
  /** Add-on after input */
  addonAfter?: React.ReactNode;
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
  /** Width of the input */
  width?: number | string;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Auto complete */
  autoComplete?: string;
  /** Pattern for validation */
  pattern?: string;
  /** Minimum value (for number type) */
  min?: number;
  /** Maximum value (for number type) */
  max?: number;
  /** Step value (for number type) */
  step?: number;
  /** Custom validation function */
  validator?: (value: string) => { isValid: boolean; message?: string };
  /** Debounce delay for onChange in milliseconds */
  debounceDelay?: number;
  
  // Event handlers
  /** On value change */
  onChange?: (value: string) => void;
  /** On blur */
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** On focus */
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  /** On press enter */
  onPressEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** On key down */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** On key up */
  onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const InputFieldWidget: React.FC<InputFieldWidgetProps> = ({
  value,
  defaultValue,
  placeholder = "Enter text...",
  label,
  disabled = false,
  readOnly = false,
  required = false,
  type = 'text',
  size = 'middle',
  variant,
  maxLength,
  showCount = false,
  allowClear = false,
  prefix,
  suffix,
  addonBefore,
  addonAfter,
  status,
  errorMessage,
  helpText,
  style,
  className,
  width,
  autoFocus = false,
  autoComplete,
  pattern,
  min,
  max,
  step,
  validator,
  debounceDelay = 0,
  onChange,
  onBlur,
  onFocus,
  onPressEnter,
  onKeyDown,
  onKeyUp
}) => {
  const [internalValue, setInternalValue] = useState(value || defaultValue || '');
  const [validationError, setValidationError] = useState<string | undefined>();
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [validationTimer, setValidationTimer] = useState<NodeJS.Timeout | null>(null);

  // Always use internal value for immediate display, update from props when they change
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      setDebounceTimer(prevTimer => {
        if (prevTimer) {
          clearTimeout(prevTimer);
        }
        return null;
      });
      setValidationTimer(prevTimer => {
        if (prevTimer) {
          clearTimeout(prevTimer);
        }
        return null;
      });
    };
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Always update internal state immediately for responsive UI
    setInternalValue(newValue);

    // Debounced validation to prevent excessive validation calls
    if (validator) {
      setValidationTimer(prevTimer => {
        if (prevTimer) {
          clearTimeout(prevTimer);
        }
        return setTimeout(() => {
          const validation = validator(newValue);
          if (!validation.isValid) {
            setValidationError(validation.message);
          } else {
            setValidationError(undefined);
          }
        }, 200); // 200ms debounce for validation
      });
    }

    // Handle debounced onChange
    if (onChange) {
      if (debounceDelay > 0) {
        // Use functional update to avoid dependency on debounceTimer
        setDebounceTimer(prevTimer => {
          if (prevTimer) {
            clearTimeout(prevTimer);
          }
          return setTimeout(() => {
            onChange(newValue);
          }, debounceDelay);
        });
      } else {
        onChange(newValue);
      }
    }
  }, [validator, onChange, debounceDelay]); // Removed debounceTimer from dependencies

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Clear debounce timer on blur to trigger immediate onChange
    setDebounceTimer(prevTimer => {
      if (prevTimer) {
        clearTimeout(prevTimer);
        if (onChange) {
          onChange(e.target.value);
        }
      }
      return null;
    });
    
    onBlur?.(e);
  }, [onChange, onBlur]); // Removed debounceTimer from dependencies

  const getInputProps = () => {
    const inputStatus = validationError ? 'error' : (status === 'success' ? undefined : status);
    const baseProps = {
      value: internalValue,
      placeholder,
      disabled,
      readOnly,
      size,
      variant,
      maxLength,
      showCount,
      allowClear,
      prefix,
      suffix,
      addonBefore,
      addonAfter,
      status: inputStatus,
      autoFocus,
      autoComplete,
      onChange: handleChange,
      onBlur: handleBlur,
      onFocus,
      onPressEnter,
      onKeyDown,
      onKeyUp,
      style: { width, ...style }
    };

    // Add type-specific props
    if (type === 'number') {
      return {
        ...baseProps,
        type: 'number',
        min,
        max,
        step
      };
    }

    if (type === 'password') {
      return {
        ...baseProps,
        type: 'password'
      };
    }

    return {
      ...baseProps,
      type,
      pattern
    };
  };

  const renderInput = () => {
    if (type === 'password') {
      return (
        <Input.Password
          {...getInputProps()}
          iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
        />
      );
    }

    return <Input {...getInputProps()} />;
  };

  const finalErrorMessage = validationError || errorMessage;

  return (
    <div 
      className={`input-field-widget ${className || ''}`}
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
            {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
          </Text>
        )}

        {/* Input */}
        {renderInput()}

        {/* Help Text and Error Message */}
        {(helpText || finalErrorMessage) && (
          <div>
            {finalErrorMessage && (
              <Text type="danger" style={{ fontSize: '12px', color: 'var(--color-danger)' }}>
                {finalErrorMessage}
              </Text>
            )}
            {helpText && !finalErrorMessage && (
              <Text type="secondary" style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {helpText}
              </Text>
            )}
          </div>
        )}
      </Space>
    </div>
  );
};

export default InputFieldWidget; 