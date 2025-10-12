#!/usr/bin/env node

/**
 * MongoDB Atlas Index Management Script
 * 
 * This script attempts to delete unnecessary indexes and create the VOC vector search index.
 * Note: Index management via API has limitations on Atlas free tier.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function manageAtlasIndexes() {
  let client;
  
  try {
console.log('=================================\n');
    
    // Connect to MongoDB
client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('test');
// List current search indexes
const collections = ['organizations', 'referencelistoptions', 'referencelisttypes', 'documents'];
    
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const indexes = await collection.listSearchIndexes().toArray();
        
        if (indexes.length > 0) {
indexes.forEach(index => {
});
          
          // Attempt to delete unnecessary indexes
          if (collectionName === 'referencelistoptions' || collectionName === 'referencelisttypes') {
for (const index of indexes) {
              try {
                await collection.dropSearchIndex(index.name);
} catch (deleteError) {
                if (deleteError.message.includes('not found')) {
} else {
}
              }
            }
          }
        }
      } catch (error) {
}
    }
    
    // Create VOC vector search index
const documentsCollection = db.collection('documents');
    
    const vocIndexConfig = {
      name: "voc_vector_search",
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
    
    try {
      await documentsCollection.createSearchIndex(vocIndexConfig);
console.log('📊 Index name: voc_vector_search');
console.log('⏱️  Index will be ready in 5-10 minutes');
    } catch (createError) {
      if (createError.message.includes('already exists')) {
} else if (createError.message.includes('maximum number')) {
console.log('\n🔧 Manual Steps Required:');
console.log('2. Delete: universal_vector_referencelistoptions');
console.log('4. Create: voc_vector_search with the configuration below');
console.log(JSON.stringify(vocIndexConfig, null, 2));
      } else {
}
    }
    
    // Verify documents are ready
const totalDocs = await documentsCollection.countDocuments({});
    const withEmbeddings = await documentsCollection.countDocuments({ embedding: { $exists: true } });
console.log(`🤖 With embeddings: ${withEmbeddings}`);
    
    const vocTypes = ['paintInvoice', 'paint_specifications', 'company', 'site'];
    for (const type of vocTypes) {
      const count = await documentsCollection.countDocuments({ type, embedding: { $exists: true } });
}
if (withEmbeddings > 0) {
console.log('1. Wait 5-10 minutes for index to be ready');
console.log('3. Use VOC workspace to ask questions about paint specs and VOC content');
    }
    
  } catch (error) {
    console.error('❌ Index management failed:', error);
  } finally {
    if (client) {
      await client.close();
}
  }
}

manageAtlasIndexes();
