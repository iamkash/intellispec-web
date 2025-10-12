/**
 * AI Service
 * 
 * Completely metadata-driven OpenAI wrapper with no hardcoded prompts or configurations.
 * All prompts, models, and parameters are defined in metadata JSON files.
 * 
 * Design Patterns:
 * - Strategy Pattern (different API strategies for GPT-4 vs GPT-5)
 * - Template Method Pattern (template interpolation)
 * - Factory Pattern (config building)
 * 
 * Features:
 * - Metadata-driven prompts
 * - GPT-5 Responses API support
 * - GPT-4 Chat Completions API support
 * - Template interpolation with conditionals
 * - Config merging and overrides
 */

const OpenAI = require('openai');
const { logger } = require('./Logger');

// Initialize OpenAI client
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generic AI text generation using metadata-driven configuration
 * @param {object} config - Complete AI configuration from metadata
 * @param {object} context - Dynamic context data to inject into prompts
 * @returns {Promise<string>} - The AI response
 */
async function generateWithAI(config, context = {}) {
  const {
    model = 'gpt-4',
    temperature = 0.7,
    maxTokens = 2000,
    maxCompletionTokens,
    systemPrompt = 'You are a helpful assistant.',
    userPromptTemplate = '',
    messages = [],
    responseFormat = null,
    reasoningEffort = 'medium',
    textVerbosity = 'medium'
  } = config;

  try {
    // Determine which API to use based on model
    const isGPT5 = model.startsWith('gpt-5');

    if (isGPT5) {
      // Use Responses API for GPT-5
      return await generateWithGPT5(config, context);
    } else {
      // Use Chat Completions API for older models
      return await generateWithChatCompletions(config, context);
    }
  } catch (error) {
    logger.error('OpenAI API Error', {
      error: error.message,
      model,
      context
    });
    throw new Error(`OpenAI API failed: ${error.message}`);
  }
}

async function generateWithGPT5(config, context) {
  const {
    model = 'gpt-5',
    systemPrompt = 'You are a helpful assistant.',
    userPromptTemplate = '',
    maxCompletionTokens = 2000,
    reasoningEffort = 'medium',
    textVerbosity = 'medium'
  } = config;

  // Build input content
  let inputContent = '';

  // Add system prompt if provided
  if (systemPrompt) {
    inputContent += interpolateTemplate(systemPrompt, context) + '\n\n';
  }

  // Add user prompt template if provided
  if (userPromptTemplate) {
    inputContent += interpolateTemplate(userPromptTemplate, context);
  }
  
  // ALSO check for direct userPrompt in context (for batch mapping)
  if (context.userPrompt) {
    inputContent += '\n\n' + context.userPrompt;
  }
  
  // Debug: Log what's being sent
  logger.debug('🔍 GPT-5 Final Input Content', {
    contentLength: inputContent.length,
    hasSystemPrompt: !!systemPrompt,
    hasUserPromptTemplate: !!userPromptTemplate,
    hasContextUserPrompt: !!context.userPrompt,
    firstChars: inputContent.substring(0, 200),
    lastChars: inputContent.substring(inputContent.length - 200)
  });

  const requestOptions = {
    model: model,
    input: inputContent.trim(),
    reasoning: { effort: reasoningEffort },
    text: { verbosity: textVerbosity }
  };

  // Add token limit if specified (GPT-5 Responses API uses max_output_tokens)
  if (maxCompletionTokens) {
    requestOptions.max_output_tokens = maxCompletionTokens;
  }

  logger.info('GPT-5 request', { model, reasoningEffort, textVerbosity });
  
  // Debug: Log the exact request being sent to OpenAI
  logger.debug('🔍 OpenAI Request (GPT-5)', {
    model,
    inputLength: inputContent.length,
    inputPreview: inputContent.substring(0, 300),
    inputEnd: inputContent.substring(inputContent.length - 200),
    reasoningEffort,
    textVerbosity,
    maxOutputTokens: requestOptions.max_output_tokens
  });

  const response = await openai.responses.create(requestOptions);
  
  // Debug: Log the FULL raw response from OpenAI
  logger.debug('🔍 OpenAI Raw Response (GPT-5)', {
    fullResponse: JSON.stringify(response, null, 2),
    responseKeys: Object.keys(response || {}),
    hasOutputText: !!response.output_text,
    hasChoices: !!response.choices,
    outputTextLength: response.output_text?.length || 0,
    outputTextPreview: response.output_text?.substring(0, 200) || '(none)',
    status: response.status,
    statusText: response.status_text,
    hasError: !!response.error
  });

  const finalOutput = response.output_text || response.choices?.[0]?.message?.content || '';
  
  logger.debug('🔍 Extracted Output', {
    outputLength: finalOutput.length,
    outputPreview: finalOutput.substring(0, 300),
    isEmpty: finalOutput === ''
  });

  return finalOutput;
}

async function generateWithChatCompletions(config, context) {
  const {
    model = 'gpt-4',
    temperature = 0.7,
    maxTokens = 2000,
    maxCompletionTokens,
    systemPrompt = 'You are a helpful assistant.',
    userPromptTemplate = '',
    messages = [],
    responseFormat = null
  } = config;

  // Build messages array from configuration
  let finalMessages = [];

  // Add system message if provided
  if (systemPrompt) {
    finalMessages.push({
      role: 'system',
      content: interpolateTemplate(systemPrompt, context)
    });
  }

  // Add custom messages if provided
  if (messages && messages.length > 0) {
    finalMessages = finalMessages.concat(
      messages.map(msg => ({
        ...msg,
        content: interpolateTemplate(msg.content, context)
      }))
    );
  }

  // Add user prompt template if provided
  if (userPromptTemplate) {
    finalMessages.push({
      role: 'user',
      content: interpolateTemplate(userPromptTemplate, context)
    });
  }

  // Build request options
  const requestOptions = {
    model: model,
    messages: finalMessages
  };

  // Add temperature if supported (GPT-5 may not support custom temperature)
  if (!model.startsWith('gpt-5')) {
    requestOptions.temperature = temperature;
  }

  // Handle token limit naming differences (gpt-5 uses max_output_tokens)
  const tokenLimit = maxCompletionTokens || maxTokens;
  if (model.startsWith('gpt-5')) {
    if (tokenLimit) requestOptions.max_output_tokens = tokenLimit;
  } else {
    if (tokenLimit) requestOptions.max_tokens = tokenLimit;
  }

  // Add response format if specified and supported
  if (responseFormat) {
    // Only add response_format for models that support it
    const supportsJsonMode = (
      model.includes('gpt-4-turbo') ||
      model.includes('gpt-4o') ||        // ✅ GPT-4o and GPT-4o-mini support JSON mode
      model.includes('gpt-3.5-turbo-1106') ||
      model.includes('gpt-4-1106')
    ) && !model.startsWith('gpt-5'); // GPT-5 models don't support response_format

    if (supportsJsonMode && responseFormat.type === 'json_object') {
      requestOptions.response_format = responseFormat;
    }
    // For GPT-5 and other models, we'll rely on prompt instructions for JSON formatting
  }

  logger.info('Chat Completions request', { model, temperature, messageCount: finalMessages.length });

  const response = await openai.chat.completions.create(requestOptions);

  return response.choices[0].message.content;
}

/**
 * Interpolate template strings with context variables and conditional blocks
 * @param {string} template - Template string with {{variable}} and {{#condition}} placeholders
 * @param {object} context - Context object with variable values
 * @returns {string} - Interpolated string
 */
function interpolateTemplate(template, context) {
  if (!template || typeof template !== 'string') {
    return template;
  }
  
  let result = template;
  
  // Handle conditional blocks: {{#variable}}content{{/variable}}
  result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
    const value = context[key];
    // Include content if value exists and is truthy (not empty string, null, undefined, false)
    return (value && value !== '') ? content : '';
  });
  
  // Handle regular variable substitution: {{variable}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return context[key] !== undefined ? context[key] : match;
  });
  
  return result;
}

/**
 * Generate intelligent fallback options based on patterns
 * @param {object} config - Fallback configuration from metadata
 * @param {object} context - Context data for generation
 * @returns {string} - JSON string with generated options
 */
function generateIntelligentFallback(config, context) {
  const {
    patterns = {},
    defaultPattern = 'generic'
  } = config;

  const { listType, count = 5 } = context;
  
  // Determine pattern based on list type
  let pattern = defaultPattern;
  const listTypeName = (listType.name || '').toLowerCase();
  const category = (listType.category || '').toLowerCase();
  
  // Find matching pattern
  for (const [patternName, patternConfig] of Object.entries(patterns)) {
    const keywords = patternConfig.keywords || [];
    if (keywords.some(keyword => 
      listTypeName.includes(keyword.toLowerCase()) || 
      category.includes(keyword.toLowerCase())
    )) {
      pattern = patternName;
      break;
    }
  }
  
  // Get pattern configuration
  const patternConfig = patterns[pattern] || patterns[defaultPattern];
  if (!patternConfig) {
    logger.error('No fallback pattern found', { pattern, listType });
    throw new Error(`No fallback pattern found for: ${pattern}`);
  }
  
  // Generate options based on pattern
  const options = patternConfig.options.slice(0, count).map((opt, index) => ({
    label: interpolateTemplate(opt.label, { ...context, index: index + 1 }),
    value: interpolateTemplate(opt.value, { ...context, index: index + 1 }),
    description: interpolateTemplate(opt.description || '', { ...context, index: index + 1 })
  }));
  
  return JSON.stringify({ options });
}

/**
 * Load AI configuration from metadata file
 * @param {string} configPath - Path to the AI configuration file
 * @returns {object} - AI configuration object
 */
function loadAIConfig(configPath) {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const fullPath = path.resolve(configPath);
    const configData = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    logger.error('Failed to load AI config', { configPath, error: error.message });
    throw new Error(`Failed to load AI configuration from ${configPath}`);
  }
}

/**
 * Merge base AI configuration with gadget-specific overrides
 * @param {object} baseConfig - Base AI configuration from file
 * @param {object} gadgetConfig - Gadget-specific AI configuration overrides
 * @returns {object} - Merged AI configuration
 */
function mergeAIConfig(baseConfig, gadgetConfig = {}) {
  // Deep merge function
  function deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
  
  // Start with base config
  let mergedConfig = { ...baseConfig };
  
  // If gadget has a useCase specified, use that as base
  if (gadgetConfig.useCase && baseConfig.useCases && baseConfig.useCases[gadgetConfig.useCase]) {
    const useCaseConfig = baseConfig.useCases[gadgetConfig.useCase];
    
    // Merge use case config with base AI generation config
    if (baseConfig.aiGeneration) {
      mergedConfig.aiGeneration = deepMerge(baseConfig.aiGeneration, useCaseConfig);
    }
    
    // Apply model presets if specified
    if (useCaseConfig.preset && baseConfig.presets && baseConfig.presets[useCaseConfig.preset]) {
      const presetConfig = baseConfig.presets[useCaseConfig.preset];
      mergedConfig.aiGeneration = deepMerge(mergedConfig.aiGeneration || {}, presetConfig);
    }
  }
  
  // Apply gadget-specific overrides (highest priority)
  if (gadgetConfig) {
    mergedConfig.aiGeneration = deepMerge(mergedConfig.aiGeneration || {}, gadgetConfig);
  }
  
  return mergedConfig;
}

/**
 * Get AI configuration for a specific gadget with base config + overrides
 * @param {string} baseConfigPath - Path to base AI configuration file
 * @param {object} gadgetConfig - Gadget-specific AI configuration
 * @returns {object} - Final merged AI configuration
 */
function getAIConfigForGadget(baseConfigPath, gadgetConfig = {}) {
  try {
    // Load base configuration
    const baseConfig = loadAIConfig(baseConfigPath);
    
    // Merge with gadget overrides
    const finalConfig = mergeAIConfig(baseConfig, gadgetConfig);
    
    return finalConfig;
  } catch (error) {
    logger.error('Failed to get AI config for gadget', { 
      baseConfigPath, 
      error: error.message 
    });
    
    // Fallback to gadget config only if base config fails
    if (gadgetConfig && Object.keys(gadgetConfig).length > 0) {
      logger.warn('Using gadget config only as fallback');
      return { aiGeneration: gadgetConfig };
    }
    
    throw error;
  }
}

/**
 * Legacy wrapper for backward compatibility
 * @deprecated Use generateWithAI instead
 */
async function analyzeText(prompt, options = {}) {
  logger.warn('analyzeText is deprecated', { message: 'Use generateWithAI instead' });
  
  const config = {
    model: options.model || 'gpt-4',
    temperature: options.temperature || 0.7,
    maxTokens: options.maxTokens || 2000,
    systemPrompt: 'You are a helpful assistant that generates structured data for business applications. Always return valid JSON when requested.',
    userPromptTemplate: '{{prompt}}',
    responseFormat: { type: 'json_object' }
  };
  
  const context = { prompt };
  
  return generateWithAI(config, context);
}

/**
 * Legacy wrapper for backward compatibility
 * @deprecated Use generateIntelligentFallback with metadata config
 */
function buildDynamicPrompt(listType, userPrompt = '', count = 10) {
  logger.warn('buildDynamicPrompt is deprecated', { 
    message: 'Use metadata-driven prompts instead' 
  });
  
  return `Generate ${count} options for "${listType.displayName}" with context: ${JSON.stringify(listType)}. ${userPrompt}`;
}

module.exports = {
  generateWithAI,
  interpolateTemplate,
  generateIntelligentFallback,
  loadAIConfig,
  mergeAIConfig,
  getAIConfigForGadget,
  // Legacy exports for backward compatibility
  analyzeText,
  buildDynamicPrompt
};

