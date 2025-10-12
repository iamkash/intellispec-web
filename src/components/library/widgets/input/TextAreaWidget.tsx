/**
 * TextArea Widget - Multi-line text input functionality
 * 
 * A reusable text area widget that provides multi-line text input with validation,
 * auto-resize, character counting, and advanced text manipulation capabilities.
 */

import { ClearOutlined, CompressOutlined, CopyOutlined, FullscreenOutlined } from '@ant-design/icons';
import { Button, Input, Space, Tooltip, Typography } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const { TextArea } = Input;
const { Text } = Typography;

export interface TextAreaWidgetProps {
  /** TextArea value */
  value?: string;
  /** Default value */
  defaultValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** TextArea label */
  label?: string;
  /** Whether textarea is disabled */
  disabled?: boolean;
  /** Whether textarea is read-only */
  readOnly?: boolean;
  /** Whether textarea is required */
  required?: boolean;
  /** TextArea size */
  size?: 'small' | 'middle' | 'large';
  /** TextArea variant */
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
  /** Number of visible text lines */
  rows?: number;
  /** Minimum number of rows */
  minRows?: number;
  /** Maximum number of rows */
  maxRows?: number;
  /** Auto resize */
  autoSize?: boolean | { minRows?: number; maxRows?: number };
  /** Maximum character length */
  maxLength?: number;
  /** Show character count */
  showCount?: boolean;
  /** Character count formatter */
  countFormatter?: (value: { count: number; maxLength?: number }) => string;
  /** Allow clear button */
  allowClear?: boolean;
  /** Auto focus on mount */
  autoFocus?: boolean;
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
  /** Width of the textarea */
  width?: number | string;
  /** Height of the textarea */
  height?: number | string;
  /** Enable resize handles */
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
  /** Word wrap mode */
  wordWrap?: 'normal' | 'break-word' | 'break-all';
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Custom validation function */
  validator?: (value: string) => { isValid: boolean; message?: string };
  /** Debounce delay for onChange in milliseconds */
  debounceDelay?: number;
  /** Enable copy to clipboard */
  enableCopy?: boolean;
  /** Enable fullscreen mode */
  enableFullscreen?: boolean;
  /** Custom toolbar buttons */
  toolbarButtons?: Array<{
    key: string;
    icon: React.ReactNode;
    tooltip: string;
    onClick: (value: string) => void;
  }>;
  /** Text processing functions */
  textProcessors?: {
    uppercase?: boolean;
    lowercase?: boolean;
    trim?: boolean;
    removeExtraSpaces?: boolean;
  };
  
  // Event handlers
  /** On value change */
  onChange?: (value: string) => void;
  /** On blur */
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  /** On focus */
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  /** On press enter */
  onPressEnter?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  /** On key down */
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  /** On key up */
  onKeyUp?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  /** On resize */
  onResize?: (size: { width: number; height: number }) => void;
  /** On copy */
  onCopy?: (value: string) => void;
  /** On fullscreen toggle */
  onFullscreenToggle?: (isFullscreen: boolean) => void;
}

export const TextAreaWidget: React.FC<TextAreaWidgetProps> = ({
  value,
  defaultValue,
  placeholder = "Enter text...",
  label,
  disabled = false,
  readOnly = false,
  required = false,
  size = 'middle',
  variant,
  rows = 4,
  minRows,
  maxRows,
  autoSize = false,
  maxLength,
  showCount = false,
  countFormatter,
  allowClear = false,
  autoFocus = false,
  status,
  errorMessage,
  helpText,
  style,
  className,
  width = '100%',
  height,
  resize = 'both',
  wordWrap = 'normal',
  showLineNumbers = false,
  validator,
  debounceDelay = 0,
  enableCopy = false,
  enableFullscreen = false,
  toolbarButtons = [],
  textProcessors = {},
  onChange,
  onBlur,
  onFocus,
  onPressEnter,
  onKeyDown,
  onKeyUp,
  onResize,
  onCopy,
  onFullscreenToggle
}) => {
  const [internalValue, setInternalValue] = useState(value || defaultValue || '');
  const [validationError, setValidationError] = useState<string | undefined>();
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [validationTimer, setValidationTimer] = useState<NodeJS.Timeout | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textareaSize, setTextareaSize] = useState<{ width: number; height: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Always use internal value for immediate display, update from props when they change
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  // Setup resize observer
  useEffect(() => {
    if (textareaRef.current && onResize) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          setTextareaSize({ width, height });
          onResize({ width, height });
        }
      });
      resizeObserverRef.current.observe(textareaRef.current);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [onResize]);

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

  const processText = useCallback((text: string): string => {
    let processedText = text;

    if (textProcessors.trim) {
      processedText = processedText.trim();
    }

    if (textProcessors.removeExtraSpaces) {
      processedText = processedText.replace(/\s+/g, ' ');
    }

    if (textProcessors.uppercase) {
      processedText = processedText.toUpperCase();
    }

    if (textProcessors.lowercase) {
      processedText = processedText.toLowerCase();
    }

    return processedText;
  }, [textProcessors]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const processedValue = processText(newValue);
    
    // Always update internal state immediately for responsive UI
    setInternalValue(processedValue);

    // Debounced validation to prevent excessive validation calls
    if (validator) {
      setValidationTimer(prevTimer => {
        if (prevTimer) {
          clearTimeout(prevTimer);
        }
        return setTimeout(() => {
          const validation = validator(processedValue);
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
            onChange(processedValue);
          }, debounceDelay);
        });
      } else {
        onChange(processedValue);
      }
    }
  }, [processText, validator, onChange, debounceDelay]); // Removed debounceTimer from dependencies

  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
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

  const handleCopy = useCallback(() => {
    if (internalValue) {
      navigator.clipboard.writeText(internalValue).then(() => {
        onCopy?.(internalValue);
      });
    }
  }, [internalValue, onCopy]);

  const handleClear = useCallback(() => {
    const clearedValue = '';
    
    if (value === undefined) {
      setInternalValue(clearedValue);
    }
    
    onChange?.(clearedValue);
  }, [value, onChange]);

  const handleFullscreenToggle = useCallback(() => {
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);
    onFullscreenToggle?.(newFullscreenState);
  }, [isFullscreen, onFullscreenToggle]);

  const getLineNumbers = () => {
    if (!showLineNumbers || !internalValue) return null;
    
    const lines = internalValue.split('\n');
    const lineNumberStyle: React.CSSProperties = {
          position: 'absolute',
      left: 0,
      top: 0,
          width: '40px',
      height: '100%',
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
          fontSize: '12px',
          lineHeight: '20px',
      color: 'var(--color-text-secondary)',
      paddingLeft: '8px',
      zIndex: 1,
      userSelect: 'none'
    };

    return (
      <div style={lineNumberStyle}>
        {lines.map((_, index) => (
          <div key={index}>{index + 1}</div>
        ))}
      </div>
    );
  };

  const renderToolbar = () => {
    const buttons = [];

    if (enableCopy) {
      buttons.push({
        key: 'copy',
        icon: <CopyOutlined />,
        tooltip: 'Copy to clipboard',
        onClick: handleCopy
      });
    }

    if (allowClear) {
      buttons.push({
        key: 'clear',
        icon: <ClearOutlined />,
        tooltip: 'Clear text',
        onClick: handleClear
      });
    }

    if (enableFullscreen) {
      buttons.push({
        key: 'fullscreen',
        icon: isFullscreen ? <CompressOutlined /> : <FullscreenOutlined />,
        tooltip: isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen',
        onClick: handleFullscreenToggle
      });
    }

    buttons.push(...toolbarButtons);

    if (buttons.length === 0) return null;

    return (
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        marginBottom: '8px',
        justifyContent: 'flex-end'
      }}>
        {buttons.map((button) => (
          <Tooltip key={button.key} title={button.tooltip}>
            <Button
              size="small"
              icon={button.icon}
              onClick={() => button.onClick(internalValue)}
              disabled={disabled}
              type="text"
            />
          </Tooltip>
        ))}
      </div>
    );
  };

  const textareaStatus = validationError ? 'error' : (status === 'success' ? undefined : status);

  const textareaStyle: React.CSSProperties = {
    width,
    height,
    resize: resize === 'none' ? 'none' : resize,
    wordWrap: wordWrap as any,
    paddingLeft: showLineNumbers ? '44px' : undefined,
    ...style
  };

  const containerStyle: React.CSSProperties = {
    position: isFullscreen ? 'fixed' : 'relative',
    top: isFullscreen ? 0 : undefined,
    left: isFullscreen ? 0 : undefined,
    width: isFullscreen ? '100vw' : width,
    height: isFullscreen ? '100vh' : height,
    zIndex: isFullscreen ? 9999 : undefined,
    background: isFullscreen ? 'var(--color-background)' : undefined,
    padding: isFullscreen ? '20px' : undefined,
    ...style
  };

  const finalErrorMessage = validationError || errorMessage;

  return (
    <div 
      className={`text-area-widget ${className || ''} ${isFullscreen ? 'fullscreen' : ''}`}
      style={containerStyle}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* Label */}
        {label && (
          <Text strong={required}>
            {label}
            {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
          </Text>
        )}

        {/* Toolbar */}
        {renderToolbar()}

        {/* TextArea Container */}
        <div style={{ position: 'relative' }}>
          {/* Line Numbers */}
          {getLineNumbers()}

          {/* TextArea */}
          <TextArea
            ref={textareaRef}
            value={internalValue}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            size={size}
            variant={variant}
            rows={!autoSize ? rows : undefined}
            autoSize={autoSize === true ? { minRows, maxRows } : autoSize}
            maxLength={maxLength}
            showCount={showCount}
            count={countFormatter ? {} : undefined}
            allowClear={false} // We handle this in toolbar
            autoFocus={autoFocus}
            status={textareaStatus}
            style={textareaStyle}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={onFocus}
            onPressEnter={onPressEnter}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
          />
        </div>

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

        {/* Textarea Info */}
        {textareaSize && (
          <Text type="secondary" style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            Size: {Math.round(textareaSize.width)} × {Math.round(textareaSize.height)}px
          </Text>
        )}
      </Space>
    </div>
  );
};

export default TextAreaWidget; 