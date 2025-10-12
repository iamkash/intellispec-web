const mongoose = require('mongoose');
require('dotenv').config();

async function check90DayAssets() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    const now = new Date();
    const future90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    
    console.log('Checking for assets with inspection dates between:');
    console.log('Start:', now.toISOString());
    console.log('End:', future90.toISOString());
    console.log('');
    
    // Check with Date objects (correct way)
    const assetsWithDates = await db.collection('documents').find({
      type: 'asset',
      tenantId: 't_hf_sinclair',
      'inspection.next_inspection_date': {
        $exists: true,
        $ne: null,
        $gte: now,
        $lte: future90
      }
    }).limit(10).toArray();
    
    console.log(`Found ${assetsWithDates.length} assets with Date objects:`);
    assetsWithDates.forEach(asset => {
      console.log(`- ${asset.asset_tag}: ${asset.inspection.next_inspection_date}`);
    });
    
    // Check with ISO strings (what the API is sending)
    console.log('\n--- Checking with ISO strings (what API sends) ---');
    const assetsWithStrings = await db.collection('documents').find({
      type: 'asset',
      tenantId: 't_hf_sinclair',
      'inspection.next_inspection_date': {
        $exists: true,
        $ne: null,
        $gte: now.toISOString(),
        $lte: future90.toISOString()
      }
    }).limit(10).toArray();
    
    console.log(`Found ${assetsWithStrings.length} assets with ISO strings:`);
    assetsWithStrings.forEach(asset => {
      console.log(`- ${asset.asset_tag}: ${asset.inspection.next_inspection_date}`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
  }
}

check90DayAssets();

