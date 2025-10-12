/**
 * Vector Migration Script
 * 
 * Migrates existing vector data from main documents to separate document_vectors collection
 * Runs safely without data loss - can be run multiple times
 */

const path = require('path');
const mongoose = require('mongoose');
try { require('dotenv').config({ path: path.resolve(process.cwd(), '.env') }); } catch (_) {}
const DocumentVectorModel = require('../models/DocumentVectors');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/intellispec-dev';

async function migrateVectors() {
  try {
    console.log('🚀 Starting vector migration...');
    
    // Connect to MongoDB using same pattern as calculator script
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { maxPoolSize: 5 });
    
    const db = mongoose.connection.db;
    const documentsCollection = db.collection('documents');
    
    // Find all documents with vector data
    const documentsWithVectors = await documentsCollection.find({
      $or: [
        { embedding: { $exists: true, $ne: null } },
        { semanticText: { $exists: true, $ne: null } },
        { searchableContent: { $exists: true, $ne: null } }
      ]
    }).toArray();
    
    console.log(`📊 Found ${documentsWithVectors.length} documents with vector data`);
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const doc of documentsWithVectors) {
      try {
        // Check if vector already exists in separate collection
        const existingVector = await DocumentVectorModel.findOne({
          documentId: doc.id || doc._id.toString(),
          tenantId: doc.tenantId
        });
        
        if (existingVector) {
          skipped++;
          continue;
        }
        
        // Create vector document
        const vectorDoc = new DocumentVectorModel({
          documentId: doc.id || doc._id.toString(),
          documentType: doc.type || 'unknown',
          tenantId: doc.tenantId || 'default-tenant',
          embedding: doc.embedding,
          semanticText: doc.semanticText,
          searchableContent: doc.searchableContent,
          embeddingModel: doc.ragMetadata?.embeddingModel || 'text-embedding-3-small',
          semanticVersion: doc.ragMetadata?.semanticVersion || '2.0',
          lastEmbeddingUpdate: doc.lastEmbeddingUpdate || new Date(),
          created_date: doc.created_date || new Date(),
          last_updated: new Date()
        });
        
        await vectorDoc.save();
        migrated++;
        
        if (migrated % 100 === 0) {
          console.log(`✅ Migrated ${migrated} vectors...`);
        }
        
      } catch (error) {
        console.error(`❌ Error migrating vector for document ${doc.id || doc._id}:`, error.message);
        errors++;
      }
    }
    
    console.log(`🎉 Vector migration completed!`);
    console.log(`📈 Results: ${migrated} migrated, ${skipped} skipped, ${errors} errors`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
    return { migrated, skipped, errors };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateVectors()
    .then((results) => {
      console.log('✅ Migration completed successfully:', results);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateVectors };
