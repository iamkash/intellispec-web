/**
 * Formula Calculator Utility
 * 
 * This utility provides formula evaluation capabilities for form gadgets.
 * It supports mathematical expressions and field counting operations.
 */

export interface FormulaContext {
  formData: Record<string, any>;
  fieldConfigs: Record<string, any>;
  metadata: any;
}

export interface FormulaResult {
  value: number;
  error?: string;
  details?: {
    formula: string;
    evaluatedFormula: string;
    fieldCounts?: Record<string, number>;
  };
}

/**
 * Count fields that match a specific value
 */
function countFieldsByValue(
  formData: Record<string, any>,
  fieldConfigs: Record<string, any>,
  value: string,
  fieldPattern?: string
): number {
  let count = 0;
  
  for (const [fieldPath, fieldValue] of Object.entries(formData)) {
    // Skip if field pattern is specified and doesn't match
    if (fieldPattern && !fieldPath.includes(fieldPattern)) {
      continue;
    }
    
    // Count fields that match the specified value
    if (fieldValue === value) {
      count++;
    }
  }
  
  return count;
}

/**
 * Count fields that match a specific value (case-insensitive)
 */
function countFieldsByValueIgnoreCase(
  formData: Record<string, any>,
  fieldConfigs: Record<string, any>,
  value: string,
  fieldPattern?: string
): number {
  let count = 0;
  
  for (const [fieldPath, fieldValue] of Object.entries(formData)) {
    // Skip if field pattern is specified and doesn't match
    if (fieldPattern && !fieldPath.includes(fieldPattern)) {
      continue;
    }
    
    // Count fields that match the specified value (case-insensitive)
    if (String(fieldValue).toLowerCase() === String(value).toLowerCase()) {
      count++;
    }
  }
  
  return count;
}

/**
 * Sum numeric values from specified fields
 */
function sumFields(
  formData: Record<string, any>,
  fieldConfigs: Record<string, any>,
  fieldPattern?: string
): number {
  let sum = 0;
  
  for (const [fieldPath, fieldValue] of Object.entries(formData)) {
    // Skip if field pattern is specified and doesn't match
    if (fieldPattern && !fieldPath.includes(fieldPattern)) {
      continue;
    }
    
    // Convert to number and add to sum
    const numValue = Number(fieldValue);
    if (!isNaN(numValue)) {
      sum += numValue;
    }
  }
  
  return sum;
}

/**
 * Get field value by path
 */
function getFieldValue(
  formData: Record<string, any>,
  fieldPath: string
): any {
  return formData[fieldPath] || 0;
}

/**
 * Evaluate a formula string
 */
export function evaluateFormula(
  formula: string,
  context: FormulaContext
): FormulaResult {
  try {
    const { formData, fieldConfigs } = context;
    
    // Create a safe evaluation environment
    const safeEval = (expression: string): number => {
      // Replace function calls with their implementations
      let processedExpression = expression;
      
      // Handle COUNT functions
      processedExpression = processedExpression.replace(
        /COUNT\(([^)]+)\)/g,
        (match, args) => {
          const [value, pattern] = args.split(',').map((arg: string) => arg.trim().replace(/['"]/g, ''));
          return countFieldsByValue(formData, fieldConfigs, value, pattern).toString();
        }
      );
      
      // Handle COUNT_IGNORE_CASE functions
      processedExpression = processedExpression.replace(
        /COUNT_IGNORE_CASE\(([^)]+)\)/g,
        (match, args) => {
          const [value, pattern] = args.split(',').map((arg: string) => arg.trim().replace(/['"]/g, ''));
          return countFieldsByValueIgnoreCase(formData, fieldConfigs, value, pattern).toString();
        }
      );
      
      // Handle SUM functions
      processedExpression = processedExpression.replace(
        /SUM\(([^)]+)\)/g,
        (match, args) => {
          const pattern = args.trim().replace(/['"]/g, '');
          return sumFields(formData, fieldConfigs, pattern).toString();
        }
      );
      
      // Handle FIELD functions
      processedExpression = processedExpression.replace(
        /FIELD\(([^)]+)\)/g,
        (match, args) => {
          const fieldPath = args.trim().replace(/['"]/g, '');
          return getFieldValue(formData, fieldPath).toString();
        }
      );
      
      // Evaluate the processed expression
      // Only allow basic mathematical operations
      const allowedChars = /^[0-9+\-*/().\s]+$/;
      if (!allowedChars.test(processedExpression)) {
        throw new Error(`Invalid characters in expression: ${processedExpression}`);
      }
      
      // Use Function constructor for safe evaluation
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${processedExpression}`)();
      return typeof result === 'number' ? result : 0;
    };
    
    const result = safeEval(formula);
    
    return {
      value: result,
      details: {
        formula,
        evaluatedFormula: formula, // This would be the processed formula in a real implementation
        fieldCounts: {
          yes: countFieldsByValue(formData, fieldConfigs, 'yes'),
          no: countFieldsByValue(formData, fieldConfigs, 'no'),
          na: countFieldsByValue(formData, fieldConfigs, 'na')
        }
      }
    };
    
  } catch (error) {
    return {
      value: 0,
      error: `Formula evaluation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        formula,
        evaluatedFormula: formula
      }
    };
  }
}

/**
 * Predefined formula templates
 */
export const FormulaTemplates = {
  // Count total "yes" responses
  COUNT_YES: "COUNT('yes')",
  
  // Count total "no" responses  
  COUNT_NO: "COUNT('no')",
  
  // Count total "na" responses
  COUNT_NA: "COUNT('na')",
  
  // Count total "yes" responses in specific fields (e.g., questions)
  COUNT_YES_QUESTIONS: "COUNT('yes', 'q')",
  
  // Count total "no" responses in specific fields
  COUNT_NO_QUESTIONS: "COUNT('no', 'q')",
  
  // Count total "na" responses in specific fields
  COUNT_NA_QUESTIONS: "COUNT('na', 'q')",
  
  // Sum numeric scores
  SUM_SCORES: "SUM('score')",
  
  // Calculate percentage of yes responses
  PERCENTAGE_YES: "(COUNT('yes') / (COUNT('yes') + COUNT('no') + COUNT('na'))) * 100",
  
  // Calculate percentage of no responses
  PERCENTAGE_NO: "(COUNT('no') / (COUNT('yes') + COUNT('no') + COUNT('na'))) * 100",
  
  // Calculate overall score based on planning and hazard scores
  OVERALL_SCORE: "FIELD('q2') + FIELD('q3') + FIELD('q4')",
  
  // Calculate compliance score (percentage of yes responses)
  COMPLIANCE_SCORE: "(COUNT('yes') / (COUNT('yes') + COUNT('no'))) * 100"
};

/**
 * Validate a formula string
 */
export function validateFormula(formula: string): { isValid: boolean; error?: string } {
  try {
    // Basic validation - check for allowed functions and syntax
    const allowedFunctions = ['COUNT', 'COUNT_IGNORE_CASE', 'SUM', 'FIELD'];
    const hasAllowedFunction = allowedFunctions.some(func => formula.includes(func));
    
    if (!hasAllowedFunction) {
      return {
        isValid: false,
        error: 'Formula must contain at least one valid function (COUNT, SUM, FIELD)'
      };
    }
    
    // Test with empty context
    const testContext: FormulaContext = {
      formData: {},
      fieldConfigs: {},
      metadata: {}
    };
    
    const result = evaluateFormula(formula, testContext);
    
    if (result.error) {
      return {
        isValid: false,
        error: result.error
      };
    }
    
    return { isValid: true };
    
  } catch (error) {
    return {
      isValid: false,
      error: `Formula validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
} 
