/**
 * Cleanup Script: Delete assets with wrong document types
 * 
 * Problem: Assets were created with type="Pipe", type="Vessel", etc.
 * instead of type="asset" with asset_type="Pipe"
 * 
 * This script finds and deletes all documents with incorrect types.
 */

const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI;

if (!mongoUri) {
  console.error('❌ MONGODB_URI not found in .env file');
  process.exit(1);
}

// Define the Document schema (matching your existing schema)
const DocumentSchema = new mongoose.Schema({
  id: String,
  type: String,
  tenantId: String,
  deleted: Boolean,
  // ... other fields
}, { 
  collection: 'documents',
  strict: false // Allow any fields
});

const Document = mongoose.model('Document', DocumentSchema);

async function cleanupWrongAssetTypes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // List of incorrect types (asset_type values that were used as document type)
    const incorrectTypes = [
      'Pipe',
      'Valve',
      'Tank',
      'Pump',
      'Compressor',
      'Heat Exchanger',
      'Exchanger',
      'Vessel',
      'Reactor',
      'Instrument',
      'Motor',
      'Electrical'
    ];

    // Find all documents with these incorrect types
    console.log('🔍 Searching for incorrectly typed documents...');
    const wrongDocs = await Document.find({
      type: { $in: incorrectTypes },
      deleted: { $ne: true }
    }).lean();

    console.log(`\n📊 Found ${wrongDocs.length} documents with incorrect types:\n`);

    // Group by type to show summary
    const byType = {};
    wrongDocs.forEach(doc => {
      byType[doc.type] = (byType[doc.type] || 0) + 1;
    });

    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   • ${type}: ${count} documents`);
    });

    if (wrongDocs.length === 0) {
      console.log('\n✅ No incorrect documents found. Database is clean!');
      await mongoose.disconnect();
      return;
    }

    // Show sample of documents to be deleted
    console.log('\n📋 Sample documents to be deleted (first 3):');
    wrongDocs.slice(0, 3).forEach(doc => {
      console.log(`   • ID: ${doc.id}, Type: ${doc.type}, Name: ${doc.name || 'N/A'}, Asset Tag: ${doc.asset_tag || 'N/A'}`);
    });

    // Ask for confirmation (in Node.js we'll just proceed - user can Ctrl+C to cancel)
    console.log('\n⚠️  PRESS CTRL+C NOW TO CANCEL ⚠️');
    console.log('Deleting in 3 seconds...\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Delete the incorrect documents
    console.log('🗑️  Deleting incorrect documents...');
    const deleteResult = await Document.deleteMany({
      type: { $in: incorrectTypes },
      deleted: { $ne: true }
    });

    console.log(`\n✅ Deleted ${deleteResult.deletedCount} documents successfully!`);

    // Verify cleanup
    const remaining = await Document.countDocuments({
      type: { $in: incorrectTypes },
      deleted: { $ne: true }
    });

    if (remaining === 0) {
      console.log('✅ Cleanup complete! All incorrect documents removed.');
    } else {
      console.log(`⚠️  Warning: ${remaining} documents still remain. Run script again.`);
    }

    // Show current asset count
    const correctAssets = await Document.countDocuments({
      type: 'asset',
      deleted: { $ne: true }
    });
    console.log(`\n📊 Current asset count (type="asset"): ${correctAssets}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupWrongAssetTypes();
