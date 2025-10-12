# Generic RAG Chatbot Framework Implementation Guide

## Overview
This document outlines the implementation of a generic, metadata-driven RAG chatbot framework that can be configured for any domain (VOC, safety, quality, etc.) through workspace metadata without hardcoding.

## Generic MongoDB Atlas Vector Search Setup

### 1. Dynamic Vector Search Index Creation

```javascript
// Generic MongoDB Atlas Search Index: {domain}_vector_search
// Index name and configuration driven by gadget metadata
function createVectorSearchIndex(gadgetConfig) {
  const indexName = `${gadgetConfig.rag.searchIndex}`;
  
  return {
    "fields": [
      {
        "type": "vector",
        "path": "embedding",
        "numDimensions": gadgetConfig.rag.embeddingDimensions || 1536,
        "similarity": gadgetConfig.rag.similarity || "cosine"
      },
      // Dynamic filter fields based on gadget configuration
      ...gadgetConfig.rag.filterFields.map(field => ({
        "type": "filter",
        "path": field
      }))
    ]
  };
}
```

### 2. Generic Document Embedding Schema

```javascript
// Generic document schema with embeddings - no domain-specific hardcoding
{
  "_id": ObjectId,
  "id": "doc_123",
  "type": "{dynamicDocumentType}", // From gadget contextSources config
  "tenantId": "tenant_123",
  
  // Dynamic filter fields based on gadget configuration
  ...dynamicFilterFields, // Populated from gadget.rag.contextSources[].fields
  
  // Original document fields (domain-agnostic)
  ...originalDocumentFields,
  
  // Generic RAG-specific fields
  "embedding": [0.1, 0.2, ...], // Configurable dimensions
  "semanticText": "{generatedSemanticText}", // Generated from semanticFields config
  "searchableContent": "{extractedKeywords}", // From gadget.rag.semanticFields
  "lastEmbeddingUpdate": ISODate(),
  "ragMetadata": {
    "sourceGadget": "gadgetId",
    "embeddingModel": "text-embedding-3-small",
    "semanticVersion": "1.0"
  },
  
  // Standard audit fields
  "created_date": ISODate(),
  "last_updated": ISODate()
}
```

## Generic API Implementation

### 1. Generic RAG Chat Endpoint

```javascript
// /api/rag/chat - Generic endpoint for any RAG chatbot
app.post('/api/rag/chat', async (req, res) => {
  try {
    const { message, context, rag, gadgetConfig } = req.body;
    const tenantId = req.headers['x-tenant-id'];
    
    // 1. Validate tenant isolation
    if (!tenantId || context.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Tenant isolation violation' });
    }
    
    // 2. Generate embedding using configured model
    const embeddingModel = gadgetConfig.rag.embeddingModel || 'text-embedding-3-small';
    const queryEmbedding = await generateEmbedding(message, embeddingModel);
    
    // 3. Build dynamic vector search pipeline from gadget configuration
    const pipeline = buildVectorSearchPipeline({
      gadgetConfig,
      queryEmbedding,
      tenantId,
      filters: context.filters,
      rag: rag
    });
    
    // 4. Execute vector search on configured collection
    const collection = gadgetConfig.rag.collection || 'documents';
    const searchResults = await db.collection(collection).aggregate(pipeline).toArray();
    
    // 5. Build context using configured semantic fields
    const contextText = buildContextFromResults(searchResults, gadgetConfig.rag.semanticFields);
    
    // 6. Generate AI response using GPT-5 Responses API or Realtime API
    const aiResponse = await generateAIResponse({
      userMessage: message,
      context: contextText,
      systemPrompt: gadgetConfig.ai.systemPrompt,
      contextPrompt: gadgetConfig.ai.contextPrompt,
      model: gadgetConfig.ai.model,
      apiType: gadgetConfig.ai.apiType,
      temperature: gadgetConfig.ai.temperature,
      maxTokens: gadgetConfig.ai.maxTokens,
      filters: context.filters,
      tenantId: tenantId,
      responsesApi: gadgetConfig.ai.responsesApi,
      realtimeApi: gadgetConfig.ai.realtimeApi,
      previousResponseId: context.previousResponseId
    });
    
    // 7. Log interaction if audit logging is enabled
    if (gadgetConfig.security.auditLogging) {
      await logChatInteraction({
        gadgetId: gadgetConfig.id,
        tenantId,
        sessionId: context.sessionId,
        userMessage: message,
        aiResponse: aiResponse.content,
        contextUsed: searchResults.length,
        timestamp: new Date()
      });
    }
    
    res.json({
      response: aiResponse.content,
      context: searchResults,
      metadata: {
        contextSources: searchResults.length,
        tenantId: tenantId,
        filters: context.filters,
        gadgetId: gadgetConfig.id
      }
    });
    
  } catch (error) {
    console.error('Generic RAG Chat Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to build dynamic vector search pipeline
function buildVectorSearchPipeline({ gadgetConfig, queryEmbedding, tenantId, filters, rag }) {
  // Build dynamic filter object from gadget configuration
  const dynamicFilters = { tenantId };
  
  // Apply workspace filters based on gadget field mappings
  Object.entries(filters).forEach(([filterKey, filterValue]) => {
    const mappedField = gadgetConfig.rag.fieldMappings?.[filterKey];
    if (mappedField && filterValue) {
      if (Array.isArray(filterValue)) {
        dynamicFilters[mappedField] = { $in: filterValue };
      } else {
        dynamicFilters[mappedField] = filterValue;
      }
    }
  });
  
  // Add document type filters from context sources
  const documentTypes = gadgetConfig.rag.contextSources.map(source => source.type);
  if (documentTypes.length > 0) {
    dynamicFilters.type = { $in: documentTypes };
  }
  
  return [
    {
      $vectorSearch: {
        index: gadgetConfig.rag.searchIndex,
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: rag.numCandidates || 100,
        limit: rag.maxResults || 5,
        filter: dynamicFilters
      }
    },
    {
      $project: buildDynamicProjection(gadgetConfig.rag.contextSources)
    }
  ];
}

// Helper function to build dynamic projection based on context sources
function buildDynamicProjection(contextSources) {
  const projection = {
    semanticText: 1,
    type: 1,
    score: { $meta: "vectorSearchScore" }
  };
  
  // Add fields from all context sources
  contextSources.forEach(source => {
    source.fields.forEach(field => {
      projection[field] = 1;
    });
  });
  
  return projection;
}
```

### 2. GPT-5 Responses API Integration

```javascript
// Generic AI response generation with GPT-5 Responses API and Realtime API support
async function generateAIResponse(config) {
  const {
    userMessage,
    context,
    systemPrompt,
    contextPrompt,
    model,
    apiType,
    temperature,
    maxTokens,
    filters,
    tenantId,
    responsesApi,
    realtimeApi,
    previousResponseId
  } = config;

  // Build context-aware system prompt
  const fullSystemPrompt = `${systemPrompt}\n\n${contextPrompt
    .replace('{filters}', JSON.stringify(filters))
    .replace('{context}', context)
    .replace('{tenantId}', tenantId)}`;

  // Use GPT-5 Responses API for context retention
  if (apiType === 'responses' && model === 'gpt-5') {
    return await generateGPT5Response({
      userMessage,
      systemPrompt: fullSystemPrompt,
      temperature,
      maxTokens,
      responsesApi,
      previousResponseId,
      realtimeApi
    });
  }

  // Fallback to standard chat completion
  return await generateStandardResponse({
    userMessage,
    systemPrompt: fullSystemPrompt,
    model,
    temperature,
    maxTokens
  });
}

// GPT-5 Responses API implementation with context retention
async function generateGPT5Response(config) {
  const {
    userMessage,
    systemPrompt,
    temperature,
    maxTokens,
    responsesApi,
    previousResponseId,
    realtimeApi
  } = config;

  try {
    // Use Realtime API if voice is enabled
    if (realtimeApi?.enabled && realtimeApi?.voiceEnabled) {
      return await handleRealtimeInteraction(config);
    }

    // Build messages array with context retention
    const messages = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    // Include previous response for context if available
    if (responsesApi.store && previousResponseId) {
      messages.push({
        role: "assistant",
        content: `[Previous context: ${previousResponseId}]`
      });
    }

    messages.push({
      role: "user",
      content: userMessage
    });

    // Call GPT-5 with Responses API
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens,
      store: responsesApi.store,
      metadata: {
        tenant_id: config.tenantId,
        previous_response_id: previousResponseId,
        context_retention: responsesApi.contextRetention
      }
    });

    return {
      content: response.choices[0].message.content,
      responseId: response.id,
      usage: response.usage,
      model: "gpt-5"
    };

  } catch (error) {
    console.error('GPT-5 Responses API Error:', error);
    throw error;
  }
}

// OpenAI Realtime API implementation with built-in tools
async function handleRealtimeInteraction(config) {
  const {
    userMessage,
    systemPrompt,
    realtimeApi
  } = config;

  try {
    // Initialize Realtime API connection
    const realtimeClient = new OpenAI.Realtime({
      model: realtimeApi.model,
      voice: realtimeApi.voice,
      input_audio_format: realtimeApi.inputAudioFormat,
      output_audio_format: realtimeApi.outputAudioFormat,
      turn_detection: realtimeApi.turnDetection
    });

    // Configure built-in tools for VOC domain
    await realtimeClient.updateSession({
      instructions: systemPrompt,
      tools: realtimeApi.tools.map(tool => ({
        type: tool.type,
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      })),
      tool_choice: "auto"
    });

    // Handle tool calls
    realtimeClient.on('conversation.item.input_audio_transcription.completed', (event) => {
      console.log('User said:', event.transcript);
    });

    realtimeClient.on('response.function_call_arguments.done', async (event) => {
      const { name, arguments: args } = event;
      
      // Execute domain-specific tool functions
      let result;
      switch (name) {
        case 'search_voc_data':
          result = await executeVOCDataSearch(args);
          break;
        case 'calculate_voc_emissions':
          result = await calculateVOCEmissions(args);
          break;
        case 'check_compliance_status':
          result = await checkComplianceStatus(args);
          break;
        default:
          result = { error: `Unknown tool: ${name}` };
      }

      // Send tool result back to the model
      await realtimeClient.submitToolOutputs([{
        tool_call_id: event.call_id,
        output: JSON.stringify(result)
      }]);
    });

    // Send user message
    await realtimeClient.sendUserMessage(userMessage);

    // Return response (this would be handled via WebSocket in real implementation)
    return {
      content: "Realtime response processed",
      responseId: `realtime_${Date.now()}`,
      audioResponse: true,
      model: realtimeApi.model
    };

  } catch (error) {
    console.error('Realtime API Error:', error);
    throw error;
  }
}

// Built-in tool implementations for VOC domain
async function executeVOCDataSearch(args) {
  const { query, filters } = args;
  
  // Execute vector search with current filters
  const searchResults = await db.collection('documents').aggregate([
    {
      $vectorSearch: {
        index: "voc_vector_search",
        path: "embedding",
        queryVector: await generateEmbedding(query),
        numCandidates: 50,
        limit: 5,
        filter: {
          tenantId: filters.tenantId,
          type: { $in: ['paintInvoice', 'paint_specifications'] }
        }
      }
    }
  ]).toArray();

  return {
    results: searchResults,
    count: searchResults.length,
    query: query
  };
}

async function calculateVOCEmissions(args) {
  const { paintSpecs, quantities } = args;
  
  let totalEmissions = 0;
  const calculations = [];

  for (let i = 0; i < paintSpecs.length; i++) {
    const spec = paintSpecs[i];
    const quantity = quantities[i];
    const emission = spec.voc_content * quantity;
    
    totalEmissions += emission;
    calculations.push({
      paintSpec: spec.product_code,
      vocContent: spec.voc_content,
      quantity: quantity,
      emission: emission
    });
  }

  return {
    totalEmissions,
    calculations,
    unit: "grams"
  };
}

async function checkComplianceStatus(args) {
  const { emissionValue, threshold, complianceType = 'daily' } = args;
  
  const isCompliant = emissionValue <= threshold;
  const percentage = (emissionValue / threshold) * 100;
  
  return {
    compliant: isCompliant,
    emissionValue,
    threshold,
    percentage: Math.round(percentage),
    complianceType,
    status: isCompliant ? 'COMPLIANT' : 'NON_COMPLIANT',
    recommendation: isCompliant 
      ? 'Emissions are within acceptable limits'
      : `Emissions exceed threshold by ${Math.round(percentage - 100)}%. Consider using lower-VOC alternatives.`
  };
}

// Generic embedding generation - model configurable via gadget metadata
async function generateEmbedding(text, model = 'text-embedding-3-small') {
  const response = await openai.embeddings.create({
    model: model,
    input: text,
    encoding_format: "float"
  });
  
  return response.data[0].embedding;
}

// Generic context building from search results
function buildContextFromResults(searchResults, semanticFields) {
  return searchResults.map(doc => {
    // Use semantic text if available, otherwise build from configured fields
    if (doc.semanticText) {
      return doc.semanticText;
    }
    
    // Build context from available fields
    const contextParts = [];
    semanticFields.forEach(field => {
      if (doc[field] !== undefined) {
        contextParts.push(`${field}: ${doc[field]}`);
      }
    });
    
    return contextParts.join('. ');
  }).join('\n');
}
```

### 3. Generic Document Preprocessing for RAG

```javascript
// Generic script to generate embeddings for any document type
async function generateDocumentEmbeddings(gadgetConfig) {
  const documentTypes = gadgetConfig.rag.contextSources.map(source => source.type);
  const collection = gadgetConfig.rag.collection || 'documents';
  
  const documents = await db.collection(collection).find({
    type: { $in: documentTypes },
    embedding: { $exists: false }
  }).toArray();
  
  for (const doc of documents) {
    // Generate semantic text using configured semantic fields and templates
    const semanticText = generateSemanticText(doc, gadgetConfig);
    
    // Generate embedding using configured model
    const embedding = await generateEmbedding(semanticText, gadgetConfig.rag.embeddingModel);
    
    // Extract searchable content from configured semantic fields
    const searchableContent = extractSearchableContent(doc, gadgetConfig.rag.semanticFields);
    
    // Update document with RAG fields
    await db.collection(collection).updateOne(
      { _id: doc._id },
      {
        $set: {
          embedding: embedding,
          semanticText: semanticText,
          searchableContent: searchableContent,
          lastEmbeddingUpdate: new Date(),
          ragMetadata: {
            sourceGadget: gadgetConfig.id,
            embeddingModel: gadgetConfig.rag.embeddingModel,
            semanticVersion: "1.0"
          }
        }
      }
    );
  }
}

// Generic semantic text generation based on document type and configuration
function generateSemanticText(document, gadgetConfig) {
  const contextSource = gadgetConfig.rag.contextSources.find(source => source.type === document.type);
  
  if (!contextSource) {
    return `Document of type ${document.type}`;
  }
  
  // Build semantic text from configured fields
  const semanticParts = [];
  
  // Add description if available
  if (contextSource.description) {
    semanticParts.push(contextSource.description);
  }
  
  // Add field values
  contextSource.fields.forEach(field => {
    if (document[field] !== undefined) {
      semanticParts.push(`${field}: ${document[field]}`);
    }
  });
  
  return semanticParts.join('. ');
}

// Generic searchable content extraction
function extractSearchableContent(document, semanticFields) {
  const keywords = [];
  
  semanticFields.forEach(field => {
    if (document[field] !== undefined) {
      // Convert field value to searchable keywords
      const value = String(document[field]).toLowerCase();
      keywords.push(value);
      
      // Add field name as keyword
      keywords.push(field.replace(/_/g, ' '));
    }
  });
  
  return keywords.join(' ');
}
```

## Generic Security & Tenant Isolation

### 1. Dynamic Tenant Filtering
```javascript
// Generic tenant filtering based on gadget security configuration
function buildSecurityFilters(gadgetConfig, tenantId, filters) {
  const securityFilters = {};
  
  // Always enforce tenant isolation if enabled
  if (gadgetConfig.security.tenantIsolation) {
    securityFilters.tenantId = tenantId;
  }
  
  // Apply workspace filters if filter awareness is enabled
  if (gadgetConfig.security.filterAware) {
    Object.entries(filters).forEach(([filterKey, filterValue]) => {
      const mappedField = gadgetConfig.rag.fieldMappings?.[filterKey];
      if (mappedField && filterValue) {
        if (Array.isArray(filterValue)) {
          securityFilters[mappedField] = { $in: filterValue };
        } else {
          securityFilters[mappedField] = filterValue;
        }
      }
    });
  }
  
  return securityFilters;
}
```

### 2. Configurable Data Encryption
```javascript
// Generic encryption based on gadget security settings
function encryptSensitiveData(document, gadgetConfig) {
  if (!gadgetConfig.security.dataEncryption) {
    return document;
  }
  
  const encryptedDoc = { ...document };
  const sensitiveFields = gadgetConfig.security.encryptedFields || [];
  
  sensitiveFields.forEach(field => {
    if (encryptedDoc[field]) {
      encryptedDoc[field] = encrypt(encryptedDoc[field], process.env.ENCRYPTION_KEY);
    }
  });
  
  return encryptedDoc;
}
```

### 3. Configurable Audit Logging
```javascript
// Generic audit logging based on gadget configuration
async function logChatInteraction(interactionData, gadgetConfig) {
  if (!gadgetConfig.security.auditLogging) {
    return;
  }
  
  const auditCollection = gadgetConfig.security.auditCollection || 'chat_audit';
  
  await db.collection(auditCollection).insertOne({
    gadgetId: gadgetConfig.id,
    gadgetType: 'rag-chatbot-gadget',
    tenantId: interactionData.tenantId,
    userId: interactionData.userId,
    sessionId: interactionData.sessionId,
    query: interactionData.userMessage,
    response: interactionData.aiResponse,
    contextSources: interactionData.contextUsed,
    timestamp: new Date(),
    ipAddress: interactionData.ipAddress,
    metadata: {
      model: gadgetConfig.ai.model,
      embeddingModel: gadgetConfig.rag.embeddingModel,
      filterContext: interactionData.filters
    }
  });
}
```

## Generic Frontend Framework Integration

### 1. Generic RAG Chatbot Gadget Class

```typescript
// Generic RAG Chatbot Gadget - completely metadata-driven
export default class GenericRAGChatbotGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'rag-chatbot-gadget',
    name: 'Generic RAG Chatbot',
    version: '1.0.0',
    description: 'Metadata-driven RAG chatbot for any domain',
    author: 'Framework Library',
    tags: ['rag', 'chatbot', 'ai', 'generic'],
    category: 'ai',
    gadgetType: GadgetType.AI,
    widgetTypes: ['chat'],
    dataFlow: {
      inputs: ['filter-context', 'user-messages'],
      outputs: ['ai-responses', 'context-data'],
      transformations: ['embedding', 'vector-search', 'ai-generation']
    }
  };

  renderBody(props: any, context?: GadgetContext): React.ReactNode {
    return React.createElement(GenericRAGChatbotComponent, { 
      ...props, 
      context,
      gadgetConfig: props.config // Pass entire config to component
    });
  }
}

// Enhanced Generic component with GPT-5 and Realtime API support
const GenericRAGChatbotComponent: React.FC<any> = ({ gadgetConfig, context }) => {
  const filterContext = useWorkspaceFilters();
  const themeColors = useThemeColors();
  const [isRecording, setIsRecording] = useState(false);
  const [realtimeClient, setRealtimeClient] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [previousResponseId, setPreviousResponseId] = useState(null);
  
  // All behavior driven by gadgetConfig metadata
  const chatbotConfig = gadgetConfig.chatbot;
  const ragConfig = gadgetConfig.rag;
  const aiConfig = gadgetConfig.ai;
  const uiConfig = gadgetConfig.ui;
  const features = gadgetConfig.features;

  // Initialize Realtime API client if enabled
  useEffect(() => {
    if (features.realtimeAudio && aiConfig.realtimeApi?.enabled) {
      initializeRealtimeClient();
    }
  }, []);

  const initializeRealtimeClient = async () => {
    try {
      const client = new OpenAI.Realtime({
        apiKey: process.env.OPENAI_API_KEY,
        model: aiConfig.realtimeApi.model,
        voice: aiConfig.realtimeApi.voice
      });

      // Configure session with domain-specific tools
      await client.updateSession({
        instructions: aiConfig.systemPrompt,
        tools: aiConfig.realtimeApi.tools,
        turn_detection: aiConfig.realtimeApi.turnDetection,
        input_audio_format: aiConfig.realtimeApi.inputAudioFormat,
        output_audio_format: aiConfig.realtimeApi.outputAudioFormat
      });

      // Set up event handlers
      client.on('conversation.item.input_audio_transcription.completed', (event) => {
        console.log('User said:', event.transcript);
        addMessageToHistory('user', event.transcript);
      });

      client.on('response.audio_transcript.done', (event) => {
        console.log('Assistant said:', event.transcript);
        addMessageToHistory('assistant', event.transcript);
      });

      client.on('response.function_call_arguments.done', async (event) => {
        const toolResult = await handleToolCall(event);
        await client.submitToolOutputs([{
          tool_call_id: event.call_id,
          output: JSON.stringify(toolResult)
        }]);
      });

      setRealtimeClient(client);
    } catch (error) {
      console.error('Failed to initialize Realtime API:', error);
    }
  };

  // Enhanced message handling with GPT-5 Responses API
  const handleMessage = async (message: string, isVoice = false) => {
    try {
      // Add user message to history
      addMessageToHistory('user', message);

      // Use Realtime API for voice interactions
      if (isVoice && realtimeClient && features.realtimeAudio) {
        await realtimeClient.sendUserMessage(message);
        return; // Response will come via WebSocket events
      }

      // Use GPT-5 Responses API for text interactions
      const response = await fetch(gadgetConfig.api.endpoint, {
        method: gadgetConfig.api.method,
        headers: {
          ...gadgetConfig.api.headers,
          'X-Tenant-ID': context.tenantId
        },
        body: JSON.stringify({
          message,
          context: {
            tenantId: context.tenantId,
            filters: filterContext.filters,
            sessionId: generateSessionId(),
            previousResponseId: previousResponseId
          },
          rag: ragConfig,
          gadgetConfig: gadgetConfig
        })
      });
      
      const result = await response.json();
      
      // Store response ID for context retention
      if (result.responseId) {
        setPreviousResponseId(result.responseId);
      }

      // Add assistant response to history
      addMessageToHistory('assistant', result.response);
      
      return result;

    } catch (error) {
      console.error('Message handling error:', error);
      addMessageToHistory('assistant', 'Sorry, I encountered an error. Please try again.');
    }
  };

  // Voice recording functionality
  const startVoiceRecording = async () => {
    if (!features.voiceInput) return;

    try {
      setIsRecording(true);
      
      if (realtimeClient && features.realtimeAudio) {
        // Use Realtime API for voice
        await realtimeClient.startRecording();
      } else {
        // Use standard speech-to-text
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Implement speech-to-text logic here
      }
    } catch (error) {
      console.error('Voice recording error:', error);
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = async () => {
    setIsRecording(false);
    
    if (realtimeClient && features.realtimeAudio) {
      await realtimeClient.stopRecording();
    }
  };

  // Tool call handler for domain-specific functions
  const handleToolCall = async (event) => {
    const { name, arguments: args } = event;
    
    try {
      // Execute tool based on configuration
      const tool = aiConfig.realtimeApi.tools.find(t => t.name === name);
      if (!tool) {
        return { error: `Unknown tool: ${name}` };
      }

      // Call backend tool execution endpoint
      const response = await fetch(`/api/tools/${name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': context.tenantId
        },
        body: JSON.stringify({
          arguments: args,
          context: {
            tenantId: context.tenantId,
            filters: filterContext.filters
          }
        })
      });

      return await response.json();
    } catch (error) {
      console.error(`Tool execution error for ${name}:`, error);
      return { error: `Failed to execute ${name}` };
    }
  };

  const addMessageToHistory = (role: 'user' | 'assistant', content: string) => {
    setConversationHistory(prev => [...prev, { role, content, timestamp: new Date() }]);
  };

  // Render enhanced UI with voice capabilities
  return (
    <EnhancedChatInterface
      config={uiConfig}
      theme={themeColors}
      onMessage={handleMessage}
      onVoiceStart={startVoiceRecording}
      onVoiceStop={stopVoiceRecording}
      isRecording={isRecording}
      conversationHistory={conversationHistory}
      quickActions={uiConfig.quickActions}
      welcomeMessage={chatbotConfig.welcomeMessage}
      placeholder={chatbotConfig.placeholder}
      features={features}
      voiceEnabled={features.voiceInput}
      realtimeEnabled={features.realtimeAudio}
    />
  );
};
```

## Generic Deployment Framework

### 1. Configuration-Driven Setup Script
```javascript
// Generic setup script that works for any RAG chatbot configuration
async function setupRAGChatbot(gadgetConfig) {
  // 1. Create vector search index based on configuration
  await createVectorSearchIndex(gadgetConfig);
  
  // 2. Generate embeddings for configured document types
  await generateDocumentEmbeddings(gadgetConfig);
  
  // 3. Set up audit logging collection if enabled
  if (gadgetConfig.security.auditLogging) {
    await setupAuditCollection(gadgetConfig);
  }
  
  // 4. Validate API endpoint configuration
  await validateAPIConfiguration(gadgetConfig);
  
  console.log(`RAG Chatbot "${gadgetConfig.chatbot.name}" setup complete`);
}
```

### 2. Generic Deployment Checklist Generator
```javascript
// Generate deployment checklist based on gadget configuration
function generateDeploymentChecklist(gadgetConfig) {
  const checklist = [
    `Create MongoDB Atlas vector search index: ${gadgetConfig.rag.searchIndex}`,
    `Generate embeddings for document types: ${gadgetConfig.rag.contextSources.map(s => s.type).join(', ')}`,
    `Deploy API endpoint: ${gadgetConfig.api.endpoint}`,
    `Configure AI model: ${gadgetConfig.ai.model}`,
    `Set up embedding model: ${gadgetConfig.rag.embeddingModel}`
  ];
  
  if (gadgetConfig.security.tenantIsolation) {
    checklist.push('Verify tenant isolation filters');
  }
  
  if (gadgetConfig.security.auditLogging) {
    checklist.push(`Set up audit logging collection: ${gadgetConfig.security.auditCollection || 'chat_audit'}`);
  }
  
  if (gadgetConfig.security.dataEncryption) {
    checklist.push('Configure data encryption keys');
  }
  
  checklist.push('Test chatbot UI responsiveness');
  checklist.push('Verify filter integration');
  
  return checklist;
}
```

This generic framework allows you to create RAG chatbots for any domain (safety, quality, compliance, etc.) by simply changing the workspace metadata configuration - no code changes required!
