#!/usr/bin/env node

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkDatabase() {
  let client;
  
  try {
client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db('intellispec');
// List all collections
    const collections = await db.listCollections().toArray();
if (collections.length === 0) {
return;
    }
    
    // Check each collection
    for (const collectionInfo of collections) {
      const collection = db.collection(collectionInfo.name);
      const count = await collection.countDocuments();
if (count > 0) {
        // Check document types
        const types = await collection.distinct('type');
        if (types.length > 0) {
}
        
        // Show sample document structure
        const sample = await collection.findOne({});
        if (sample) {
          const fields = Object.keys(sample).slice(0, 10);
}
      }
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    if (client) {
      await client.close();
}
  }
}

checkDatabase();
