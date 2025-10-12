const mongoose = require('mongoose');
require('dotenv').config();

async function testFinalPipeline() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const collection = db.collection('documents');

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
        "$addFields": {
          "inspectionDateObj": {
            "$cond": {
              "if": { "$eq": [{ "$type": "$inspection.next_inspection_date" }, "date"] },
              "then": "$inspection.next_inspection_date",
              "else": { "$toDate": "$inspection.next_inspection_date" }
            }
          }
        }
      },
      {
        "$group": {
          "_id": {
            "$dateToString": {
              "format": "%Y-%m",
              "date": "$inspectionDateObj"
            }
          },
          "period": {
            "$first": {
              "$dateToString": {
                "format": "%Y-%m",
                "date": "$inspectionDateObj"
              }
            }
          },
          "count": { "$sum": 1 }
        }
      },
      { "$sort": { "_id": 1 } },
      { "$project": { "_id": 0, "period": 1, "count": 1 } }
    ];

    console.log('Running final pipeline...');
    const results = await collection.aggregate(pipeline).toArray();
    console.log('\nResults:', JSON.stringify(results, null, 2));
    console.log('\nSuccess! Chart should display this data.');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
  }
}

testFinalPipeline();

