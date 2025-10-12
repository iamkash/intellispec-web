const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI;

async function testChartAggregation() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('documents');

    // Test 1: Check if we have assets with inspection dates in the next 90 days
    const now = new Date();
    const future90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    
    console.log('\n=== Test 1: Assets with inspection dates (next 90 days) ===');
    console.log('Date range:', now.toISOString(), 'to', future90.toISOString());
    
    const assetsInRange = await collection.countDocuments({
      type: 'asset',
      tenantId: 't_hf_sinclair',
      'inspection.next_inspection_date': {
        $exists: true,
        $ne: null,
        $gte: now.toISOString(),
        $lte: future90.toISOString()
      }
    });
    
    console.log('Assets with inspections due (next 90 days):', assetsInRange);

    // Test 2: Simple month aggregation (what we expect)
    console.log('\n=== Test 2: Month aggregation ===');
    
    const monthAggregation = await collection.aggregate([
      {
        $match: {
          type: 'asset',
          tenantId: 't_hf_sinclair',
          'inspection.next_inspection_date': {
            $exists: true,
            $ne: null,
            $gte: now.toISOString(),
            $lte: future90.toISOString()
          }
        }
      },
      {
        $group: {
          _id: { $substr: ['$inspection.next_inspection_date', 0, 7] },
          period: { $first: { $substr: ['$inspection.next_inspection_date', 0, 7] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, period: 1, count: 1 } }
    ]).toArray();
    
    console.log('Month aggregation results:', JSON.stringify(monthAggregation, null, 2));

    // Test 3: Sample of assets with inspection dates
    console.log('\n=== Test 3: Sample assets ===');
    const sampleAssets = await collection.find({
      type: 'asset',
      tenantId: 't_hf_sinclair',
      'inspection.next_inspection_date': { $exists: true, $ne: null }
    }).limit(5).toArray();
    
    sampleAssets.forEach(asset => {
      console.log(`- ${asset.asset_tag}: ${asset['inspection.next_inspection_date']}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testChartAggregation();

