#!/usr/bin/env node

/**
 * Create VOC Vector Search Index
 * Creates the specific index needed for VOC RAG functionality
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function createVOCIndex() {
  let client;
  
  try {
console.log('===================================\n');
    
    // Connect to MongoDB
client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('test');
const documentsCollection = db.collection('documents');
    
    // Correct Atlas vector search index format
    const vocIndexConfig = {
      name: "voc_vector_search",
      type: "vectorSearch",
      definition: {
        "fields": [
          {
            "type": "vector",
            "path": "embedding",
            "numDimensions": 1536,
            "similarity": "cosine"
          },
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
          {
            "type": "filter",
            "path": "companyId"
          },
          {
            "type": "filter",
            "path": "facilityId"
          },
          {
            "type": "filter",
            "path": "company_id"
          },
          {
            "type": "filter",
            "path": "id"
          },
          {
            "type": "filter",
            "path": "status"
          }
        ]
      }
    };
console.log('📊 Index name: voc_vector_search');
console.log('📐 Dimensions: 1536');
try {
      await documentsCollection.createSearchIndex(vocIndexConfig);
console.log('⏱️  Index will be ready in 5-10 minutes');
} catch (createError) {
      if (createError.message.includes('already exists')) {
} else {
console.log('\n🔧 Manual Creation Required:');
console.log('Use Vector Search type with this configuration:');
}
    }
    
    // Show what documents are ready
const vocTypes = [
      { type: 'paintInvoice', description: 'Paint purchase invoices' },
      { type: 'paint_specifications', description: 'Paint product specifications' },
      { type: 'company', description: 'Company information' },
      { type: 'site', description: 'Facility and site data' }
    ];
    
    for (const { type, description } of vocTypes) {
      const count = await documentsCollection.countDocuments({
        type,
        embedding: { $exists: true }
      });
      console.log(`  • ${description} (${type}): ${count} documents with embeddings`);
    }
    
    const totalVOCDocs = await documentsCollection.countDocuments({
      type: { $in: ['paintInvoice', 'paint_specifications', 'company', 'site'] },
      embedding: { $exists: true }
    });
    console.log(`\nTotal VOC-enabled documents: ${totalVOCDocs}`);
console.log('\n📋 Test Commands (run after index is ready):');
console.log('$env:DATABASE_NAME="test"; node scripts/test-rag-chatbot.js --endpoint=http://localhost:4000');
    
  } catch (error) {
    console.error('❌ Failed to create VOC index:', error);
  } finally {
    if (client) {
      await client.close();
}
  }
}

createVOCIndex();
