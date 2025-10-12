const mongoose = require('mongoose');
require('dotenv').config();

async function testAggregationDebug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('documents');

    // Test 1: Just the base filter
    console.log('\n=== Test 1: Base filter only ===');
    const count1 = await collection.countDocuments({
      type: "asset",
      tenantId: "t_hf_sinclair"
    });
    console.log('Assets with base filter:', count1);

    // Test 2: Base filter + date filter
    console.log('\n=== Test 2: Base filter + date filter ===');
    const count2 = await collection.countDocuments({
      type: "asset",
      tenantId: "t_hf_sinclair",
      "inspection.next_inspection_date": {
        "$exists": true,
        "$ne": null,
        "$gte": new Date("2025-10-06T00:00:00.000Z"),
        "$lte": new Date("2026-01-04T23:59:59.999Z")
      }
    });
    console.log('Assets with date filter:', count2);

    // Test 3: Aggregation without baseFilter in pipeline
    console.log('\n=== Test 3: Aggregation (single $match) ===');
    const pipeline3 = [
      {
        "$match": {
          "type": "asset",
          "tenantId": "t_hf_sinclair",
          "inspection.next_inspection_date": {
            "$exists": true,
            "$ne": null,
            "$gte": new Date("2025-10-06T00:00:00.000Z"),
            "$lte": new Date("2026-01-04T23:59:59.999Z")
          }
        }
      },
      {
        "$group": {
          "_id": {
            "$dateToString": {
              "format": "%Y-%m",
              "date": "$inspection.next_inspection_date"
            }
          },
          "period": {
            "$first": {
              "$dateToString": {
                "format": "%Y-%m",
                "date": "$inspection.next_inspection_date"
              }
            }
          },
          "count": { "$sum": 1 }
        }
      },
      { "$sort": { "_id": 1 } },
      { "$project": { "_id": 0, "period": 1, "count": 1 } }
    ];

    const results3 = await collection.aggregate(pipeline3).toArray();
    console.log('Results:', JSON.stringify(results3, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    await mongoose.disconnect();
  }
}

testAggregationDebug();

