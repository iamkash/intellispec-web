#!/usr/bin/env node

/**
 * Universal Vector System for Entire Atlas Database
 * 
 * This is a completely generic, framework-level system that automatically:
 * - Discovers ALL document types in your Atlas database
 * - Creates vector search indexes for any collection
 * - Generates embeddings for ANY document structure
 * - Maintains vectors automatically via change streams
 * - Works with existing and future document types
 * 
 * Features:
 * - Zero configuration required for new document types
 * - Automatic semantic text generation from any document structure
 * - Real-time vector updates via MongoDB change streams
 * - Tenant isolation and security
 * - Configurable embedding models and dimensions
 * - Batch processing with rate limiting
 * - Error recovery and retry logic
 * 
 * Usage:
 *   node scripts/universal-vector-system.js --mode=setup     # Initial setup
 *   node scripts/universal-vector-system.js --mode=generate  # Generate embeddings
 *   node scripts/universal-vector-system.js --mode=watch     # Start change stream watcher
 *   node scripts/universal-vector-system.js --mode=all       # Setup + generate + watch
 */

const { MongoClient } = require('mongodb');
const OpenAI = require('openai');
require('dotenv').config();

// Configuration
const CONFIG = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/intellispec',
    database: process.env.DATABASE_NAME || 'intellispec'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
    dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS) || 1536,
    maxTokens: 8000 // OpenAI embedding input limit
  },
  vector: {
    indexPrefix: process.env.VECTOR_INDEX_PREFIX || 'universal_vector',
    similarity: process.env.VECTOR_SIMILARITY || 'cosine',
    batchSize: parseInt(process.env.BATCH_SIZE) || 50,
    rateLimitDelay: parseInt(process.env.RATE_LIMIT_DELAY) || 100 // ms between requests
  },
  system: {
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    changeStreamResumeAfter: null // Will be set dynamically
  }
};

// Validate required environment variables
if (!CONFIG.openai.apiKey) {
  console.error('❌ OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: CONFIG.openai.apiKey });

// Parse command line arguments
const args = process.argv.slice(2);
const mode = args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'all';
const selectedCollections = args.find(arg => arg.startsWith('--collections='))?.split('=')[1]?.split(',');
const tenantId = args.find(arg => arg.startsWith('--tenant='))?.split('=')[1];
const dryRun = args.includes('--dry-run');

/**
 * Universal Document Type Discovery
 * Automatically discovers all document types across all collections
 */
async function discoverDocumentTypes(db) {
const documentTypes = new Map();
  
  try {
    // Get all collections
    const allCollections = await db.listCollections().toArray();
    for (const collectionInfo of allCollections) {
      const collectionName = collectionInfo.name;
      
      // Skip system collections
      if (collectionName.startsWith('system.')) continue;
      if (selectedCollections && !selectedCollections.includes(collectionName)) continue;
const collection = db.collection(collectionName);
      
      // Get distinct document types
      const types = await collection.distinct('type');
      
      if (types.length > 0) {
for (const type of types) {
          if (!documentTypes.has(type)) {
            // Get sample document to analyze structure
            const sample = await collection.findOne({ type });
            
            if (sample) {
              const structure = analyzeDocumentStructure(sample);
              documentTypes.set(type, {
                collection: collectionName,
                structure,
                sampleFields: Object.keys(sample),
                count: await collection.countDocuments({ type })
              });
            }
          }
        }
      } else {
        // Collection without 'type' field - treat as single document type
        const sampleDoc = await collection.findOne({});
        if (sampleDoc) {
          const inferredType = collectionName;
          const structure = analyzeDocumentStructure(sampleDoc);
          documentTypes.set(inferredType, {
            collection: collectionName,
            structure,
            sampleFields: Object.keys(sampleDoc),
            count: await collection.countDocuments({})
          });
}
      }
    }
    for (const [type, info] of documentTypes) {
      console.log(`  📄 Document type: ${type}`);
      console.log(`    🔧 Key fields: ${info.structure.textFields.slice(0, 5).join(', ')}${info.structure.textFields.length > 5 ? '...' : ''}`);
    }
    
    return documentTypes;
    
  } catch (error) {
    console.error('❌ Error discovering document types:', error);
    throw error;
  }
}

/**
 * Analyze document structure to identify semantic fields
 */
function analyzeDocumentStructure(document) {
  const structure = {
    textFields: [],
    numericFields: [],
    dateFields: [],
    objectFields: [],
    arrayFields: [],
    identifierFields: []
  };
  
  function analyzeField(key, value, path = '') {
    const fullPath = path ? `${path}.${key}` : key;
    
    // Skip system fields
    if (['_id', '__v', 'deleted', 'deleted_at', 'deleted_by', 'created_date', 'last_updated', 'created_by', 'updated_by'].includes(key)) {
      return;
    }
    
    // Skip RAG fields
    if (['embedding', 'semanticText', 'searchableContent', 'lastEmbeddingUpdate', 'ragMetadata'].includes(key)) {
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
      structure.arrayFields.push(fullPath);
      // Analyze array elements
      if (value.length > 0) {
        analyzeField(`${key}[0]`, value[0], path);
      }
    } else if (type === 'object') {
      structure.objectFields.push(fullPath);
      // Recursively analyze object properties
      for (const [subKey, subValue] of Object.entries(value)) {
        analyzeField(subKey, subValue, fullPath);
      }
    }
  }
  
  // Analyze all fields in the document
  for (const [key, value] of Object.entries(document)) {
    analyzeField(key, value);
  }
  
  return structure;
}

/**
 * Universal Vector Search Index Creation
 * Creates indexes for any collection/document type combination
 */
async function createUniversalVectorIndexes(db, documentTypes) {
const indexResults = [];
  
  for (const [docType, info] of documentTypes) {
    const indexName = `${CONFIG.vector.indexPrefix}_${docType}`;
    
    try {
const collection = db.collection(info.collection);
      
      // Universal index configuration
      const indexConfig = {
        name: indexName,
        type: "vectorSearch",
        definition: {
          "fields": [
            {
              "type": "vector",
              "path": "embedding",
              "numDimensions": CONFIG.openai.dimensions,
              "similarity": CONFIG.vector.similarity
            },
            // Universal filter fields that work for any document type
            {
              "type": "filter",
              "path": "tenantId"
            },
            {
              "type": "filter", 
              "path": "type"
            },
            {
              "type": "filter",
              "path": "deleted"
            },
            // Add identifier fields as filters
            ...info.structure.identifierFields.map(field => ({
              "type": "filter",
              "path": field
            }))
          ]
        }
      };
      
      if (!dryRun) {
        try {
          await collection.createSearchIndex(indexConfig);
indexResults.push({ docType, indexName, status: 'created' });
        } catch (indexError) {
          if (indexError.message.includes('already exists')) {
indexResults.push({ docType, indexName, status: 'exists' });
          } else if (indexError.message.includes('not supported') || indexError.message.includes('Atlas')) {
console.log(JSON.stringify(indexConfig, null, 2));
            indexResults.push({ docType, indexName, status: 'atlas_required', config: indexConfig });
          } else {
            throw indexError;
          }
        }
      } else {
console.log(JSON.stringify(indexConfig, null, 2));
        indexResults.push({ docType, indexName, status: 'dry_run', config: indexConfig });
      }
      
    } catch (error) {
      console.error(`❌ Error creating index for ${docType}:`, error.message);
      indexResults.push({ docType, indexName, status: 'error', error: error.message });
    }
  }
  
  return indexResults;
}

/**
 * Universal Semantic Text Generation
 * Generates meaningful semantic text from any document structure
 */
function generateUniversalSemanticText(document, structure) {
  const semanticParts = [];
  
  // Add document type and basic info
  if (document.type) {
    semanticParts.push(`Document type: ${document.type}`);
  }
  
  // Add text fields (most important for semantic meaning)
  structure.textFields.forEach(field => {
    const value = getNestedValue(document, field);
    if (value && typeof value === 'string' && value.trim()) {
      const fieldName = field.split('.').pop();
      semanticParts.push(`${fieldName}: ${value.trim()}`);
    }
  });
  
  // Add important identifier fields
  structure.identifierFields.forEach(field => {
    const value = getNestedValue(document, field);
    if (value) {
      const fieldName = field.split('.').pop();
      semanticParts.push(`${fieldName}: ${value}`);
    }
  });
  
  // Add numeric fields with meaningful names
  structure.numericFields.forEach(field => {
    const value = getNestedValue(document, field);
    if (value !== null && value !== undefined) {
      const fieldName = field.split('.').pop();
      // Only include numeric fields that seem meaningful
      if (fieldName.includes('amount') || fieldName.includes('count') || 
          fieldName.includes('content') || fieldName.includes('value') ||
          fieldName.includes('price') || fieldName.includes('quantity')) {
        semanticParts.push(`${fieldName}: ${value}`);
      }
    }
  });
  
  // Add date fields
  structure.dateFields.forEach(field => {
    const value = getNestedValue(document, field);
    if (value) {
      const fieldName = field.split('.').pop();
      const dateStr = value instanceof Date ? value.toISOString().split('T')[0] : value;
      semanticParts.push(`${fieldName}: ${dateStr}`);
    }
  });
  
  // Add array fields (summarized)
  structure.arrayFields.forEach(field => {
    const value = getNestedValue(document, field);
    if (Array.isArray(value) && value.length > 0) {
      const fieldName = field.split('.').pop();
      semanticParts.push(`${fieldName}: ${value.length} items`);
    }
  });
  
  return semanticParts.join('. ');
}

/**
 * Universal Searchable Content Generation
 */
function generateUniversalSearchableContent(document, structure) {
  const keywords = [];
  
  // Add all text content
  structure.textFields.forEach(field => {
    const value = getNestedValue(document, field);
    if (value && typeof value === 'string') {
      keywords.push(value.toLowerCase());
      // Add field name as keyword
      keywords.push(field.replace(/[._]/g, ' ').toLowerCase());
    }
  });
  
  // Add identifier values
  structure.identifierFields.forEach(field => {
    const value = getNestedValue(document, field);
    if (value) {
      keywords.push(String(value).toLowerCase());
    }
  });
  
  // Add document type
  if (document.type) {
    keywords.push(document.type.toLowerCase());
  }
  
  return keywords.join(' ');
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    if (key.includes('[') && key.includes(']')) {
      // Handle array notation like "items[0]"
      const [arrayKey, indexStr] = key.split('[');
      const index = parseInt(indexStr.replace(']', ''));
      return current?.[arrayKey]?.[index];
    }
    return current?.[key];
  }, obj);
}

/**
 * Generate embedding with retry logic
 */
async function generateEmbeddingWithRetry(text, retries = CONFIG.system.maxRetries) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: CONFIG.openai.embeddingModel,
        input: text.substring(0, CONFIG.openai.maxTokens),
        encoding_format: "float"
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error(`❌ Embedding generation attempt ${attempt} failed:`, error.message);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, CONFIG.system.retryDelay));
    }
  }
}

/**
 * Universal Document Processing
 * Processes any document type and generates embeddings
 */
async function processUniversalDocuments(db, documentTypes, options = {}) {
const results = {
    processed: 0,
    updated: 0,
    errors: 0,
    skipped: 0,
    byType: {}
  };
  
  for (const [docType, info] of documentTypes) {
const collection = db.collection(info.collection);
    
    // Build query
    const query = { type: docType };
    if (tenantId) {
      query.tenantId = tenantId;
    }
    
    // Skip documents with recent embeddings unless forced
    if (!options.force) {
      query.$or = [
        { embedding: { $exists: false } },
        { lastEmbeddingUpdate: { $exists: false } },
        { 
          lastEmbeddingUpdate: { 
            $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days old
          }
        }
      ];
    }
    
    const totalDocs = await collection.countDocuments(query);
if (totalDocs === 0) {
continue;
    }
    
    results.byType[docType] = { processed: 0, updated: 0, errors: 0, skipped: 0 };
    
    // Process in batches
    let processed = 0;
    
    while (processed < totalDocs) {
      const documents = await collection
        .find(query)
        .skip(processed)
        .limit(CONFIG.vector.batchSize)
        .toArray();
      
      if (documents.length === 0) break;
for (const doc of documents) {
        try {
          results.processed++;
          results.byType[docType].processed++;
          
          // Generate semantic text using universal algorithm
          const semanticText = generateUniversalSemanticText(doc, info.structure);
          
          if (!semanticText || semanticText.length < 10) {
results.skipped++;
            results.byType[docType].skipped++;
            continue;
          }
          
          if (!dryRun) {
            // Generate embedding
            const embedding = await generateEmbeddingWithRetry(semanticText);
            
            // Generate searchable content
            const searchableContent = generateUniversalSearchableContent(doc, info.structure);
            
            // Update document
            const updateResult = await collection.updateOne(
              { _id: doc._id },
              {
                $set: {
                  embedding: embedding,
                  semanticText: semanticText,
                  searchableContent: searchableContent,
                  lastEmbeddingUpdate: new Date(),
                  ragMetadata: {
                    embeddingModel: CONFIG.openai.embeddingModel,
                    semanticVersion: "2.0",
                    generatedAt: new Date(),
                    sourceGadget: "universal-vector-system",
                    autoGenerated: true
                  }
                }
              }
            );
            
            if (updateResult.modifiedCount > 0) {
              results.updated++;
              results.byType[docType].updated++;
            }
          } else {
results.updated++;
            results.byType[docType].updated++;
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, CONFIG.vector.rateLimitDelay));
          
        } catch (error) {
          results.errors++;
          results.byType[docType].errors++;
          console.error(`    ❌ Error processing ${doc._id}:`, error.message);
        }
      }
      
      processed += documents.length;
      
      const progress = Math.round((processed / totalDocs) * 100);
      console.log(`    Progress: ${processed}/${totalDocs} (${progress}%)`);
}
  }
  
  return results;
}

/**
 * MongoDB Change Streams for Real-time Vector Updates
 */
async function startChangeStreamWatcher(db, documentTypes) {
const collections = [...new Set([...documentTypes.values()].map(info => info.collection))];
  
  for (const collectionName of collections) {
    const collection = db.collection(collectionName);
// Create change stream
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
    
    changeStream.on('change', async (change) => {
      try {
const document = change.fullDocument;
        if (!document || !document.type) return;
        
        const docTypeInfo = documentTypes.get(document.type);
        if (!docTypeInfo) {
return;
        }
        
        // Skip if embedding is recent (avoid infinite loops)
        if (document.lastEmbeddingUpdate && 
            (Date.now() - new Date(document.lastEmbeddingUpdate).getTime()) < 60000) {
          return;
        }
// Generate semantic text
        const semanticText = generateUniversalSemanticText(document, docTypeInfo.structure);
        
        if (semanticText && semanticText.length >= 10) {
          // Generate embedding
          const embedding = await generateEmbeddingWithRetry(semanticText);
          
          // Generate searchable content
          const searchableContent = generateUniversalSearchableContent(document, docTypeInfo.structure);
          
          // Update document with new vectors
          await collection.updateOne(
            { _id: document._id },
            {
              $set: {
                embedding: embedding,
                semanticText: semanticText,
                searchableContent: searchableContent,
                lastEmbeddingUpdate: new Date(),
                ragMetadata: {
                  embeddingModel: CONFIG.openai.embeddingModel,
                  semanticVersion: "2.0",
                  generatedAt: new Date(),
                  sourceGadget: "universal-vector-system",
                  autoGenerated: true,
                  trigger: change.operationType
                }
              }
            }
          );
}
        
      } catch (error) {
        console.error('❌ Change stream processing error:', error);
      }
    });
    
    changeStream.on('error', (error) => {
      console.error(`❌ Change stream error for ${collectionName}:`, error);
      // Restart change stream after delay
      setTimeout(() => {
startChangeStreamWatcher(db, documentTypes);
      }, 5000);
    });
  }
// Keep process alive
  process.on('SIGINT', () => {
process.exit(0);
  });
  
  // Keep the process running
  await new Promise(() => {}); // Never resolves
}

/**
 * Main execution function
 */
async function runUniversalVectorSystem() {
console.log('====================================================\n');
console.log(`🏢 Tenant Filter: ${tenantId || 'All tenants'}`);
let client;
  
  try {
    // Connect to MongoDB
client = new MongoClient(CONFIG.mongodb.uri);
    await client.connect();
    const db = client.db(CONFIG.mongodb.database);
// Discover all document types
    const documentTypes = await discoverDocumentTypes(db);
    
    if (documentTypes.size === 0) {
return;
    }
    
    // Execute based on mode
    if (mode === 'setup' || mode === 'all') {
      const indexResults = await createUniversalVectorIndexes(db, documentTypes);
      indexResults.forEach(result => {
        console.log(`  • Index created for ${result.collection}: ${result.indexName}`);
      });
    }
    
    if (mode === 'generate' || mode === 'all') {
      const processResults = await processUniversalDocuments(db, documentTypes);
console.log(`  📄 Total processed: ${processResults.processed}`);
console.log(`  ⏭️  Total skipped: ${processResults.skipped}`);
console.log('\n📋 By Document Type:');
      for (const [docType, stats] of Object.entries(processResults.byType)) {
        console.log(`    • ${docType}: updated=${stats.updated}, errors=${stats.errors}, skipped=${stats.skipped}`);
      }
    }
    
    if (mode === 'watch' || mode === 'all') {
      await startChangeStreamWatcher(db, documentTypes);
    }
    
  } catch (error) {
    console.error('❌ Universal vector system error:', error);
    process.exit(1);
  } finally {
    if (client && mode !== 'watch' && mode !== 'all') {
      await client.close();
}
  }
}

// Export for use as module
module.exports = {
  runUniversalVectorSystem,
  discoverDocumentTypes,
  generateUniversalSemanticText,
  generateUniversalSearchableContent,
  CONFIG
};

// Run if called directly
if (require.main === module) {
  runUniversalVectorSystem();
}
