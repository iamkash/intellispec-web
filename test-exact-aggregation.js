const mongoose = require('mongoose');
require('dotenv').config();

async function testExactAggregation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('documents');

    // Test the exact pipeline from the config
    const pipeline = [
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
      {
        "$sort": { "_id": 1 }
      },
      {
        "$project": {
          "_id": 0,
          "period": 1,
          "count": 1
        }
      }
    ];

    console.log('\n=== Running aggregation ===');
    const results = await collection.aggregate(pipeline).toArray();
    
    console.log('Results:', JSON.stringify(results, null, 2));
    console.log('\nTotal records:', results.length);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    await mongoose.disconnect();
  }
}

testExactAggregation();

