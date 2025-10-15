#!/usr/bin/env node

/**
 * Generic Metadata Validation System
 * 
 * This script validates any workspace or wizard configuration
 * using a generic, metadata-driven approach with no hardcoded implementations.
 */

const fs = require('fs').promises;
const path = require('path');

// Generic validation rules that work for any metadata structure
const VALIDATION_RULES = {
  // Common required fields for any configuration
  required: {
    id: { type: 'string', message: 'ID is required' },
    title: { type: 'string', message: 'Title is required' }
  },
  
  // Gadget validation rules
  gadgets: {
    required: true,
    type: 'array',
    message: 'Gadgets array is required',
    itemValidation: {
      id: { type: 'string', required: true },
      type: { type: 'string', required: true },
      title: { type: 'string', required: false },
      description: { type: 'string', required: false }
    }
  },
  
  // Workflow metadata validation (generic)
  workflowMetadata: {
    gadgetType: 'workflow-metadata-gadget',
    requiredFields: {
      workflowId: { type: 'string', message: 'Workflow ID is required' },
      agents: { type: 'array', message: 'Agents array is required' }
    },
    optionalFields: {
      connections: { type: 'array', message: 'Connections array is optional' },
      entryPoint: { type: 'string', message: 'Entry point is optional' },
      finishPoint: { type: 'string', message: 'Finish point is optional' }
    }
  },
  
  // Agent validation rules
  agent: {
    requiredFields: {
      id: { type: 'string', message: 'Agent ID is required' },
      type: { type: 'string', message: 'Agent type is required' }
    },
    optionalFields: {
      config: { type: 'object', message: 'Agent config is optional' }
    }
  },
  
  // Connection validation rules
  connection: {
    requiredFields: {
      from: { type: 'string', message: 'Source agent is required' },
      to: { type: 'string', message: 'Target agent is required' }
    },
    optionalFields: {
      data_mapping: { type: 'object', message: 'Data mapping is optional' },
      condition: { type: 'string', message: 'Condition is optional' }
    }
  }
};

/**
 * Generic validation function that works for any metadata structure
 */
function validateMetadata(config, rules = VALIDATION_RULES) {
  const errors = [];
  const warnings = [];
  
  // Validate required fields
  Object.entries(rules.required || {}).forEach(([field, rule]) => {
    if (!config[field]) {
      errors.push({
        path: [field],
        message: rule.message,
        code: 'missing_required_field'
      });
    } else if (rule.type && typeof config[field] !== rule.type) {
      errors.push({
        path: [field],
        message: `Expected ${rule.type}, got ${typeof config[field]}`,
        code: 'invalid_type'
      });
    }
  });
  
  // Validate gadgets array
  if (rules.gadgets) {
    if (!config.gadgets || !Array.isArray(config.gadgets)) {
      errors.push({
        path: ['gadgets'],
        message: rules.gadgets.message,
        code: 'missing_gadgets'
      });
    } else {
      // Validate each gadget
      config.gadgets.forEach((gadget, index) => {
        if (rules.gadgets.itemValidation) {
          Object.entries(rules.gadgets.itemValidation).forEach(([field, rule]) => {
            if (rule.required && !gadget[field]) {
              errors.push({
                path: ['gadgets', index.toString(), field],
                message: `${field} is required for gadget`,
                code: 'missing_gadget_field'
              });
            }
          });
        }
        
        // Check for workflow metadata gadget
        if (gadget.type === rules.workflowMetadata?.gadgetType) {
          validateWorkflowMetadata(gadget, rules.workflowMetadata, errors, warnings, ['gadgets', index.toString()]);
        }
      });
    }
  }
  
  return { success: errors.length === 0, errors, warnings };
}

/**
 * Validate workflow metadata specifically
 */
function validateWorkflowMetadata(gadget, rules, errors, warnings, basePath = []) {
  const config = gadget.config || {};
  
  // Validate required fields
  Object.entries(rules.requiredFields || {}).forEach(([field, rule]) => {
    if (!config[field]) {
      errors.push({
        path: [...basePath, 'config', field],
        message: rule.message,
        code: 'missing_workflow_field'
      });
    }
  });
  
  // Validate agents
  if (config.agents && Array.isArray(config.agents)) {
    config.agents.forEach((agent, index) => {
      if (rules.agent && rules.agent.requiredFields) {
        Object.entries(rules.agent.requiredFields).forEach(([field, rule]) => {
          if (!agent[field]) {
            errors.push({
              path: [...basePath, 'config', 'agents', index.toString(), field],
              message: rule.message,
              code: 'missing_agent_field'
            });
          }
        });
      }
    });
  } else if (rules.requiredFields && rules.requiredFields.agents) {
    warnings.push({
      path: [...basePath, 'config', 'agents'],
      message: 'No agents defined in workflow metadata',
      suggestion: 'Add agent definitions for workflow execution'
    });
  }
  
  // Validate connections
  if (config.connections && Array.isArray(config.connections)) {
    config.connections.forEach((connection, index) => {
      if (rules.connection && rules.connection.requiredFields) {
        Object.entries(rules.connection.requiredFields).forEach(([field, rule]) => {
          if (!connection[field]) {
            errors.push({
              path: [...basePath, 'config', 'connections', index.toString(), field],
              message: rule.message,
              code: 'missing_connection_field'
            });
          }
        });
      }
    });
  } else {
    warnings.push({
      path: [...basePath, 'config', 'connections'],
      message: 'No connections defined in workflow metadata',
      suggestion: 'Add connection definitions to link agents together'
    });
  }
  
  // Check for entry/finish points
  if (!config.entryPoint) {
    warnings.push({
      path: [...basePath, 'config', 'entryPoint'],
      message: 'No entry point defined for workflow',
      suggestion: 'Add entryPoint to specify which agent starts the workflow'
    });
  }
  
  if (!config.finishPoint) {
    warnings.push({
      path: [...basePath, 'config', 'finishPoint'],
      message: 'No finish point defined for workflow',
      suggestion: 'Add finishPoint to specify which agent ends the workflow'
    });
  }
}

/**
 * Get validation summary
 */
function getValidationSummary(result) {
  if (result.success) {
    const warningText = result.warnings.length > 0 
      ? ` with ${result.warnings.length} warning(s)`
      : '';
    return `✅ Validation passed${warningText}`;
  }
  return `❌ Validation failed with ${result.errors.length} error(s)`;
}

/**
 * Display validation results
 */
function displayValidationResults(result, configName) {
console.log(getValidationSummary(result));
  
  if (!result.success) {
result.errors.forEach((error, index) => {
console.log(`    ❌ [${error.code}] ${error.path.length ? error.path.join('.') : '(root)'}: ${error.message}`);
if (error.suggestion) {
console.log(`       ↳ ${error.suggestion}`);
}
});
  }
  
  if (result.warnings.length > 0) {
result.warnings.forEach((warning, index) => {
if (warning.suggestion) {
console.log(`    ⚠️  ${warning.path.length ? warning.path.join('.') : '(root)'}: ${warning.message}`);
console.log(`       ↳ ${warning.suggestion}`);
} else {
console.log(`    ⚠️  ${warning.path.length ? warning.path.join('.') : '(root)'}: ${warning.message}`);
}
    });
  }
}

/**
 * Display metadata summary
 */
function displayMetadataSummary(config, configName) {
console.log(`  ID: ${config.id}`);
console.log(`  Gadgets: ${config.gadgets?.length || 0}`);
// Check for workflow metadata
  const workflowGadget = config.gadgets?.find(g => g.type === 'workflow-metadata-gadget');
  if (workflowGadget) {
console.log(`  Workflow ID: ${workflowGadget.config?.workflowId}`);
console.log(`  Connections: ${workflowGadget.config?.connections?.length || 0}`);
console.log(`  Finish Point: ${workflowGadget.config?.finishPoint || 'Not specified'}`);
  }
}

/**
 * Validate a single metadata file
 */
async function validateMetadataFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const config = JSON.parse(data);
    const configName = path.basename(filePath, '.json');

    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      console.log(`  ${configName}: skipping non-object metadata`);
      return { success: true, errors: [], warnings: [], skipped: true };
    }

    if (!Array.isArray(config.gadgets)) {
      console.log(`  ${configName}: skipping metadata without gadgets array`);
      return { success: true, errors: [], warnings: [], skipped: true };
    }

    displayMetadataSummary(config, configName);

    const validation = validateMetadata(config);
    displayValidationResults(validation, configName);

    return validation;
  } catch (error) {
    console.error(`❌ Error validating ${filePath}:`, error.message);
    return { success: false, errors: [{ path: [], message: error.message }], warnings: [] };
  }
}

/**
 * Find all metadata files recursively
 */
async function findMetadataFiles(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findMetadataFiles(fullPath));
    } else if (entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Main validation function
 */
async function validateAllMetadata() {
const workspacesDir = path.join(__dirname, '../public/data/workspaces');
  const metadataFiles = await findMetadataFiles(workspacesDir);
  
  if (metadataFiles.length === 0) {
return;
  }
const results = [];
  let totalWarnings = 0;
  let validatedCount = 0;
  let skippedCount = 0;
  
  for (const filePath of metadataFiles) {
    const result = await validateMetadataFile(filePath);
    results.push({ filePath, result });
    if (result.skipped) {
      skippedCount += 1;
      continue;
    }
    validatedCount += 1;
    totalWarnings += result.warnings.length;
  }
  
  // Summary
console.log(`  Files validated: ${validatedCount}`);
  if (skippedCount > 0) {
console.log(`  Files skipped: ${skippedCount}`);
  }
console.log(`  Total warnings: ${totalWarnings}`);
  
  const failedFiles = results.filter(r => !r.result.success && !r.result.skipped);
  if (failedFiles.length > 0) {
failedFiles.forEach(f => console.log(`  - ${path.relative(workspacesDir, f.filePath)}`));
    process.exit(1);
  } else {
}
}

// Run validation
if (require.main === module) {
  validateAllMetadata();
}

module.exports = { 
  validateMetadata, 
  validateMetadataFile, 
  validateAllMetadata,
  VALIDATION_RULES 
};
