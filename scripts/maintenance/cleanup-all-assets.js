require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI;
const TENANT_ID = process.env.TENANT_ID || 't_hf_sinclair';

async function cleanupAllAssets() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    console.log('🔍 Searching for all assets...');
    
    // Find all assets
    const assets = await db.collection('documents').find({
      tenantId: TENANT_ID,
      type: 'asset'
    }).toArray();
    
    console.log(`📊 Found ${assets.length} assets:\n`);
    
    if (assets.length > 0) {
      // Show sample (first 5)
      console.log('📋 Sample assets (first 5):');
      assets.slice(0, 5).forEach((doc, idx) => {
        console.log(`   ${idx + 1}. ID: ${doc.id}, Name: ${doc.name || 'N/A'}, Asset Tag: ${doc.asset_tag || 'N/A'}`);
      });
      
      if (assets.length > 5) {
        console.log(`   ... and ${assets.length - 5} more\n`);
      } else {
        console.log('');
      }
      
      console.log('⚠️  PRESS CTRL+C NOW TO CANCEL ⚠️');
      console.log('Deleting all assets in 3 seconds...\n');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('🗑️  Deleting all assets...\n');
      
      const deleteResult = await db.collection('documents').deleteMany({
        tenantId: TENANT_ID,
        type: 'asset'
      });
      
      console.log(`✅ Deleted ${deleteResult.deletedCount} assets successfully!`);
      console.log('✅ Cleanup complete! All assets removed.\n');
    } else {
      console.log('✅ No assets found. Database is clean!\n');
    }
    
    console.log('🔌 Disconnected from MongoDB');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

cleanupAllAssets();
