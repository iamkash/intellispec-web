/**
 * Check Script: View assets with wrong document types (DRY RUN - NO DELETION)
 */

const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI;

if (!mongoUri) {
  console.error('❌ MONGODB_URI not found in .env file');
  process.exit(1);
}

const DocumentSchema = new mongoose.Schema({
  id: String,
  type: String,
  tenantId: String,
  deleted: Boolean,
}, { 
  collection: 'documents',
  strict: false
});

const Document = mongoose.model('Document', DocumentSchema);

async function checkWrongAssetTypes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const incorrectTypes = [
      'Pipe', 'Valve', 'Tank', 'Pump', 'Compressor',
      'Heat Exchanger', 'Exchanger', 'Vessel', 'Reactor',
      'Instrument', 'Motor', 'Electrical'
    ];

    console.log('🔍 Searching for incorrectly typed documents...\n');
    const wrongDocs = await Document.find({
      type: { $in: incorrectTypes },
      deleted: { $ne: true }
    }).lean();

    console.log(`📊 Found ${wrongDocs.length} documents with incorrect types:\n`);

    const byType = {};
    wrongDocs.forEach(doc => {
      byType[doc.type] = (byType[doc.type] || 0) + 1;
    });

    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   ❌ ${type}: ${count} documents`);
    });

    if (wrongDocs.length > 0) {
      console.log('\n📋 All incorrect documents:\n');
      wrongDocs.forEach((doc, idx) => {
        console.log(`${idx + 1}. Type: ${doc.type}, ID: ${doc.id}`);
        console.log(`   Name: ${doc.name || 'N/A'}`);
        console.log(`   Asset Tag: ${doc.asset_tag || 'N/A'}`);
        console.log(`   Tenant: ${doc.tenantId}\n`);
      });
    }

    const correctAssets = await Document.countDocuments({
      type: 'asset',
      deleted: { $ne: true }
    });
    console.log(`\n✅ Current correct assets (type="asset"): ${correctAssets}\n`);

    console.log('💡 To delete these, run: node cleanup-wrong-asset-types.js');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkWrongAssetTypes();
