/**
 * Slider Widget - Numeric range selection functionality
 * 
 * A reusable slider widget that provides numeric range selection with validation,
 * marks, tooltips, and advanced value manipulation capabilities.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Slider, Typography, Space, Button, InputNumber } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

const { Text } = Typography;

export type SliderValue = number | [number, number];

export interface SliderMark {
  value: number;
  label: React.ReactNode;
  style?: React.CSSProperties;
}

export interface SliderWidgetProps {
  /** Selected value */
  value?: SliderValue;
  /** Default value */
  defaultValue?: SliderValue;
  /** Slider label */
  label?: string;
  /** Whether slider is disabled */
  disabled?: boolean;
  /** Whether slider is read-only */
  readOnly?: boolean;
  /** Whether slider is required */
  required?: boolean;
  /** Slider size */
  size?: 'small' | 'middle' | 'large';
  /** Whether to use range slider */
  isRange?: boolean;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step size */
  step?: number;
  /** Marks on the slider */
  marks?: Record<number, SliderMark | React.ReactNode>;
  /** Whether to show marks */
  showMarks?: boolean;
  /** Whether to show tooltip */
  tooltip?: {
    open?: boolean;
    placement?: 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
    formatter?: (value: number) => React.ReactNode;
    autoAdjustOverflow?: boolean;
  };
  /** Whether to show dots for each step */
  dots?: boolean;
  /** Whether to show input number controls */
  showInputNumber?: boolean;
  /** Whether to include min/max in marks */
  included?: boolean;
  /** Whether to reverse the slider */
  reverse?: boolean;
  /** Whether slider is vertical */
  vertical?: boolean;
  /** Height for vertical slider */
  verticalHeight?: number;
  /** Custom track style */
  trackStyle?: React.CSSProperties | React.CSSProperties[];
  /** Custom handle style */
  handleStyle?: React.CSSProperties | React.CSSProperties[];
  /** Custom rail style */
  railStyle?: React.CSSProperties;
  /** Custom dot style */
  dotStyle?: React.CSSProperties;
  /** Custom active dot style */
  activeDotStyle?: React.CSSProperties;
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
  /** Width of the slider */
  width?: number | string;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Custom validation function */
  validator?: (value: SliderValue) => { isValid: boolean; message?: string };
  /** Value prefix */
  valuePrefix?: string;
  /** Value suffix */
  valueSuffix?: string;
  /** Custom value formatter */
  valueFormatter?: (value: number) => string;
  /** Preset values */
  presets?: Array<{
    label: string;
    value: SliderValue;
  }>;
  /** Whether to show current value */
  showCurrentValue?: boolean;
  /** Whether to show min/max labels */
  showMinMaxLabels?: boolean;
  /** Whether to show percentage */
  showPercentage?: boolean;
  /** Custom color for different ranges */
  colorMap?: Array<{
    min: number;
    max: number;
    color: string;
  }>;
  /** Whether to allow keyboard input */
  keyboard?: boolean;
  /** Auto focus on handle */
  autoFocusHandle?: boolean;
  /** Whether to show reset button */
  showResetButton?: boolean;
  /** Reset button text */
  resetButtonText?: string;
  /** Animation duration */
  animationDuration?: number;
  /** Trigger validation on */
  triggerValidation?: 'onChange' | 'onAfterChange' | 'both';
  
  // Event handlers
  /** On value change */
  onChange?: (value: SliderValue) => void;
  /** On value change complete */
  onAfterChange?: (value: SliderValue) => void;
  /** On focus */
  onFocus?: (e: React.FocusEvent) => void;
  /** On blur */
  onBlur?: (e: React.FocusEvent) => void;
  /** On preset select */
  onPresetSelect?: (preset: { label: string; value: SliderValue }) => void;
  /** On reset */
  onReset?: () => void;
  /** On input number change */
  onInputNumberChange?: (value: SliderValue) => void;
}

export const SliderWidget: React.FC<SliderWidgetProps> = ({
  value,
  defaultValue = 0,
  label,
  disabled = false,
  readOnly = false,
  required = false,
  size = 'middle',
  isRange = false,
  min = 0,
  max = 100,
  step = 1,
  marks,
  showMarks = false,
  tooltip = { open: true },
  dots = false,
  showInputNumber = false,
  included = true,
  reverse = false,
  vertical = false,
  verticalHeight = 200,
  trackStyle,
  handleStyle,
  railStyle,
  dotStyle,
  activeDotStyle,
  status,
  errorMessage,
  helpText,
  style,
  className,
  width = '100%',
  autoFocus = false,
  validator,
  valuePrefix = '',
  valueSuffix = '',
  valueFormatter,
  presets = [],
  showCurrentValue = false,
  showMinMaxLabels = false,
  showPercentage = false,
  colorMap = [],
  keyboard = true,
  autoFocusHandle = false,
  showResetButton = false,
  resetButtonText = 'Reset',
  animationDuration = 300,
  triggerValidation = 'both',
  onChange,
  onAfterChange,
  onFocus,
  onBlur,
  onPresetSelect,
  onReset,
  onInputNumberChange
}) => {
  const [internalValue, setInternalValue] = useState<SliderValue>(value !== undefined ? value : defaultValue);
  const [validationError, setValidationError] = useState<string | undefined>();

  // Sync internal state with prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const currentValue = internalValue;

  const validateValue = useCallback((newValue: SliderValue) => {
    if (validator) {
      const validation = validator(newValue);
      if (!validation.isValid) {
        setValidationError(validation.message);
        return false;
      }
    }

    // Range validation
    if (isRange && Array.isArray(newValue)) {
      if (newValue[0] > newValue[1]) {
        setValidationError('Start value must be less than or equal to end value');
        return false;
      }
    }

    // Min/Max validation
    const valuesToCheck = Array.isArray(newValue) ? newValue : [newValue];
    for (const val of valuesToCheck) {
      if (val < min) {
        setValidationError(`Value must be greater than or equal to ${min}`);
        return false;
      }
      if (val > max) {
        setValidationError(`Value must be less than or equal to ${max}`);
        return false;
      }
    }

    setValidationError(undefined);
    return true;
  }, [validator, isRange, min, max]);

  const handleChange = useCallback((newValue: SliderValue) => {
    // Always update internal state immediately for visual feedback
    setInternalValue(newValue);

    // Validate if required
    if (triggerValidation === 'onChange' || triggerValidation === 'both') {
      validateValue(newValue);
    }

    onChange?.(newValue);
  }, [triggerValidation, validateValue, onChange]);

  const handleAfterChange = useCallback((newValue: SliderValue) => {
    // Validate if required
    if (triggerValidation === 'onAfterChange' || triggerValidation === 'both') {
      validateValue(newValue);
    }

    onAfterChange?.(newValue);
  }, [triggerValidation, validateValue, onAfterChange]);

  const handleInputNumberChange = useCallback((newValue: number | null, index?: number) => {
    if (newValue === null) return;

    let updatedValue: SliderValue;
    
    if (isRange && Array.isArray(currentValue)) {
      updatedValue = [...currentValue] as [number, number];
      if (index !== undefined) {
        updatedValue[index] = newValue;
      }
    } else {
      updatedValue = newValue;
    }

    if (value === undefined) {
      setInternalValue(updatedValue);
    }

    validateValue(updatedValue);
    onChange?.(updatedValue);
    onInputNumberChange?.(updatedValue);
  }, [isRange, currentValue, value, validateValue, onChange, onInputNumberChange]);

  const handlePresetSelect = useCallback((preset: { label: string; value: SliderValue }) => {
    if (value === undefined) {
      setInternalValue(preset.value);
    }
    
    validateValue(preset.value);
    onChange?.(preset.value);
    onPresetSelect?.(preset);
  }, [value, validateValue, onChange, onPresetSelect]);

  const handleReset = useCallback(() => {
    const resetValue = defaultValue;
    
    if (value === undefined) {
      setInternalValue(resetValue);
    }
    
    validateValue(resetValue);
    onChange?.(resetValue);
    onReset?.();
  }, [value, defaultValue, validateValue, onChange, onReset]);

  const formatValue = useCallback((val: number) => {
    if (valueFormatter) {
      return valueFormatter(val);
    }
    
    let formatted = val.toString();
    
    if (showPercentage && typeof min === 'number' && typeof max === 'number' && max > min) {
      const percentage = ((val - min) / (max - min)) * 100;
      formatted = `${percentage.toFixed(1)}%`;
    }
    
    return `${valuePrefix}${formatted}${valueSuffix}`;
  }, [valueFormatter, showPercentage, min, max, valuePrefix, valueSuffix]);

  const getSliderColor = useCallback((val: number) => {
    if (colorMap.length === 0) return undefined;
    
    const colorRange = colorMap.find(range => val >= range.min && val <= range.max);
    return colorRange?.color;
  }, [colorMap]);

  const getTrackStyle = useMemo(() => {
    if (trackStyle) return trackStyle;
    
    if (colorMap.length > 0) {
      const val = Array.isArray(currentValue) ? currentValue[0] : currentValue;
      const color = getSliderColor(val);
      return color ? { backgroundColor: color } : {};
    }
    
    return {};
  }, [trackStyle, colorMap, currentValue, getSliderColor]);

  const getMarks = useMemo(() => {
    let sliderMarks = marks || {};
    
    if (showMarks && !marks) {
      const markStep = (max - min) / 4;
      sliderMarks = {};
      for (let i = 0; i <= 4; i++) {
        const markValue = min + (markStep * i);
        sliderMarks[markValue] = formatValue(markValue);
      }
    }
    
    if (showMinMaxLabels) {
      sliderMarks = {
        ...sliderMarks,
        [min]: formatValue(min),
        [max]: formatValue(max)
      };
    }
    
    return sliderMarks;
  }, [marks, showMarks, showMinMaxLabels, min, max, formatValue]);

  const renderPresets = () => {
    if (presets.length === 0) return null;

    return (
      <div style={{ marginBottom: '8px' }}>
        <Text type="secondary" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>
          Quick Select:
        </Text>
        <Space wrap>
          {presets.map((preset, index) => (
            <Button
              key={index}
              size="small"
              type="text"
              onClick={() => handlePresetSelect(preset)}
              disabled={disabled || readOnly}
            >
              {preset.label}
            </Button>
          ))}
        </Space>
      </div>
    );
  };

  const renderInputNumbers = () => {
    if (!showInputNumber) return null;

    if (isRange && Array.isArray(currentValue)) {
      return (
        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <InputNumber
            size={size}
            min={min}
            max={max}
            step={step}
            value={currentValue[0]}
            onChange={(val) => handleInputNumberChange(val, 0)}
            disabled={disabled || readOnly}
            style={{ flex: 1 }}
            prefix={valuePrefix}
            suffix={valueSuffix}
          />
          <Text type="secondary">to</Text>
          <InputNumber
            size={size}
            min={min}
            max={max}
            step={step}
            value={currentValue[1]}
            onChange={(val) => handleInputNumberChange(val, 1)}
            disabled={disabled || readOnly}
            style={{ flex: 1 }}
            prefix={valuePrefix}
            suffix={valueSuffix}
          />
        </div>
      );
    }

    return (
      <div style={{ marginTop: '8px' }}>
        <InputNumber
          size={size}
          min={min}
          max={max}
          step={step}
          value={currentValue as number}
          onChange={(val) => handleInputNumberChange(val)}
          disabled={disabled || readOnly}
          style={{ width: '100%' }}
          prefix={valuePrefix}
          suffix={valueSuffix}
        />
      </div>
    );
  };

  const renderCurrentValue = () => {
    if (!showCurrentValue) return null;

    return (
      <div style={{ marginTop: '8px', textAlign: 'center' }}>
        <Text strong>
          {Array.isArray(currentValue) 
            ? `${formatValue(currentValue[0])} - ${formatValue(currentValue[1])}`
            : formatValue(currentValue as number)
          }
        </Text>
      </div>
    );
  };

  const sliderProps = {
    value: currentValue,
    defaultValue,
    disabled: disabled || readOnly,
    min,
    max,
    step,
    marks: getMarks,
    dots,
    included,
    reverse,
    vertical,
    range: isRange,
    tooltip,
    trackStyle: getTrackStyle,
    handleStyle,
    railStyle,
    dotStyle,
    activeDotStyle,
    keyboard,
    autoFocus: autoFocusHandle || autoFocus,
    onChange: handleChange,
    onAfterChange: handleAfterChange,
    onFocus,
    onBlur,
    style: {
      width: vertical ? undefined : width,
      height: vertical ? verticalHeight : undefined,
      margin: vertical ? '0 auto' : undefined,
      ...style
    }
  };

  const finalErrorMessage = validationError || errorMessage;

  return (
    <div 
      className={`slider-widget ${className || ''}`}
      style={{
        width: '100%',
        ...style
      }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* Label and Reset Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {label && (
            <Text strong={required}>
              {label}
              {required && <span style={{ color: 'hsl(var(--destructive))' }}>*</span>}
            </Text>
          )}
          
          {showResetButton && (
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={handleReset}
              disabled={disabled || readOnly}
              type="text"
            >
              {resetButtonText}
            </Button>
          )}
        </div>

        {/* Presets */}
        {renderPresets()}

        {/* Slider */}
        <div style={{ padding: vertical ? '10px 0' : '10px 0' }}>
          <Slider {...sliderProps as any} />
        </div>

        {/* Current Value */}
        {renderCurrentValue()}

        {/* Input Numbers */}
        {renderInputNumbers()}

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

export default SliderWidget; 
