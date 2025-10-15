const mongoose = require('mongoose');
const OpenAI = require('openai');
const { logger } = require('../core/Logger');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Use existing mongoose connection instead of creating new MongoClient
const getDb = () => {
  if (!mongoose.connection.db) {
    throw new Error('MongoDB not connected. Ensure mongoose.connect() is called first.');
  }
  return mongoose.connection.db;
};

/**
 * RAG Chat Endpoint - Configurable and Extensible
 * Supports configurable document types, field mappings, and tools
 * Metadata-driven with reduced hardcoded business logic
 */

const { requireAuth } = require('../core/AuthMiddleware');

// In-memory cache for embeddings (performance optimization)
const embeddingCache = new Map();
const CACHE_MAX_SIZE = 1000;

// Generic entity extraction from queries using workspace configuration
function extractEntityName(query, entityMappings, entityType) {
  const lowerQuery = query.toLowerCase();
  const entityConfig = entityMappings?.[entityType];

  if (!entityConfig) {
return null;
  }

  // Use configurable extraction patterns if available, otherwise use generic patterns
  const patterns = entityConfig.extractionPatterns || [
    /use\s+(.+?)(?:\?|$|\s+in|\s+for|\s+by|\s+with)/i,
    /uses\s+(.+?)(?:\?|$|\s+in|\s+for|\s+by|\s+with)/i,
    /contain\s+(.+?)(?:\?|$|\s+in|\s+for|\s+by|\s+with)/i,
    /have\s+(.+?)(?:\?|$|\s+in|\s+for|\s+by|\s+with)/i,
    /with\s+(.+?)(?:\?|$|\s+in|\s+for|\s+by|\s+with)/i,
    /for\s+(.+?)(?:\?|$|\s+in|\s+total|\s+sum|\s+amount)/i,
    /of\s+(.+?)(?:\?|$|\s+in|\s+total|\s+sum|\s+amount)/i
  ];

  for (const pattern of patterns) {
    let regex = pattern;

    if (!(pattern instanceof RegExp)) {
      if (typeof pattern === 'string') {
        try {
          regex = new RegExp(pattern, 'i');
        } catch (error) {
          logger?.warn?.('Invalid regex pattern string in entityMappings', { pattern, error: error.message });
          continue;
        }
      } else if (pattern && typeof pattern === 'object' && pattern.pattern) {
        try {
          regex = new RegExp(pattern.pattern, pattern.flags || 'i');
        } catch (error) {
          logger?.warn?.('Invalid regex pattern object in entityMappings', { pattern, error: error.message });
          continue;
        }
      } else {
        continue;
      }
    }

    const match = lowerQuery.match(regex);
    if (match && match[1]) {
      let entityName = match[1].trim();

      // Remove common prefixes/suffixes
      entityName = entityName
        .replace(/^(the|a|an)\s+/i, '')
        .replace(/\s+(paint|spec|specification|product)$/i, '')
        .trim();

      if (entityName.length > 2) {
        return entityName;
      }
    }
  }

  // Fallback: try to extract from the last part of the query
  const words = query.split(/\s+/);
  if (words.length > 3) {
    const potentialName = words.slice(-3).join(' ');
    if (potentialName.length > 3) {
      return potentialName;
    }
  }

  return null;
}

// Execute configured queries from workspace configuration
async function executeConfiguredQuery(ragConfig, queryType, query, tenantId, db) {
  const queryConfig = ragConfig.aggregateQueries?.[queryType];
  const entityMappings = ragConfig.entityMappings;

  if (!queryConfig) {
return null;
  }
// Extract entity name using configuration
  const entityType = queryConfig.baseFilter?.type || 'paint_specifications';
  const entityName = extractEntityName(query, entityMappings, entityType);

  if (!entityName) {
return {
      [queryConfig.operation === 'count' ? 'count' : 'value']: 0,
      [queryConfig.operation === 'count' ? 'relationship' : 'aggregate']: true,
      error: `Please specify which ${entityType} you want the ${queryType} for`
    };
  }
// Find the entity using configured search fields
  const entityConfig = entityMappings?.[entityType];
  if (!entityConfig) {
return null;
  }

  const searchConditions = entityConfig.searchFields.map(field => ({
    [field]: { $regex: entityName, $options: 'i' }
  }));

  const entity = await getDb().collection(queryConfig.collection).findOne({
    type: entityType,
    tenantId: tenantId,
    $or: searchConditions
  });

  if (!entity) {
return {
      [queryConfig.operation === 'count' ? 'count' : 'value']: 0,
      [queryConfig.operation === 'count' ? 'relationship' : 'aggregate']: true,
      error: `${entityType} not found`
    };
  }
// Execute the configured operation
  let result;
  if (queryConfig.operation === 'count') {
    // Count operation
    const filter = {
      ...queryConfig.baseFilter,
      tenantId: tenantId,
      [queryConfig.joinField]: entity[entityConfig.idField]
    };
    result = await getDb().collection(queryConfig.collection).countDocuments(filter);
  } else {
    // Aggregate operation (sum)
    const pipeline = [
      {
        $match: {
          ...queryConfig.baseFilter,
          tenantId: tenantId,
          [queryConfig.joinField]: entity[entityConfig.idField]
        }
      }
    ];

    // Add unwind if needed
    if (queryConfig.sumField && queryConfig.sumField.includes('.')) {
      pipeline.push({ $unwind: `$${queryConfig.sumField.split('.')[0]}` });
      pipeline.push({
        $match: {
          [queryConfig.joinField]: entity[entityConfig.idField]
        }
      });
    }

    // Add group stage
    pipeline.push({
      $group: {
        _id: null,
        totalValue: { $sum: `$${queryConfig.sumField}` }
      }
    });

    const aggregateResult = await getDb().collection(queryConfig.collection).aggregate(pipeline).toArray();
    result = aggregateResult.length > 0 ? aggregateResult[0].totalValue : 0;
  }
// Format response using template
  const response = {
    [queryConfig.operation === 'count' ? 'count' : 'value']: result,
    [queryConfig.operation === 'count' ? 'relationship' : 'aggregate']: true,
    [entityType.replace('_specifications', 'Spec')]: entity[entityConfig.displayField],
    [`${entityType.replace('_specifications', 'Spec')}Id`]: entity[entityConfig.idField],
    query: query
  };

  return response;
}

// Security filter to remove system IDs from AI responses
function sanitizeResponse(response) {
  if (!response || typeof response !== 'string') return response;

  // Remove only MongoDB ObjectIds (24-character hex strings)
  let sanitized = response.replace(/\b[a-f0-9]{24}\b/gi, '[ID]');

  // Remove doc_ patterns that are clearly system identifiers
  sanitized = sanitized.replace(/\bdoc_[a-z0-9_-]{8,}\b/gi, '[DOC]');

  // Clean up any multiple replacement markers
  sanitized = sanitized.replace(/(\[ID\]|\[DOC\])[\s\n\r]*/g, '$1 ');
  sanitized = sanitized.replace(/((\[ID\]|\[DOC\])\s*)+/g, '$1');

  return sanitized.trim();
}

// Input sanitization for user messages
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  // Remove potentially dangerous patterns
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  return sanitized.trim();
}

// Fastify registration function
async function registerRAGChatRoutes(fastify) {
  
  fastify.post('/rag/chat', {
    preHandler: requireAuth
  }, async (request, reply) => {
    try {
      const { message, workspaceId, gadgetId, context = {}, rag, gadgetConfig, previousResponseId } = request.body;
      const { tenantId, userId } = request.user;
      const sessionId = `${userId}_${Date.now()}`;
      const db = getDb();
      const resolvedContext = previousResponseId
        ? { ...context, previousResponseId }
        : { ...context };

      // Sanitize the message for security
      const sanitizedMessage = sanitizeInput(message);
      logger.debug('RAG chat request', {
        workspaceId,
        gadgetId,
        hasContext: Object.keys(resolvedContext).length > 0,
        hasRag: !!rag,
        hasGadgetConfig: !!gadgetConfig
      });

      // Support both new format (workspaceId/gadgetId) and legacy format (gadgetConfig)
      let workspaceConfig;
      
      if (workspaceId && gadgetId) {
        // New format: load from file system
        workspaceConfig = await loadWorkspaceConfig(workspaceId, gadgetId);
        if (!workspaceConfig) {
          return reply.code(404).send({ error: `Workspace configuration not found: ${workspaceId}/${gadgetId}` });
        }
      } else if (gadgetConfig) {
        // Legacy format: use provided configuration
        workspaceConfig = gadgetConfig;
      } else {
        return reply.code(400).send({ error: 'Either workspaceId/gadgetId or gadgetConfig is required' });
      }

      // 2. All queries use vector search for consistency
      const searchResults = await performVectorSearch({
        message: sanitizedMessage,
        ragConfig: workspaceConfig.rag,
        context: resolvedContext,
        tenantId,
        db
      });

      // 3. Generate AI response
      const aiResponse = await generateAIResponse({
        message: sanitizedMessage,
        searchResults,
        aiConfig: workspaceConfig.ai,
        ragConfig: workspaceConfig.rag,
        context: resolvedContext,
        tenantId,
        isCountingQuery: sanitizedMessage.toLowerCase().includes('how many') || sanitizedMessage.toLowerCase().includes('count')
      });

      // 4. Log interaction for analytics
      const responseToLog = typeof aiResponse === 'string' ? aiResponse : aiResponse.content;
      await logChatInteraction({
        sessionId,
        userId,
        tenantId,
        message,
        response: responseToLog,
        workspaceId,
        gadgetId,
        db
      });

      // Handle different response formats
      let responseText, model, usage, responseId;

      if (typeof aiResponse === 'string') {
        // Relationship counting query - aiResponse is a direct string
        responseText = aiResponse;
        model = 'relationship-counter';
        usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
        responseId = null;
} else {
        // Normal AI response - aiResponse is an object
        responseText = aiResponse.content;
        model = aiResponse.model;
        usage = aiResponse.usage;
        responseId = aiResponse.responseId;
}

      return reply.send({
        success: true,
        response: sanitizeResponse(responseText),
        searchResults: Array.isArray(searchResults) ? searchResults.length :
                      (searchResults?.count || searchResults?.value || 0),
        contextUsed: true,
        sessionId,
        userId,
        model,
        usage,
        responseId
      });

    } catch (error) {
      logger.error('RAG chat error', {
        error: error.message,
        stack: error.stack
      });
      return reply.code(500).send({
        success: false,
        error: 'Failed to process RAG chat request',
        message: error.message
      });
    }
  });
}

/**
 * Load workspace configuration from file system
 */
async function loadWorkspaceConfig(workspaceId, gadgetId) {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Handle both simple filenames and full paths
    const workspacePath = path.join(process.cwd(), 'public', 'data', 'workspaces', `${workspaceId}.json`);
const workspaceData = JSON.parse(await fs.readFile(workspacePath, 'utf8'));
    
    // Find the specific gadget configuration
    const gadget = workspaceData.gadgets?.find(g => g.id === gadgetId);
    if (!gadget) {
      throw new Error(`Gadget ${gadgetId} not found in workspace ${workspaceId}`);
    }
    
    return gadget.config;
  } catch (error) {
      logger.error('Error loading workspace config', {
        error: error.message,
        workspaceId,
        gadgetId
      });
    return null;
  }
}

// All queries now use vector search for consistency - no direct query path

/**
 * Perform vector search for complex queries
 */
async function performVectorSearch({ message, ragConfig, context, tenantId, db }) {
  const startTime = Date.now();

  try {
    // Sanitize the message for safe processing
    const sanitizedMessage = sanitizeInput(message);

    // For counting queries, we want comprehensive results
    const query = sanitizedMessage.toLowerCase().trim();
    const isCountingQuery = query.includes('how many') || query.includes('count');

    // Check for relationship queries (e.g., "how many invoices use X")
    const isRelationshipCountingQuery = isCountingQuery && (
      query.includes('use ') || query.includes('uses ') ||
      query.includes('contain') || query.includes('have ') ||
      query.includes('with ')
    );

    // Check for aggregate queries (e.g., "total gallons", "sum quantity")
    const isAggregateQuery = query.includes('total ') || query.includes('sum ') ||
                             query.includes('amount') || query.includes('quantity') ||
                             query.includes('gallons') || query.includes('volume');
// Generate embedding for ALL queries - pure vector search approach
    const embedding = await generateEmbedding(sanitizedMessage, ragConfig.embeddingModel);
// Build filter using configurable field mappings
    const filterStage = buildGenericFilter(ragConfig, context, tenantId, sanitizedMessage);
// Build comprehensive vector search pipeline using separate vectors collection
    let pipeline;

    if (isCountingQuery) {
      // For counting queries, get ALL documents that match the filter (including those without embeddings)
pipeline = [
        {
          $match: filterStage // First apply our filter
        },
        {
          $limit: Math.max(parseInt(ragConfig.maxResults || 1000), 2000) // Ensure we get ALL results
        }
      ];
    } else {
      // Vector search using separate vectors collection
      const { DocumentVectorModel } = require('../models/DocumentVectors');
      
      // First, find relevant vectors
      const vectorResults = await DocumentVectorModel.aggregate([
        {
          $vectorSearch: {
            index: 'vector_search_index', // New index on document_vectors collection
            path: "embedding",
            queryVector: embedding,
            numCandidates: Math.min(Math.max(parseInt(ragConfig.maxResults || 1000) * 10, 10000), 50000),
            limit: parseInt(ragConfig.maxResults || 1000),
            filter: { tenantId: tenantId }
          }
        },
        {
          $project: {
            documentId: 1,
            documentType: 1,
            score: { $meta: "vectorSearchScore" }
          }
        }
      ]);
      
      // Then join with main documents
      const documentIds = vectorResults.map(v => v.documentId);
      
      pipeline = [
        {
          $match: {
            $and: [
              { id: { $in: documentIds } },
              filterStage
            ]
          }
        },
        {
          $addFields: {
            score: { $meta: "vectorSearchScore" }
          }
        }
      ];
    }
    
    // Execute search
    const searchResults = await getDb().collection(ragConfig.collection || 'documents')
      .aggregate(pipeline)
      .toArray();
    logger.debug('RAG search results', {
      resultCount: searchResults.length
    });

    // Log results for debugging
    if (isCountingQuery) {
const docTypes = searchResults.map(doc => doc.type).filter(Boolean);
      const typeCounts = {};
      docTypes.forEach(type => {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
// For counting queries, also show total count by type
      const allDocTypes = {};
      searchResults.forEach(doc => {
        const type = doc.type;
        allDocTypes[type] = (allDocTypes[type] || 0) + 1;
      });
} else {
      // Regular vector search results
      const docTypes = searchResults.map(doc => doc.type || doc.document?.type).filter(Boolean);
      const typeCounts = {};
      docTypes.forEach(type => {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      logger.debug('First document structure', {
        document: searchResults[0]
      });
    }

    // Handle relationship counting queries using workspace configuration
    if (isRelationshipCountingQuery) {
// Use generic relationship counting from configuration
      const result = await executeConfiguredQuery(ragConfig, 'totalInvoices', query, tenantId, db);
      if (result) {
        return result;
      }
    }

    // Handle aggregate queries using hybrid approach
    if (isAggregateQuery) {
// Check if we should use LLM analysis or pre-calculated results
      const useLLMAnalysis = ragConfig.ai?.analysisMode === 'llm' ||
                            (query.includes('analyze') || query.includes('compare') || query.includes('trend'));

      if (useLLMAnalysis) {
// Let LLM analyze the data by providing more context
        // Don't pre-calculate, let LLM work with the data
      } else {
        // Use pre-calculated results for precision
        let queryType = 'totalGallons';
        if (query.includes('gallons') || query.includes('quantity') || query.includes('volume')) {
          queryType = 'totalGallons';
        } else if (query.includes('count') || query.includes('number')) {
          queryType = 'totalInvoices';
        }

        const result = await executeConfiguredQuery(ragConfig, queryType, query, tenantId, db);
        if (result) {
          return result;
        }
      }
    }

    const durationMs = Date.now() - startTime;
    logger.debug('Vector search completed', {
      tenantId,
      durationMs,
      resultCount: Array.isArray(searchResults) ? searchResults.length : 0,
      isCountingQuery,
      isRelationshipCountingQuery,
      isAggregateQuery
    });

    return searchResults;
    
  } catch (error) {
    logger.error('Vector search error', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Build configurable filter from workspace configuration
 */
function buildGenericFilter(ragConfig, context, tenantId, message) {
const filters = {};
  // Only add tenantId if it's a valid string
  if (tenantId && typeof tenantId === 'string' && tenantId.length > 0) {
    filters.tenantId = tenantId;
  } else {
}
  // Note: MongoDB vector search filters may not support $ne operator
  // deleted: { $ne: true }

  // Generic document type filtering - only use explicitly configured types
  let targetDocTypes = [];

  if (context.filters?.document_type) {
    // Use document type from filters if specified
    const docTypes = Array.isArray(context.filters.document_type)
      ? context.filters.document_type
      : [context.filters.document_type];
    targetDocTypes = docTypes;
  } else {
    // Generic document type filtering using workspace configuration
    const query = (message || '').toLowerCase().trim();

    // Use query intelligence from workspace configuration if available
    if (ragConfig.queryIntelligence) {
      const intelligence = ragConfig.queryIntelligence;
// Check for relationship queries (configurable keywords)
      const isRelationshipQuery = intelligence.relationshipKeywords?.some(keyword =>
        query.includes(keyword.toLowerCase())
      ) || false;

      // Check for specific document type queries
      const specificTypeMatch = intelligence.documentTypeMappings?.find(mapping =>
        mapping.keywords.some(keyword => query.includes(keyword.toLowerCase()))
      );

      if (specificTypeMatch) {
        targetDocTypes = specificTypeMatch.documentTypes;
} else if (isRelationshipQuery && intelligence.relationshipDocumentTypes) {
        targetDocTypes = intelligence.relationshipDocumentTypes;
} else {
        // Default to all configured types
        targetDocTypes = ragConfig.documentTypes || [];
}
    } else {
      // Fallback to all configured types if no intelligence configured
      targetDocTypes = ragConfig.documentTypes || [];
}
  }

  if (targetDocTypes.length > 0) {
// Ensure all doc types are strings
    const validDocTypes = targetDocTypes.filter(type => typeof type === 'string' && type.length > 0);
    if (validDocTypes.length > 0) {
      // MongoDB vector search filters may not support $in operator
      // Try using simple equality for single type, or skip complex operators
      if (validDocTypes.length === 1) {
        filters.type = validDocTypes[0];
} else {
// For now, don't add the type filter to avoid MongoDB errors
        // filters.type = { $in: validDocTypes };
      }
    } else {
}
  } else {
}

  // Apply workspace filters based on configurable field mappings
  if (context.filters && ragConfig.configurableFieldMappings) {
    Object.entries(context.filters).forEach(([filterKey, filterValue]) => {
      const mappedField = ragConfig.configurableFieldMappings[filterKey];
      if (mappedField && filterValue) {
        if (Array.isArray(filterValue) && filterValue.length > 0) {
// filters[mappedField] = { $in: filterValue }; // Skip for now
        } else if (!Array.isArray(filterValue) && filterValue) {
          filters[mappedField] = filterValue;
}
      }
    });
  }
// Validate filter object before returning
  const validatedFilters = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      validatedFilters[key] = value;
    }
  });
return validatedFilters;
}

/**
 * Generate embedding with caching for performance
 */
async function generateEmbedding(text, model = 'text-embedding-3-small') {
  const cacheKey = `${model}:${text}`;
  
  // Check cache first
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey);
  }
  
  // Generate new embedding
  const response = await openai.embeddings.create({
    model,
    input: text
  });
  
  const embedding = response.data[0].embedding;
  
  // Cache with size limit
  if (embeddingCache.size >= CACHE_MAX_SIZE) {
    const firstKey = embeddingCache.keys().next().value;
    embeddingCache.delete(firstKey);
  }
  embeddingCache.set(cacheKey, embedding);
  
  return embedding;
}

/**
 * Generate AI response using configured model
 */
async function generateAIResponse({ message, searchResults, aiConfig, ragConfig, context, tenantId, isCountingQuery = false }) {
  try {
    // Handle special configured query results
    if (searchResults && typeof searchResults === 'object' && (searchResults.relationship || searchResults.aggregate)) {
if (searchResults.error) {
        return searchResults.error;
      }

      // Find the appropriate response template from configuration
      let responseTemplate = null;
      if (ragConfig.aggregateQueries) {
        for (const queryConfig of Object.values(ragConfig.aggregateQueries)) {
          if (queryConfig.responseTemplate) {
            // Check if this result matches the query type
            if ((searchResults.relationship && queryConfig.operation === 'count') ||
                (searchResults.aggregate && queryConfig.operation !== 'count')) {
              responseTemplate = queryConfig.responseTemplate;
              break;
            }
          }
        }
      }

      // Use template if available, otherwise fallback to generic response
      if (responseTemplate) {
        let response = responseTemplate;
        // Replace placeholders
        Object.entries(searchResults).forEach(([key, value]) => {
          response = response.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        });
        return response;
      } else {
        // Fallback generic responses
        if (searchResults.relationship) {
          const count = searchResults.count;
          const entityName = Object.keys(searchResults).find(key =>
            key.includes('Spec') && !key.includes('Id')
          );
          const entityValue = entityName ? searchResults[entityName] : 'entity';

          if (count === 0) {
            return `No items found using "${entityValue}".`;
          } else if (count === 1) {
            return `1 item uses "${entityValue}".`;
          } else {
            return `${count} items use "${entityValue}".`;
          }
        } else if (searchResults.aggregate) {
          const value = searchResults.value;
          const entityName = Object.keys(searchResults).find(key =>
            key.includes('Spec') && !key.includes('Id')
          );
          const entityValue = entityName ? searchResults[entityName] : 'entity';

          if (value === 0) {
            return `No value found for "${entityValue}".`;
          } else {
            return `Total: ${value} for "${entityValue}".`;
          }
        }
      }
    }

    // Build context from search results
    const contextText = buildContextFromResults(searchResults, ragConfig, isCountingQuery, message);
    
    // Build system prompt
    const systemPrompt = `${aiConfig.systemPrompt}\n\n${aiConfig.contextPrompt
      .replace('{filters}', JSON.stringify(context.filters || {}))
      .replace('{context}', contextText || 'No relevant context found.')
      .replace('{tenantId}', tenantId)}`;
    
    // Generate response based on model type
    if (aiConfig.model === 'gpt-5-nano') {
      return await generateGPT5NanoResponse({
        message,
        systemPrompt,
        maxTokens: aiConfig.maxTokens || 2000,
        previousResponseId: context?.previousResponseId
      });
    } else {
      return await generateStandardResponse({
        message,
        systemPrompt,
        model: aiConfig.model || 'gpt-4o-mini',
        temperature: aiConfig.temperature || 0.1,
        maxTokens: aiConfig.maxTokens || 1000
      });
    }
    
  } catch (error) {
    logger.error('AI response generation error', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Generate response using GPT-5-nano with Responses API
 */
async function generateGPT5NanoResponse({ message, systemPrompt, maxTokens, previousResponseId }) {
  logger.debug('GPT-5 Nano request', {
    previousResponseId: previousResponseId || 'None',
    maxTokens
  });

  const combinedInput = `${systemPrompt}\n\nUser: ${message}`;

  const responseOptions = {
    model: 'gpt-5-nano',
    input: combinedInput,
    reasoning: { effort: "minimal" },
    text: { verbosity: "low" },
    max_output_tokens: maxTokens
  };

  // Add previous response ID for context if available
  if (previousResponseId) {
    responseOptions.previous_response_id = previousResponseId;
}

  const response = await openai.responses.create(responseOptions);
  
  return {
    content: response.output_text,
    responseId: response.id,
    usage: response.usage,
    model: 'gpt-5-nano'
  };
}

/**
 * Generate response using standard Chat Completions API
 */
async function generateStandardResponse({ message, systemPrompt, model, temperature, maxTokens }) {
const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ],
    temperature,
    max_tokens: maxTokens
  });
  
  return {
    content: response.choices[0].message.content,
    responseId: response.id,
    usage: response.usage,
    model
  };
}

/**
 * Build context from search results (completely generic)
 */
function buildContextFromResults(searchResults, ragConfig, isCountingQuery = false, message = '') {
  if (!searchResults || searchResults.length === 0) {
    return 'No documents found matching your query.';
  }

  if (typeof searchResults === 'string') {
    return searchResults; // Already formatted context from direct query
  }

  // Extract semantic fields from ragConfig
  const semanticFields = ragConfig?.semanticFields;
  
    // Count documents by type for explicit counting context
  const typeCounts = {};
  searchResults.forEach(doc => {
    let docType;
    if (isCountingQuery) {
      docType = doc.type;
    } else {
      docType = doc.type || doc.document?.type;
    }
    if (docType) {
      typeCounts[docType] = (typeCounts[docType] || 0) + 1;
    }
  });

  // Build concise count summary for counting queries
  let contextHeader = '';
  if (isCountingQuery) {
    contextHeader = `TOTAL_DOCUMENTS: ${searchResults.length}\n`;
    if (Object.keys(typeCounts).length > 0) {
      contextHeader += `BY_TYPE: ${Object.entries(typeCounts).map(([type, count]) => `${type}=${count}`).join(', ')}\n`;
    }
  } else {
    contextHeader = `DOCUMENT_COUNTS: ${Object.entries(typeCounts).map(([type, count]) => `${type}=${count}`).join(', ')}\n`;
  }

  // For analysis queries, add aggregations based on common fields
  if (!isCountingQuery && message && (
    message.toLowerCase().includes('which') ||
    message.toLowerCase().includes('most') ||
    message.toLowerCase().includes('top') ||
    message.toLowerCase().includes('highest') ||
    message.toLowerCase().includes('analysis')
  )) {
    const fieldAggregations = {};

    // Analyze first document to identify common aggregatable fields
    const sampleDoc = searchResults[0];
    if (sampleDoc) {
      const docData = sampleDoc.type ? sampleDoc : sampleDoc.document;
      if (docData) {
        // Look for common ID fields that might be aggregatable
        const potentialFields = ['facilityId', 'companyId', 'customerId', 'supplierId', 'category', 'status', 'type'];

        potentialFields.forEach(field => {
          if (docData[field]) {
            fieldAggregations[field] = {};
          }
        });
      }
    }

    // Aggregate data for identified fields
    searchResults.forEach(doc => {
      const docData = doc.type ? doc : doc.document;
      if (docData) {
        Object.keys(fieldAggregations).forEach(field => {
          const value = docData[field];
          if (value) {
            fieldAggregations[field][value] = (fieldAggregations[field][value] || 0) + 1;
          }
        });
      }
    });

    // Add concise aggregations to context
    Object.entries(fieldAggregations).forEach(([field, counts]) => {
      if (Object.keys(counts).length > 1) { // Only show if there are multiple values
        const fieldName = field.replace('Id', '').toUpperCase();
        const sortedCounts = Object.entries(counts).sort(([,a], [,b]) => b - a);
        contextHeader += `${fieldName}_TOP: ${sortedCounts[0][0]} (${sortedCounts[0][1]})\n`;
      }
    });
  }

  // Build minimal detailed context based on query type
  let detailedContext = '';

  if (isCountingQuery) {
    // For counting queries, no detailed context needed - just the counts
    detailedContext = '';
  } else {
    // For analysis/identification queries, include comprehensive context
    logger.debug('Processing query', { message });

    // Generic query type detection using workspace configuration
    let isAnalysisQuery = false;
    let isRelationshipQuery = false;

    if (ragConfig.queryIntelligence) {
      const intelligence = ragConfig.queryIntelligence;

      // Check for analysis queries (highest, lowest, most, etc.)
      isAnalysisQuery = intelligence.analysisKeywords?.some(keyword =>
        message.toLowerCase().includes(keyword.toLowerCase())
      ) || false;

      // Check for relationship queries
      isRelationshipQuery = intelligence.relationshipKeywords?.some(keyword =>
        message.toLowerCase().includes(keyword.toLowerCase())
      ) || false;

      if (isAnalysisQuery) {
}

      if (isRelationshipQuery) {
}
    }

    const docsToInclude = (isAnalysisQuery || isRelationshipQuery) ? searchResults : searchResults.slice(0, 10); // More docs for analysis/relationship queries
detailedContext = docsToInclude.map((doc, index) => {
      let docType, docData;

      // Handle different result formats
      if (doc.type) {
        docType = doc.type;
        docData = doc;
      } else {
        docType = doc.document?.type;
        docData = doc.document;
      }

      if (!docType || !docData) return '';
// Generic context building using workspace configuration
      if ((isAnalysisQuery || isRelationshipQuery) && semanticFields && typeof semanticFields === 'object' && semanticFields.fields) {
// Use configurable analysis fields from workspace config
        let analysisFields = semanticFields.fields;

        if (ragConfig.contextEnhancement?.analysisFields) {
          // Use specific analysis fields if configured
          analysisFields = ragConfig.contextEnhancement.analysisFields;
}

        if (analysisFields.length > 0) {
          const contextParts = analysisFields
            .map(field => {
              const value = getNestedValue(docData, field);
              if (value !== undefined && value !== null) {
// Special handling for arrays (like lineItems)
                if (Array.isArray(value)) {
                  if (field === 'lineItems' && value.length > 0) {
                    // Format lineItems specially for invoice documents
const formattedItems = value.map((item, idx) => {
return `Item${idx + 1}: qty=${item.quantityPurchased || 'N/A'}, specId=${item.paintSpecId || 'N/A'}`;
                    }).join('; ');
return `${field}: [${formattedItems}]`;
                  } else {
                    // Generic array formatting
                    return `${field}: [${value.map(item =>
                      typeof item === 'object' ? JSON.stringify(item) : item
                    ).join(', ')}]`;
                  }
                } else if (typeof value === 'object') {
                  // Handle nested objects
                  return `${field}: ${JSON.stringify(value)}`;
                } else {
                  // Simple values
                  return `${field}: ${value}`;
                }
              }
              return null;
            })
            .filter(Boolean);

          if (contextParts.length > 0) {
            // Include contextual information based on document type
            const contextualFields = ragConfig.contextEnhancement?.contextualFields?.[docType] || [];
            const additionalInfo = contextualFields
              .map(field => {
                const value = getNestedValue(docData, field);
                return value ? `${field}: ${value}` : null;
              })
              .filter(Boolean)
              .join(', ');

            return `${docType}: ${contextParts.join(', ')}${additionalInfo ? ` (${additionalInfo})` : ''}`;
          } else {
}
        } else {
}
      }

      // Use semantic text if available
      if (docData?.semanticText) {
        return `${docType}: ${docData.semanticText.substring(0, 150)}`;
      }

      // Use configurable semantic fields if available
      if (semanticFields && typeof semanticFields === 'object' && semanticFields.fields) {
        const contextParts = semanticFields.fields
          .map(field => {
            const value = getNestedValue(docData, field);
            return value ? `${field}: ${value}` : null;
          })
          .filter(Boolean)
          .slice(0, 6); // Include more fields for analysis

        if (contextParts.length > 0) {
          return `${docType}: ${contextParts.join(', ')}`;
        }
      }

      // Generic fallback with more fields for analysis
      return buildGenericDocumentContext(docData).substring(0, 200);
    }).filter(Boolean).join('\n');
  }
  
  // Ensure we have some context
  let finalContext = contextHeader;
  if (detailedContext) {
    finalContext += detailedContext;
  }
  logger.debug('Context preview', {
    preview: finalContext.substring(0, 200)
  });

  return finalContext || 'No context available.';
}

/**
 * Build generic document context (no hardcoded fields)
 */
function buildGenericDocumentContext(doc) {
  const contextParts = [];
  const excludeFields = ['_id', 'tenantId', 'deleted', 'created_date', 'last_updated', 'embedding', 'lastEmbeddingUpdate', 'ragMetadata'];
  
  function extractFields(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      if (excludeFields.includes(key) || value === null || value === undefined || value === '') {
        continue;
      }
      
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        contextParts.push(`${fieldPath}: ${value}`);
      } else if (Array.isArray(value) && value.length > 0) {
        if (typeof value[0] === 'object') {
          // Array of objects - extract from first few items
          value.slice(0, 2).forEach((item, index) => {
            extractFields(item, `${fieldPath}[${index}]`);
          });
        } else {
          // Array of primitives
          contextParts.push(`${fieldPath}: [${value.slice(0, 3).join(', ')}${value.length > 3 ? '...' : ''}]`);
        }
      } else if (typeof value === 'object' && prefix.split('.').length < 2) {
        // Nested object - recurse with depth limit
        extractFields(value, fieldPath);
      }
    }
  }
  
  extractFields(doc);
  
  return `${doc.type}: ${contextParts.join(', ')} (Score: ${doc.score?.toFixed(3)})`;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Removed unused direct query functions - all queries use vector search now

/**
 * Log chat interaction for analytics
 */
async function logChatInteraction({ sessionId, userId, tenantId, message, response, workspaceId, gadgetId, db }) {
  try {
    await getDb().collection('rag_chat_interactions').insertOne({
      sessionId,
      userId,
      tenantId,
      message,
      response,
      workspaceId,
      gadgetId,
      timestamp: new Date(),
      created_date: new Date()
    });
  } catch (error) {
    logger.error('Error logging chat interaction', {
      error: error.message
    });
  }
}

module.exports = { registerRAGChatRoutes };
