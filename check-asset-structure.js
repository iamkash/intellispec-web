const mongoose = require('mongoose');
require('dotenv').config();

async function checkAssetStructure() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    const asset = await db.collection('documents').findOne({
      type: 'asset',
      tenantId: 't_hf_sinclair',
      'inspection.next_inspection_date': { $exists: true, $ne: null }
    });
    
    console.log('Asset structure:');
    console.log(JSON.stringify(asset, null, 2));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
  }
}

checkAssetStructure();

