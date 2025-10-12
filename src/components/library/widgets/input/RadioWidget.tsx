/**
 * Radio Widget - Single selection radio button functionality
 * 
 * A reusable radio button widget that provides single selection with validation,
 * custom layouts, and advanced styling capabilities.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Radio, Typography, Space, Card, Button, Tooltip } from 'antd';
import { CheckOutlined, ClearOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface RadioOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  description?: string;
  icon?: React.ReactNode;
  color?: string;
  tooltip?: string;
}

export interface RadioWidgetProps {
  /** Selected value */
  value?: string | number;
  /** Default value */
  defaultValue?: string | number;
  /** Radio label */
  label?: string;
  /** Available options */
  options: RadioOption[];
  /** Whether radio is disabled */
  disabled?: boolean;
  /** Whether radio is read-only */
  readOnly?: boolean;
  /** Whether radio is required */
  required?: boolean;
  /** Radio size */
  size?: 'small' | 'middle' | 'large';
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Use button style */
  buttonStyle?: 'outline' | 'solid';
  /** Use card style */
  cardStyle?: boolean;
  /** Allow clear selection */
  allowClear?: boolean;
  /** Show option count */
  showCount?: boolean;
  /** Custom option width */
  optionWidth?: number | string;
  /** Custom option height */
  optionHeight?: number | string;
  /** Options per row (for grid layout) */
  optionsPerRow?: number;
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
  /** Width of the radio group */
  width?: number | string;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Custom option render */
  optionRender?: (option: RadioOption, isSelected: boolean) => React.ReactNode;
  /** Custom validation function */
  validator?: (value: string | number) => { isValid: boolean; message?: string };
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
  
  // Event handlers
  /** On value change */
  onChange?: (value: string | number) => void;
  /** On blur */
  onBlur?: (e: React.FocusEvent<HTMLDivElement>) => void;
  /** On focus */
  onFocus?: (e: React.FocusEvent<HTMLDivElement>) => void;
  /** On option click */
  onOptionClick?: (option: RadioOption) => void;
  /** On clear */
  onClear?: () => void;
  /** On key down */
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

export const RadioWidget: React.FC<RadioWidgetProps> = ({
  value,
  defaultValue,
  label,
  options = [],
  disabled = false,
  readOnly = false,
  required = false,
  size = 'middle',
  direction = 'horizontal',
  buttonStyle = 'solid',
  cardStyle = false,
  allowClear = false,
  showCount = false,
  optionWidth,
  optionHeight,
  optionsPerRow,
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
  onChange,
  onBlur,
  onFocus,
  onOptionClick,
  onClear,
  onKeyDown
}) => {
  const [internalValue, setInternalValue] = useState(value !== undefined ? value : defaultValue);
  const [validationError, setValidationError] = useState<string | undefined>();
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Sync internal state with prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const handleChange = useCallback((e: any) => {
    const newValue = e.target.value;
    
    // Always update internal state immediately for visual feedback
    setInternalValue(newValue);

    // Validate input
    if (validator) {
      const validation = validator(newValue);
      if (!validation.isValid) {
        setValidationError(validation.message);
      } else {
        setValidationError(undefined);
      }
    }

    // Find selected option
    const selectedOption = options.find(option => option.value === newValue);
    if (selectedOption) {
      onOptionClick?.(selectedOption);
    }

    onChange?.(newValue);
  }, [validator, onChange, options, onOptionClick]);

  const handleClear = useCallback(() => {
    const clearedValue = undefined;
    
    // Always update internal state immediately for visual feedback
    setInternalValue(clearedValue);
    
    onChange?.(clearedValue as any);
    onClear?.();
  }, [onChange, onClear]);

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
            handleChange({ target: { value: selectedOption.value } });
          }
        }
        break;
      case 'Escape':
        if (allowClear) {
          handleClear();
        }
        break;
    }
    
    onKeyDown?.(e);
  }, [enableKeyboardNav, options, focusedIndex, allowClear, handleChange, handleClear, onKeyDown]);

  const getGridStyle = useMemo(() => {
    if (!optionsPerRow) return {};
    
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${optionsPerRow}, 1fr)`,
      gap: '8px'
    };
  }, [optionsPerRow]);

  const getOptionStyle = useCallback((option: RadioOption, isSelected: boolean) => {
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

  const renderOption = useCallback((option: RadioOption, index: number) => {
    const isSelected = internalValue === option.value;
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
            <div style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
              {option.description}
            </div>
          )}
        </div>
        {showSelectionIndicator && isSelected && (
          <CheckOutlined style={{ color: 'hsl(var(--primary))' }} />
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
              handleChange({ target: { value: option.value } });
            }
          }}
        >
          {content}
        </Card>
      );
    }

    return content;
  }, [internalValue, focusedIndex, optionRender, getOptionStyle, showSelectionIndicator, cardStyle, readOnly, handleChange]);

  const renderRadioGroup = () => {
    if (buttonStyle && !cardStyle) {
      return (
        <Radio.Group
          value={internalValue}
          onChange={handleChange}
          disabled={disabled || readOnly}
          size={size}
          buttonStyle={buttonStyle}
          style={{ width }}
        >
          <Space direction={direction} style={getGridStyle}>
            {options.map((option, index) => (
              <Tooltip key={option.value} title={option.tooltip}>
                <Radio.Button
                  value={option.value}
                  disabled={option.disabled}
                  style={getOptionStyle(option, internalValue === option.value)}
                >
                  {renderOption(option, index)}
                </Radio.Button>
              </Tooltip>
            ))}
          </Space>
        </Radio.Group>
      );
    }

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
          {options.map((option, index) => (
            <Tooltip key={option.value} title={option.tooltip}>
              <div>{renderOption(option, index)}</div>
            </Tooltip>
          ))}
        </div>
      );
    }

    return (
      <div onKeyDown={handleKeyDown} tabIndex={0}>
        <Radio.Group
          value={internalValue}
          onChange={handleChange}
          disabled={disabled || readOnly}
          size={size}
          style={{ width }}
        >
          <Space direction={direction} style={getGridStyle}>
            {options.map((option, index) => (
              <Tooltip key={option.value} title={option.tooltip}>
                <Radio
                  value={option.value}
                  disabled={option.disabled}
                  style={getOptionStyle(option, internalValue === option.value)}
                  autoFocus={autoFocus && index === 0}
                >
                  {renderOption(option, index)}
                </Radio>
              </Tooltip>
            ))}
          </Space>
        </Radio.Group>
      </div>
    );
  };

  const finalErrorMessage = validationError || errorMessage;

  return (
    <div 
      className={`radio-widget ${className || ''}`}
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
          {label && (
            <Text strong={required}>
              {label}
              {required && <span style={{ color: 'hsl(var(--destructive))' }}>*</span>}
              {showCount && (
                <span style={{ marginLeft: '8px', color: 'hsl(var(--muted-foreground))', fontSize: '12px' }}>
                  ({options.length} option{options.length !== 1 ? 's' : ''})
                </span>
              )}
            </Text>
          )}
          
          {allowClear && internalValue !== undefined && (
            <Button
              size="small"
              icon={<ClearOutlined />}
              onClick={handleClear}
              disabled={disabled || readOnly}
              type="text"
              title="Clear selection"
            />
          )}
        </div>

        {/* Radio Group */}
        {renderRadioGroup()}

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

export default RadioWidget; 