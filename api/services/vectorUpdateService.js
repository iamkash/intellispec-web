/**
 * Vector Update Service
 * 
 * Production-ready service that automatically maintains vector embeddings
 * for ALL document types using MongoDB change streams.
 * 
 * Features:
 * - Real-time vector updates on document changes
 * - Automatic document type discovery
 * - Tenant isolation and security
 * - Error recovery and retry logic
 * - Rate limiting and batch processing
 * - Health monitoring and metrics
 * - Graceful shutdown handling
 * 
 * Framework Integration:
 * - Uses DatabaseManager for connection management
 * - No duplicate connections created
 */

const DatabaseManager = require('../core/DatabaseManager');
const OpenAI = require('openai');
const DocumentVectorModel = require('../models/DocumentVectors');
const EventEmitter = require('events');
const { logger } = require('../core/Logger');

class VectorUpdateService extends EventEmitter {
  constructor(config = {}) {
    super();
    
    const env = process.env;
    const isProduction = env.NODE_ENV === 'production';

    const toBool = (value, defaultValue) => {
      if (value === undefined || value === null) return defaultValue;
      if (typeof value === 'boolean') return value;
      const normalized = String(value).trim().toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
      if (['false', '0', 'no', 'off'].includes(normalized)) return false;
      return defaultValue;
    };

    const toInt = (value, defaultValue) => {
      if (value === undefined || value === null || value === '') {
        return defaultValue;
      }
      const parsed = parseInt(value, 10);
      return Number.isNaN(parsed) ? defaultValue : parsed;
    };

    const toArray = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) {
        return value.map(item => String(item).trim()).filter(Boolean);
      }
      return String(value)
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    };

    const allowedCollections = toArray(config.allowedCollections || env.VECTOR_ALLOWED_COLLECTIONS);
    const discoveryEnabledEnv = env.VECTOR_DISCOVERY_ENABLED !== undefined
      ? toBool(env.VECTOR_DISCOVERY_ENABLED, true)
      : !isProduction;

    this.config = {
      openai: {
        apiKey: config.openaiKey || env.OPENAI_API_KEY,
        embeddingModel: config.embeddingModel || 'text-embedding-3-small',
        dimensions: config.dimensions || 1536,
        maxTokens: 8000
      },
      processing: {
        batchSize: toInt(config.batchSize || env.VECTOR_BATCH_SIZE, 5),
        rateLimitDelay: toInt(config.rateLimitDelay || env.VECTOR_RATE_LIMIT_DELAY, 500),
        maxRetries: toInt(config.maxRetries || env.VECTOR_MAX_RETRIES, 3),
        retryDelay: toInt(config.retryDelay || env.VECTOR_RETRY_DELAY, 10000),
        debounceDelay: toInt(config.debounceDelay || env.VECTOR_DEBOUNCE_MS, 3000) // Prevent rapid successive updates
      },
      monitoring: {
        enabled: config.monitoring !== false,
        logInterval: toInt(config.logInterval || env.VECTOR_MONITOR_INTERVAL, 60000) // 1 minute
      },
      discovery: {
        enabled: toBool(config.discoveryEnabled, discoveryEnabledEnv),
        allowedCollections,
        maxCollections: toInt(
          config.maxCollections || env.VECTOR_MAX_COLLECTIONS,
          allowedCollections.length || 5
        ),
        sampleLimit: toInt(
          config.discoverySampleLimit || env.VECTOR_DISCOVERY_SAMPLE_LIMIT,
          100
        )
      }
    };
    
    this.dbManager = null;
    this.db = null;
    this.openai = null;
    this.changeStreams = new Map();
    this.documentTypes = new Map();
    this.isRunning = false;
    this.metrics = {
      documentsProcessed: 0,
      embeddingsGenerated: 0,
      errors: 0,
      startTime: null,
      lastActivity: null
    };
    this.pendingUpdates = new Map(); // Debounce rapid updates
    
    // Validate configuration
    if (!this.config.openai.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    this.openai = new OpenAI({ apiKey: this.config.openai.apiKey });
    
    // Add error handler to prevent unhandled errors from crashing the process
    this.on('error', (errorInfo) => {
      logger.error('🚨 VectorUpdateService Error:', errorInfo);
      // Log but don't crash - errors are already handled in individual methods
    });
  }
  
  /**
   * Start the vector update service
   */
  async start() {
    if (this.isRunning) {
      return;
    }
    
    try {
      // Use DatabaseManager instead of creating own connection
      this.dbManager = DatabaseManager.getInstance();
      
      if (!this.dbManager.isHealthy()) {
        throw new Error('DatabaseManager is not healthy. Cannot start Vector Update Service.');
      }
      
      // Use native client from DatabaseManager for change streams
      const nativeClient = this.dbManager.getNativeClient();
      this.db = nativeClient.db();
      
      logger.info('Vector Update Service using DatabaseManager connection');
      
      // Discover document types
      await this.discoverDocumentTypes();
      
      // Start change streams
      await this.startChangeStreams();
      
      // Start monitoring
      if (this.config.monitoring.enabled) {
        this.startMonitoring();
      }
      
      this.isRunning = true;
      this.metrics.startTime = new Date();
      logger.info(`Monitoring ${this.documentTypes.size} document types`);
      
      this.emit('started');
      
    } catch (error) {
      logger.error('Failed to start Vector Update Service', { error: error.message });
      await this.stop();
      throw error;
    }
  }
  
  /**
   * Stop the vector update service
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }
    
    try {
      // Close change streams
      for (const changeStream of this.changeStreams.values()) {
        await changeStream.close();
      }
      this.changeStreams.clear();
      
      // Don't close DatabaseManager connection - it's managed by server.js
      this.db = null;
      
      this.isRunning = false;
      logger.info('Vector Update Service stopped successfully');
      this.emit('stopped');
      
    } catch (error) {
      logger.error('Error stopping Vector Update Service', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Discover all document types in the database
   */
  async discoverDocumentTypes() {
    this.documentTypes.clear();

    const { discovery } = this.config;
    const collectionsInfo = await this.db.listCollections().toArray();
    const availableNames = new Set(collectionsInfo.map(info => info.name));

    let targetCollections = [];

    if (discovery.allowedCollections.length > 0) {
      targetCollections = discovery.allowedCollections.filter(name => {
        if (availableNames.has(name)) {
          return true;
        }
        logger.warn('Vector Update Service: skipping unknown collection from VECTOR_ALLOWED_COLLECTIONS', { collection: name });
        return false;
      });
    }

    if (discovery.enabled) {
      const discovered = collectionsInfo
        .map(info => info.name)
        .filter(name => !name.startsWith('system.'));

      if (targetCollections.length === 0) {
        targetCollections = discovered;
      } else {
        const allowed = new Set(targetCollections);
        targetCollections = discovered.filter(name => allowed.has(name));
      }
    } else if (targetCollections.length === 0) {
      logger.warn('Vector Update Service discovery disabled and no allowed collections provided; service will remain idle.');
      return;
    }

    targetCollections = Array.from(new Set(targetCollections));

    if (discovery.maxCollections > 0 && targetCollections.length > discovery.maxCollections) {
      logger.warn('Vector Update Service limiting monitored collections', {
        maxCollections: discovery.maxCollections,
        truncated: targetCollections.slice(0, discovery.maxCollections)
      });
      targetCollections = targetCollections.slice(0, discovery.maxCollections);
    }

    if (targetCollections.length === 0) {
      logger.info('Vector Update Service did not identify any collections to monitor.');
      return;
    }

    for (const collectionName of targetCollections) {
      if (collectionName.startsWith('system.')) {
        continue;
      }

      try {
        const collection = this.db.collection(collectionName);
        const types = await collection.distinct('type');

        if (types.length > 0) {
          for (const type of types) {
            if (this.documentTypes.has(type)) {
              continue;
            }

            const sample = await collection.findOne({ type });
            if (!sample) {
              continue;
            }

            const structure = this.analyzeDocumentStructure(sample);
            const count = await collection.countDocuments(
              { type },
              { limit: discovery.sampleLimit }
            );

            this.documentTypes.set(type, {
              collection: collectionName,
              structure,
              count
            });
          }
        } else {
          const sampleDoc = await collection.findOne({});
          if (!sampleDoc) {
            continue;
          }

          const inferredType = collectionName;
          const structure = this.analyzeDocumentStructure(sampleDoc);
          const count = await collection.countDocuments(
            {},
            { limit: discovery.sampleLimit }
          );

          this.documentTypes.set(inferredType, {
            collection: collectionName,
            structure,
            count
          });
        }
      } catch (error) {
        logger.warn('Vector Update Service failed to inspect collection', {
          collection: collectionName,
          error: error.message
        });
      }
    }

    logger.info('Vector Update Service discovered document types', {
      totalTypes: this.documentTypes.size,
      collections: [...new Set([...this.documentTypes.values()].map(info => info.collection))]
    });
  }
  
  /**
   * Analyze document structure to identify semantic fields
   */
  analyzeDocumentStructure(document) {
    const structure = {
      textFields: [],
      numericFields: [],
      dateFields: [],
      identifierFields: []
    };
    
    const analyzeField = (key, value, path = '') => {
      const fullPath = path ? `${path}.${key}` : key;
      
      // Skip system and RAG fields
      if (['_id', '__v', 'deleted', 'deleted_at', 'deleted_by', 'created_date', 
           'last_updated', 'created_by', 'updated_by', 'embedding', 'semanticText', 
           'searchableContent', 'lastEmbeddingUpdate', 'ragMetadata'].includes(key)) {
        return;
      }
      
      if (value === null || value === undefined) return;
      
      const type = typeof value;
      
      if (type === 'string') {
        if (key.toLowerCase().includes('id') || key.toLowerCase().includes('code')) {
          structure.identifierFields.push(fullPath);
        } else {
          structure.textFields.push(fullPath);
        }
      } else if (type === 'number') {
        structure.numericFields.push(fullPath);
      } else if (value instanceof Date || (type === 'string' && !isNaN(Date.parse(value)))) {
        structure.dateFields.push(fullPath);
      } else if (Array.isArray(value)) {
        if (value.length > 0) {
          analyzeField(`${key}[0]`, value[0], path);
        }
      } else if (type === 'object') {
        for (const [subKey, subValue] of Object.entries(value)) {
          analyzeField(subKey, subValue, fullPath);
        }
      }
    };
    
    for (const [key, value] of Object.entries(document)) {
      analyzeField(key, value);
    }
    
    return structure;
  }
  
  /**
   * Start change streams for all collections
   */
  async startChangeStreams() {
    const collections = [...new Set([...this.documentTypes.values()].map(info => info.collection))];

    if (collections.length === 0) {
      logger.info('Vector Update Service: no change streams to start.');
      return;
    }

    for (const collectionName of collections) {
      if (this.changeStreams.has(collectionName)) {
        continue;
      }
      await this.startChangeStreamForCollection(collectionName);
    }
  }
  
  /**
   * Start change stream for a specific collection
   */
  async startChangeStreamForCollection(collectionName) {
    if (this.changeStreams.has(collectionName)) {
      return;
    }

    const collection = this.db.collection(collectionName);
    const changeStream = collection.watch([
      {
        $match: {
          $or: [
            { operationType: 'insert' },
            { operationType: 'update' },
            { operationType: 'replace' }
          ]
        }
      }
    ], {
      fullDocument: 'updateLookup'
    });
    
    changeStream.on('change', (change) => {
      this.handleDocumentChange(change, collectionName);
    });
    
    changeStream.on('error', (error) => {
      logger.error(`❌ Change stream error for ${collectionName}:`, error);
      this.metrics.errors++;
      
      // Handle specific MongoDB document size errors
      if (error.code === 10334 || error.codeName === 'BSONObjectTooLarge') {
        logger.warn(`⚠️ Document too large for change stream processing (${collectionName}). Skipping vector updates for large documents.`);
        // Don't restart for size errors - they'll keep failing
        return;
      }
      
      this.emit('error', { collection: collectionName, error });
      
      // Restart change stream after delay for other errors
      setTimeout(() => {
        logger.info(`🔄 Restarting change stream for ${collectionName}...`);
        this.changeStreams.delete(collectionName);
        this.startChangeStreamForCollection(collectionName);
      }, this.config.processing.retryDelay);
    });
    
    this.changeStreams.set(collectionName, changeStream);
  }
  
  /**
   * Handle document change event
   */
  async handleDocumentChange(change, collectionName) {
    try {
      const document = change.fullDocument;
      if (!document) return;
      
      const documentId = document._id.toString();
      const documentType = document.type || collectionName;
      
      // Skip if we don't have structure info for this document type
      const docTypeInfo = this.documentTypes.get(documentType);
      if (!docTypeInfo) {
        return;
      }
      
      // Skip if embedding is very recent (avoid infinite loops and rapid updates)
      if (document.lastEmbeddingUpdate && 
          (Date.now() - new Date(document.lastEmbeddingUpdate).getTime()) < 60000) {
        return;
      }
      
      // Debounce rapid successive updates for the same document
      const pendingKey = `${collectionName}:${documentId}`;
      if (this.pendingUpdates.has(pendingKey)) {
        clearTimeout(this.pendingUpdates.get(pendingKey));
      }
      
      const timeoutId = setTimeout(async () => {
        this.pendingUpdates.delete(pendingKey);
        await this.processDocumentUpdate(document, docTypeInfo, collectionName);
      }, this.config.processing.debounceDelay);
      
      this.pendingUpdates.set(pendingKey, timeoutId);
      
    } catch (error) {
      logger.error('❌ Error handling document change:', error);
      this.metrics.errors++;
      this.emit('error', { change, error });
    }
  }
  
  /**
   * Process document update and generate vectors
   */
  async processDocumentUpdate(document, docTypeInfo, collectionName) {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        const documentType = document.type || collectionName;
        const documentId = document.id || document._id;
        
        // Generate semantic text
        const semanticText = this.generateSemanticText(document, docTypeInfo.structure);
        
        if (!semanticText || semanticText.length < 10) {
          return;
        }
        
        // Generate embedding with retry
        const embedding = await this.generateEmbeddingWithRetry(semanticText);
        
        // Generate searchable content
        const searchableContent = this.generateSearchableContent(document, docTypeInfo.structure);
        
        // Store vector in separate collection with duplicate key handling
        const tenantId = document.tenantId || 'default-tenant';
        await DocumentVectorModel.findOneAndUpdate(
          { 
            documentId: document.id || document._id.toString(),
            tenantId: tenantId
          },
          {
            documentId: document.id || document._id.toString(),
            documentType: document.type || collectionName,
            tenantId: tenantId,
            embedding: embedding,
            semanticText: semanticText,
            searchableContent: searchableContent,
            embeddingModel: this.config.openai.embeddingModel,
            semanticVersion: "2.0",
            lastEmbeddingUpdate: new Date(),
            last_updated: new Date()
          },
          { 
            upsert: true, 
            new: true,
            setDefaultsOnInsert: true
          }
        );
        
        this.metrics.documentsProcessed++;
        this.metrics.embeddingsGenerated++;
        this.metrics.lastActivity = new Date();
        this.emit('documentProcessed', {
          documentType,
          documentId,
          semanticText: semanticText.substring(0, 100) + '...'
        });
        
        // Success - break out of retry loop
        break;
        
      } catch (error) {
        retryCount++;
        
        // Handle MongoDB duplicate key errors specifically
        if (error.code === 11000 && error.codeName === 'DuplicateKey') {
          if (retryCount < maxRetries) {
            logger.warn(`⚠️ Duplicate key conflict for document ${document._id}, retrying (${retryCount}/${maxRetries})...`);
            // Wait before retry to reduce race conditions
            await this.delay(100 * retryCount);
            continue;
          } else {
            logger.warn(`⚠️ Duplicate key conflict persisted for document ${document._id} after ${maxRetries} retries - vector may already exist, skipping`);
            return; // Skip this update, don't emit error
          }
        }
        
        // For other errors, log and emit but don't crash
        logger.error(`❌ Error processing document update (attempt ${retryCount}/${maxRetries}):`, error.message);
        this.metrics.errors++;
        
        if (retryCount >= maxRetries) {
          // Only emit error after all retries exhausted, but don't let it crash the process
          logger.error(`❌ Failed to process document ${document._id} after ${maxRetries} attempts`);
          return; // Don't emit unhandled errors that crash the process
        }
        
        // Wait before retry
        await this.delay(1000 * retryCount);
      }
    }
  }
  
  /**
   * Generate semantic text from document (size-optimized)
   */
  generateSemanticText(document, structure) {
    const semanticParts = [];
    const MAX_SEMANTIC_LENGTH = 8000; // Limit to ~8KB to prevent document bloat
    
    // Add document type
    if (document.type) {
      semanticParts.push(`Document type: ${document.type}`);
    }
    
    // Special handling for paint invoices - add consumption context
    if (document.type === 'paintInvoice') {
      semanticParts.push('Paint purchase invoice with consumption data');
      
      if (document.facilityId) {
        semanticParts.push(`Facility: ${document.facilityId}`);
      }
      if (document.companyId) {
        semanticParts.push(`Company: ${document.companyId}`);
      }
      if (document.invoiceNumber) {
        semanticParts.push(`Invoice: ${document.invoiceNumber}`);
      }
      
      // Add line items consumption data
      if (document.lineItems && Array.isArray(document.lineItems)) {
        const totalQuantity = document.lineItems.reduce((sum, item) => sum + (item.quantityPurchased || 0), 0);
        semanticParts.push(`Total paint purchased: ${totalQuantity} gallons`);
        semanticParts.push(`Line items: ${document.lineItems.length} products`);
        
        // Add details about paint products
        document.lineItems.forEach((item, index) => {
          if (item.quantityPurchased) {
            semanticParts.push(`Product ${index + 1}: ${item.quantityPurchased} gallons purchased`);
          }
          if (item.vocGramsPerLiter) {
            semanticParts.push(`VOC content: ${item.vocGramsPerLiter} g/L`);
          }
        });
      }
    }
    
    // Add text fields
    structure.textFields.forEach(field => {
      const value = this.getNestedValue(document, field);
      if (value && typeof value === 'string' && value.trim()) {
        const fieldName = field.split('.').pop();
        semanticParts.push(`${fieldName}: ${value.trim()}`);
      }
    });
    
    // Add identifier fields
    structure.identifierFields.forEach(field => {
      const value = this.getNestedValue(document, field);
      if (value) {
        const fieldName = field.split('.').pop();
        semanticParts.push(`${fieldName}: ${value}`);
      }
    });
    
    // Add meaningful numeric fields
    structure.numericFields.forEach(field => {
      const value = this.getNestedValue(document, field);
      if (value !== null && value !== undefined) {
        const fieldName = field.split('.').pop();
        if (fieldName.includes('amount') || fieldName.includes('count') || 
            fieldName.includes('content') || fieldName.includes('value') ||
            fieldName.includes('price') || fieldName.includes('quantity')) {
          semanticParts.push(`${fieldName}: ${value}`);
        }
      }
    });
    
    // Add date fields
    structure.dateFields.forEach(field => {
      const value = this.getNestedValue(document, field);
      if (value) {
        const fieldName = field.split('.').pop();
        const dateStr = value instanceof Date ? value.toISOString().split('T')[0] : value;
        semanticParts.push(`${fieldName}: ${dateStr}`);
      }
    });
    
    const fullText = semanticParts.join('. ');
    
    // Truncate if too long to prevent document size issues
    if (fullText.length > MAX_SEMANTIC_LENGTH) {
      logger.warn(`Semantic text truncated from ${fullText.length} to ${MAX_SEMANTIC_LENGTH} characters for document ${document._id}`);
      return fullText.substring(0, MAX_SEMANTIC_LENGTH) + '...';
    }
    
    return fullText;
  }
  
  /**
   * Generate searchable content from document (size-optimized)
   */
  generateSearchableContent(document, structure) {
    const keywords = [];
    const MAX_SEARCHABLE_LENGTH = 4000; // Limit to ~4KB to prevent document bloat
    
    // Add text content
    structure.textFields.forEach(field => {
      const value = this.getNestedValue(document, field);
      if (value && typeof value === 'string') {
        keywords.push(value.toLowerCase());
        keywords.push(field.replace(/[._]/g, ' ').toLowerCase());
      }
    });
    
    // Add identifier values
    structure.identifierFields.forEach(field => {
      const value = this.getNestedValue(document, field);
      if (value) {
        keywords.push(String(value).toLowerCase());
      }
    });
    
    // Add document type
    if (document.type) {
      keywords.push(document.type.toLowerCase());
    }
    
    const fullContent = keywords.join(' ');
    
    // Truncate if too long to prevent document size issues
    if (fullContent.length > MAX_SEARCHABLE_LENGTH) {
      logger.warn(`Searchable content truncated from ${fullContent.length} to ${MAX_SEARCHABLE_LENGTH} characters for document ${document._id}`);
      return fullContent.substring(0, MAX_SEARCHABLE_LENGTH) + '...';
    }
    
    return fullContent;
  }
  
  /**
   * Generate embedding with retry logic
   */
  async generateEmbeddingWithRetry(text, retries = this.config.processing.maxRetries) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.openai.embeddings.create({
          model: this.config.openai.embeddingModel,
          input: text.substring(0, this.config.openai.maxTokens),
          encoding_format: "float"
        });
        
        return response.data[0].embedding;
      } catch (error) {
        logger.error(`❌ Embedding generation attempt ${attempt} failed:`, error.message);
        
        if (attempt === retries) {
          throw error;
        }
        
        await this.delay(this.config.processing.retryDelay);
      }
    }
  }
  
  /**
   * Get nested value using dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      if (key.includes('[') && key.includes(']')) {
        const [arrayKey, indexStr] = key.split('[');
        const index = parseInt(indexStr.replace(']', ''));
        return current?.[arrayKey]?.[index];
      }
      return current?.[key];
    }, obj);
  }
  
  /**
   * Start monitoring and metrics logging
   */
  startMonitoring() {
setInterval(() => {
      const uptime = this.metrics.startTime ? 
        Math.round((Date.now() - this.metrics.startTime.getTime()) / 1000) : 0;
logger.info(`  ⏱️  Uptime: ${uptime}s`);
logger.info(`  🤖 Embeddings generated: ${this.metrics.embeddingsGenerated}`);
logger.info(`  🕐 Last activity: ${this.metrics.lastActivity || 'None'}`);
logger.info(`  ⏳ Pending updates: ${this.pendingUpdates.size}`);
      
      this.emit('metrics', this.metrics);
    }, this.config.monitoring.logInterval);
  }
  
  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      isRunning: this.isRunning,
      documentTypes: this.documentTypes.size,
      activeChangeStreams: this.changeStreams.size,
      pendingUpdates: this.pendingUpdates.size
    };
  }
  
  /**
   * Health check
   */
  isHealthy() {
    return this.isRunning && 
           this.client && 
           this.db && 
           this.changeStreams.size > 0;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = VectorUpdateService;
