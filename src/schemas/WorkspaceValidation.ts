/**
 * Workspace Configuration Validation using Zod
 * 
 * Production-ready runtime validation for workspace configurations.
 * Uses Zod for type-safe validation with detailed error messages.
 */

import { z } from 'zod';
import { DOCUMENT_FIELD_MAPPINGS, validateFieldMapping } from '../models/DocumentSchemas';

// Filter Definition Schema
export const FilterDefinitionSchema = z.object({
  id: z.string().min(1, 'Filter ID is required'),
  type: z.enum(['text', 'select', 'multiselect', 'daterange', 'number', 'boolean']),
  label: z.string().min(1, 'Filter label is required'),
  placeholder: z.string().optional(),
  optionsUrl: z.string().min(1).refine(url => {
    // Accept both relative URLs (starting with /) and absolute URLs
    return url.startsWith('/') || z.string().url().safeParse(url).success;
  }, {
    message: 'Must be a valid URL (relative like /api/endpoint or absolute like https://example.com/api/endpoint)'
  }).optional(),
  dependsOn: z.union([z.string(), z.array(z.string())]).optional(),
  required: z.boolean().optional(),
  refreshTrigger: z.boolean().optional(),
  labelField: z.string().optional(),
  valueField: z.string().optional(),
  presets: z.array(z.string()).optional()
}).refine(data => {
  // Validate that select/multiselect filters with optionsUrl have labelField and valueField
  if ((data.type === 'select' || data.type === 'multiselect') && data.optionsUrl) {
    return data.labelField && data.valueField;
  }
  return true;
}, {
  message: 'Select/multiselect filters with optionsUrl must have both labelField and valueField specified',
  path: ['labelField', 'valueField']
});

// Filter Context Schema
export const FilterContextSchema = z.object({
  enabled: z.boolean(),
  filterDefinitions: z.array(FilterDefinitionSchema)
}).refine(data => {
  if (!data.enabled) return true;
  
  // Validate filter dependencies
  const filterIds = new Set(data.filterDefinitions.map(f => f.id));
  const invalidDeps = data.filterDefinitions.filter(f => {
    if (!f.dependsOn) return false;
    
    // Handle both string and array dependencies
    const dependencies = Array.isArray(f.dependsOn) ? f.dependsOn : [f.dependsOn];
    return dependencies.some((depId: string) => !filterIds.has(depId));
  });
  
  return invalidDeps.length === 0;
}, {
  message: 'Filter dependencies must reference existing filter IDs'
});

// Aggregation Configuration Schema
export const AggregationConfigSchema = z.object({
  name: z.string().min(1, 'Aggregation name is required'),
  collection: z.string().min(1, 'Collection name is required'),
  baseFilter: z.record(z.any()).refine(filter => {
    // Accept either type (for documents) or workflowId (for executions)
    return (filter.type && typeof filter.type === 'string') ||
           (filter.workflowId && typeof filter.workflowId === 'string');
  }, {
    message: 'Base filter must include a document type or workflowId'
  }),
  fieldMappings: z.record(z.string()).optional(),
  groupBy: z.record(z.any()).optional(),
  pipeline: z.array(z.any()).optional(),
  postProcess: z.object({
    calculations: z.record(z.object({
      formula: z.string()
    }))
  }).optional()
}).refine(data => {
  // Validate field mappings against document schema
  if (!data.fieldMappings) return true;

  // Skip validation for executions (they don't follow document schema)
  if (data.baseFilter.workflowId) return true;

  const documentType = data.baseFilter.type as string;
  if (!DOCUMENT_FIELD_MAPPINGS[documentType]) {
    return false; // Invalid document type
  }

  // Validate each field mapping
  for (const [filterField, dbField] of Object.entries(data.fieldMappings)) {
    const validation = validateFieldMapping(documentType, filterField, dbField);
    if (!validation.isValid) {
      return false;
    }
  }
  
  return true;
}, {
  message: 'Field mappings contain invalid field references'
});

// KPI Configuration Schema
export const KPIConfigSchema = z.object({
  id: z.string().min(1, 'KPI ID is required'),
  title: z.string().min(1, 'KPI title is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
  iconColor: z.string().optional(),
  unit: z.string().optional(),
  format: z.enum(['number', 'percentage', 'currency', 'text']).optional(),
  aggregationConfig: AggregationConfigSchema.optional(),
  dataPath: z.string().optional(),
  target: z.object({
    value: z.number(),
    comparison: z.enum(['gte', 'lte', 'eq', 'ne'])
  }).optional()
}).refine(data => {
  // Validate data path syntax
  if (!data.dataPath) return true;
  
  const dataPathRegex = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+|\[\d+\])*$/;
  return dataPathRegex.test(data.dataPath);
}, {
  message: 'Invalid data path syntax. Use dot notation (e.g., "data.0.field_name")'
});

// Data Source Configuration Schema
export const DataSourceConfigSchema = z.object({
  endpoint: z.string().min(1).refine(url => {
    // Accept both relative URLs (starting with /) and absolute URLs
    return url.startsWith('/') || z.string().url().safeParse(url).success;
  }, {
    message: 'Must be a valid URL (relative like /api/endpoint or absolute like https://example.com/api/endpoint)'
  }),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  headers: z.record(z.string()).optional(),
  body: z.object({
    config: AggregationConfigSchema.optional()
  }).optional()
});

// RAG Chatbot Configuration Schema
const RAGChatbotConfigSchema = z.object({
  chatbot: z.object({
    welcomeMessage: z.string().min(1, 'Welcome message is required'),
    placeholder: z.string().min(1, 'Placeholder is required'),
    maxMessages: z.number().optional(),
    enableHistory: z.boolean().optional(),
    quickActions: z.array(z.object({
      label: z.string(),
      message: z.string(),
      icon: z.string().optional()
    })).optional()
  }),
  rag: z.object({
    enabled: z.boolean(),
    vectorStore: z.enum(['mongodb_atlas']),
    embeddingModel: z.string(),
    searchIndex: z.string(),
    collection: z.string(),
    embeddingDimensions: z.number(),
    similarity: z.enum(['cosine', 'euclidean', 'dotProduct']),
    fieldMappings: z.record(z.string()),
    filterFields: z.array(z.string()),
    contextSources: z.array(z.string()),
    semanticFields: z.array(z.string())
  }).optional(),
  ai: z.object({
    model: z.string().min(1, 'AI model is required'),
    apiType: z.enum(['responses', 'standard']).optional(),
    realtimeEnabled: z.boolean().optional(),
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().min(1),
    systemPrompt: z.string().min(1, 'System prompt is required'),
    contextPrompt: z.string().optional(),
    responsesApi: z.object({
      store: z.boolean(),
      contextRetention: z.boolean(),
      previousResponseId: z.string().optional()
    }).optional(),
    realtimeApi: z.object({
      enabled: z.boolean(),
      voiceEnabled: z.boolean(),
      model: z.string(),
      voice: z.string(),
      inputAudioFormat: z.string(),
      outputAudioFormat: z.string(),
      turnDetection: z.object({
        type: z.string(),
        threshold: z.number(),
        prefixPaddingMs: z.number(),
        silenceDurationMs: z.number()
      }),
      tools: z.array(z.object({
        type: z.string(),
        name: z.string(),
        description: z.string(),
        parameters: z.any()
      }))
    }).optional()
  }),
  security: z.object({
    tenantIsolation: z.boolean(),
    filterAware: z.boolean(),
    dataEncryption: z.boolean().optional(),
    auditLogging: z.boolean().optional(),
    maxRequestsPerMinute: z.number().optional()
  }).optional(),
  api: z.object({
    endpoint: z.string().min(1, 'API endpoint is required'),
    method: z.string(),
    headers: z.record(z.string()),
    requestFormat: z.any().optional()
  }),
  ui: z.object({
    theme: z.object({
      primaryColor: z.string(),
      backgroundColor: z.string(),
      textColor: z.string(),
      accentColor: z.string(),
      mutedColor: z.string()
    }),
    layout: z.object({
      height: z.string(),
      showHeader: z.boolean(),
      showFooter: z.boolean(),
      compactMode: z.boolean().optional()
    }),
    animations: z.object({
      enabled: z.boolean(),
      typingIndicator: z.boolean().optional(),
      messageTransitions: z.boolean().optional()
    }).optional()
  }).optional(),
  features: z.object({
    contextRetention: z.boolean(),
    filterIntegration: z.boolean(),
    dataVisualization: z.boolean().optional(),
    exportChat: z.boolean().optional(),
    voiceInput: z.boolean().optional(),
    voiceOutput: z.boolean().optional(),
    realtimeAudio: z.boolean().optional(),
    toolCalling: z.boolean().optional(),
    multiLanguage: z.boolean().optional()
  }).optional()
});

// Column Configuration Schema for Grid Gadgets
const ColumnConfigSchema = z.object({
  key: z.string().min(1, 'Column key is required'),
  title: z.string().min(1, 'Column title is required'),
  width: z.union([z.string(), z.number()]).optional(),
  sortable: z.boolean().optional(),
  filterable: z.boolean().optional(),
  editable: z.boolean().optional(),
  field: z.object({
    type: z.enum(['text', 'email', 'password', 'select', 'date', 'number', 'textarea']).optional(),
    options: z.union([
      z.array(z.string()), 
      z.array(z.object({ 
        value: z.string(), 
        label: z.string(),
        color: z.string().optional()
      }))
    ]).optional(),
    optionsUrl: z.string().optional(),
    required: z.boolean().optional(),
    placeholder: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    validation: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      message: z.string().optional()
    }).optional()
  }).optional()
});

// SGrid Search Gadget Configuration Schema
const SGridSearchGadgetConfigSchema = z.object({
  dataUrl: z.string().optional(),
  hideCreateButton: z.boolean().optional(),
  columns: z.array(ColumnConfigSchema).optional(),
  rowActions: z.array(z.any()).optional(),
  toolbar: z.object({
    enableCreate: z.boolean().optional(),
    createButtonText: z.string().optional(),
    createWorkspace: z.string().optional(),
    createParams: z.record(z.any()).optional(),
    enableBulkDelete: z.boolean().optional(),
    bulkDeleteText: z.string().optional(),
    bulkDeleteConfirmText: z.string().optional(),
    customActions: z.array(z.any()).optional()
  }).optional(),
  search: z.object({
    placeholder: z.string().optional(),
    enableColumnFilters: z.boolean().optional(),
    filters: z.array(z.any()).optional()
  }).optional(),
  pagination: z.record(z.any()).optional()
});

// Generic Gadget Configuration Schema
const GenericGadgetConfigSchema = z.object({
  kpis: z.array(KPIConfigSchema).optional(),
  dataSource: DataSourceConfigSchema.optional(),
  dataUrl: z.string().optional(),
  layout: z.string().optional(),
  kpiLayout: z.string().optional(),
  columns: z.number().optional(), // For other gadgets that use columns as number
  showTrends: z.boolean().optional(),
  showTargets: z.boolean().optional(),
  autoRefresh: z.boolean().optional(),
  maxItems: z.number().optional(),
  showIcons: z.boolean().optional(),
  showLabels: z.boolean().optional(),
  cardSize: z.string().optional(),
  spacing: z.string().optional(),
  actions: z.array(z.any()).optional()
});

// Gadget Configuration Schema with Type-Specific Configs
export const GadgetConfigSchema = z.object({
  id: z.string().min(1, 'Gadget ID is required'),
  type: z.string().min(1, 'Gadget type is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  position: z.number().optional(),
  config: z.union([
    // SGrid Search Gadget specific config
    SGridSearchGadgetConfigSchema,
    // Generic gadget config for all other types
    GenericGadgetConfigSchema
  ]).optional()
});

// Main Workspace Schema
export const WorkspaceConfigSchema = z.object({
  id: z.string().min(1, 'Workspace ID is required'),
  title: z.string().min(1, 'Workspace title is required'),
  description: z.string().optional(),
  layout: z.enum(['dashboard', 'grid', 'list']).optional(),
  filterContext: FilterContextSchema.optional(),
  gadgets: z.array(GadgetConfigSchema).min(1, 'At least one gadget is required'),
  settings: z.object({
    autoRefresh: z.boolean().optional(),
    refreshInterval: z.number().positive().optional(),
    theme: z.enum(['light', 'dark', 'auto']).optional(),
    density: z.enum(['compact', 'comfortable', 'spacious']).optional(),
    showLastUpdated: z.boolean().optional(),
    enableExport: z.boolean().optional(),
    enablePrint: z.boolean().optional(),
    requireSuperAdmin: z.boolean().optional(),
    auditAllActions: z.boolean().optional(),
    tenantScoped: z.boolean().optional()
  }).optional(),
  metadata: z.object({
    created: z.string().datetime().optional(),
    version: z.string().optional(),
    tags: z.array(z.string()).optional(),
    description: z.string().optional(),
    features: z.array(z.string()).optional(),
    permissions: z.object({
      required: z.array(z.string()).optional(),
      actions: z.array(z.string()).optional()
    }).optional()
  }).optional()
});

// Validation Result Types
export interface ValidationResult {
  success: boolean;
  data?: any;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string[];
  message: string;
  code: string;
  suggestion?: string;
}

export interface ValidationWarning {
  path: string[];
  message: string;
  suggestion?: string;
}

/**
 * Validate workspace configuration with detailed error reporting
 */
export function validateWorkspaceConfig(config: unknown): ValidationResult {
  const result = WorkspaceConfigSchema.safeParse(config);
  
  if (result.success) {
    const warnings = generateWarnings(result.data);
    return {
      success: true,
      data: result.data,
      errors: [],
      warnings
    };
  }

  // Convert Zod errors to our format
  const errors: ValidationError[] = result.error.errors.map(error => ({
    path: error.path.map(p => String(p)),
    message: error.message,
    code: error.code,
    suggestion: generateSuggestion(error)
  }));

  return {
    success: false,
    errors,
    warnings: []
  };
}

/**
 * Generate helpful suggestions for validation errors
 */
function generateSuggestion(error: z.ZodIssue): string | undefined {
  switch (error.code) {
    case 'invalid_enum_value':
      return `Valid options: ${error.options?.join(', ')}`;
    
    case 'too_small':
      if (error.type === 'string') {
        return 'This field cannot be empty';
      }
      if (error.type === 'array') {
        return `At least ${error.minimum} item(s) required`;
      }
      break;
    
    case 'invalid_string':
      if (error.validation === 'url') {
        return 'Must be a valid URL (e.g., https://example.com/api/endpoint)';
      }
      if (error.validation === 'datetime') {
        return 'Must be a valid ISO datetime string (e.g., 2024-01-01T00:00:00Z)';
      }
      break;
  }
  
  return undefined;
}

/**
 * Generate warnings for best practices
 */
function generateWarnings(config: z.infer<typeof WorkspaceConfigSchema>): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // Check for performance issues
  if (config.gadgets.length > 20) {
    warnings.push({
      path: ['gadgets'],
      message: `Large number of gadgets (${config.gadgets.length}) may impact performance`,
      suggestion: 'Consider splitting into multiple workspaces or using pagination'
    });
  }

  // Check for missing descriptions
  const gadgetsWithoutDescriptions = config.gadgets.filter(g => !g.description);
  if (gadgetsWithoutDescriptions.length > 0) {
    const missingIds = gadgetsWithoutDescriptions.map(g => g.id).join(', ');
    warnings.push({
      path: ['gadgets'],
      message: `${gadgetsWithoutDescriptions.length} gadget(s) missing descriptions: ${missingIds}`,
      suggestion: 'Add descriptions for better maintainability'
    });
    
    // Add individual warnings for each missing description
    gadgetsWithoutDescriptions.forEach((gadget, index) => {
      const gadgetIndex = config.gadgets.findIndex(g => g.id === gadget.id);
      warnings.push({
        path: ['gadgets', gadgetIndex.toString(), 'description'],
        message: `Gadget "${gadget.id}" (${gadget.type}) is missing description`,
        suggestion: `Add: "description": "Brief description of what this ${gadget.type} does"`
      });
    });
  }

  // Check for missing labelField/valueField in select/multiselect filters
  if (config.filterContext?.enabled) {
    config.filterContext.filterDefinitions.forEach((filter, index) => {
      if ((filter.type === 'select' || filter.type === 'multiselect') && filter.optionsUrl) {
        const missingFields = [];
        if (!filter.labelField) missingFields.push('labelField');
        if (!filter.valueField) missingFields.push('valueField');
        
        if (missingFields.length > 0) {
          warnings.push({
            path: ['filterContext', 'filterDefinitions', index.toString()],
            message: `🔍 FILTER "${filter.id}" (${filter.type}) at index ${index} is missing: ${missingFields.join(', ')}`,
            suggestion: `Add to filter "${filter.id}": ${missingFields.map(field => 
              field === 'labelField' 
                ? '"labelField": "label" // or "name", "code", "title"' 
                : '"valueField": "value" // or "id", "key"'
            ).join(', ')}`
          });
        }
      }
    });
  }

  // Check filter dependencies
  if (config.filterContext?.enabled) {
    const dependentFilters = config.filterContext.filterDefinitions.filter(f => f.dependsOn);
    if (dependentFilters.length > 3) {
      warnings.push({
        path: ['filterContext', 'filterDefinitions'],
        message: 'Complex filter dependencies may confuse users',
        suggestion: 'Consider simplifying filter relationships'
      });
    }
  }

  // Check for non-standard API endpoints
  config.gadgets.forEach((gadget, index) => {
    if (!gadget.config) return;

    const config = gadget.config as any; // Type assertion for union handling

    // Check dataSource for generic gadgets
    if (config.dataSource?.endpoint) {
      const endpoint = config.dataSource.endpoint;
      if (!endpoint.startsWith('/api/')) {
        warnings.push({
          path: ['gadgets', index.toString(), 'config', 'dataSource', 'endpoint'],
          message: 'Non-standard API endpoint',
          suggestion: 'Use /api/ prefix for consistency'
        });
      }
    }

    // Check dataUrl for sgrid gadgets
    if (config.dataUrl) {
      const dataUrl = config.dataUrl;
      // Only warn about non-standard endpoints if it's not a static data file
      if (!dataUrl.startsWith('/api/') && !dataUrl.startsWith('http') && !dataUrl.startsWith('/data/')) {
        warnings.push({
          path: ['gadgets', index.toString(), 'config', 'dataUrl'],
          message: 'Non-standard API endpoint',
          suggestion: 'Use /api/ prefix or absolute URL for consistency'
        });
      }
    }
  });

  return warnings;
}

/**
 * Validate specific field mappings
 */
export function validateFieldMappings(
  documentType: string,
  fieldMappings: Record<string, string>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!DOCUMENT_FIELD_MAPPINGS[documentType]) {
    errors.push({
      path: ['baseFilter', 'type'],
      message: `Unknown document type: ${documentType}`,
      code: 'invalid_document_type',
      suggestion: `Valid types: ${Object.keys(DOCUMENT_FIELD_MAPPINGS).join(', ')}`
    });
    return { success: false, errors, warnings };
  }

  Object.entries(fieldMappings).forEach(([filterField, dbField]) => {
    const validation = validateFieldMapping(
      documentType,
      filterField,
      dbField
    );

    if (!validation.isValid) {
      errors.push({
        path: ['fieldMappings', filterField],
        message: `Invalid field mapping: ${filterField} -> ${dbField}`,
        code: 'invalid_field_mapping',
        suggestion: validation.suggestion
      });
    }
  });

  return {
    success: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Quick validation for development
 */
export function quickValidate(config: unknown): boolean {
  const result = WorkspaceConfigSchema.safeParse(config);
  return result.success;
}

/**
 * Get validation summary
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.success) {
    const warningText = result.warnings.length > 0 
      ? ` with ${result.warnings.length} warning(s)`
      : '';
    return `✅ Validation passed${warningText}`;
  }

  return `❌ Validation failed with ${result.errors.length} error(s)`;
}
