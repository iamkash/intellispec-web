/**
 * React Hook for Workspace Validation
 * 
 * Uses Zod for runtime validation with React integration.
 * Provides real-time validation feedback for workspace configurations.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { quickValidate, validateWorkspaceConfig, ValidationResult } from '../schemas/WorkspaceValidation';

export interface UseWorkspaceValidationOptions {
  validateOnChange?: boolean;
  debounceMs?: number;
  showInProduction?: boolean;
}

export interface UseWorkspaceValidationResult {
  validationResult: ValidationResult | null;
  isValidating: boolean;
  isValid: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  errorCount: number;
  warningCount: number;
  validate: (config: unknown) => ValidationResult;
  quickCheck: (config: unknown) => boolean;
  getErrorsForPath: (path: string[]) => ValidationResult['errors'];
  getWarningsForPath: (path: string[]) => ValidationResult['warnings'];
}

/**
 * Hook for workspace configuration validation
 */
export function useWorkspaceValidation(
  config: unknown = null,
  options: UseWorkspaceValidationOptions = {}
): UseWorkspaceValidationResult {
  const {
    validateOnChange = true,
    debounceMs = 300,
    showInProduction = false
  } = options;

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Only validate in development by default
  const shouldValidate = process.env.NODE_ENV === 'development' || showInProduction;

  // Validate function
  const validate = useCallback((configToValidate: unknown): ValidationResult => {
    if (!shouldValidate) {
      return { success: true, errors: [], warnings: [] };
    }

    setIsValidating(true);
    
    try {
      const result = validateWorkspaceConfig(configToValidate);
      setValidationResult(result);
      return result;
    } catch (error) {
      const errorResult: ValidationResult = {
        success: false,
        errors: [{
          path: [],
          message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          code: 'validation_exception'
        }],
        warnings: []
      };
      setValidationResult(errorResult);
      return errorResult;
    } finally {
      setIsValidating(false);
    }
  }, [shouldValidate]);

  // Quick validation without state updates
  const quickCheck = useCallback((configToCheck: unknown): boolean => {
    if (!shouldValidate) return true;
    return quickValidate(configToCheck);
  }, [shouldValidate]);

  // Auto-validate on config changes with debouncing
  useEffect(() => {
    if (!validateOnChange || !config || !shouldValidate) {
      return;
    }

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      validate(config);
    }, debounceMs);

    setDebounceTimer(timer);

    // Cleanup
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [config, validateOnChange, debounceMs, validate, shouldValidate]); // Removed debounceTimer from deps

  // Get errors for specific path
  const getErrorsForPath = useCallback((path: string[]) => {
    if (!validationResult) return [];
    
    return validationResult.errors.filter(error => 
      error.path.length === path.length &&
      error.path.every((segment, index) => segment === path[index])
    );
  }, [validationResult]);

  // Get warnings for specific path
  const getWarningsForPath = useCallback((path: string[]) => {
    if (!validationResult) return [];
    
    return validationResult.warnings.filter(warning => 
      warning.path.length === path.length &&
      warning.path.every((segment, index) => segment === path[index])
    );
  }, [validationResult]);

  // Computed values
  const computedValues = useMemo(() => ({
    isValid: validationResult?.success ?? false,
    hasErrors: (validationResult?.errors.length ?? 0) > 0,
    hasWarnings: (validationResult?.warnings.length ?? 0) > 0,
    errorCount: validationResult?.errors.length ?? 0,
    warningCount: validationResult?.warnings.length ?? 0
  }), [validationResult]);

  return {
    validationResult,
    isValidating,
    ...computedValues,
    validate,
    quickCheck,
    getErrorsForPath,
    getWarningsForPath
  };
}

/**
 * Hook for field-level validation
 */
export function useFieldValidation(
  fieldPath: string[],
  workspaceValidation: UseWorkspaceValidationResult
) {
  const fieldErrors = workspaceValidation.getErrorsForPath(fieldPath);
  const fieldWarnings = workspaceValidation.getWarningsForPath(fieldPath);

  return {
    hasErrors: fieldErrors.length > 0,
    hasWarnings: fieldWarnings.length > 0,
    errors: fieldErrors,
    warnings: fieldWarnings,
    isValid: fieldErrors.length === 0
  };
}

/**
 * Hook for development-only validation with console logging
 */
export function useDevWorkspaceValidation(config: unknown = null) {
  const validation = useWorkspaceValidation(config, {
    validateOnChange: true,
    debounceMs: 500,
    showInProduction: false
  });

  // Log validation results in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && validation.validationResult) {
      const { success, errors, warnings } = validation.validationResult;

      console.group('🛡️ Workspace Validation');
      
      if (success) {
} else {
        console.error(`❌ ${errors.length} validation error(s):`);
        errors.forEach((error, index) => {
          console.error(`${index + 1}. ${error.path.join('.')}: ${error.message}`);
          if (error.suggestion) {
            console.info(`   💡 ${error.suggestion}`);
          }
        });
      }

      if (warnings.length > 0) {
        console.warn(`⚠️ ${warnings.length} warning(s):`);
        warnings.forEach((warning, index) => {
          console.warn(`${index + 1}. ${warning.path.join('.')}: ${warning.message}`);
          if (warning.suggestion) {
            console.info(`   💡 ${warning.suggestion}`);
          }
        });
      }

      console.groupEnd();
    }
  }, [validation.validationResult]);

  return validation;
}
