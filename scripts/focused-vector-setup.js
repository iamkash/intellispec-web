#!/usr/bin/env node

/**
 * Focused Vector Setup for VOC Use Case
 * 
 * Creates vector search indexes only for the most important document types
 * to work within MongoDB Atlas index limits.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

// Configuration
const CONFIG = {
  mongodb: {
    uri: process.env.MONGODB_URI,
    database: process.env.DATABASE_NAME || 'test'
  },
  // Focus on the most important document types for VOC
  priorityDocumentTypes: [
    'paintInvoice',
    'paint_specifications', 
    'company',
    'site'
  ]
};

async function createFocusedVectorIndexes() {
  let client;
  
  try {
console.log('=========================================\n');
    
    // Connect to MongoDB
client = new MongoClient(CONFIG.mongodb.uri);
    await client.connect();
    const db = client.db(CONFIG.mongodb.database);
// Create a single comprehensive index for the documents collection
    const collection = db.collection('documents');
const indexConfig = {
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
          // Universal filter fields
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
          // VOC-specific filter fields
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
            "path": "site_id"
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
    
    try {
      await collection.createSearchIndex(indexConfig);
console.log('   📊 Supports all document types in documents collection');
} catch (indexError) {
      if (indexError.message.includes('already exists')) {
} else if (indexError.message.includes('maximum number')) {
console.log('\n💡 Manual Setup Required:');
console.log('2. Use this configuration:');
} else {
        throw indexError;
      }
    }
    
    // Check document counts for priority types
    for (const docType of CONFIG.priorityDocumentTypes) {
      const count = await collection.countDocuments({ type: docType });
      if (count > 0) {
        const sample = await collection.findOne({ type: docType });
        const hasEmbedding = !!sample?.embedding;
        console.log(`  • ${docType}: ${count} docs (embedding ${hasEmbedding ? 'available' : 'missing'})`);
      } else {
        console.log(`  • ${docType}: no documents found`);
      }
    }
console.log('\n📋 Next Steps:');
console.log('2. Test RAG chatbot: $env:DATABASE_NAME="test"; node scripts/test-rag-chatbot.js');
    
  } catch (error) {
    console.error('❌ Focused vector setup failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
}
  }
}

createFocusedVectorIndexes();
