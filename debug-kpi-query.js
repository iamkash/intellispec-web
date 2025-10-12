/**
 * Debug KPI Query Script
 *
 * Runs a raw MongoDB aggregation pipeline for a single KPI
 * to validate its logic without any framework context (e.g., tenancy).
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/intellispec';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Main debug function
const debugKpiQuery = async () => {
  try {
    console.log('🔍 Running raw aggregation for "Overdue" KPI...');

    const db = mongoose.connection.db;

    const pipeline = [
      {
        $match: {
          type: 'asset',
          'inspection.next_inspection_date': { $lt: new Date().toISOString() }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ];

    const result = await db.collection('documents').aggregate(pipeline).toArray();
    
    console.log('\n--- Raw Aggregation Result ---');
    if (result.length > 0) {
      console.log(`Overdue Count: ${result[0].count}`);
    } else {
      console.log('Overdue Count: 0');
    }
    console.log('------------------------------');
    console.log('This is the global count, irrespective of tenant.');

  } catch (error) {
    console.error('❌ Error during aggregation:', error);
    process.exit(1);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await debugKpiQuery();
  await mongoose.disconnect();
  process.exit(0);
};

main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
