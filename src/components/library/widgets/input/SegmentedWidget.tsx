/**
 * SegmentedWidget - Modern segmented control component
 * 
 * A form input widget that provides a segmented control interface for selecting
 * between multiple options. Modern alternative to radio buttons with better UX.
 * Perfect for toggles, view modes, filters, and option selection.
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Segmented, Space, Typography, Tooltip } from 'antd';
import { sanitizeData } from '../../../../utils/sanitizeData';

// Theme-aware styles
const themeStyles = {
  container: {
    '--segmented-bg': 'hsl(var(--background))',
    '--segmented-border': 'hsl(var(--border))',
    '--segmented-text': 'hsl(var(--foreground))',
    '--segmented-text-secondary': 'hsl(var(--muted-foreground))',
    '--segmented-hover-bg': 'hsl(var(--accent))',
    '--segmented-selected-bg': 'hsl(var(--primary))',
    '--segmented-selected-text': 'hsl(var(--primary-foreground))',
    '--segmented-disabled-bg': 'hsl(var(--muted))',
    '--segmented-disabled-text': 'hsl(var(--muted-foreground))',
    '--segmented-error': 'hsl(var(--destructive))',
  } as React.CSSProperties,
  segmented: {
    backgroundColor: 'var(--segmented-bg)',
    borderColor: 'var(--segmented-border)',
    color: 'var(--segmented-text)',
  } as React.CSSProperties,
};

const { Text } = Typography;

// Segmented option interface
export interface SegmentedOption {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// Segmented widget props
export interface SegmentedWidgetProps {
  id: string;
  label?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string | number) => void;
  
  // Data and configuration
  options: SegmentedOption[];
  
  // Appearance
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  block?: boolean;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
  
  // Validation
  required?: boolean;
  validateOnChange?: boolean;
  validator?: (value: any) => string | null;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  
  // Custom rendering
  optionRender?: (option: SegmentedOption) => React.ReactNode;
  
  // Interactions
  onFocus?: (e: React.FocusEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;
  
  // Presets and configuration
  presets?: {
    [key: string]: SegmentedOption[];
  };
  preset?: string;
  
  // Tooltips
  showTooltips?: boolean;
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  
  // Loading state
  loading?: boolean;
}

/**
 * SegmentedWidget Component
 * 
 * Provides a modern segmented control for option selection.
 * Supports icons, tooltips, validation, and comprehensive customization.
 */
export const SegmentedWidget: React.FC<SegmentedWidgetProps> = ({
  id,
  label,
  value,
  defaultValue,
  onChange,
  
  options,
  
  size = 'middle',
  disabled = false,
  block = false,
  
  className,
  style,
  
  required = false,
  validateOnChange = true,
  validator,
  
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  
  optionRender,
  
  onFocus,
  onBlur,
  
  presets,
  preset,
  
  showTooltips = true,
  tooltipPlacement = 'top',
  
  loading = false,
}) => {
  const [internalValue, setInternalValue] = useState<string | number | undefined>(value || defaultValue);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Get options from preset or use provided options
  const finalOptions = useMemo(() => {
    if (preset && presets && presets[preset]) {
      return presets[preset];
    }
    return options;
  }, [preset, presets, options]);

  // Sanitize options data
  const sanitizedOptions = useMemo(() => {
    return sanitizeData(finalOptions) as SegmentedOption[];
  }, [finalOptions]);

  // Convert options to Ant Design format
  const antOptions = useMemo(() => {
    return sanitizedOptions.map(option => {
      const antOption: any = {
        label: option.label,
        value: option.value,
        disabled: option.disabled,
        className: option.className,
        style: option.style,
      };

      // Add icon if provided
      if (option.icon) {
        antOption.icon = option.icon;
      }

      return antOption;
    });
  }, [sanitizedOptions]);

  // Validation function
  const validateValue = useCallback((val: any): string | null => {
    if (required && (val === undefined || val === null || val === '')) {
      return 'This field is required';
    }
    
    if (validator) {
      return validator(val);
    }
    
    return null;
  }, [required, validator]);

  // Handle value change
  const handleChange = useCallback((newValue: string | number) => {
    // Always update internal state immediately for visual feedback
    setInternalValue(newValue);
    
    if (validateOnChange) {
      const error = validateValue(newValue);
      setValidationError(error);
    }
    
    onChange?.(newValue);
  }, [onChange, validateOnChange, validateValue]);

  // Update internal value when prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // Render option with tooltip if enabled
  const renderOption = useCallback((option: SegmentedOption) => {
    if (optionRender) {
      return optionRender(option);
    }

    const content = (
      <Space size={4}>
        {option.icon}
        <span>{option.label}</span>
      </Space>
    );

    if (showTooltips && option.label) {
      return (
        <Tooltip
          title={option.label}
          placement={tooltipPlacement}
          mouseEnterDelay={0.5}
        >
          {content}
        </Tooltip>
      );
    }

    return content;
  }, [optionRender, showTooltips, tooltipPlacement]);

  // Build enhanced options with custom rendering
  const enhancedOptions = useMemo(() => {
    return antOptions.map(option => ({
      ...option,
      label: renderOption(sanitizedOptions.find(opt => opt.value === option.value)!),
    }));
  }, [antOptions, sanitizedOptions, renderOption]);

  return (
    <div 
      className={className} 
      style={{
        ...themeStyles.container,
        ...style
      }}
    >
      <style>
        {`
          .segmented-theme-compatible .ant-segmented {
            background-color: var(--segmented-bg) !important;
            border-color: var(--segmented-border) !important;
            color: var(--segmented-text) !important;
          }
          
          .segmented-theme-compatible .ant-segmented-item {
            color: var(--segmented-text) !important;
            background-color: transparent !important;
            border-color: transparent !important;
          }
          
          .segmented-theme-compatible .ant-segmented-item:hover {
            color: var(--segmented-text) !important;
            background-color: var(--segmented-hover-bg) !important;
          }
          
          .segmented-theme-compatible .ant-segmented-item-selected {
            color: white !important;
            background-color: var(--segmented-selected-bg) !important;
            border-color: var(--segmented-selected-bg) !important;
          }
          
          .segmented-theme-compatible .ant-segmented-item-disabled {
            color: var(--segmented-disabled-text) !important;
            background-color: var(--segmented-disabled-bg) !important;
          }
          
          .segmented-theme-compatible .ant-segmented-thumb {
            background-color: var(--segmented-selected-bg) !important;
            border-color: var(--segmented-selected-bg) !important;
          }
        `}
      </style>
      {label && (
        <label 
          htmlFor={id}
          style={{ 
            display: 'block', 
            marginBottom: 8,
            fontWeight: 500,
            color: required ? 'var(--segmented-error)' : 'var(--segmented-text)'
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--segmented-error)' }}> *</span>}
        </label>
      )}
      
      <div className="segmented-theme-compatible">
        <Segmented
          value={internalValue}
          options={enhancedOptions}
          size={size}
          disabled={disabled || loading}
          block={block}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          style={themeStyles.segmented}
        />
      </div>
      
      {validationError && (
        <div style={{ 
          color: 'var(--segmented-error)', 
          fontSize: 12, 
          marginTop: 4 
        }}>
          {validationError}
        </div>
      )}
      
      {loading && (
        <div style={{ 
          textAlign: 'center', 
          color: 'var(--segmented-text-secondary)', 
          fontSize: 12, 
          marginTop: 4 
        }}>
          Loading...
        </div>
      )}
    </div>
  );
};

export default SegmentedWidget; 