/**
 * Form Validator Utility Class
 * 
 * Handles validation for different field types in forms.
 * Provides type-specific validation methods and a unified validation interface.
 * 
 * @author AI Assistant
 * @version 1.0.0
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface FieldConfig {
  type?: string;
  label?: string;
  required?: boolean;
  validator?: (value: any) => ValidationResult;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  [key: string]: any;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

/**
 * FormValidator class provides comprehensive validation for form fields
 * Supports built-in validation for common field types and custom validators
 */
export class FormValidator {
  
  // Email validation regex - RFC 5322 compliant basic pattern
  private static EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Phone validation regex - supports international format
  private static PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;
  
  // Strong password requirements
  private static PASSWORD_REQUIREMENTS = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false
  };

  /**
   * Validates an email address
   */
  static validateEmail(value: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { isValid: true }; // Empty is valid (required check is separate)
    }
    
    const isValid = this.EMAIL_REGEX.test(value.trim());
    return {
      isValid,
      message: isValid ? undefined : 'Please enter a valid email address'
    };
  }

  /**
   * Validates a phone number
   */
  static validatePhone(value: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { isValid: true }; // Empty is valid (required check is separate)
    }
    
    // Remove common phone number formatting characters
    const cleanValue = value.replace(/[\s\-\(\)\.]/g, '');
    const isValid = this.PHONE_REGEX.test(cleanValue);
    
    return {
      isValid,
      message: isValid ? undefined : 'Please enter a valid phone number'
    };
  }

  /**
   * Validates a URL
   */
  static validateUrl(value: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { isValid: true }; // Empty is valid (required check is separate)
    }
    
    try {
      new URL(value.trim());
      return { isValid: true };
    } catch {
      return {
        isValid: false,
        message: 'Please enter a valid URL'
      };
    }
  }

  /**
   * Validates a number
   */
  static validateNumber(value: any, config?: FieldConfig): ValidationResult {
    if (value === null || value === undefined || value === '') {
      return { isValid: true }; // Empty is valid (required check is separate)
    }
    
    const numValue = Number(value);
    
    if (isNaN(numValue)) {
      return {
        isValid: false,
        message: 'Please enter a valid number'
      };
    }
    
    // Check min/max constraints
    if (config?.min !== undefined && numValue < config.min) {
      return {
        isValid: false,
        message: `Value must be at least ${config.min}`
      };
    }
    
    if (config?.max !== undefined && numValue > config.max) {
      return {
        isValid: false,
        message: `Value must be at most ${config.max}`
      };
    }
    
    return { isValid: true };
  }

  /**
   * Validates a password
   */
  static validatePassword(value: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { isValid: true }; // Empty is valid (required check is separate)
    }
    
    const requirements = this.PASSWORD_REQUIREMENTS;
    const errors: string[] = [];
    
    if (value.length < requirements.minLength) {
      errors.push(`At least ${requirements.minLength} characters`);
    }
    
    if (requirements.requireUppercase && !/[A-Z]/.test(value)) {
      errors.push('One uppercase letter');
    }
    
    if (requirements.requireLowercase && !/[a-z]/.test(value)) {
      errors.push('One lowercase letter');
    }
    
    if (requirements.requireNumbers && !/\d/.test(value)) {
      errors.push('One number');
    }
    
    if (requirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
      errors.push('One special character');
    }
    
    return {
      isValid: errors.length === 0,
      message: errors.length > 0 ? `Password must contain: ${errors.join(', ')}` : undefined
    };
  }

  /**
   * Validates text length
   */
  static validateTextLength(value: string, config?: FieldConfig): ValidationResult {
    if (!value || value.trim() === '') {
      return { isValid: true }; // Empty is valid (required check is separate)
    }
    
    const length = value.length;
    
    if (config?.minLength !== undefined && length < config.minLength) {
      return {
        isValid: false,
        message: `Must be at least ${config.minLength} characters`
      };
    }
    
    if (config?.maxLength !== undefined && length > config.maxLength) {
      return {
        isValid: false,
        message: `Must be at most ${config.maxLength} characters`
      };
    }
    
    return { isValid: true };
  }

  /**
   * Validates against a custom pattern
   */
  static validatePattern(value: string, pattern: RegExp, message?: string): ValidationResult {
    if (!value || value.trim() === '') {
      return { isValid: true }; // Empty is valid (required check is separate)
    }
    
    const isValid = pattern.test(value);
    return {
      isValid,
      message: isValid ? undefined : (message || 'Invalid format')
    };
  }

  /**
   * Validates required field
   */
  static validateRequired(value: any, label?: string): ValidationResult {
    const isEmpty = value === null || value === undefined || 
                   (typeof value === 'string' && value.trim() === '') ||
                   (Array.isArray(value) && value.length === 0);
    
    return {
      isValid: !isEmpty,
      message: isEmpty ? `${label || 'This field'} is required` : undefined
    };
  }

  /**
   * Validates a single field based on its configuration
   */
  static validateField(value: any, config: FieldConfig): ValidationResult {
    // Required validation
    if (config.required) {
      const requiredResult = this.validateRequired(value, config.label);
      if (!requiredResult.isValid) {
        return requiredResult;
      }
    }
    
    // Skip type validation if empty (required check above handles emptiness)
    if (value === null || value === undefined || value === '') {
      return { isValid: true };
    }
    
    // Type-specific validation
    switch (config.type) {
      case 'email':
        return this.validateEmail(value);
      case 'phone':
        return this.validatePhone(value);
      case 'url':
        return this.validateUrl(value);
      case 'number':
        return this.validateNumber(value, config);
      case 'password':
        return this.validatePassword(value);
      case 'text':
      case 'textarea':
        return this.validateTextLength(value, config);
      default:
        // Custom pattern validation
        if (config.pattern) {
          return this.validatePattern(value, config.pattern);
        }
        break;
    }
    
    // Custom validator
    if (config.validator) {
      return config.validator(value);
    }
    
    return { isValid: true };
  }

  /**
   * Validates an entire form
   */
  static validateForm(formData: Record<string, any>, fieldConfigs: Record<string, FieldConfig>): FormValidationResult {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};
    
    Object.keys(fieldConfigs).forEach(fieldPath => {
      const config = fieldConfigs[fieldPath];
      const value = formData[fieldPath];
      
      const result = this.validateField(value, config);
      
      if (!result.isValid && result.message) {
        errors[fieldPath] = result.message;
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get validation requirements for a field type
   */
  static getFieldRequirements(fieldType: string): string[] {
    switch (fieldType) {
      case 'email':
        return ['Valid email format (user@domain.com)'];
      case 'phone':
        return ['Valid phone number format'];
      case 'url':
        return ['Valid URL format (https://example.com)'];
      case 'password':
        const req = this.PASSWORD_REQUIREMENTS;
        const requirements = [`At least ${req.minLength} characters`];
        if (req.requireUppercase) requirements.push('One uppercase letter');
        if (req.requireLowercase) requirements.push('One lowercase letter');
        if (req.requireNumbers) requirements.push('One number');
        if (req.requireSpecialChars) requirements.push('One special character');
        return requirements;
      case 'number':
        return ['Valid number format'];
      default:
        return [];
    }
  }
}

// Export default instance for convenience
export default FormValidator; 