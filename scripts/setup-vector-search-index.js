#!/usr/bin/env node

/**
 * MongoDB Atlas Vector Search Index Setup Script
 * 
 * This script creates the required vector search index for RAG chatbot functionality.
 * Run this script to set up the 'voc_vector_search' index as specified in workspace configs.
 * 
 * Prerequisites:
 * - MongoDB Atlas cluster with vector search capability
 * - Proper connection string in MONGODB_URI environment variable
 * - Documents collection with embedding field
 * 
 * Usage: node scripts/setup-vector-search-index.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intellispec';
const DATABASE_NAME = process.env.DATABASE_NAME || 'intellispec';

/**
 * Vector Search Index Configuration for VOC RAG Chatbot
 * Based on workspace configuration: public/data/workspaces/compliance-manager/voc-workspace.json
 */
const VECTOR_SEARCH_INDEX_CONFIG = {
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
        "path": "companyId"
      },
      {
        "type": "filter",
        "path": "facilityId"
      },
      {
        "type": "filter",
        "path": "deleted"
      }
    ]
  }
};

/**
 * Additional indexes for better performance
 */
const ADDITIONAL_INDEXES = [
  {
    name: "tenant_type_compound",
    definition: { "tenantId": 1, "type": 1, "deleted": 1 }
  },
  {
    name: "embedding_exists",
    definition: { "embedding": 1 }
  },
  {
    name: "semantic_text_index",
    definition: { "semanticText": "text" }
  }
];

async function setupVectorSearchIndex() {
  let client;
  
  try {
client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DATABASE_NAME);
    const collection = db.collection('documents');
// Check if documents exist
    const docCount = await collection.countDocuments();
if (docCount === 0) {
}
    
    // Check if any documents have embeddings
    const embeddingCount = await collection.countDocuments({ embedding: { $exists: true } });
if (embeddingCount === 0) {
}
    
    // Create vector search index (Atlas-specific)
try {
      // Note: This requires MongoDB Atlas with vector search capability
      // For local MongoDB, this will fail - vector search is Atlas-only
      await collection.createSearchIndex(VECTOR_SEARCH_INDEX_CONFIG);
} catch (indexError) {
      if (indexError.message.includes('already exists')) {
} else if (indexError.message.includes('not supported') || indexError.message.includes('Atlas')) {
console.log('📝 Please create this index manually in Atlas UI:');
} else {
        throw indexError;
      }
    }
    
    // Create additional compound indexes for performance
for (const indexConfig of ADDITIONAL_INDEXES) {
      try {
        await collection.createIndex(indexConfig.definition, { name: indexConfig.name });
} catch (indexError) {
        if (indexError.message.includes('already exists')) {
} else {
}
      }
    }
    
    // Verify setup
const indexes = await collection.listIndexes().toArray();
indexes.forEach(index => {
});
    
    // Check document structure
    const sampleDoc = await collection.findOne({});
    if (sampleDoc) {
console.log('  Fields:', Object.keys(sampleDoc));
console.log('  Has semanticText:', !!sampleDoc.semanticText);
console.log('  Tenant ID:', sampleDoc.tenantId);
    }
// Next steps guidance
console.log('1. ✅ Vector search index setup (completed)');
console.log('3. 🧪 Test RAG chatbot functionality');
} catch (error) {
    console.error('❌ Error setting up vector search index:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
}
  }
}

// Run the setup
if (require.main === module) {
  setupVectorSearchIndex();
}

module.exports = { setupVectorSearchIndex, VECTOR_SEARCH_INDEX_CONFIG };
