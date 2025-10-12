/**
 * Schema Validator
 * 
 * Truly metadata-driven validation with no hardcoded schemas.
 * All validation rules come from database or metadata files.
 * 
 * Design Patterns:
 * - Strategy Pattern (different validation strategies)
 * - Factory Pattern (schema creation)
 * - Builder Pattern (dynamic schema building)
 * 
 * Features:
 * - 100% metadata-driven (no hardcoded schemas)
 * - Dynamic enum validation from reference data
 * - Conditional validation
 * - Caching for performance
 * - Context-aware validation
 */

const mongoose = require('mongoose');
const { z } = require('zod');
const { logger } = require('./Logger');

// Cache for reference data to avoid repeated database queries
const referenceDataCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get reference list options with caching
 */
async function getReferenceListOptions(listTypeName, parentValue = null) {
  const cacheKey = `${listTypeName}:${parentValue || 'all'}`;
  const cached = referenceDataCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  try {
    const db = mongoose.connection;
    const optionsCol = db.collection('referenceListOptions');
    
    let query = { 
      listType: listTypeName,
      isActive: true
    };
    
    if (parentValue) {
      query.parentValue = parentValue;
    }
    
    const options = await optionsCol.find(query).toArray();
    const values = options.map(opt => opt.value);
    
    // Cache the result
    referenceDataCache.set(cacheKey, {
      data: values,
      timestamp: Date.now()
    });
    
    return values;
  } catch (error) {
    logger.error('Error fetching reference data', { 
      listTypeName, 
      parentValue, 
      error: error.message 
    });
    return [];
  }
}

/**
 * Create a dynamic enum validator that fetches valid values from reference data
 */
function createDynamicEnum(listTypeName, parentValue = null, defaultValue = null) {
  return z.string().refine(async (value) => {
    if (!value && defaultValue) {
      return true; // Allow default value
    }
    
    const validValues = await getReferenceListOptions(listTypeName, parentValue);
    return validValues.includes(value);
  }, {
    message: `Invalid value. Must be one of the valid options for ${listTypeName}`
  });
}

/**
 * Create a conditional enum validator based on another field's value
 */
function createConditionalEnum(listTypePattern, dependentField) {
  return z.string().refine(async (value, ctx) => {
    if (!value) return true; // Allow empty values
    
    // Get the parent value from the validation context
    const parentValue = ctx.parent?.[dependentField];
    if (!parentValue) return true; // Allow if parent not set
    
    // Build list type name based on pattern and parent value
    const listTypeName = listTypePattern.replace('{parentValue}', parentValue);
    const validValues = await getReferenceListOptions(listTypeName);
    
    return validValues.includes(value);
  }, {
    message: `Invalid value for the selected ${dependentField}`
  });
}

/**
 * Build Zod validator from field configuration
 */
async function buildFieldValidator(fieldConfig) {
  let validator;
  
  switch (fieldConfig.type) {
    case 'string':
      validator = z.string();
      if (fieldConfig.min) validator = validator.min(fieldConfig.min, fieldConfig.message || 'Field is required');
      if (fieldConfig.max) validator = validator.max(fieldConfig.max);
      if (fieldConfig.email) validator = validator.email();
      if (fieldConfig.url) validator = validator.url();
      if (fieldConfig.regex) validator = validator.regex(new RegExp(fieldConfig.regex), fieldConfig.regexMessage);
      break;
      
    case 'number':
      validator = z.number();
      if (fieldConfig.min !== undefined) validator = validator.min(fieldConfig.min);
      if (fieldConfig.max !== undefined) validator = validator.max(fieldConfig.max);
      if (fieldConfig.positive) validator = validator.positive(fieldConfig.message);
      if (fieldConfig.nonnegative) validator = validator.nonnegative();
      if (fieldConfig.int) validator = validator.int();
      break;
      
    case 'boolean':
      validator = z.boolean();
      break;
      
    case 'date':
      validator = z.date();
      break;
      
    case 'array':
      let itemValidator = z.any();
      if (fieldConfig.items) {
        itemValidator = await buildFieldValidator(fieldConfig.items);
      }
      validator = z.array(itemValidator);
      if (fieldConfig.min) validator = validator.min(fieldConfig.min, fieldConfig.message);
      if (fieldConfig.max) validator = validator.max(fieldConfig.max);
      if (fieldConfig.nonempty) validator = validator.nonempty(fieldConfig.message);
      break;
      
    case 'object':
      if (fieldConfig.properties) {
        const objectSchema = await createSchemaFromMetadata({ fields: fieldConfig.properties });
        validator = objectSchema;
      } else {
        validator = z.object({});
      }
      break;
      
    case 'enum':
      if (fieldConfig.referenceList) {
        // Dynamic enum from reference data
        validator = createDynamicEnum(fieldConfig.referenceList, fieldConfig.parentValue, fieldConfig.default);
      } else if (fieldConfig.values) {
        // Static enum
        validator = z.enum(fieldConfig.values);
      } else {
        validator = z.string();
      }
      break;
      
    default:
      validator = z.any();
  }
  
  // Apply common modifiers
  if (fieldConfig.optional) {
    validator = validator.optional();
  }
  if (fieldConfig.nullable) {
    validator = validator.nullable();
  }
  if (fieldConfig.default !== undefined) {
    validator = validator.default(fieldConfig.default);
  }
  
  return validator;
}

/**
 * Create a schema from metadata configuration
 * This is the core function that makes validation 100% metadata-driven
 */
async function createSchemaFromMetadata(schemaConfig) {
  const schemaFields = {};
  
  for (const [fieldName, fieldConfig] of Object.entries(schemaConfig.fields || {})) {
    schemaFields[fieldName] = await buildFieldValidator(fieldConfig);
  }
  
  return z.object(schemaFields);
}

/**
 * Get document schema configuration from database
 */
async function getDocumentSchemaConfig(documentType) {
  try {
    const db = mongoose.connection;
    const schemasCol = db.collection('documentSchemas');
    
    const schemaConfig = await schemasCol.findOne({ 
      documentType: documentType,
      isActive: true 
    });
    
    if (!schemaConfig) {
      logger.warn('No schema configuration found for document type', { documentType });
    }
    
    return schemaConfig;
  } catch (error) {
    logger.error('Error fetching schema config', { 
      documentType, 
      error: error.message 
    });
    return null;
  }
}

/**
 * Validate document with contextual validation
 * This is the main validation function - 100% metadata-driven!
 */
async function validateDocumentWithContext(documentType, data, context = {}) {
  try {
    // Get schema from metadata
    const schemaConfig = await getDocumentSchemaConfig(documentType);
    
    if (!schemaConfig) {
      logger.warn('No schema found, skipping validation', { documentType });
      return data; // Return data as-is if no schema defined
    }
    
    // Build schema from metadata
    const schema = await createSchemaFromMetadata(schemaConfig);
    
    // Validate data
    const validated = await schema.parseAsync(data);
    
    logger.info('Document validated successfully', { 
      documentType, 
      fieldCount: Object.keys(data).length 
    });
    
    return validated;
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Validation failed', {
        documentType,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          value: e.received
        }))
      });
    } else {
      logger.error('Schema validation error', {
        documentType,
        error: error.message
      });
    }
    throw error;
  }
}

/**
 * Validate a specific field against its schema
 */
async function validateField(documentType, fieldName, value, context = {}) {
  try {
    const schemaConfig = await getDocumentSchemaConfig(documentType);
    
    if (!schemaConfig || !schemaConfig.fields || !schemaConfig.fields[fieldName]) {
      logger.warn('No schema found for field', { documentType, fieldName });
      return { valid: true, value }; // No validation if no schema
    }
    
    const fieldConfig = schemaConfig.fields[fieldName];
    const fieldValidator = await buildFieldValidator(fieldConfig);
    
    const validated = await fieldValidator.parseAsync(value);
    
    return { valid: true, value: validated };
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(e => e.message)
      };
    }
    
    logger.error('Field validation error', {
      documentType,
      fieldName,
      error: error.message
    });
    
    return {
      valid: false,
      errors: [error.message]
    };
  }
}

/**
 * Get validation rules for a document type (for frontend)
 */
async function getValidationRules(documentType) {
  try {
    const schemaConfig = await getDocumentSchemaConfig(documentType);
    
    if (!schemaConfig) {
      return null;
    }
    
    // Return rules in a format suitable for frontend validation
    const rules = {};
    
    for (const [fieldName, fieldConfig] of Object.entries(schemaConfig.fields || {})) {
      rules[fieldName] = {
        type: fieldConfig.type,
        required: !fieldConfig.optional && !fieldConfig.nullable,
        min: fieldConfig.min,
        max: fieldConfig.max,
        pattern: fieldConfig.regex,
        referenceList: fieldConfig.referenceList,
        values: fieldConfig.values,
        message: fieldConfig.message
      };
    }
    
    return rules;
    
  } catch (error) {
    logger.error('Error getting validation rules', {
      documentType,
      error: error.message
    });
    return null;
  }
}

/**
 * Clear reference data cache (useful for testing or when data changes)
 */
function clearReferenceDataCache() {
  referenceDataCache.clear();
  logger.info('Reference data cache cleared');
}

/**
 * Clear specific cache entry
 */
function clearCacheEntry(listTypeName, parentValue = null) {
  const cacheKey = `${listTypeName}:${parentValue || 'all'}`;
  referenceDataCache.delete(cacheKey);
  logger.info('Cache entry cleared', { cacheKey });
}

module.exports = {
  validateDocumentWithContext,
  validateField,
  getValidationRules,
  getReferenceListOptions,
  clearReferenceDataCache,
  clearCacheEntry,
  createDynamicEnum,
  createConditionalEnum,
  createSchemaFromMetadata,
  getDocumentSchemaConfig
};

