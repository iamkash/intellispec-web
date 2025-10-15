/**
 * AI Column Mapping API Routes
 * 
 * Provides AI-powered column mapping suggestions using AIService.
 * All prompts and configurations come from metadata.
 * 
 * Design Patterns:
 * - Facade Pattern: Simplifies AI interaction for frontend
 * - Strategy Pattern: Different strategies for verify vs suggest
 */

const { logger } = require('../core/Logger');
const { loadAIConfig } = require('../core/AIService');
const { verifyMapping, suggestMapping, buildVerificationContext, buildSuggestionContext } = require('../utils/aiColumnMappingHelper');
const { requireAuth } = require('../core/AuthMiddleware');
const { ValidationError } = require('../core/ErrorHandler');

function stripControlCharacters(value) {
  if (!value) {
    return value;
  }

  let sanitized = '';
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    const isControl = (code >= 0 && code <= 31) || (code >= 127 && code <= 159);
    sanitized += isControl ? ' ' : value[index];
  }
  return sanitized;
}

async function registerAIColumnMappingRoutes(fastify) {
  
  /**
   * POST /api/ai/column-mapping/verify
   * Verify if a suggested column mapping is correct
   */
  fastify.post('/ai/column-mapping/verify', { preHandler: requireAuth }, async (request, reply) => {
    const { excelColumn, sampleData, suggestedDbField, fieldDefinition, allFieldDefinitions, aiConfigPath } = request.body;
    
    // Validate required fields
    if (!excelColumn || !suggestedDbField || !fieldDefinition || !allFieldDefinitions) {
      throw new ValidationError('Missing required fields', {
        required: ['excelColumn', 'suggestedDbField', 'fieldDefinition', 'allFieldDefinitions']
      });
    }
    
    try {
      // Load AI configuration from metadata
      const configPath = aiConfigPath || 'public/data/ai-config/column-mapping.json';
      const baseConfig = loadAIConfig(configPath);
      
      // Get verification-specific configuration
      const verificationConfig = baseConfig.useCases?.verification || baseConfig.aiGeneration;
      
      if (!verificationConfig) {
        throw new Error('No verification configuration found in AI config');
      }
      
      // Build context for template interpolation
      const context = buildVerificationContext(
        excelColumn,
        sampleData || [],
        suggestedDbField,
        fieldDefinition,
        allFieldDefinitions
      );
      
      // Call AI for verification
      const result = await verifyMapping(verificationConfig, context);
      
      return reply.send({
        success: true,
        result
      });
      
    } catch (error) {
      logger.error('AI column mapping verification failed', {
        excelColumn,
        suggestedDbField,
        error: error.message
      });
      
      return reply.code(500).send({
        success: false,
        error: 'AI verification failed',
        message: error.message
      });
    }
  });
  
  /**
   * POST /api/ai/column-mapping/batch-suggest
   * 🚀 BATCH MODE: Get AI suggestions for ALL columns in ONE API call
   * Much more efficient than per-column mapping!
   */
  fastify.post('/ai/column-mapping/batch-suggest', { preHandler: requireAuth }, async (request, reply) => {
    const { columns, allFieldDefinitions, aiConfig } = request.body;
    
    // Validate required fields
    if (!columns || !Array.isArray(columns) || !allFieldDefinitions || !aiConfig) {
      throw new ValidationError('Missing required fields', {
        required: ['columns (array)', 'allFieldDefinitions', 'aiConfig']
      });
    }
    
    try {
      // Build AI service config from metadata
      // Note: Batch mode builds prompt dynamically, so userPromptTemplate is NOT required
      const suggestionConfig = {
        model: aiConfig.model || 'gpt-4o-mini',
        systemPrompt: aiConfig.systemPrompt
      };
      
      // Add model-specific parameters
      if (aiConfig.model && aiConfig.model.startsWith('gpt-5')) {
        // GPT-5 Responses API - AIService will convert maxCompletionTokens to max_output_tokens
        suggestionConfig.maxCompletionTokens = aiConfig.maxCompletionTokens || 2000; // Higher for batch
        suggestionConfig.reasoningEffort = aiConfig.reasoningEffort || 'low';
        suggestionConfig.textVerbosity = aiConfig.textVerbosity || 'low'; // Valid values: 'low', 'medium', 'high'
      } else {
        // GPT-4 and older models
        suggestionConfig.temperature = aiConfig.temperature || 0.3;
        suggestionConfig.maxTokens = aiConfig.maxTokens || 2000; // Higher for batch
        suggestionConfig.responseFormat = { type: 'json_object' };
      }
      
      if (!suggestionConfig.systemPrompt) {
        throw new Error('AI config missing systemPrompt');
      }
      
      logger.info('🚀 Batch AI suggestion request', {
        columnCount: columns.length,
        model: suggestionConfig.model,
        fieldCount: allFieldDefinitions.length
      });
      
      // Build batch context - all columns in one prompt
      const columnDescriptions = columns.map((col, idx) => {
        const sampleStr = col.sampleData.slice(0, 3).join(', ');
        return `${idx + 1}. "${col.excelColumn}" (samples: ${sampleStr})`;
      }).join('\n');
      
      // ✅ Group fields by hierarchy level for better AI comprehension
      const companyFields = allFieldDefinitions.filter(f => f.label.startsWith('Company:'));
      const siteFields = allFieldDefinitions.filter(f => f.label.startsWith('Site/Facility:'));
      const assetGroupFields = allFieldDefinitions.filter(f => f.label.startsWith('Asset Group/Unit:'));
      const assetFields = allFieldDefinitions.filter(f => f.label.startsWith('Asset:'));
      
      // ✅ CRITICAL: Show dbField (ID) with human-readable label for AI comprehension
      // Format: "dbField_id" → "Human Label"
      const fieldList = `
=== COMPANY FIELDS (use for Excel columns: Company, Company Name, etc.) ===
${companyFields.map(f => `"${f.dbField}" → ${f.label}${f.required ? ' [REQUIRED]' : ''}`).join('\n')}

=== SITE/FACILITY FIELDS (use for Excel columns: Facility, Site, Plant, etc.) ===
${siteFields.map(f => `"${f.dbField}" → ${f.label}${f.required ? ' [REQUIRED]' : ''}`).join('\n')}

=== ASSET GROUP/UNIT FIELDS (use for Excel columns: Unit, Unit ID, Asset Group, etc.) ===
${assetGroupFields.map(f => `"${f.dbField}" → ${f.label}${f.required ? ' [REQUIRED]' : ''}`).join('\n')}

=== ASSET/EQUIPMENT FIELDS (use for Excel columns: Equipment, Asset, Equipment ID, Equipment Type, Equipment Description, etc.) ===
${assetFields.map(f => `"${f.dbField}" → ${f.label}${f.required ? ' [REQUIRED]' : ''}`).join('\n')}
`.trim();
      
      // Create batch-optimized prompt - FEW-SHOT EXAMPLE for GPT-5
      // Show a concrete example to follow
      
      // ✅ GENERIC: Build prompt using metadata-provided instructions
      // The systemPrompt from metadata provides domain-specific context
      // We just add the data (columns and fields) dynamically
      
      const batchUserPrompt = `You MUST return ONLY valid JSON. No other text.

Excel columns to map (${columns.length} total):
${columnDescriptions}

Available database fields (${allFieldDefinitions.length} total):
${fieldList}

INSTRUCTIONS:
1. Map each Excel column to ONE database field_id from the list above
2. Use the "field_id" (in quotes), NOT the human label
3. Return confidence 0.0-1.0
4. If no good match, use confidence < 0.5

EXAMPLE:
Excel: "name" → Use field_id: "site_name" (NOT "Site Name")

OUTPUT FORMAT (valid JSON only):
{
  "mappings": [
    {"excelColumn": "company_id", "dbField": "company_id", "confidence": 0.9, "explanation": "direct match"},
    {"excelColumn": "name", "dbField": "site_name", "confidence": 0.85, "explanation": "facility name"}
  ]
}

Now map all ${columns.length} columns. Return ONLY the JSON object with "mappings" array:`;

      // Debug: Log field list and prompt details
      logger.debug('🔍 Field List Details', {
        totalFields: allFieldDefinitions.length,
        companyFieldsCount: companyFields.length,
        siteFieldsCount: siteFields.length,
        assetGroupFieldsCount: assetGroupFields.length,
        assetFieldsCount: assetFields.length,
        fieldListLength: fieldList.length,
        fieldListPreview: fieldList.substring(0, 500),
        fieldListEnd: fieldList.substring(Math.max(0, fieldList.length - 200))
      });
      
      // Debug: Log the exact prompt being sent to AI (AFTER it's built!)
      logger.debug('🔍 AI Prompt Details', {
        promptLength: batchUserPrompt.length,
        promptPreview: batchUserPrompt.substring(0, 500),
        promptEnd: batchUserPrompt.substring(batchUserPrompt.length - 200),
        columnNames: columns.map(c => c.excelColumn),
        firstThreeFields: allFieldDefinitions.slice(0, 3).map(f => `${f.dbField} → ${f.label}`)
      });
      
      // Debug: Log FULL prompt (comment out in production for performance)
      logger.debug('🔍 FULL AI Prompt', {
        fullPrompt: batchUserPrompt
      });

      // Call AI with batch prompt
      const { generateWithAI } = require('../core/AIService');
      let aiResponse = await generateWithAI(suggestionConfig, {
        userPrompt: batchUserPrompt
      });
      
      // Debug: Log FULL response from OpenAI
      logger.debug('🔍 FULL AI Response', {
        fullResponse: aiResponse,
        responseType: typeof aiResponse,
        responseLength: aiResponse?.length || 0,
        isNull: aiResponse === null,
        isUndefined: aiResponse === undefined,
        isEmpty: aiResponse === ''
      });
      
      logger.info('🚀 Batch AI response received', {
        responseLength: aiResponse?.length || 0,
        preview: aiResponse ? aiResponse.substring(0, 200) : '(empty)' // Show first 200 chars
      });
      
      // ✅ Check if AI returned conversational text instead of JSON
      if (!aiResponse.trim().startsWith('{') && !aiResponse.trim().startsWith('[')) {
        logger.error('AI returned conversational text instead of JSON', {
          response: aiResponse.substring(0, 500),
          responseLength: aiResponse.length
        });
        
        // Fallback: Try to extract JSON from the response if it contains it
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiResponse = jsonMatch[0];
          logger.info('Extracted JSON from conversational response');
        } else {
          throw new Error(`AI returned non-JSON response: ${aiResponse.substring(0, 200)}...`);
        }
      }
      
      // Parse batch response
      let batchResult;
      try {
        // ✅ Clean AI response: remove control characters that break JSON parsing
        // AI sometimes includes unescaped newlines, tabs, etc. in explanation strings
        const cleanedResponse = stripControlCharacters(aiResponse)
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        batchResult = JSON.parse(cleanedResponse);
      } catch (parseError) {
        logger.error('Failed to parse batch AI response', {
          responsePreview: aiResponse.substring(0, 500), // First 500 chars only
          responseLength: aiResponse.length,
          error: parseError.message,
          parseErrorPosition: parseError.message
        });
        throw new Error(`AI returned invalid JSON: ${parseError.message}`);
      }
      
      logger.info('🚀 Parsed AI response', {
        hasMapping: !!batchResult.mappings,
        topLevelKeys: Object.keys(batchResult),
        resultType: typeof batchResult
      });
      
      // Extract mappings array
      const mappings = batchResult.mappings || [];
      
      if (!Array.isArray(mappings)) {
        logger.error('AI response structure incorrect', {
          batchResult: JSON.stringify(batchResult).substring(0, 500),
          mappingsType: typeof batchResult.mappings
        });
        throw new Error('AI response missing mappings array');
      }
      
      if (mappings.length === 0) {
        logger.warn('AI returned empty mappings array', {
          fullResponse: aiResponse
        });
      }
      
      // Convert to result format
      const results = mappings.map(mapping => ({
        excelColumn: mapping.excelColumn,
        dbField: mapping.dbField || null,
        confidence: mapping.confidence || 0,
        reason: `AI: ${mapping.explanation || 'No explanation provided'}`
      }));
      
      logger.info('🚀 Batch mapping complete', {
        totalColumns: columns.length,
        mappedColumns: results.filter(r => r.dbField).length
      });
      
      return reply.send({
        success: true,
        results
      });
      
    } catch (error) {
      logger.error('Batch AI mapping failed', {
        columnCount: columns?.length,
        error: error.message,
        stack: error.stack
      });
      
      return reply.code(500).send({
        success: false,
        error: 'Batch AI mapping failed',
        message: error.message
      });
    }
  });
  
  /**
   * POST /api/ai/column-mapping/suggest
   * Get AI suggestion for column mapping when no local match found
   * ⚠️ DEPRECATED: Use /batch-suggest for better performance
   */
  fastify.post('/ai/column-mapping/suggest', { preHandler: requireAuth }, async (request, reply) => {
    const { excelColumn, sampleData, allFieldDefinitions, aiConfig } = request.body;
    
    // Validate required fields
    if (!excelColumn || !allFieldDefinitions || !aiConfig) {
      throw new ValidationError('Missing required fields', {
        required: ['excelColumn', 'allFieldDefinitions', 'aiConfig']
      });
    }
    
    try {
      // Build AI service config from metadata (no file loading!)
      const suggestionConfig = {
        model: aiConfig.model || 'gpt-4o-mini',
        systemPrompt: aiConfig.systemPrompt,
        userPromptTemplate: aiConfig.userPromptTemplate
      };
      
      // Add GPT-5 specific parameters if using GPT-5
      if (aiConfig.model && aiConfig.model.startsWith('gpt-5')) {
        suggestionConfig.maxCompletionTokens = aiConfig.maxCompletionTokens || 300;
        suggestionConfig.reasoningEffort = aiConfig.reasoningEffort || 'low';
        suggestionConfig.textVerbosity = aiConfig.textVerbosity || 'concise';
        // GPT-5 doesn't support responseFormat - JSON must be requested in prompt
      } else {
        // GPT-4 and older models
        suggestionConfig.temperature = aiConfig.temperature || 0.3;
        suggestionConfig.maxTokens = aiConfig.maxTokens || 300;
        suggestionConfig.responseFormat = aiConfig.responseFormat || { type: 'json_object' };
      }
      
      if (!suggestionConfig.systemPrompt || !suggestionConfig.userPromptTemplate) {
        throw new Error('AI config missing required prompts (systemPrompt, userPromptTemplate)');
      }
      
      // Build context for template interpolation
      const context = buildSuggestionContext(
        excelColumn,
        sampleData || [],
        allFieldDefinitions
      );
      
      // Debug logging
      logger.info('🤖 AI suggestion request', {
        excelColumn,
        model: suggestionConfig.model,
        hasSystemPrompt: !!suggestionConfig.systemPrompt,
        hasUserPromptTemplate: !!suggestionConfig.userPromptTemplate,
        contextKeys: Object.keys(context)
      });
      
      // Call AI for suggestion
      const result = await suggestMapping(suggestionConfig, context);
      
      return reply.send({
        success: true,
        result
      });
      
    } catch (error) {
      logger.error('AI column mapping suggestion failed', {
        excelColumn,
        error: error.message
      });
      
      return reply.code(500).send({
        success: false,
        error: 'AI suggestion failed',
        message: error.message
      });
    }
  });
  
  logger.info('AI Column Mapping routes registered');
}

module.exports = registerAIColumnMappingRoutes;
