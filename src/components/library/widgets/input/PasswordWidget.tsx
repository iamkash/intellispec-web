/**
 * PasswordWidget - Enhanced password input component
 * 
 * A form input widget that provides password input with visibility toggle,
 * strength meter, validation, and comprehensive security features.
 * Perfect for login forms, password creation, and security-focused inputs.
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Input, Progress, Typography } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone, LockOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Password } = Input;

// Password strength levels
export enum PasswordStrength {
  WEAK = 'weak',
  FAIR = 'fair',
  GOOD = 'good',
  STRONG = 'strong'
}

// Password requirements interface
export interface PasswordRequirement {
  id: string;
  description: string;
  regex: RegExp;
  met?: boolean;
}

// Password widget props
export interface PasswordWidgetProps {
  id: string;
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onPressEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  
  // Appearance
  size?: 'small' | 'middle' | 'large';
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
  disabled?: boolean;
  addonBefore?: React.ReactNode;
  addonAfter?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  
  // Visibility toggle
  visibilityToggle?: boolean;
  iconRender?: (visible: boolean) => React.ReactNode;
  
  // Password strength
  showStrengthMeter?: boolean;
  strengthMeterProps?: {
    showText?: boolean;
    textPosition?: 'top' | 'bottom' | 'inline';
    strokeColor?: {
      [key in PasswordStrength]: string;
    };
  };
  
  // Requirements and validation
  requirements?: PasswordRequirement[];
  showRequirements?: boolean;
  requirementsPosition?: 'top' | 'bottom' | 'side';
  minLength?: number;
  maxLength?: number;
  
  // Validation
  required?: boolean;
  validateOnChange?: boolean;
  validator?: (value: string) => string | null;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  autoComplete?: string;
  
  // Interactions
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onVisibilityChange?: (visible: boolean) => void;
  onStrengthChange?: (strength: PasswordStrength, score: number) => void;
  
  // Security
  preventPaste?: boolean;
  preventCopy?: boolean;
  clearOnSubmit?: boolean;
  
  // Debouncing
  debounceMs?: number;
}

/**
 * PasswordWidget Component
 * 
 * Provides enhanced password input with strength meter and validation.
 * Supports visibility toggle, requirement checking, and security features.
 */
export const PasswordWidget: React.FC<PasswordWidgetProps> = ({
  id,
  label,
  placeholder = "Enter password",
  value,
  defaultValue,
  onChange,
  onPressEnter,
  
  size = 'middle',
  variant,
  disabled = false,
  addonBefore,
  addonAfter,
  prefix,
  suffix,
  
  visibilityToggle = true,
  iconRender,
  
  showStrengthMeter = true,
  strengthMeterProps = {},
  
  requirements = [],
  showRequirements = true,
  requirementsPosition = 'bottom',
  minLength = 8,
  maxLength = 128,
  
  required = false,
  validateOnChange = true,
  validator,
  
  className,
  style,
  
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  autoComplete = 'new-password',
  
  onFocus,
  onBlur,
  onVisibilityChange,
  onStrengthChange,
  
  preventPaste = false,
  preventCopy = false,
  clearOnSubmit = false,
  
  debounceMs = 300,
}) => {
  const [internalValue, setInternalValue] = useState<string>(value || defaultValue || '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Default password requirements
  // Combine default and custom requirements
  const allRequirements = useMemo(() => {
    if (requirements.length > 0) {
      return requirements;
    }

    return [
      {
        id: 'length',
        description: `At least ${minLength} characters`,
        regex: new RegExp(`.{${minLength},}`),
      },
      {
        id: 'uppercase',
        description: 'At least one uppercase letter',
        regex: /[A-Z]/,
      },
      {
        id: 'lowercase',
        description: 'At least one lowercase letter',
        regex: /[a-z]/,
      },
      {
        id: 'number',
        description: 'At least one number',
        regex: /[0-9]/,
      },
      {
        id: 'special',
        description: 'At least one special character',
        regex: /[!@#$%^&*(),.?":{}|<>]/,
      },
    ];
  }, [requirements, minLength]);

  // Calculate password strength
  const calculateStrength = useCallback((password: string): { strength: PasswordStrength; score: number } => {
    if (!password) return { strength: PasswordStrength.WEAK, score: 0 };
    
    let score = 0;
    const metRequirements = allRequirements.filter(req => req.regex.test(password));
    
    // Base score from requirements
    score += (metRequirements.length / allRequirements.length) * 60;
    
    // Length bonus
    if (password.length >= 12) score += 20;
    else if (password.length >= 10) score += 15;
    else if (password.length >= 8) score += 10;
    
    // Complexity bonus
    if (password.length > 0) {
      const uniqueChars = new Set(password).size;
      score += Math.min(uniqueChars, 20);
    }
    
    // Determine strength level
    let strength: PasswordStrength;
    if (score >= 80) strength = PasswordStrength.STRONG;
    else if (score >= 60) strength = PasswordStrength.GOOD;
    else if (score >= 40) strength = PasswordStrength.FAIR;
    else strength = PasswordStrength.WEAK;
    
    return { strength, score: Math.min(score, 100) };
  }, [allRequirements]);

  // Current password strength
  const { strength, score } = useMemo(() => {
    return calculateStrength(internalValue);
  }, [internalValue, calculateStrength]);

  // Check requirements
  const checkedRequirements = useMemo(() => {
    return allRequirements.map(req => ({
      ...req,
      met: req.regex.test(internalValue),
    }));
  }, [allRequirements, internalValue]);

  // Validation function
  const validateValue = useCallback((val: string): string | null => {
    if (required && !val) {
      return 'Password is required';
    }
    
    if (val && val.length < minLength) {
      return `Password must be at least ${minLength} characters long`;
    }
    
    if (val && val.length > maxLength) {
      return `Password must be no more than ${maxLength} characters long`;
    }
    
    if (validator) {
      return validator(val);
    }
    
    return null;
  }, [required, minLength, maxLength, validator]);

  // Handle value change with debouncing
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Set new timer for debounced onChange
    const timer = setTimeout(() => {
      if (validateOnChange) {
        const error = validateValue(newValue);
        setValidationError(error);
      }
      
      onChange?.(newValue);
    }, debounceMs);
    
    setDebounceTimer(timer);
  }, [onChange, validateOnChange, validateValue, debounceTimer, debounceMs]);

  // Handle visibility toggle
  const handleVisibilityChange = useCallback((visible: boolean) => {
    setIsVisible(visible);
    onVisibilityChange?.(visible);
  }, [onVisibilityChange]);

  const visibilityToggleConfig = useMemo(() => {
    if (!visibilityToggle) {
      return false;
    }

    return {
      visible: isVisible,
      onVisibleChange: handleVisibilityChange,
    } as const;
  }, [visibilityToggle, isVisible, handleVisibilityChange]);

  // Handle paste prevention
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    if (preventPaste) {
      e.preventDefault();
    }
  }, [preventPaste]);

  // Handle copy prevention
  const handleCopy = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    if (preventCopy) {
      e.preventDefault();
    }
  }, [preventCopy]);

  // Update internal value when prop changes
  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  // Notify strength changes
  useEffect(() => {
    onStrengthChange?.(strength, score);
  }, [strength, score, onStrengthChange]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Custom icon render
  const customIconRender = useCallback((visible: boolean) => {
    if (iconRender) {
      return iconRender(visible);
    }
    return visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />;
  }, [iconRender]);

  // Strength meter colors
  const strengthColors = {
    [PasswordStrength.WEAK]: 'var(--color-danger)',
    [PasswordStrength.FAIR]: 'var(--color-warning)',
    [PasswordStrength.GOOD]: 'var(--color-success)',
    [PasswordStrength.STRONG]: 'var(--color-primary)',
    ...strengthMeterProps.strokeColor,
  };

  // Render strength meter
  const renderStrengthMeter = () => {
    if (!showStrengthMeter) return null;
    
    const strengthText = strength.charAt(0).toUpperCase() + strength.slice(1);
    const color = strengthColors[strength];
    
    return (
      <div style={{ marginTop: 8 }}>
        <Progress
          percent={score}
          strokeColor={color}
          showInfo={false}
          size="small"
        />
        {strengthMeterProps.showText !== false && (
          <Text style={{ color, fontSize: 12 }}>
            Password strength: {strengthText}
          </Text>
        )}
      </div>
    );
  };

  // Render requirements
  const renderRequirements = () => {
    if (!showRequirements || checkedRequirements.length === 0) return null;
    
    return (
      <div style={{ marginTop: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>Requirements:</Text>
        {checkedRequirements.map(req => (
          <div key={req.id} style={{ fontSize: 11, marginTop: 2, color: 'var(--text-secondary)' }}>
            <span style={{ 
              color: req.met ? 'var(--color-success)' : 'var(--color-danger)',
              marginRight: 4 
            }}>
              {req.met ? '✓' : '✗'}
            </span>
            {req.description}
          </div>
        ))}
      </div>
    );
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
            color: required ? 'var(--color-danger)' : undefined
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
        </label>
      )}
      
      {requirementsPosition === 'top' && renderRequirements()}
      
      <Password
        id={id}
        value={internalValue}
        placeholder={placeholder}
        size={size}
        variant={variant}
        disabled={disabled}
        addonBefore={addonBefore}
        addonAfter={addonAfter}
        prefix={prefix || <LockOutlined />}
        suffix={suffix}
        visibilityToggle={visibilityToggleConfig}
        iconRender={customIconRender}
        autoComplete={autoComplete}
        onChange={handleChange}
        onPressEnter={onPressEnter}
        onFocus={onFocus}
        onBlur={onBlur}
        onPaste={handlePaste}
        onCopy={handleCopy}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        style={{ width: '100%' }}
      />
      
      {renderStrengthMeter()}
      
      {requirementsPosition === 'bottom' && renderRequirements()}
      
      {validationError && (
        <div style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>
          {validationError}
        </div>
      )}
    </div>
  );
};

export default PasswordWidget; 
