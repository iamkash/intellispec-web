const mongoose = require('mongoose');
require('dotenv').config();

async function checkExistingData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intellispec');
    const db = mongoose.connection.db;
    const collection = db.collection('documents');

    console.log('🔍 Checking existing asset data...');

    const companies = await collection.find({ type: 'company' }).toArray();
    const sites = await collection.find({ type: 'site' }).toArray();
    const assetGroups = await collection.find({ type: 'asset_group' }).toArray();
    const assets = await collection.find({ type: 'asset' }).toArray();

    console.log(`📊 Companies: ${companies.length}`);
    companies.slice(0, 3).forEach(c => console.log(`  - ${c.name} (${c.id})`));
    if (companies.length > 3) console.log(`  ... and ${companies.length - 3} more`);

    console.log(`📊 Sites: ${sites.length}`);
    sites.slice(0, 3).forEach(s => console.log(`  - ${s.name} (${s.id})`));

    console.log(`📊 Asset Groups: ${assetGroups.length}`);
    console.log(`📊 Assets: ${assets.length}`);

  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkExistingData();
