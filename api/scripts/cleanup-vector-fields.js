/**
 * Vector Fields Cleanup Script
 * 
 * Removes vector fields from main documents after successful migration
 * to complete the document size optimization
 */

const path = require('path');
const mongoose = require('mongoose');
try { require('dotenv').config({ path: path.resolve(process.cwd(), '.env') }); } catch (_) {}

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/intellispec-dev';

async function cleanupVectorFields() {
  try {
    console.log('🧹 Starting vector fields cleanup...');
    
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { maxPoolSize: 5 });
    
    const db = mongoose.connection.db;
    const documentsCollection = db.collection('documents');
    
    // Find all documents with vector fields
    const documentsWithVectors = await documentsCollection.countDocuments({
      $or: [
        { embedding: { $exists: true } },
        { semanticText: { $exists: true } },
        { searchableContent: { $exists: true } },
        { lastEmbeddingUpdate: { $exists: true } },
        { ragMetadata: { $exists: true } }
      ]
    });
    
    console.log(`📊 Found ${documentsWithVectors} documents with vector fields to clean up`);
    
    if (documentsWithVectors === 0) {
      console.log('✅ No vector fields found in documents - cleanup already complete!');
      await mongoose.disconnect();
      return { cleaned: 0, errors: 0 };
    }
    
    // Remove vector fields from all documents
    console.log('🗑️ Removing vector fields from documents...');
    
    const result = await documentsCollection.updateMany(
      {
        $or: [
          { embedding: { $exists: true } },
          { semanticText: { $exists: true } },
          { searchableContent: { $exists: true } },
          { lastEmbeddingUpdate: { $exists: true } },
          { ragMetadata: { $exists: true } }
        ]
      },
      {
        $unset: {
          embedding: "",
          semanticText: "",
          searchableContent: "",
          lastEmbeddingUpdate: "",
          ragMetadata: ""
        },
        $set: {
          last_updated: new Date()
        }
      }
    );
    
    console.log(`🎉 Vector fields cleanup completed!`);
    console.log(`📈 Results: ${result.modifiedCount} documents cleaned, ${result.matchedCount} documents matched`);
    
    // Verify cleanup
    const remainingVectors = await documentsCollection.countDocuments({
      $or: [
        { embedding: { $exists: true } },
        { semanticText: { $exists: true } },
        { searchableContent: { $exists: true } },
        { lastEmbeddingUpdate: { $exists: true } },
        { ragMetadata: { $exists: true } }
      ]
    });
    
    if (remainingVectors === 0) {
      console.log('✅ Verification successful - no vector fields remain in documents');
    } else {
      console.warn(`⚠️ Warning: ${remainingVectors} documents still have vector fields`);
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
    return { 
      cleaned: result.modifiedCount, 
      matched: result.matchedCount,
      remaining: remainingVectors,
      errors: 0 
    };
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    throw error;
  }
}

// Run cleanup if called directly
if (require.main === module) {
  cleanupVectorFields()
    .then((results) => {
      console.log('✅ Cleanup completed successfully:', results);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupVectorFields };
