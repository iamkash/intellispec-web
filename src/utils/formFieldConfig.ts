/**
 * Form Field Configuration Utility
 * 
 * Provides utilities for creating dynamic form fields based on metadata configuration
 * and AI analysis results. Supports various field types and validation rules.
 */

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'date' | 'boolean' | 'file' | 'custom';
  required?: boolean;
  placeholder?: string;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  options?: Array<{
    label: string;
    value: any;
  }>;
  dependencies?: string[]; // Fields this field depends on
  conditional?: {
    field: string;
    value: any;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  };
  metadata?: Record<string, any>; // Additional field metadata
}

export interface FormSectionConfig {
  title: string;
  description?: string;
  fields: FormFieldConfig[];
  collapsible?: boolean;
  collapsed?: boolean;
}

export interface FormConfig {
  sections: FormSectionConfig[];
  layout?: 'vertical' | 'horizontal' | 'grid';
  columns?: number;
  submitText?: string;
  cancelText?: string;
  showProgress?: boolean;
  allowPartialSave?: boolean;
}

export interface AIAnalysisResult {
  confidence: number;
  entities: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  summary: string;
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  markdownReport?: string; // Detailed markdown report
  complianceStatus?: 'compliant' | 'non-compliant' | 'conditional' | 'pending';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  nextActions?: string[]; // Actionable next steps
  fields: Record<string, any>; // Extracted field values
}

/**
 * Generate form configuration from AI analysis result
 */
export const generateFormFromAnalysis = (
  analysisResult: AIAnalysisResult,
  baseConfig: FormConfig
): FormConfig => {
  const enhancedConfig: FormConfig = {
    ...baseConfig,
    sections: baseConfig.sections.map(section => ({
      ...section,
      fields: section.fields.map(field => {
        // Check if AI analysis has a value for this field
        const aiValue = analysisResult.fields[field.name];
        if (aiValue !== undefined) {
          return {
            ...field,
            defaultValue: aiValue,
            metadata: {
              ...field.metadata,
              aiGenerated: true,
              confidence: analysisResult.confidence,
              source: 'ai_analysis'
            }
          };
        }
        return field;
      })
    }))
  };

  return enhancedConfig;
};

/**
 * Create form field configuration from metadata
 */
export const createFieldConfig = (metadata: any): FormFieldConfig => {
  const baseConfig: FormFieldConfig = {
    name: metadata.name || 'field',
    label: metadata.label || metadata.name || 'Field',
    type: metadata.type || 'text',
    required: metadata.required || false,
    placeholder: metadata.placeholder,
    defaultValue: metadata.defaultValue,
    validation: metadata.validation,
    options: metadata.options,
    dependencies: metadata.dependencies,
    conditional: metadata.conditional,
    metadata: metadata.metadata || {}
  };

  return baseConfig;
};

/**
 * Create form section configuration from metadata
 */
export const createSectionConfig = (metadata: any): FormSectionConfig => {
  return {
    title: metadata.title || 'Section',
    description: metadata.description,
    fields: (metadata.fields || []).map(createFieldConfig),
    collapsible: metadata.collapsible || false,
    collapsed: metadata.collapsed || false
  };
};

/**
 * Create complete form configuration from metadata
 */
export const createFormConfig = (metadata: any): FormConfig => {
  return {
    sections: (metadata.sections || []).map(createSectionConfig),
    layout: metadata.layout || 'vertical',
    columns: metadata.columns || 1,
    submitText: metadata.submitText || 'Submit',
    cancelText: metadata.cancelText || 'Cancel',
    showProgress: metadata.showProgress || false,
    allowPartialSave: metadata.allowPartialSave || false
  };
};

/**
 * Validate form field configuration
 */
export const validateFieldConfig = (config: FormFieldConfig): string[] => {
  const errors: string[] = [];

  if (!config.name) {
    errors.push('Field name is required');
  }

  if (!config.label) {
    errors.push('Field label is required');
  }

  if (!['text', 'textarea', 'number', 'select', 'multiselect', 'date', 'boolean', 'file', 'custom'].includes(config.type)) {
    errors.push(`Invalid field type: ${config.type}`);
  }

  if (config.type === 'select' || config.type === 'multiselect') {
    if (!config.options || config.options.length === 0) {
      errors.push('Options are required for select/multiselect fields');
    }
  }

  if (config.validation) {
    if (config.validation.min !== undefined && config.validation.max !== undefined) {
      if (config.validation.min > config.validation.max) {
        errors.push('Min value cannot be greater than max value');
      }
    }
  }

  return errors;
};

/**
 * Get field value based on type
 */
export const getFieldValue = (field: FormFieldConfig, value: any): any => {
  switch (field.type) {
    case 'number':
      return typeof value === 'number' ? value : parseFloat(value) || 0;
    case 'boolean':
      return Boolean(value);
    case 'date':
      return value instanceof Date ? value : new Date(value);
    case 'multiselect':
      return Array.isArray(value) ? value : [value].filter(Boolean);
    default:
      return value;
  }
};

/**
 * Validate field value against configuration
 */
export const validateFieldValue = (field: FormFieldConfig, value: any): string[] => {
  const errors: string[] = [];

  if (field.required && (value === undefined || value === null || value === '')) {
    errors.push(`${field.label} is required`);
    return errors;
  }

  if (value === undefined || value === null || value === '') {
    return errors; // Skip validation for empty optional fields
  }

  if (field.validation) {
    const { min, max, pattern } = field.validation;

    if (field.type === 'number') {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      if (isNaN(numValue)) {
        errors.push(`${field.label} must be a valid number`);
      } else {
        if (min !== undefined && numValue < min) {
          errors.push(`${field.label} must be at least ${min}`);
        }
        if (max !== undefined && numValue > max) {
          errors.push(`${field.label} must be at most ${max}`);
        }
      }
    }

    if (field.type === 'text' || field.type === 'textarea') {
      const strValue = String(value);
      if (min !== undefined && strValue.length < min) {
        errors.push(`${field.label} must be at least ${min} characters`);
      }
      if (max !== undefined && strValue.length > max) {
        errors.push(`${field.label} must be at most ${max} characters`);
      }
      if (pattern && !new RegExp(pattern).test(strValue)) {
        errors.push(field.validation.message || `${field.label} format is invalid`);
      }
    }
  }

  return errors;
};

/**
 * Check if field should be visible based on conditional logic
 */
export const isFieldVisible = (field: FormFieldConfig, formValues: Record<string, any>): boolean => {
  if (!field.conditional) {
    return true;
  }

  const { field: dependentField, value, operator } = field.conditional;
  const dependentValue = formValues[dependentField];

  switch (operator) {
    case 'equals':
      return dependentValue === value;
    case 'not_equals':
      return dependentValue !== value;
    case 'contains':
      return String(dependentValue).includes(String(value));
    case 'greater_than':
      return Number(dependentValue) > Number(value);
    case 'less_than':
      return Number(dependentValue) < Number(value);
    default:
      return true;
  }
};

/**
 * Flatten form configuration to get all fields
 */
export const flattenFormFields = (config: FormConfig): FormFieldConfig[] => {
  return config.sections.flatMap(section => section.fields);
};

/**
 * Get field by name from form configuration
 */
export const getFieldByName = (config: FormConfig, name: string): FormFieldConfig | undefined => {
  return flattenFormFields(config).find(field => field.name === name);
};

/**
 * Merge AI analysis results with form configuration
 */
export const mergeAnalysisWithForm = (
  formConfig: FormConfig,
  analysisResult: AIAnalysisResult
): FormConfig => {
  return {
    ...formConfig,
    sections: formConfig.sections.map(section => ({
      ...section,
      fields: section.fields.map(field => {
        const aiValue = analysisResult.fields[field.name];
        if (aiValue !== undefined) {
          return {
            ...field,
            defaultValue: aiValue,
            metadata: {
              ...field.metadata,
              aiGenerated: true,
              confidence: analysisResult.confidence,
              source: 'ai_analysis',
              originalValue: field.defaultValue
            }
          };
        }
        return field;
      })
    }))
  };
}; 