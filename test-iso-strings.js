const mongoose = require('mongoose');
require('dotenv').config();

async function testISOStrings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const collection = db.collection('documents');

    // Test with ISO strings (what worked before)
    console.log('=== Test with ISO strings ===');
    const count = await collection.countDocuments({
      type: "asset",
      tenantId: "t_hf_sinclair",
      "inspection.next_inspection_date": {
        "$exists": true,
        "$ne": null,
        "$gte": "2025-10-06T00:00:00.000Z",
        "$lte": "2026-01-04T23:59:59.999Z"
      }
    });
    console.log('Count with ISO strings:', count);

    // Aggregation with ISO strings
    const pipeline = [
      {
        "$match": {
          "type": "asset",
          "tenantId": "t_hf_sinclair",
          "inspection.next_inspection_date": {
            "$exists": true,
            "$ne": null,
            "$gte": "2025-10-06T00:00:00.000Z",
            "$lte": "2026-01-04T23:59:59.999Z"
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

    const results = await collection.aggregate(pipeline).toArray();
    console.log('\nAggregation results:', JSON.stringify(results, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
  }
}

testISOStrings();

