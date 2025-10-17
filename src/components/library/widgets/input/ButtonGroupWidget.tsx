/**
 * ButtonGroupWidget - Button group selection component
 * 
 * A form input widget that provides selection via button groups.
 * Supports single/multiple selection, icons, colors, and comprehensive customization.
 * Perfect for option selection, toggle groups, and filter controls.
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Button, Space, Tooltip, theme } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { sanitizeData } from '../../../../utils/sanitizeData';

// Button option interface
export interface ButtonOption {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  color?: string;
  tooltip?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Button group widget props
export interface ButtonGroupWidgetProps {
  id: string;
  label?: string;
  value?: string | number | (string | number)[];
  defaultValue?: string | number | (string | number)[];
  onChange?: (value: string | number | (string | number)[]) => void;
  
  // Data and configuration
  options: ButtonOption[];
  multiple?: boolean;
  
  // Appearance
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  block?: boolean;
  
  // Button styling
  type?: 'default' | 'primary' | 'dashed' | 'link' | 'text';
  shape?: 'default' | 'circle' | 'round';
  variant?: 'outlined' | 'filled' | 'borderless';
  
  // Layout
  direction?: 'horizontal' | 'vertical';
  wrap?: boolean;
  spacing?: number | [number, number];
  
  // Selection behavior
  allowDeselect?: boolean;
  minSelection?: number;
  maxSelection?: number;
  
  // Validation
  required?: boolean;
  validateOnChange?: boolean;
  validator?: (value: string | number | (string | number)[]) => string | null;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  
  // Interactions
  onFocus?: (value: string | number) => void;
  onBlur?: (value: string | number) => void;
  
  // Visual states
  showCheckmark?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  
  // Loading state
  loading?: boolean;
  
  // Custom rendering
  renderOption?: (option: ButtonOption, isSelected: boolean) => React.ReactNode;
}

/**
 * ButtonGroupWidget Component
 * 
 * Provides button group selection with single/multiple modes.
 * Supports icons, tooltips, validation, and comprehensive customization.
 */
export const ButtonGroupWidget: React.FC<ButtonGroupWidgetProps> = ({
  id,
  label,
  value,
  defaultValue,
  onChange,
  
  options,
  multiple = false,
  
  size = 'middle',
  disabled = false,
  block = false,
  
  type = 'default',
  shape = 'default',
  variant = 'outlined',
  
  direction = 'horizontal',
  wrap = true,
  spacing = 8,
  
  allowDeselect = true,
  minSelection = 0,
  maxSelection,
  
  required = false,
  validateOnChange = true,
  validator,
  
  className,
  style,
  buttonStyle,
  
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  
  onFocus,
  onBlur,
  
  showCheckmark = true,
  activeColor,
  inactiveColor,
  
  loading = false,
  
  renderOption,
}) => {
  // Get theme tokens
  const { token } = theme.useToken();
  const [internalValue, setInternalValue] = useState<string | number | (string | number)[]>(
    value || defaultValue || (multiple ? [] : '')
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // Theme-aware color values
  const themeColors = useMemo(() => ({
    primary: activeColor || token.colorPrimary,
    primaryHover: token.colorPrimaryHover || token.colorPrimary,
    primaryActive: token.colorPrimaryActive || token.colorPrimary,
    surface: inactiveColor || token.colorBgContainer,
    border: token.colorBorder,
    text: token.colorText,
    textSecondary: token.colorTextSecondary,
    disabledBg: token.colorBgContainerDisabled,
    disabledBorder: token.colorBorder,
    disabledText: token.colorTextDisabled,
    error: token.colorError,
  }), [token, activeColor, inactiveColor]);

  // Dynamic styles based on theme
  const buttonStyles = useMemo(() => ({
    base: {
      position: 'relative' as const,
      transition: `all ${token.motionDurationMid} ease`,
      borderRadius: token.borderRadius,
    },
    hover: {
      backgroundColor: themeColors.primaryHover,
      borderColor: themeColors.primaryHover,
      color: 'hsl(var(--primary-foreground))',
    },
    focus: {
      boxShadow: `0 0 0 2px ${token.colorPrimaryBg}`,
    },
    selected: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
      color: 'hsl(var(--primary-foreground))',
    },
    disabled: {
      backgroundColor: themeColors.disabledBg,
      borderColor: themeColors.disabledBorder,
      color: themeColors.disabledText,
      cursor: 'not-allowed' as const,
    },
  }), [token, themeColors]);

  // Sanitize options data
  const sanitizedOptions = useMemo(() => {
    return sanitizeData(options) as ButtonOption[];
  }, [options]);

  // Normalize value to array for easier handling
  const normalizedValue = useMemo(() => {
    if (multiple) {
      return Array.isArray(internalValue) ? internalValue : [internalValue].filter(v => v !== '');
    }
    return Array.isArray(internalValue) ? internalValue : [internalValue].filter(v => v !== '');
  }, [internalValue, multiple]);

  // Check if option is selected
  const isSelected = useCallback((optionValue: string | number) => {
    return normalizedValue.includes(optionValue);
  }, [normalizedValue]);

  // Validation function
  const validateValue = useCallback((val: string | number | (string | number)[]): string | null => {
    const selectedValues = Array.isArray(val) ? val : [val].filter(v => v !== '');
    
    if (required && selectedValues.length === 0) {
      return 'Selection is required';
    }
    
    if (minSelection && selectedValues.length < minSelection) {
      return `At least ${minSelection} option${minSelection > 1 ? 's' : ''} must be selected`;
    }
    
    if (maxSelection && selectedValues.length > maxSelection) {
      return `At most ${maxSelection} option${maxSelection > 1 ? 's' : ''} can be selected`;
    }
    
    if (validator) {
      return validator(val);
    }
    
    return null;
  }, [required, minSelection, maxSelection, validator]);

  // Handle value change
  const handleValueChange = useCallback((newValue: string | number | (string | number)[]) => {
    setInternalValue(newValue);
    
    if (validateOnChange) {
      const error = validateValue(newValue);
      setValidationError(error);
    }
    
    onChange?.(newValue);
  }, [onChange, validateOnChange, validateValue]);

  // Handle option click
  const handleOptionClick = useCallback((optionValue: string | number) => {
    if (disabled || loading) return;
    
    if (multiple) {
      let newValue: (string | number)[];
      const currentArray = Array.isArray(internalValue) ? internalValue : [];
      
      if (isSelected(optionValue)) {
        // Deselect
        if (allowDeselect) {
          newValue = currentArray.filter(v => v !== optionValue);
        } else {
          return; // Don't allow deselection
        }
      } else {
        // Select
        if (maxSelection && currentArray.length >= maxSelection) {
          return; // Don't allow selection beyond max
        }
        newValue = [...currentArray, optionValue];
      }
      
      handleValueChange(newValue);
    } else {
      let newValue: string | number | (string | number)[];
      
      if (isSelected(optionValue) && allowDeselect) {
        // Deselect in single mode
        newValue = '';
      } else {
        // Select in single mode
        newValue = optionValue;
      }
      
      handleValueChange(newValue);
    }
  }, [
    disabled,
    loading,
    multiple,
    internalValue,
    isSelected,
    allowDeselect,
    maxSelection,
    handleValueChange,
  ]);

  // Handle focus
  const handleFocus = useCallback((optionValue: string | number) => {
    onFocus?.(optionValue);
  }, [onFocus]);

  // Handle blur
  const handleBlur = useCallback((optionValue: string | number) => {
    onBlur?.(optionValue);
  }, [onBlur]);

  // Update internal value when prop changes
  useEffect(() => {
    setInternalValue(value || (multiple ? [] : ''));
  }, [value, multiple]);

  // Inject theme-aware styles
  useEffect(() => {
    const styleId = 'button-group-widget-theme-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    // Update styles with current theme tokens
    styleElement.textContent = `
      .button-group-option {
        position: relative;
        transition: all ${token.motionDurationMid} ease;
        border-radius: ${token.borderRadius}px;
      }
      
      .button-group-option:hover:not(:disabled) {
        background-color: ${themeColors.primaryHover} !important;
        border-color: ${themeColors.primaryHover} !important;
        color: hsl(var(--primary-foreground)) !important;
      }
      
      .button-group-option:focus {
        box-shadow: 0 0 0 2px ${token.colorPrimaryBg} !important;
      }
      
      .button-group-option.selected {
        background-color: ${themeColors.primary} !important;
        border-color: ${themeColors.primary} !important;
        color: hsl(var(--primary-foreground)) !important;
      }
      
      .button-group-option.selected:hover:not(:disabled) {
        background-color: ${themeColors.primaryHover} !important;
        border-color: ${themeColors.primaryHover} !important;
      }
      
      .button-group-option:disabled {
        background-color: ${themeColors.disabledBg} !important;
        border-color: ${themeColors.disabledBorder} !important;
        color: ${themeColors.disabledText} !important;
        cursor: not-allowed !important;
      }
    `;
  }, [token, themeColors]);

  // Render individual button
  const renderButton = useCallback((option: ButtonOption) => {
    const selected = isSelected(option.value);
    const isDisabled = disabled || option.disabled || loading;
    
    // Custom rendering if provided
    if (renderOption) {
      return renderOption(option, selected);
    }
    
    // Button content
    const buttonContent = (
      <Space size={4}>
        {option.icon}
        <span>{option.label}</span>
        {showCheckmark && selected && <CheckOutlined />}
      </Space>
    );
    
    // Button props
    const buttonProps = {
      type: selected ? 'primary' : type,
      size,
      disabled: isDisabled,
      loading: loading,
      shape,
      block: block && direction === 'vertical',
      style: {
        ...buttonStyles.base,
        backgroundColor: selected ? themeColors.primary : themeColors.surface,
        borderColor: selected ? themeColors.primary : themeColors.border,
        color: selected ? 'hsl(var(--primary-foreground))' : themeColors.text,
        ...(isDisabled && buttonStyles.disabled),
        ...buttonStyle,
        ...option.style,
      },
      className: `${option.className || ''} button-group-option ${selected ? 'selected' : ''}`.trim(),
      onClick: () => handleOptionClick(option.value),
      onFocus: () => handleFocus(option.value),
      onBlur: () => handleBlur(option.value),
      'aria-pressed': selected,
      'aria-label': option.tooltip || option.label,
    };
    
    const button = <Button key={option.value} {...buttonProps}>{buttonContent}</Button>;
    
    // Wrap with tooltip if provided
    if (option.tooltip) {
      return (
        <Tooltip key={option.value} title={option.tooltip}>
          {button}
        </Tooltip>
      );
    }
    
    return button;
  }, [
    isSelected,
    disabled,
    loading,
    renderOption,
    showCheckmark,
    type,
    size,
    shape,
    block,
    direction,
    buttonStyle,
    buttonStyles,
    themeColors,
    handleOptionClick,
    handleFocus,
    handleBlur,
  ]);

  return (
    <div className={className} style={style}>
      {label && (
        <label 
          htmlFor={id}
          style={{ 
            display: 'block', 
            marginBottom: token.marginXS,
            fontWeight: token.fontWeightStrong,
            color: required ? themeColors.error : themeColors.text
          }}
        >
          {label}
          {required && <span style={{ color: themeColors.error }}> *</span>}
        </label>
      )}
      
      <Space
        direction={direction}
        wrap={wrap}
        size={spacing}
        style={{
          width: block ? '100%' : 'auto',
          display: direction === 'vertical' ? 'flex' : undefined,
        }}
      >
        {sanitizedOptions.map(renderButton)}
      </Space>
      
      {validationError && (
        <div style={{ 
          color: themeColors.error, 
          fontSize: token.fontSizeSM, 
          marginTop: token.marginXS 
        }}>
          {validationError}
        </div>
      )}
      
      {multiple && (
        <div style={{ 
          marginTop: token.marginXS, 
          fontSize: token.fontSizeSM, 
          color: themeColors.textSecondary 
        }}>
          {normalizedValue.length} selected
          {minSelection > 0 && ` (min: ${minSelection})`}
          {maxSelection && ` (max: ${maxSelection})`}
        </div>
      )}
    </div>
  );
};

export default ButtonGroupWidget; 
