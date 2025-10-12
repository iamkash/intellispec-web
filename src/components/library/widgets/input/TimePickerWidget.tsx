/**
 * TimePicker Widget - Time selection functionality
 * 
 * A reusable time picker widget that provides time selection with validation,
 * 12/24 hour format, time ranges, and advanced time manipulation capabilities.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { TimePicker, Typography, Space, Button, Select, Tooltip, Alert, Spin } from 'antd';
import { ClockCircleOutlined, ClearOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { sanitizeData } from '../../../../utils/sanitizeData';

const { RangePicker } = TimePicker;
const { Text } = Typography;
const { Option } = Select;

export type TimeValue = Dayjs | null;
export type TimeRangeValue = [Dayjs | null, Dayjs | null] | null;

/**
 * Convert string or other value to dayjs time object
 */
const convertToTimeValue = (value: any): TimeValue => {
  if (!value) return null;
  if (dayjs.isDayjs(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = dayjs(value);
      return (parsed && typeof parsed.isValid === 'function' && parsed.isValid()) ? parsed : null;
    } catch (error) {
      return null;
    }
  }
  return null;
};

/**
 * Convert range value to dayjs time objects
 */
const convertToTimeRangeValue = (value: any): TimeRangeValue => {
  if (!value) return null;
  if (Array.isArray(value)) {
    return [convertToTimeValue(value[0]), convertToTimeValue(value[1])];
  }
  return null;
};

export interface TimePickerWidgetProps {
  /** Selected time value */
  value?: TimeValue | TimeRangeValue;
  /** Default time value */
  defaultValue?: TimeValue | TimeRangeValue;
  /** TimePicker label */
  label?: string;
  /** Whether timepicker is disabled */
  disabled?: boolean;
  /** Whether timepicker is read-only */
  readOnly?: boolean;
  /** Whether timepicker is required */
  required?: boolean;
  /** TimePicker size */
  size?: 'small' | 'middle' | 'large';
  /** TimePicker variant */
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
  /** Whether to use range picker */
  isRange?: boolean;
  /** Time format */
  format?: string;
  /** Placeholder text */
  placeholder?: string | [string, string];
  /** Allow clear selection */
  allowClear?: boolean;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Use 12 hour format */
  use12Hours?: boolean;
  /** Show hour */
  showHour?: boolean;
  /** Show minute */
  showMinute?: boolean;
  /** Show second */
  showSecond?: boolean;
  /** Show now button */
  showNow?: boolean;
  /** Hour step */
  hourStep?: number;
  /** Minute step */
  minuteStep?: number;
  /** Second step */
  secondStep?: number;
  /** Hide disabled options */
  hideDisabledOptions?: boolean;
  /** Disabled hours */
  disabledHours?: () => number[];
  /** Disabled minutes */
  disabledMinutes?: (selectedHour: number) => number[];
  /** Disabled seconds */
  disabledSeconds?: (selectedHour: number, selectedMinute: number) => number[];
  /** Default open value */
  defaultOpenValue?: TimeValue;
  /** Custom render for addon */
  renderExtraFooter?: () => React.ReactNode;
  /** Preset times */
  presets?: Array<{
    label: string;
    value: TimeValue | TimeRangeValue;
  }>;
  /** Default open state */
  defaultOpen?: boolean;
  /** Controlled open state */
  open?: boolean;
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
  /** Width of the timepicker */
  width?: number | string;
  /** Dropdown placement */
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
  /** Custom validation function */
  validator?: (value: TimeValue | TimeRangeValue) => { isValid: boolean; message?: string };
  /** Input read only */
  inputReadOnly?: boolean;
  /** Custom suffix icon */
  suffixIcon?: React.ReactNode;
  /** Custom clear icon */
  clearIcon?: React.ReactNode;
  /** Allow input typing */
  allowTyping?: boolean;
  /** Popup container */
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  /** Minimum selectable time */
  minTime?: TimeValue;
  /** Maximum selectable time */
  maxTime?: TimeValue;
  /** Time zones support */
  timeZone?: string;
  /** Show time zone selector */
  showTimeZone?: boolean;
  /** Available time zones */
  timeZones?: Array<{
    label: string;
    value: string;
  }>;
  
  // Event handlers
  /** On time change */
  onChange?: (value: TimeValue | TimeRangeValue, timeString: string | [string, string]) => void;
  /** On time select */
  onSelect?: (value: TimeValue) => void;
  /** On open change */
  onOpenChange?: (open: boolean) => void;
  /** On OK button click */
  onOk?: (value: TimeValue | TimeRangeValue) => void;
  /** On blur */
  onBlur?: () => void;
  /** On focus */
  onFocus?: () => void;
  /** On preset select */
  onPresetSelect?: (preset: { label: string; value: TimeValue | TimeRangeValue }) => void;
  /** On time zone change */
  onTimeZoneChange?: (timeZone: string) => void;
}

export const TimePickerWidget: React.FC<TimePickerWidgetProps> = ({
  value,
  defaultValue,
  label,
  disabled = false,
  readOnly = false,
  required = false,
  size = 'middle',
  variant,
  isRange = false,
  format,
  placeholder,
  allowClear = true,
  autoFocus = false,
  use12Hours = false,
  showHour = true,
  showMinute = true,
  showSecond = false,
  showNow = true,
  hourStep = 1,
  minuteStep = 1,
  secondStep = 1,
  hideDisabledOptions = false,
  disabledHours,
  disabledMinutes,
  disabledSeconds,
  defaultOpenValue,
  renderExtraFooter,
  presets = [],
  defaultOpen = false,
  open,
  status,
  errorMessage,
  helpText,
  style,
  className,
  width = '100%',
  placement = 'bottomLeft',
  validator,
  inputReadOnly = false,
  suffixIcon,
  clearIcon,
  allowTyping = true,
  getPopupContainer,
  minTime,
  maxTime,
  timeZone,
  showTimeZone = false,
  timeZones = [],
  onChange,
  onSelect,
  onOpenChange,
  onOk,
  onBlur,
  onFocus,
  onPresetSelect,
  onTimeZoneChange
}) => {
  const [internalValue, setInternalValue] = useState<TimeValue | TimeRangeValue>(value !== undefined ? value : (defaultValue || null));
  const [validationError, setValidationError] = useState<string | undefined>();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [selectedTimeZone, setSelectedTimeZone] = useState<string>(timeZone || '');

  // Sync internal state with prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // Convert values to proper dayjs objects
  const convertedValue = useMemo(() => {
    if (isRange) {
      return convertToTimeRangeValue(internalValue);
    } else {
      return convertToTimeValue(internalValue);
    }
  }, [internalValue, isRange]);

  const convertedDefaultValue = useMemo(() => {
    if (isRange) {
      return convertToTimeRangeValue(defaultValue);
    } else {
      return convertToTimeValue(defaultValue);
    }
  }, [defaultValue, isRange]);

  const rangeDefaultValue = useMemo(() => {
    return isRange ? convertedDefaultValue as TimeRangeValue : null;
  }, [convertedDefaultValue, isRange]);

  const singleDefaultValue = useMemo(() => {
    return !isRange ? convertedDefaultValue as TimeValue : null;
  }, [convertedDefaultValue, isRange]);

  const currentOpen = open !== undefined ? open : internalOpen;

  const handleChange = useCallback((newValue: TimeValue | TimeRangeValue, timeString: string | [string, string]) => {
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

    // Additional validation for time ranges
    if (isRange && Array.isArray(newValue) && newValue[0] && newValue[1]) {
      if (dayjs.isDayjs(newValue[0]) && dayjs.isDayjs(newValue[1]) && typeof newValue[0].isAfter === 'function' && newValue[0].isAfter(newValue[1])) {
        setValidationError('Start time must be before end time');
        return;
      }
    }

    // Check min/max time constraints
    const timeToCheck = isRange ? (Array.isArray(newValue) ? newValue[0] : null) : newValue as TimeValue;
    if (timeToCheck && dayjs.isDayjs(timeToCheck)) {
      if (minTime && dayjs.isDayjs(minTime) && typeof timeToCheck.isBefore === 'function' && timeToCheck.isBefore(minTime)) {
        setValidationError(`Time must be after ${minTime.format ? minTime.format(getFormat()) : minTime}`);
        return;
      }
      if (maxTime && dayjs.isDayjs(maxTime) && typeof timeToCheck.isAfter === 'function' && timeToCheck.isAfter(maxTime)) {
        setValidationError(`Time must be before ${maxTime.format ? maxTime.format(getFormat()) : maxTime}`);
        return;
      }
    }

    setValidationError(undefined);
    onChange?.(newValue, timeString);
  }, [validator, onChange, isRange, minTime, maxTime]);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [open, onOpenChange]);

  const handlePresetSelect = useCallback((preset: { label: string; value: TimeValue | TimeRangeValue }) => {
    handleChange(preset.value, Array.isArray(preset.value) ? [
      preset.value[0]?.format(getFormat()) || '',
      preset.value[1]?.format(getFormat()) || ''
    ] : preset.value?.format(getFormat()) || '');
    onPresetSelect?.(preset);
  }, [handleChange, onPresetSelect]);

  const handleTimeZoneChange = useCallback((newTimeZone: string) => {
    setSelectedTimeZone(newTimeZone);
    onTimeZoneChange?.(newTimeZone);
  }, [onTimeZoneChange]);

  const getFormat = useCallback(() => {
    if (format) return format;
    
    let timeFormat = '';
    if (showHour) timeFormat += use12Hours ? 'h' : 'HH';
    if (showMinute) timeFormat += (timeFormat ? ':' : '') + 'mm';
    if (showSecond) timeFormat += (timeFormat ? ':' : '') + 'ss';
    if (use12Hours) timeFormat += ' A';
    
    return timeFormat || 'HH:mm';
  }, [format, use12Hours, showHour, showMinute, showSecond]);

  const getPlaceholder = useMemo(() => {
    if (placeholder) return placeholder;
    
    if (isRange) {
      return ['Start time', 'End time'];
    }
    
    return 'Select time';
  }, [placeholder, isRange]);

  const getDisabledTime = useCallback(() => {
    return {
      disabledHours,
      disabledMinutes,
      disabledSeconds,
    };
  }, [disabledHours, disabledMinutes, disabledSeconds]);

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

  const renderTimeZoneSelector = () => {
    if (!showTimeZone || timeZones.length === 0) return null;

    return (
      <div style={{ marginBottom: '8px' }}>
        <Text type="secondary" style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>
          Time Zone:
        </Text>
        <Space wrap>
          {timeZones.map((tz) => (
            <Button
              key={tz.value}
              size="small"
              type={selectedTimeZone === tz.value ? 'primary' : 'text'}
              onClick={() => handleTimeZoneChange(tz.value)}
              disabled={disabled || readOnly}
            >
              {tz.label}
            </Button>
          ))}
        </Space>
      </div>
    );
  };

  const renderTimePicker = () => {
    if (isRange) {
      return (
        <RangePicker
          value={convertedValue as TimeRangeValue}
          defaultValue={rangeDefaultValue || undefined}
          disabled={disabled || readOnly}
          size={size}
          variant={variant}
          format={getFormat()}
          placeholder={getPlaceholder as [string, string]}
          allowClear={allowClear}
          autoFocus={autoFocus}
          use12Hours={use12Hours}
          showNow={showNow}
          hourStep={hourStep as any}
          minuteStep={minuteStep as any}
          secondStep={secondStep as any}
          hideDisabledOptions={hideDisabledOptions}
          disabledTime={getDisabledTime}
          open={currentOpen}
          status={validationError ? 'error' : (status === 'success' ? undefined : status)}
          style={{ width }}
          placement={placement}
          inputReadOnly={inputReadOnly}
          suffixIcon={suffixIcon || <ClockCircleOutlined />}
          clearIcon={clearIcon}
          getPopupContainer={getPopupContainer}
          onChange={handleChange as any}
          onOpenChange={handleOpenChange}
          onOk={onOk}
          onBlur={onBlur}
          onFocus={onFocus}
        />
      );
    }

    return (
      <TimePicker
        value={convertedValue as TimeValue}
        defaultValue={singleDefaultValue || undefined}
        disabled={disabled || readOnly}
        size={size}
        variant={variant}
        format={getFormat()}
        placeholder={getPlaceholder as string}
        allowClear={allowClear}
        autoFocus={autoFocus}
        use12Hours={use12Hours}
        showNow={showNow}
        hourStep={hourStep as any}
        minuteStep={minuteStep as any}
        secondStep={secondStep as any}
        hideDisabledOptions={hideDisabledOptions}
        disabledTime={getDisabledTime}
        open={currentOpen}
        status={validationError ? 'error' : (status === 'success' ? undefined : status)}
        style={{ width }}
        placement={placement}
        inputReadOnly={inputReadOnly}
        suffixIcon={suffixIcon || <ClockCircleOutlined />}
        clearIcon={clearIcon}
        getPopupContainer={getPopupContainer}
        onChange={handleChange as any}
        onOpenChange={handleOpenChange}
        onOk={onOk}
        onBlur={onBlur}
        onFocus={onFocus}
      />
    );
  };

  const finalErrorMessage = validationError || errorMessage;

  return (
    <div 
      className={`time-picker-widget ${className || ''}`}
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
            {required && <span style={{ color: 'hsl(var(--destructive))' }}>*</span>}
          </Text>
        )}

        {/* Time Zone Selector */}
        {renderTimeZoneSelector()}

        {/* Presets */}
        {renderPresets()}

        {/* TimePicker */}
        {renderTimePicker()}

        {/* Current Selection Info */}
        {internalValue && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            {isRange && Array.isArray(internalValue) ? (
              internalValue[0] && internalValue[1] ? (
                <>
                  Selected: {(internalValue[0] && typeof internalValue[0].format === 'function') ? internalValue[0].format(getFormat()) : internalValue[0]} to {(internalValue[1] && typeof internalValue[1].format === 'function') ? internalValue[1].format(getFormat()) : internalValue[1]}
                  {selectedTimeZone && ` (${selectedTimeZone})`}
                </>
              ) : (
                'Select time range'
              )
            ) : (
              internalValue && `Selected: ${(internalValue as TimeValue)?.format ? (internalValue as TimeValue)?.format(getFormat()) : internalValue}${selectedTimeZone ? ` (${selectedTimeZone})` : ''}`
            )}
          </div>
        )}

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

        {/* Additional Info */}
        {(minTime || maxTime) && (
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {minTime && `Min: ${minTime.format ? minTime.format(getFormat()) : minTime}`}
            {minTime && maxTime && ' • '}
            {maxTime && `Max: ${maxTime.format ? maxTime.format(getFormat()) : maxTime}`}
          </Text>
        )}
      </Space>
    </div>
  );
};

export default TimePickerWidget; 
