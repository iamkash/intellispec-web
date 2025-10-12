/**
 * Generic Metadata Validation Schema
 * 
 * Validates any workspace or wizard configuration using a generic,
 * metadata-driven approach with no hardcoded implementations.
 */

import { z } from 'zod';

// Generic Agent Configuration Schema
export const AgentConfigSchema = z.object({
  id: z.string().min(1, 'Agent ID is required'),
  type: z.string().min(1, 'Agent type is required'),
  config: z.object({
    analysisPrompt: z.string().optional(),
    aiConfig: z.object({
      model: z.string().optional(),
      reasoningConfig: z.object({
        reasoningEffort: z.enum(['minimal', 'low', 'medium', 'high']).optional(),
        textVerbosity: z.enum(['low', 'medium', 'high']).optional(),
        maxCompletionTokens: z.number().positive().optional()
      }).optional(),
      temperature: z.number().min(0).max(2).optional()
    }).optional()
  }).optional()
});

// Generic Connection Schema
export const ConnectionSchema = z.object({
  from: z.string().min(1, 'Source agent is required'),
  to: z.string().min(1, 'Target agent is required'),
  data_mapping: z.object({
    source: z.string().optional(),
    target: z.string().optional()
  }).optional(),
  condition: z.string().optional()
});

// Generic Workflow Metadata Schema
export const WorkflowMetadataSchema = z.object({
  workflowId: z.string().min(1, 'Workflow ID is required'),
  agents: z.array(AgentConfigSchema).optional(),
  connections: z.array(ConnectionSchema).optional(),
  entryPoint: z.string().optional(),
  finishPoint: z.string().optional()
});

// Generic Gadget Schema
export const GadgetSchema = z.object({
  id: z.string().min(1, 'Gadget ID is required'),
  type: z.string().min(1, 'Gadget type is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  position: z.number().optional(),
  size: z.number().optional(),
  config: z.union([
    WorkflowMetadataSchema,
    z.record(z.any()) // Generic config object
  ]).optional()
});

// Generic Section Schema
export const SectionSchema = z.object({
  id: z.string().min(1, 'Section ID is required'),
  title: z.string().min(1, 'Section title is required'),
  description: z.string().optional(),
  sectionType: z.string().optional(),
  order: z.number().positive().optional(),
  includeInPdf: z.boolean().optional(),
  aiAgent: z.string().optional(),
  voicePrompt: z.string().optional(),
  analysisPrompt: z.string().optional(),
  aiConfig: z.record(z.any()).optional(),
  fields: z.array(z.any()).optional(),
  maxImages: z.number().positive().optional(),
  imageType: z.string().optional()
});

// Generic Metadata Configuration Schema
export const MetadataConfigSchema = z.object({
  id: z.string().min(1, 'Configuration ID is required'),
  title: z.string().min(1, 'Configuration title is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
  type: z.string().optional(),
  mode: z.string().optional(),
  layout: z.string().optional(),
  standards: z.array(z.string()).optional(),
  gadgets: z.array(GadgetSchema).optional(),
  sections: z.array(SectionSchema).optional()
}).passthrough(); // Allow any additional properties for extensibility

// Validation Result Types
export interface MetadataValidationResult {
  success: boolean;
  data?: any;
  errors: MetadataValidationError[];
  warnings: MetadataValidationWarning[];
}

export interface MetadataValidationError {
  path: string[];
  message: string;
  code: string;
  suggestion?: string;
}

export interface MetadataValidationWarning {
  path: string[];
  message: string;
  suggestion?: string;
}

/**
 * Generic validation function that works for any metadata structure
 */
export function validateMetadataConfig(config: unknown): MetadataValidationResult {
  const result = MetadataConfigSchema.safeParse(config);
  
  if (result.success) {
    const warnings = generateMetadataWarnings(result.data);
    return {
      success: true,
      data: result.data,
      errors: [],
      warnings
    };
  }

  // Convert Zod errors to our format
  const errors: MetadataValidationError[] = result.error.errors.map(error => ({
    path: error.path.map(p => String(p)),
    message: error.message,
    code: error.code,
    suggestion: generateMetadataSuggestion(error)
  }));

  return {
    success: false,
    errors,
    warnings: []
  };
}

/**
 * Generate helpful suggestions for metadata validation errors
 */
function generateMetadataSuggestion(error: z.ZodIssue): string | undefined {
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
    
    case 'invalid_type':
      return `Expected ${error.expected}, got ${error.received}`;
  }
  
  return undefined;
}

/**
 * Generate warnings for metadata best practices
 */
function generateMetadataWarnings(config: z.infer<typeof MetadataConfigSchema>): MetadataValidationWarning[] {
  const warnings: MetadataValidationWarning[] = [];

  // Check for workflow metadata gadget
  const workflowGadget = config.gadgets?.find(g => g.type === 'workflow-metadata-gadget');
  if (!workflowGadget) {
    warnings.push({
      path: ['gadgets'],
      message: 'No workflow-metadata-gadget found. Workflow execution may not work properly.',
      suggestion: 'Add a workflow-metadata-gadget with agent definitions and connections'
    });
  } else {
    // Validate workflow metadata
    const workflowConfig = workflowGadget.config as any;
    if (workflowConfig && typeof workflowConfig === 'object') {
      if (!workflowConfig.agents || workflowConfig.agents.length === 0) {
        warnings.push({
          path: ['gadgets', 'workflow-metadata-gadget', 'config', 'agents'],
          message: 'No agents defined in workflow metadata',
          suggestion: 'Add agent definitions with id, type, and config properties'
        });
      }

      if (!workflowConfig.connections || workflowConfig.connections.length === 0) {
        warnings.push({
          path: ['gadgets', 'workflow-metadata-gadget', 'config', 'connections'],
          message: 'No connections defined in workflow metadata',
          suggestion: 'Add connection definitions to link agents together'
        });
      }

      if (!workflowConfig.entryPoint) {
        warnings.push({
          path: ['gadgets', 'workflow-metadata-gadget', 'config', 'entryPoint'],
          message: 'No entry point defined for workflow',
          suggestion: 'Add entryPoint to specify which agent starts the workflow'
        });
      }
    }
  }

  // Check for wizard gadget
  const wizardGadget = config.gadgets?.find(g => g.type === 'ai-agentic-wizard-gadget');
  if (!wizardGadget) {
    warnings.push({
      path: ['gadgets'],
      message: 'No ai-agentic-wizard-gadget found. Wizard UI may not render properly.',
      suggestion: 'Add an ai-agentic-wizard-gadget for the main wizard interface'
    });
  }

  // Check for sections
  if (!config.sections || config.sections.length === 0) {
    warnings.push({
      path: ['sections'],
      message: 'No sections defined. Wizard will have no steps.',
      suggestion: 'Add sections array with wizard steps'
    });
  }

  return warnings;
}

/**
 * Quick validation for development
 */
export function quickValidateMetadata(config: unknown): boolean {
  const result = MetadataConfigSchema.safeParse(config);
  return result.success;
}

/**
 * Get validation summary
 */
export function getMetadataValidationSummary(result: MetadataValidationResult): string {
  if (result.success) {
    const warningText = result.warnings.length > 0 
      ? ` with ${result.warnings.length} warning(s)`
      : '';
    return `✅ Metadata validation passed${warningText}`;
  }

  return `❌ Metadata validation failed with ${result.errors.length} error(s)`;
}

// Re-export for backward compatibility
export const WizardConfigSchema = MetadataConfigSchema;
export const validateWizardConfig = validateMetadataConfig;
export const getWizardValidationSummary = getMetadataValidationSummary;
