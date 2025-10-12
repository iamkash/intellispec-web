const mongoose = require('mongoose');
require('dotenv').config();

async function removeTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intellispec');
    const db = mongoose.connection.db;
    const collection = db.collection('documents');

    console.log('🧹 Removing test asset data...');

    // Remove the test data I added
    const testIds = [
      'company_001', 'company_002', 'company_003',
      'site_001', 'site_002', 'site_003', 'site_004', 'site_005',
      'asset_group_001', 'asset_group_002', 'asset_group_003', 'asset_group_004', 'asset_group_005',
      'asset_001', 'asset_002', 'asset_003', 'asset_004', 'asset_005'
    ];

    const result = await collection.deleteMany({ id: { $in: testIds } });

    console.log(`🗑️  Removed ${result.deletedCount} test documents`);

    // Check remaining data
    const companies = await collection.countDocuments({ type: 'company' });
    const sites = await collection.countDocuments({ type: 'site' });
    const assetGroups = await collection.countDocuments({ type: 'asset_group' });
    const assets = await collection.countDocuments({ type: 'asset' });

    console.log(`📊 Remaining data:`);
    console.log(`  Companies: ${companies}`);
    console.log(`  Sites: ${sites}`);
    console.log(`  Asset Groups: ${assetGroups}`);
    console.log(`  Assets: ${assets}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

removeTestData();
