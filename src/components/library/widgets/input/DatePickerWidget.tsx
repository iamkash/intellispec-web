/**
 * DatePicker Widget - Date and time selection functionality
 * 
 * A reusable date picker widget that provides date selection, date ranges,
 * time selection, and advanced date manipulation capabilities.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DatePicker, TimePicker as AntdTimePicker, ConfigProvider, Space, Typography, Button, Alert } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { PickerLocale } from 'antd/es/date-picker/generatePicker';
import { sanitizeData } from '../../../../utils/sanitizeData';

const { RangePicker } = DatePicker;
const { Text } = Typography;

export type DateValue = Dayjs | null;
export type RangeValue = [Dayjs | null, Dayjs | null] | null;

/**
 * Convert string or other value to dayjs object
 */
const convertToDateValue = (value: any): DateValue => {
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
 * Convert range value to dayjs objects
 */
const convertToRangeValue = (value: any): RangeValue => {
  if (!value) return null;
  if (Array.isArray(value)) {
    return [convertToDateValue(value[0]), convertToDateValue(value[1])];
  }
  return null;
};

export interface DatePickerWidgetProps {
  /** Selected date value */
  value?: DateValue | RangeValue;
  /** Default date value */
  defaultValue?: DateValue | RangeValue;
  /** DatePicker label */
  label?: string;
  /** Whether datepicker is disabled */
  disabled?: boolean;
  /** Whether datepicker is read-only */
  readOnly?: boolean;
  /** Whether datepicker is required */
  required?: boolean;
  /** DatePicker size */
  size?: 'small' | 'middle' | 'large';
  /** DatePicker variant */
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
  /** Picker type */
  picker?: 'date' | 'week' | 'month' | 'quarter' | 'year';
  /** Whether to show time picker */
  showTime?: boolean | object;
  /** Whether to use range picker */
  isRange?: boolean;
  /** Date format */
  format?: string;
  /** Placeholder text */
  placeholder?: string | [string, string];
  /** Allow clear selection */
  allowClear?: boolean;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Show today button */
  showToday?: boolean;
  /** Show now button (for time picker) */
  showNow?: boolean;
  /** Minimum selectable date */
  minDate?: DateValue;
  /** Maximum selectable date */
  maxDate?: DateValue;
  /** Disabled date function */
  disabledDate?: (current: Dayjs) => boolean;
  /** Disabled time function */
  disabledTime?: (current: Dayjs | null) => object;
  /** Custom render for date cells */
  dateRender?: (current: Dayjs, info: { originNode: React.ReactElement; today: Dayjs; range?: 'start' | 'end'; type: string }) => React.ReactNode;
  /** Custom render for panel header */
  renderExtraFooter?: () => React.ReactNode;
  /** Preset ranges */
  presets?: Array<{
    label: string;
    value: DateValue | RangeValue;
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
  /** Width of the datepicker */
  width?: number | string;
  /** Dropdown placement */
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
  /** Whether to show week numbers */
  showWeekNumber?: boolean;
  /** Custom validation function */
  validator?: (value: DateValue | RangeValue) => { isValid: boolean; message?: string };
  /** Date input mode */
  inputReadOnly?: boolean;
  /** Custom suffix icon */
  suffixIcon?: React.ReactNode;
  /** Custom clear icon */
  clearIcon?: React.ReactNode;
  /** Multiple date selection */
  multiple?: boolean;
  /** Max number of selectable dates (for multiple) */
  maxCount?: number;
  /** Locale settings */
  locale?: any; // PickerLocale is removed, so use any for now
  
  // Event handlers
  /** On date change */
  onChange?: (value: DateValue | RangeValue, dateString: string | [string, string]) => void;
  /** On date select */
  onSelect?: (value: DateValue) => void;
  /** On panel change */
  onPanelChange?: (value: DateValue | RangeValue, mode: string | [string, string]) => void;
  /** On open change */
  onOpenChange?: (open: boolean) => void;
  /** On calendar change */
  onCalendarChange?: (values: RangeValue, formatString: [string, string]) => void;
  /** On OK button click */
  onOk?: (value: DateValue | RangeValue) => void;
  /** On blur */
  onBlur?: () => void;
  /** On focus */
  onFocus?: () => void;
  /** On preset select */
  onPresetSelect?: (preset: { label: string; value: DateValue | RangeValue }) => void;
}

export const DatePickerWidget: React.FC<DatePickerWidgetProps> = ({
  value,
  defaultValue,
  label,
  disabled = false,
  readOnly = false,
  required = false,
  size = 'middle',
  variant,
  picker = 'date',
  showTime = false,
  isRange = false,
  format,
  placeholder,
  allowClear = true,
  autoFocus = false,
  showToday = true,
  showNow = true,
  minDate,
  maxDate,
  disabledDate,
  disabledTime,
  dateRender,
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
  showWeekNumber = false,
  validator,
  inputReadOnly = false,
  suffixIcon,
  clearIcon,
  multiple = false,
  maxCount,
  locale,
  onChange,
  onSelect,
  onPanelChange,
  onOpenChange,
  onCalendarChange,
  onOk,
  onBlur,
  onFocus,
  onPresetSelect
}) => {
  const [internalValue, setInternalValue] = useState<DateValue | RangeValue>(value !== undefined ? value : (defaultValue || null));
  const [validationError, setValidationError] = useState<string | undefined>();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  // Sync internal state with prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // Convert values to proper dayjs objects
  const convertedValue = useMemo(() => {
    if (isRange) {
      return convertToRangeValue(internalValue);
    } else {
      return convertToDateValue(internalValue);
    }
  }, [internalValue, isRange]);

  const convertedDefaultValue = useMemo(() => {
    if (isRange) {
      return convertToRangeValue(defaultValue);
    } else {
      return convertToDateValue(defaultValue);
    }
  }, [defaultValue, isRange]);

  const rangeDefaultValue = useMemo(() => {
    return isRange ? convertedDefaultValue as RangeValue : null;
  }, [convertedDefaultValue, isRange]);

  const singleDefaultValue = useMemo(() => {
    return !isRange ? convertedDefaultValue as DateValue : null;
  }, [convertedDefaultValue, isRange]);

  const currentValue = convertedValue;
  const currentOpen = open !== undefined ? open : internalOpen;

  const handleChange = useCallback((newValue: DateValue | RangeValue, dateString: string | [string, string]) => {
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

    // Additional validation for date ranges
    if (isRange && Array.isArray(newValue) && newValue[0] && newValue[1]) {
      if (dayjs.isDayjs(newValue[0]) && dayjs.isDayjs(newValue[1]) && typeof newValue[0].isAfter === 'function' && newValue[0].isAfter(newValue[1])) {
        setValidationError('Start date must be before end date');
        return;
      }
    }

    // Check min/max date constraints
    const dateToCheck = isRange ? (Array.isArray(newValue) ? newValue[0] : null) : newValue as DateValue;
    if (dateToCheck && dayjs.isDayjs(dateToCheck)) {
      if (minDate && dayjs.isDayjs(minDate) && typeof dateToCheck.isBefore === 'function' && dateToCheck.isBefore(minDate)) {
        setValidationError(`Date must be after ${minDate.format ? minDate.format(format || 'YYYY-MM-DD') : minDate}`);
        return;
      }
      if (maxDate && dayjs.isDayjs(maxDate) && typeof dateToCheck.isAfter === 'function' && dateToCheck.isAfter(maxDate)) {
        setValidationError(`Date must be before ${maxDate.format ? maxDate.format(format || 'YYYY-MM-DD') : maxDate}`);
        return;
      }
    }

    setValidationError(undefined);
    onChange?.(newValue, dateString);
  }, [validator, onChange, isRange, minDate, maxDate, format]);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [open, onOpenChange]);

  const handlePresetSelect = useCallback((preset: { label: string; value: DateValue | RangeValue }) => {
    handleChange(preset.value, Array.isArray(preset.value) ? [
      preset.value[0]?.format(format || 'YYYY-MM-DD') || '',
      preset.value[1]?.format(format || 'YYYY-MM-DD') || ''
    ] : preset.value?.format(format || 'YYYY-MM-DD') || '');
    onPresetSelect?.(preset);
  }, [handleChange, format, onPresetSelect]);

  const getDisabledDate = useCallback((current: Dayjs): boolean => {
    // Apply custom disabled date function
    if (disabledDate && disabledDate(current)) {
      return true;
    }

    // Apply min/max date constraints
    if (minDate && dayjs.isDayjs(current) && dayjs.isDayjs(minDate) && typeof current.isBefore === 'function' && current.isBefore(minDate, 'day')) {
      return true;
    }
    if (maxDate && dayjs.isDayjs(current) && dayjs.isDayjs(maxDate) && typeof current.isAfter === 'function' && current.isAfter(maxDate, 'day')) {
      return true;
    }

    return false;
  }, [disabledDate, minDate, maxDate]);

  const getFormat = useCallback((): string => {
    if (format) return format;
    
    if (showTime) {
      return picker === 'date' ? 'YYYY-MM-DD HH:mm:ss' : 'HH:mm:ss';
    }
    
    switch (picker) {
      case 'week': return 'YYYY-wo';
      case 'month': return 'YYYY-MM';
      case 'quarter': return 'YYYY-[Q]Q';
      case 'year': return 'YYYY';
      default: return 'YYYY-MM-DD';
    }
  }, [format, showTime, picker]);

  const getPlaceholder = useCallback((): string | [string, string] => {
    if (placeholder) return placeholder;
    
    if (isRange) {
      return ['Start date', 'End date'];
    }
    
    return `Select ${picker}`;
  }, [placeholder, isRange, picker]);

  const formatString = getFormat();

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

  const renderDatePicker = () => {
    const themeConfig = {
      token: {
        colorBgContainer: 'var(--color-surface)',
        colorBgElevated: 'var(--color-surface)',
        colorBorder: 'var(--color-border)',
        colorText: 'var(--color-text)',
        colorTextSecondary: 'var(--color-text-secondary)',
        colorPrimary: 'var(--color-primary)',
        colorBgTextHover: 'var(--color-hover)',
        colorBgTextActive: 'var(--color-primary)',
        borderRadius: 6,
      },
    };

    if (isRange) {
      return (
        <ConfigProvider theme={themeConfig}>
          <RangePicker
            value={currentValue as RangeValue}
            defaultValue={rangeDefaultValue || undefined}
            disabled={disabled || readOnly}
            size={size}
            variant={variant}
            picker={picker}
            format={getFormat()}
            placeholder={getPlaceholder() as [string, string]}
            allowClear={allowClear}
            autoFocus={autoFocus}
            showToday={showToday}
            showTime={showTime}
            open={currentOpen}
            status={validationError ? 'error' : (status === 'success' ? undefined : status)}
            style={{ width }}
            className={className}
            placement={placement}
            inputReadOnly={inputReadOnly}
            suffixIcon={suffixIcon || <CalendarOutlined />}
            clearIcon={clearIcon}
            locale={locale}
            disabledDate={getDisabledDate}
            disabledTime={disabledTime}
            dateRender={dateRender as any}
            renderExtraFooter={renderExtraFooter}
            onChange={handleChange as any}
            onCalendarChange={onCalendarChange}
            onPanelChange={onPanelChange}
            onOpenChange={handleOpenChange}
            onOk={onOk}
            onBlur={onBlur}
            onFocus={onFocus}
          />
        </ConfigProvider>
      );
    } else {
      return (
        <ConfigProvider theme={themeConfig}>
          <DatePicker
            value={currentValue as DateValue}
            defaultValue={singleDefaultValue || undefined}
            disabled={disabled || readOnly}
            size={size}
            variant={variant}
            picker={picker}
            format={getFormat()}
            placeholder={getPlaceholder() as string}
            allowClear={allowClear}
            autoFocus={autoFocus}
            showToday={showToday}
            showTime={showTime}
            open={currentOpen}
            status={validationError ? 'error' : (status === 'success' ? undefined : status)}
            style={{ width }}
            className={className}
            placement={placement}
            inputReadOnly={inputReadOnly}
            suffixIcon={suffixIcon || <CalendarOutlined />}
            clearIcon={clearIcon}
            locale={locale}
            disabledDate={getDisabledDate}
            disabledTime={disabledTime}
            dateRender={dateRender as any}
            renderExtraFooter={renderExtraFooter}
            onChange={handleChange as any}
            onPanelChange={onPanelChange}
            onOpenChange={handleOpenChange}
            onOk={onOk}
            onBlur={onBlur}
            onFocus={onFocus}
          />
        </ConfigProvider>
      );
    }
  };

  const finalErrorMessage = validationError || errorMessage;

  return (
    <div 
      className={`date-picker-widget ${className || ''}`}
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

        {/* Presets */}
        {renderPresets()}

        {/* DatePicker */}
        {renderDatePicker()}

        {/* Current Selection Info */}
        {currentValue && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            {isRange && Array.isArray(currentValue) ? (
              currentValue[0] && currentValue[1] ? (
                <>
                  Selected: {(currentValue[0] && typeof currentValue[0].format === 'function') ? currentValue[0].format(formatString) : currentValue[0]} to {(currentValue[1] && typeof currentValue[1].format === 'function') ? currentValue[1].format(formatString) : currentValue[1]}
                  {' '}({(currentValue[1] && currentValue[0] && typeof currentValue[1].diff === 'function') ? currentValue[1].diff(currentValue[0], 'day') : 0} days)
                </>
              ) : (
                'Select date range'
              )
            ) : (
              currentValue && `Selected: ${(currentValue as DateValue)?.format ? (currentValue as DateValue)?.format(formatString) : currentValue}`
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
        {(minDate || maxDate) && (
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {minDate && `Min: ${minDate.format ? minDate.format(formatString) : minDate}`}
            {minDate && maxDate && ' • '}
            {maxDate && `Max: ${maxDate.format ? maxDate.format(formatString) : maxDate}`}
          </Text>
        )}
      </Space>
    </div>
  );
};

export default DatePickerWidget; 