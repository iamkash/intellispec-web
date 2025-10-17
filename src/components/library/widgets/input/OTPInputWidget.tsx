/**
 * OTPInputWidget - One-time password input component
 * 
 * A form input widget that provides individual digit inputs for OTP/PIN codes.
 * Supports auto-focus, paste handling, validation, and comprehensive customization.
 * Perfect for two-factor authentication, PIN verification, and secure code entry.
 */

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Input, Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { InputRef } from 'antd';

// OTP input widget props
export interface OTPInputWidgetProps {
  id: string;
  label?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  
  // Configuration
  length?: number;
  type?: 'text' | 'password' | 'number';
  mask?: boolean;
  maskChar?: string;
  
  // Appearance
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  placeholder?: string;
  
  // Behavior
  autoFocus?: boolean;
  selectTextOnFocus?: boolean;
  allowPaste?: boolean;
  allowClear?: boolean;
  
  // Validation
  required?: boolean;
  validateOnChange?: boolean;
  validator?: (value: string) => string | null;
  pattern?: RegExp;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  spacing?: number;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  
  // Interactions
  onFocus?: (index: number) => void;
  onBlur?: (index: number) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>, index: number) => void;
  
  // Auto-submission
  autoSubmit?: boolean;
  autoSubmitDelay?: number;
  
  // Resend functionality
  showResend?: boolean;
  onResend?: () => void;
  resendText?: string;
  resendCooldown?: number;
  
  // Error handling
  showError?: boolean;
  errorMessage?: string;
  
  // Timer
  showTimer?: boolean;
  timerDuration?: number;
  onTimerComplete?: () => void;
  
  // Formatting
  separator?: string;
  groupSize?: number;
}

/**
 * OTPInputWidget Component
 * 
 * Provides individual digit inputs for OTP/PIN code entry.
 * Supports auto-focus, paste handling, validation, and timer functionality.
 */
export const OTPInputWidget: React.FC<OTPInputWidgetProps> = ({
  id,
  label,
  value,
  defaultValue,
  onChange,
  onComplete,
  
  length = 6,
  type = 'text',
  mask = false,
  maskChar = '●',
  
  size = 'middle',
  disabled = false,
  placeholder,
  
  autoFocus = true,
  selectTextOnFocus = true,
  allowPaste = true,
  allowClear = true,
  
  required = false,
  validateOnChange = true,
  validator,
  pattern,
  
  className,
  style,
  inputStyle,
  spacing = 8,
  
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  
  onFocus,
  onBlur,
  onKeyDown,
  
  autoSubmit = false,
  autoSubmitDelay = 500,
  
  showResend = false,
  onResend,
  resendText = 'Resend Code',
  resendCooldown = 60,
  
  showError = true,
  errorMessage,
  
  showTimer = false,
  timerDuration = 300,
  onTimerComplete,
  
  separator,
  groupSize = 3,
}) => {
  const [internalValue, setInternalValue] = useState<string>(value || defaultValue || '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [, setFocusedIndex] = useState<number>(-1);
  const [resendTimer, setResendTimer] = useState<number>(0);
  const [timer, setTimer] = useState<number>(timerDuration);
  const [, setIsComplete] = useState<boolean>(false);
  
  const inputRefs = useRef<(InputRef | null)[]>([]);
  const resendIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize input refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
    for (let i = 0; i < length; i++) {
      if (!inputRefs.current[i]) {
        inputRefs.current[i] = null;
      }
    }
  }, [length]);

  // Parse value into individual digits
  const digits = useMemo(() => {
    const valueArray = internalValue.split('');
    const result = new Array(length).fill('');
    for (let i = 0; i < Math.min(valueArray.length, length); i++) {
      result[i] = valueArray[i];
    }
    return result;
  }, [internalValue, length]);

  // Validation function
  const validateValue = useCallback((val: string): string | null => {
    if (required && val.length === 0) {
      return 'This field is required';
    }
    
    if (val.length > 0 && val.length < length) {
      return `Please enter all ${length} digits`;
    }
    
    if (pattern && val.length === length && !pattern.test(val)) {
      return 'Invalid code format';
    }
    
    if (validator) {
      return validator(val);
    }
    
    return null;
  }, [required, length, pattern, validator]);

  // Handle value change
  const handleValueChange = useCallback((newValue: string) => {
    setInternalValue(newValue);
    
    if (validateOnChange) {
      const error = validateValue(newValue);
      setValidationError(error);
    }
    
    onChange?.(newValue);
    
    // Check if complete
    if (newValue.length === length) {
      setIsComplete(true);
      onComplete?.(newValue);
      
      // Auto-submit if enabled
      if (autoSubmit) {
        if (submitTimeoutRef.current) {
          clearTimeout(submitTimeoutRef.current);
        }
        submitTimeoutRef.current = setTimeout(() => {
          // Trigger form submission or other action
        }, autoSubmitDelay);
      }
    } else {
      setIsComplete(false);
    }
  }, [onChange, onComplete, validateOnChange, validateValue, length, autoSubmit, autoSubmitDelay]);

  // Handle individual input change
  const handleInputChange = useCallback((index: number, newValue: string) => {
    // Only allow single character for individual inputs
    const char = newValue.slice(-1);
    
    // Update the value
    const newDigits = [...digits];
    newDigits[index] = char;
    const newFullValue = newDigits.join('');
    
    handleValueChange(newFullValue);
    
    // Auto-focus next input if character entered
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [digits, length, handleValueChange]);

  // Handle key down
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    onKeyDown?.(e, index);
    
    // Handle backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      
      if (digits[index]) {
        // Clear current input
        const newDigits = [...digits];
        newDigits[index] = '';
        handleValueChange(newDigits.join(''));
      } else if (index > 0) {
        // Move to previous input and clear it
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        handleValueChange(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    }
    
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
    
    // Handle delete
    if (e.key === 'Delete') {
      e.preventDefault();
      const newDigits = [...digits];
      newDigits[index] = '';
      handleValueChange(newDigits.join(''));
    }
  }, [digits, length, handleValueChange, onKeyDown]);

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    if (!allowPaste) {
      e.preventDefault();
      return;
    }
    
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const sanitizedText = pastedText.replace(/\s/g, '').slice(0, length);
    
    if (sanitizedText.length > 0) {
      handleValueChange(sanitizedText);
      
      // Focus the next empty input or the last input
      const nextIndex = Math.min(sanitizedText.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  }, [allowPaste, length, handleValueChange]);

  // Handle focus
  const handleFocus = useCallback((index: number) => {
    setFocusedIndex(index);
    onFocus?.(index);
    
    if (selectTextOnFocus) {
      inputRefs.current[index]?.select();
    }
  }, [onFocus, selectTextOnFocus]);

  // Handle blur
  const handleBlur = useCallback((index: number) => {
    setFocusedIndex(-1);
    onBlur?.(index);
  }, [onBlur]);

  // Handle clear
  const handleClear = useCallback(() => {
    handleValueChange('');
    inputRefs.current[0]?.focus();
  }, [handleValueChange]);

  // Handle resend
  const handleResend = useCallback(() => {
    if (resendTimer > 0) return;
    
    onResend?.();
    setResendTimer(resendCooldown);
    
    // Start resend cooldown
    if (resendIntervalRef.current) {
      clearInterval(resendIntervalRef.current);
    }
    
    resendIntervalRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          if (resendIntervalRef.current) {
            clearInterval(resendIntervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onResend, resendCooldown, resendTimer]);

  // Auto-focus first input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Update internal value when prop changes
  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  // Timer functionality
  useEffect(() => {
    if (showTimer && timerDuration > 0) {
      setTimer(timerDuration);
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      timerIntervalRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
            }
            onTimerComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [showTimer, timerDuration, onTimerComplete]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (resendIntervalRef.current) clearInterval(resendIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    };
  }, []);

  // Format time display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Render individual input
  const renderInput = (index: number) => {
    const value = digits[index] || '';
    const displayValue = mask && value ? maskChar : value;
    
    return (
      <Input
        key={index}
        ref={el => { inputRefs.current[index] = el; }}
        value={displayValue}
        placeholder={placeholder}
        size={size}
        disabled={disabled}
        maxLength={1}
        style={{
          width: size === 'large' ? 48 : size === 'small' ? 32 : 40,
          textAlign: 'center',
          ...inputStyle,
        }}
        onChange={e => handleInputChange(index, e.target.value)}
        onKeyDown={e => handleKeyDown(e, index)}
        onPaste={e => handlePaste(e, index)}
        onFocus={() => handleFocus(index)}
        onBlur={() => handleBlur(index)}
        aria-label={`${ariaLabel || 'OTP'} digit ${index + 1}`}
        aria-describedby={ariaDescribedBy}
      />
    );
  };

  // Render inputs with separators
  const renderInputs = () => {
    const inputs = [];
    
    for (let i = 0; i < length; i++) {
      inputs.push(renderInput(i));
      
      // Add separator if specified and not the last input
      if (separator && i < length - 1 && (i + 1) % groupSize === 0) {
        inputs.push(
          <span key={`sep-${i}`} style={{ margin: `0 ${spacing}px` }}>
            {separator}
          </span>
        );
      }
    }
    
    return inputs;
  };

  return (
    <div className={className} style={style}>
      {label && (
        <label 
          htmlFor={id}
          style={{ 
            display: 'block', 
            marginBottom: 8,
            fontWeight: 500,
            color: required ? '#ff4d4f' : undefined
          }}
        >
          {label}
          {required && <span style={{ color: '#ff4d4f' }}> *</span>}
        </label>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing }}>
        {renderInputs()}
        
        {allowClear && internalValue.length > 0 && (
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={handleClear}
            disabled={disabled}
            style={{ marginLeft: 8 }}
          />
        )}
      </div>
      
      {showTimer && timer > 0 && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
          Time remaining: {formatTime(timer)}
        </div>
      )}
      
      {showResend && (
        <div style={{ marginTop: 8 }}>
          <Button
            type="link"
            size="small"
            onClick={handleResend}
            disabled={resendTimer > 0}
            style={{ padding: 0 }}
          >
            {resendTimer > 0 ? `${resendText} (${resendTimer}s)` : resendText}
          </Button>
        </div>
      )}
      
      {showError && (validationError || errorMessage) && (
        <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>
          {validationError || errorMessage}
        </div>
      )}
    </div>
  );
};

export default OTPInputWidget; 
