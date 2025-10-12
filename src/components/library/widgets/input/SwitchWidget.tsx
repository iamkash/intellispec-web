/**
 * Switch Widget - On/off toggle functionality
 * 
 * A reusable switch widget that provides boolean toggle with validation,
 * custom labels, icons, and advanced interaction capabilities.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Switch, Typography, Space, Button, Tooltip } from 'antd';
import { CheckOutlined, CloseOutlined, LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

export interface SwitchWidgetProps {
  /** Switch value */
  value?: boolean;
  /** Default value */
  defaultValue?: boolean;
  /** Switch label */
  label?: string;
  /** Whether switch is disabled */
  disabled?: boolean;
  /** Whether switch is read-only */
  readOnly?: boolean;
  /** Whether switch is required */
  required?: boolean;
  /** Switch size */
  size?: 'small' | 'default';
  /** Whether switch is in loading state */
  loading?: boolean;
  /** Label for checked state */
  checkedLabel?: React.ReactNode;
  /** Label for unchecked state */
  uncheckedLabel?: React.ReactNode;
  /** Icon for checked state */
  checkedIcon?: React.ReactNode;
  /** Icon for unchecked state */
  uncheckedIcon?: React.ReactNode;
  /** Label position */
  labelPosition?: 'left' | 'right';
  /** Whether to show confirmation dialog */
  showConfirmation?: boolean;
  /** Confirmation message */
  confirmationMessage?: string;
  /** Confirmation title */
  confirmationTitle?: string;
  /** Custom colors */
  colors?: {
    checked?: string;
    unchecked?: string;
  };
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
  /** Custom validation function */
  validator?: (value: boolean) => { isValid: boolean; message?: string };
  /** Animation duration */
  animationDuration?: number;
  /** Whether to show state text */
  showStateText?: boolean;
  /** Custom state text */
  stateText?: {
    checked: string;
    unchecked: string;
  };
  /** Whether to show reset button */
  showResetButton?: boolean;
  /** Reset button text */
  resetButtonText?: string;
  /** Tooltip text */
  tooltip?: string | { checked: string; unchecked: string };
  /** Click delay (debounce) */
  clickDelay?: number;
  /** Custom confirmation buttons */
  confirmationButtons?: {
    okText?: string;
    cancelText?: string;
  };
  /** Whether to use async onChange */
  asyncOnChange?: boolean;
  /** Async onChange timeout */
  asyncTimeout?: number;
  /** Custom switch content */
  switchContent?: {
    checked?: React.ReactNode;
    unchecked?: React.ReactNode;
  };
  /** Whether to show loading on change */
  showLoadingOnChange?: boolean;
  /** Loading timeout */
  loadingTimeout?: number;
  
  // Event handlers
  /** On value change */
  onChange?: (value: boolean) => void | Promise<void>;
  /** On focus */
  onFocus?: (e: React.FocusEvent) => void;
  /** On blur */
  onBlur?: (e: React.FocusEvent) => void;
  /** On reset */
  onReset?: () => void;
  /** On confirmation */
  onConfirm?: (value: boolean) => void;
  /** On cancel confirmation */
  onCancel?: () => void;
  /** On async change start */
  onAsyncStart?: () => void;
  /** On async change complete */
  onAsyncComplete?: (success: boolean) => void;
}

export const SwitchWidget: React.FC<SwitchWidgetProps> = ({
  value,
  defaultValue = false,
  label,
  disabled = false,
  readOnly = false,
  required = false,
  size = 'default',
  loading = false,
  checkedLabel,
  uncheckedLabel,
  checkedIcon,
  uncheckedIcon,
  labelPosition = 'left',
  showConfirmation = false,
  confirmationMessage = 'Are you sure you want to change this setting?',
  confirmationTitle = 'Confirm Change',
  colors,
  autoFocus = false,
  status,
  errorMessage,
  helpText,
  style,
  className,
  validator,
  animationDuration = 200,
  showStateText = false,
  stateText = { checked: 'ON', unchecked: 'OFF' },
  showResetButton = false,
  resetButtonText = 'Reset',
  tooltip,
  clickDelay = 0,
  confirmationButtons = { okText: 'OK', cancelText: 'Cancel' },
  asyncOnChange = false,
  asyncTimeout = 3000,
  switchContent,
  showLoadingOnChange = false,
  loadingTimeout = 1000,
  onChange,
  onFocus,
  onBlur,
  onReset,
  onConfirm,
  onCancel,
  onAsyncStart,
  onAsyncComplete
}) => {
  const [internalValue, setInternalValue] = useState(value !== undefined ? value : defaultValue);
  const [validationError, setValidationError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingValue, setPendingValue] = useState<boolean | null>(null);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);

  // Sync internal state with prop changes
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const isActuallyLoading = loading || isLoading;

  const validateValue = useCallback((newValue: boolean) => {
    if (validator) {
      const validation = validator(newValue);
      if (!validation.isValid) {
        setValidationError(validation.message);
        return false;
      }
    }

    setValidationError(undefined);
    return true;
  }, [validator]);

  const handleAsyncChange = useCallback(async (newValue: boolean) => {
    if (!onChange) return;

    setIsLoading(true);
    onAsyncStart?.();

    try {
      const changePromise = onChange(newValue);
      if (changePromise instanceof Promise) {
        await Promise.race([
          changePromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), asyncTimeout)
          )
        ]);
      }
      onAsyncComplete?.(true);
    } catch (error) {
      console.error('Switch async change error:', error);
      onAsyncComplete?.(false);
    } finally {
      setIsLoading(false);
    }
  }, [onChange, asyncTimeout, onAsyncStart, onAsyncComplete]);

  const handleConfirmation = useCallback((confirmed: boolean) => {
    if (confirmed && pendingValue !== null) {
      // Always update internal state immediately for visual feedback
      setInternalValue(pendingValue);

      validateValue(pendingValue);
      
      if (asyncOnChange) {
        handleAsyncChange(pendingValue);
      } else {
        onChange?.(pendingValue);
      }

      onConfirm?.(pendingValue);
    } else {
      onCancel?.();
    }

    setShowConfirmDialog(false);
    setPendingValue(null);
  }, [pendingValue, validateValue, asyncOnChange, handleAsyncChange, onChange, onConfirm, onCancel]);

  const handleLoadingChange = useCallback((newValue: boolean) => {
    if (showLoadingOnChange) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        if (value === undefined) {
          setInternalValue(newValue);
        }
        validateValue(newValue);
        onChange?.(newValue);
      }, loadingTimeout);
    } else {
      if (value === undefined) {
        setInternalValue(newValue);
      }
      validateValue(newValue);
      onChange?.(newValue);
    }
  }, [showLoadingOnChange, loadingTimeout, value, validateValue, onChange]);

  const handleChange = useCallback((newValue: boolean, event?: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || readOnly) return;

    // Handle click delay
    if (clickDelay > 0) {
      if (clickTimer) {
        clearTimeout(clickTimer);
      }
      const timer = setTimeout(() => {
        processChange(newValue);
      }, clickDelay);
      setClickTimer(timer);
    } else {
      processChange(newValue);
    }
  }, [disabled, readOnly, clickDelay, clickTimer]);

  const processChange = useCallback((newValue: boolean) => {
    if (showConfirmation) {
      setPendingValue(newValue);
      setShowConfirmDialog(true);
      return;
    }

    if (asyncOnChange || showLoadingOnChange) {
      handleLoadingChange(newValue);
    } else {
      // Update internal state if not controlled
      if (value === undefined) {
        setInternalValue(newValue);
      }

      validateValue(newValue);
      onChange?.(newValue);
    }
  }, [showConfirmation, asyncOnChange, showLoadingOnChange, handleLoadingChange, value, validateValue, onChange]);

  const handleReset = useCallback(() => {
    const resetValue = defaultValue;
    
    if (value === undefined) {
      setInternalValue(resetValue);
    }
    
    validateValue(resetValue);
    onChange?.(resetValue);
    onReset?.();
  }, [value, defaultValue, validateValue, onChange, onReset]);

  const getSwitchStyle = useMemo(() => {
    const switchStyle: React.CSSProperties = {
      transition: `all ${animationDuration}ms ease`,
      ...style
    };

    if (colors) {
      if (internalValue && colors.checked) {
        switchStyle.backgroundColor = colors.checked;
      } else if (!internalValue && colors.unchecked) {
        switchStyle.backgroundColor = colors.unchecked;
      }
    }

    return switchStyle;
  }, [animationDuration, style, colors, internalValue]);

  const getTooltipText = useMemo(() => {
    if (!tooltip) return undefined;
    
    if (typeof tooltip === 'string') {
      return tooltip;
    }
    
    return internalValue ? tooltip.checked : tooltip.unchecked;
  }, [tooltip, internalValue]);

  const renderSwitchContent = () => {
    if (!switchContent) return {};

    return {
      checkedChildren: switchContent.checked,
      unCheckedChildren: switchContent.unchecked
    };
  };

  const renderConfirmationDialog = () => {
    if (!showConfirmDialog) return null;

    // For demo purposes - in a real app, you'd use a proper modal
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '6px',
          minWidth: '300px',
          textAlign: 'center'
        }}>
          <Text strong style={{ fontSize: '16px', marginBottom: '12px', display: 'block' }}>
            {confirmationTitle}
          </Text>
          <Text style={{ marginBottom: '20px', display: 'block' }}>
            {confirmationMessage}
          </Text>
          <Space>
            <Button onClick={() => handleConfirmation(false)}>
              {confirmationButtons.cancelText}
            </Button>
            <Button type="primary" onClick={() => handleConfirmation(true)}>
              {confirmationButtons.okText}
            </Button>
          </Space>
        </div>
      </div>
    );
  };

  const renderStateText = () => {
    if (!showStateText) return null;

    return (
      <Text style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
        {internalValue ? stateText.checked : stateText.unchecked}
      </Text>
    );
  };

  const renderLabel = () => {
    if (!label) return null;

    return (
      <Text strong={required}>
        {label}
        {required && <span style={{ color: 'hsl(var(--destructive))' }}>*</span>}
      </Text>
    );
  };

  const renderSwitch = () => {
    const switchProps = {
      checked: internalValue,
      disabled: disabled || readOnly,
      loading: isActuallyLoading,
      size,
      autoFocus,
      style: getSwitchStyle,
      checkedChildren: checkedIcon || checkedLabel,
      unCheckedChildren: uncheckedIcon || uncheckedLabel,
      onChange: handleChange,
      onFocus,
      onBlur,
      ...renderSwitchContent()
    };

    const switchElement = <Switch {...switchProps} />;

    if (getTooltipText) {
      return (
        <Tooltip title={getTooltipText}>
          {switchElement}
        </Tooltip>
      );
    }

    return switchElement;
  };

  const finalErrorMessage = validationError || errorMessage;

  return (
    <div 
      className={`switch-widget ${className || ''}`}
      style={{
        width: '100%',
        ...style
      }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {/* Switch and Label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {labelPosition === 'left' && renderLabel()}
          
          {renderSwitch()}
          
          {labelPosition === 'right' && renderLabel()}
          
          {renderStateText()}
          
          {showResetButton && (
            <Button
              size="small"
              type="text"
              onClick={handleReset}
              disabled={disabled || readOnly}
              style={{ marginLeft: 'auto' }}
            >
              {resetButtonText}
            </Button>
          )}
        </div>

        {/* Current State Info */}
        {(checkedLabel || uncheckedLabel) && (
          <div style={{ fontSize: '12px', color: '#666' }}>
            Current: {internalValue ? checkedLabel : uncheckedLabel}
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
      </Space>

      {/* Confirmation Dialog */}
      {renderConfirmationDialog()}
    </div>
  );
};

export default SwitchWidget; 