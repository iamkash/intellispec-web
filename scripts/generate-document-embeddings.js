#!/usr/bin/env node

/**
 * Document Embeddings Generation Script
 * 
 * This script generates embeddings for existing documents to enable RAG functionality.
 * It processes documents based on the VOC workspace configuration and creates:
 * - Vector embeddings using OpenAI's text-embedding-3-small model
 * - Semantic text for improved context building
 * - Searchable content for keyword matching
 * 
 * Prerequisites:
 * - OpenAI API key in OPENAI_API_KEY environment variable
 * - MongoDB connection with documents to process
 * - Vector search index already created
 * 
 * Usage: node scripts/generate-document-embeddings.js [--dry-run] [--batch-size=50] [--document-type=paintInvoice]
 */

const { MongoClient } = require('mongodb');
const OpenAI = require('openai');
require('dotenv').config();

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intellispec';
const DATABASE_NAME = process.env.DATABASE_NAME || 'test';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// VOC Workspace Configuration (from voc-workspace.json)
const VOC_RAG_CONFIG = {
  embeddingModel: 'text-embedding-3-small',
  embeddingDimensions: 1536,
  contextSources: [
    {
      type: 'paintInvoice',
      description: 'Paint purchase invoices with VOC content tracking',
      fields: [
        'companyId', 'facilityId', 'purchaseDate', 'totalAmount',
        'lineItems', 'supplier', 'invoiceNumber'
      ]
    },
    {
      type: 'paint_specifications',
      description: 'Paint product specifications with VOC emissions data',
      fields: [
        'manufacturer', 'product', 'product_code', 'voc_content',
        'density', 'coverage', 'application_method', 'regulatory_info'
      ]
    },
    {
      type: 'company',
      description: 'Company information and compliance status',
      fields: [
        'name', 'industry', 'compliance_status', 'headquarters',
        'contact', 'founded_year', 'employee_count', 'annual_revenue'
      ]
    },
    {
      type: 'site',
      description: 'Facility and site information',
      fields: [
        'name', 'site_type', 'company_id', 'location', 'capacity'
      ]
    }
  ],
  semanticFields: [
    'manufacturer', 'product', 'product_code', 'voc_content',
    'companyId', 'facilityId', 'purchaseDate', 'totalAmount',
    'supplier', 'invoiceNumber', 'lineItems', 'name', 'industry'
  ]
};

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
const documentTypeArg = args.find(arg => arg.startsWith('--document-type='));

const BATCH_SIZE = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 50;
const DOCUMENT_TYPE_FILTER = documentTypeArg ? documentTypeArg.split('=')[1] : null;

/**
 * Generate embedding using OpenAI
 */
async function generateEmbedding(text, model = 'text-embedding-3-small') {
  try {
    const response = await openai.embeddings.create({
      model: model,
      input: text.substring(0, 8000), // Limit input length
      encoding_format: "float"
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    throw error;
  }
}

/**
 * Generate semantic text from document based on context source configuration
 */
function generateSemanticText(document) {
  const contextSource = VOC_RAG_CONFIG.contextSources.find(source => source.type === document.type);
  
  if (!contextSource) {
    return `Document of type ${document.type}`;
  }
  
  const semanticParts = [];
  
  // Add description
  if (contextSource.description) {
    semanticParts.push(contextSource.description);
  }
  
  // Add field values
  contextSource.fields.forEach(field => {
    const value = getNestedValue(document, field);
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'object') {
        semanticParts.push(`${field}: ${JSON.stringify(value)}`);
      } else {
        semanticParts.push(`${field}: ${value}`);
      }
    }
  });
  
  return semanticParts.join('. ');
}

/**
 * Extract searchable content from document
 */
function extractSearchableContent(document) {
  const keywords = [];
  
  VOC_RAG_CONFIG.semanticFields.forEach(field => {
    const value = getNestedValue(document, field);
    if (value !== undefined && value !== null && value !== '') {
      // Convert field value to searchable keywords
      const stringValue = String(value).toLowerCase();
      keywords.push(stringValue);
      
      // Add field name as keyword
      keywords.push(field.replace(/_/g, ' '));
    }
  });
  
  return keywords.join(' ');
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Process documents in batches to generate embeddings
 */
async function processDocumentBatch(collection, documents) {
  const results = {
    processed: 0,
    updated: 0,
    errors: 0,
    skipped: 0
  };
  
  for (const doc of documents) {
    try {
      results.processed++;
      
      // Skip if embedding already exists and is recent
      if (doc.embedding && doc.lastEmbeddingUpdate &&
          (Date.now() - new Date(doc.lastEmbeddingUpdate).getTime()) < 7 * 24 * 60 * 60 * 1000) {
results.skipped++;
        continue;
      }
      
      // Generate semantic text
      const semanticText = generateSemanticText(doc);
      
      if (!semanticText || semanticText.length < 10) {
results.skipped++;
        continue;
      }
if (!isDryRun) {
        // Generate embedding
        const embedding = await generateEmbedding(semanticText, VOC_RAG_CONFIG.embeddingModel);
        
        // Extract searchable content
        const searchableContent = extractSearchableContent(doc);
        
        // Update document with RAG fields
        const updateResult = await collection.updateOne(
          { _id: doc._id },
          {
            $set: {
              embedding: embedding,
              semanticText: semanticText,
              searchableContent: searchableContent,
              lastEmbeddingUpdate: new Date(),
              ragMetadata: {
                embeddingModel: VOC_RAG_CONFIG.embeddingModel,
                semanticVersion: "1.0",
                generatedAt: new Date()
              }
            }
          }
        );
        
        if (updateResult.modifiedCount > 0) {
          results.updated++;
} else {
}
      } else {
console.log(`   Semantic text: ${semanticText.substring(0, 100)}...`);
        results.updated++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      results.errors++;
      console.error(`❌ Error processing ${doc.type}:${doc.id}:`, error.message);
    }
  }
  
  return results;
}

/**
 * Main function to generate embeddings for all documents
 */
async function generateDocumentEmbeddings() {
  let client;
  
  try {
client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection('documents');
if (isDryRun) {
}
    
    // Build query filter
    const query = {
      $or: VOC_RAG_CONFIG.contextSources.map(source => ({ type: source.type }))
    };
    
    if (DOCUMENT_TYPE_FILTER) {
      query.type = DOCUMENT_TYPE_FILTER;
}
    
    // Count total documents
    const totalDocs = await collection.countDocuments(query);
if (totalDocs === 0) {
return;
    }
    
    // Count documents with existing embeddings
    const existingEmbeddings = await collection.countDocuments({
      ...query,
      embedding: { $exists: true }
    });
// Process documents in batches
    let processed = 0;
    const totalResults = {
      processed: 0,
      updated: 0,
      errors: 0,
      skipped: 0
    };
while (processed < totalDocs) {
      const documents = await collection
        .find(query)
        .skip(processed)
        .limit(BATCH_SIZE)
        .toArray();
      
      if (documents.length === 0) break;
const batchResults = await processDocumentBatch(collection, documents);
      
      // Accumulate results
      Object.keys(totalResults).forEach(key => {
        totalResults[key] += batchResults[key];
      });
      
      processed += documents.length;
}
    
    // Final summary
console.log('\n📊 Summary:');
console.log(`  ✅ Documents updated: ${totalResults.updated}`);
console.log(`  ❌ Errors: ${totalResults.errors}`);
    
    if (!isDryRun && totalResults.updated > 0) {
const finalEmbeddingCount = await collection.countDocuments({
        ...query,
        embedding: { $exists: true }
      });
// Sample verification
      const sampleDoc = await collection.findOne({
        ...query,
        embedding: { $exists: true }
      });
      
      if (sampleDoc) {
console.log(`  Type: ${sampleDoc.type}`);
console.log(`  Embedding dimensions: ${sampleDoc.embedding?.length || 0}`);
console.log(`  Last updated: ${sampleDoc.lastEmbeddingUpdate}`);
      }
    }
console.log('1. ✅ Document embeddings generated');
console.log('3. 🔍 Monitor search performance and relevance');
} catch (error) {
    console.error('❌ Error generating embeddings:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
}
  }
}

// Run the script
if (require.main === module) {
console.log('=====================================\n');
  
  if (isDryRun) {
}
  
  generateDocumentEmbeddings();
}

module.exports = { 
  generateDocumentEmbeddings, 
  generateSemanticText, 
  extractSearchableContent,
  VOC_RAG_CONFIG 
};
