/**
 * AI Column Mapping Helper (Backend Utility)
 * 
 * Uses AIService.js for all OpenAI interactions - NO direct OpenAI calls.
 * Follows established design patterns:
 * - Strategy Pattern: Different strategies for verification vs suggestion
 * - Template Method Pattern: Template-driven prompts from metadata
 * - Factory Pattern: Config building for AIService
 * 
 * ⚠️ CRITICAL: This is a PURE UTILITY with ZERO hardcoded prompts or business logic.
 * ALL prompts, models, and configurations come from metadata.
 */

const { generateWithAI } = require('../core/AIService');
const { logger } = require('../core/Logger');

/**
 * Verify if a suggested mapping is correct using AI
 * @param {object} config - Verification configuration from metadata
 * @param {object} context - Mapping context (excelColumn, sampleData, suggestedField, etc.)
 * @returns {Promise<object>} - { confirmed: boolean, suggestedField?: string, explanation: string }
 */
async function verifyMapping(config, context) {
  try {
    logger.info('AI verifying column mapping', {
      excelColumn: context.excelColumn,
      suggestedField: context.suggestedDbField
    });

    // Generate AI response using metadata-driven config
    const aiResponse = await generateWithAI(config, context);
    
    // Parse JSON response
    let result;
    try {
      result = JSON.parse(aiResponse);
    } catch (parseError) {
      logger.error('Failed to parse AI verification response', { 
        response: aiResponse,
        error: parseError.message 
      });
      throw new Error('AI returned invalid JSON response');
    }

    logger.info('AI verification complete', {
      excelColumn: context.excelColumn,
      confirmed: result.confirmed,
      suggestedField: result.suggestedField
    });

    return {
      confirmed: result.confirmed || false,
      suggestedField: result.suggestedField,
      explanation: result.explanation || 'No explanation provided'
    };

  } catch (error) {
    logger.error('AI verification failed', {
      excelColumn: context.excelColumn,
      error: error.message
    });
    throw error;
  }
}

/**
 * Get AI suggestion for column mapping when no local match found
 * @param {object} config - Suggestion configuration from metadata
 * @param {object} context - Mapping context (excelColumn, sampleData, availableFields)
 * @returns {Promise<object|null>} - { dbField: string, confidence: number, reason: string } or null
 */
async function suggestMapping(config, context) {
  try {
    logger.info('AI suggesting column mapping', {
      excelColumn: context.excelColumn
    });

    // Generate AI response using metadata-driven config
    const aiResponse = await generateWithAI(config, context);
    
    // Parse JSON response
    let result;
    try {
      result = JSON.parse(aiResponse);
    } catch (parseError) {
      logger.error('Failed to parse AI suggestion response', { 
        response: aiResponse,
        error: parseError.message 
      });
      throw new Error('AI returned invalid JSON response');
    }

    // Validate result
    if (!result.dbField || result.confidence < 0.5) {
      logger.info('AI could not confidently suggest mapping', {
        excelColumn: context.excelColumn,
        confidence: result.confidence
      });
      return null;
    }

    logger.info('AI suggestion complete', {
      excelColumn: context.excelColumn,
      dbField: result.dbField,
      confidence: result.confidence
    });

    return {
      dbField: result.dbField,
      confidence: result.confidence,
      reason: `OpenAI suggestion: ${result.explanation || 'No explanation provided'}`
    };

  } catch (error) {
    logger.error('AI suggestion failed', {
      excelColumn: context.excelColumn,
      error: error.message,
      stack: error.stack
    });
    return null; // Graceful failure - return null instead of throwing
  }
}

/**
 * Build verification context for AIService template interpolation
 * @param {string} excelColumn - Excel column name
 * @param {Array} sampleData - Sample data values
 * @param {string} suggestedDbField - Suggested database field
 * @param {object} fieldDef - Field definition from metadata
 * @param {Array} allFields - All available field definitions
 * @returns {object} - Context object for template interpolation
 */
function buildVerificationContext(excelColumn, sampleData, suggestedDbField, fieldDef, allFields) {
  return {
    excelColumn,
    sampleData: JSON.stringify(sampleData.slice(0, 5)),
    suggestedDbField,
    fieldLabel: fieldDef?.label || suggestedDbField,
    fieldDataType: fieldDef?.dataType || 'unknown',
    availableFields: allFields.map(f => 
      `- ${f.dbField} (${f.label}) - ${f.dataType}${f.aliases ? ` [aliases: ${f.aliases.join(', ')}]` : ''}`
    ).join('\n')
  };
}

/**
 * Build suggestion context for AIService template interpolation
 * @param {string} excelColumn - Excel column name
 * @param {Array} sampleData - Sample data values
 * @param {Array} allFields - All available field definitions
 * @returns {object} - Context object for template interpolation
 */
function buildSuggestionContext(excelColumn, sampleData, allFields) {
  return {
    excelColumn,
    sampleData: JSON.stringify(sampleData.slice(0, 5)),
    availableFields: allFields.map(f => 
      `- ${f.dbField} (${f.label}) - ${f.dataType}${f.aliases ? ` [aliases: ${f.aliases.join(', ')}]` : ''}`
    ).join('\n')
  };
}

module.exports = {
  verifyMapping,
  suggestMapping,
  buildVerificationContext,
  buildSuggestionContext
};
