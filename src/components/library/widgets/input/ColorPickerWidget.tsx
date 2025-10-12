/**
 * ColorPicker Widget - Color selection
 */

import React, { useState, useCallback, useEffect } from 'react';
import { ColorPicker, Typography, Space } from 'antd';

const { Text } = Typography;

export interface ColorPickerWidgetProps {
  value?: string;
  defaultValue?: string;
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  size?: 'small' | 'middle' | 'large';
  allowClear?: boolean;
  arrow?: boolean;
  format?: any;
  open?: boolean;
  placement?: 'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight';
  presets?: Array<{ label: string; colors: string[] }>;
  showText?: boolean;
  trigger?: 'click' | 'hover';
  status?: 'error' | 'warning' | 'success';
  errorMessage?: string;
  helpText?: string;
  style?: React.CSSProperties;
  className?: string;
  validator?: (value: string) => { isValid: boolean; message?: string };
  
  onChange?: (value: string, color: any) => void;
  onFormatChange?: (format?: any) => void;
  onOpenChange?: (open: boolean) => void;
}

export const ColorPickerWidget: React.FC<ColorPickerWidgetProps> = ({
  value,
  defaultValue = '#1677ff',
  label,
  disabled = false,
  readOnly = false,
  required = false,
  size = 'middle',
  allowClear = false,
  arrow = true,
  format = undefined,
  open,
  placement = 'bottomLeft',
  presets = [],
  showText = false,
  trigger = 'click',
  status,
  errorMessage,
  helpText,
  style,
  className,
  validator,
  onChange,
  onFormatChange,
  onOpenChange
}) => {
  const [internalValue, setInternalValue] = useState(value || defaultValue);
  const [validationError, setValidationError] = useState<string | undefined>();

  // Sync internal state with prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = useCallback((color: any, colorString: string) => {
    // Always update internal state immediately for visual feedback
    setInternalValue(colorString);

    if (validator) {
      const validation = validator(colorString);
      if (!validation.isValid) {
        setValidationError(validation.message);
      } else {
        setValidationError(undefined);
      }
    }

    onChange?.(colorString, color);
  }, [validator, onChange]);

  const finalErrorMessage = validationError || errorMessage;

  return (
    <div className={`color-picker-widget ${className || ''}`} style={{ width: '100%', ...style }}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {label && (
          <Text strong={required}>
            {label}
            {required && <span style={{ color: 'hsl(var(--destructive))' }}>*</span>}
          </Text>
        )}

        <ColorPicker
          value={internalValue}
          defaultValue={defaultValue}
          disabled={disabled || readOnly}
          size={size}
          allowClear={allowClear}
          arrow={arrow}
          format={format}
          open={open}
          placement={placement}
          presets={presets}
          showText={showText}
          trigger={trigger}
          onChange={handleChange}
          onFormatChange={onFormatChange}
          onOpenChange={onOpenChange}
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

export default ColorPickerWidget; 