#!/usr/bin/env node

/**
 * Check Vector Search Index Status
 * Monitors the status of the VOC vector search index
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkIndexStatus() {
  let client;
  
  try {
// Connect to MongoDB
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('test');
    
    const documentsCollection = db.collection('documents');
    
    // List search indexes
try {
      const indexes = await documentsCollection.listSearchIndexes().toArray();
      
      if (indexes.length === 0) {
return;
      }
      
      indexes.forEach(index => {
if (index.status === 'READY') {
} else if (index.status === 'BUILDING') {
} else if (index.status === 'FAILED') {
} else {
}
      });
      
      // Check if VOC index exists and is ready
      const vocIndex = indexes.find(idx => idx.name === 'voc_vector_search');
      
      if (vocIndex) {
if (vocIndex.status === 'READY') {
} else {
}
      } else {
}
      
    } catch (indexError) {
      console.error('❌ Error listing indexes:', indexError.message);
    }
    
    // Show document readiness
const totalWithEmbeddings = await documentsCollection.countDocuments({ 
      embedding: { $exists: true } 
    });
const vocDocs = await documentsCollection.countDocuments({
      type: { $in: ['paintInvoice', 'paint_specifications', 'company', 'site'] },
      embedding: { $exists: true }
    });
} catch (error) {
    console.error('❌ Status check failed:', error);
  } finally {
    if (client) {
      await client.close();
}
  }
}

checkIndexStatus();
