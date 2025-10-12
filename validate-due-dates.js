/**
 * Validate Due Dates Script
 *
 * Queries all asset documents and groups them by the status
 * of their next inspection due date.
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

// Main validation function
const validateDueDates = async () => {
  try {
    console.log('🔍 Validating inspection due dates for all assets...');

    const db = mongoose.connection.db;
    const assets = await db.collection('documents').find({ type: 'asset' }).toArray();
    
    if (assets.length === 0) {
      console.log('No asset documents found.');
      return;
    }

    const now = new Date();
    const groups = {
      'Overdue': 0,
      'Due in next 30 days': 0,
      'Due in 31-90 days': 0,
      'Due in > 90 days': 0,
      'No date set': 0,
    };

    assets.forEach(asset => {
      const nextInspectionDateStr = asset.inspection?.next_inspection_date;
      if (!nextInspectionDateStr) {
        groups['No date set']++;
        return;
      }

      const nextInspectionDate = new Date(nextInspectionDateStr);
      const diffTime = nextInspectionDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        groups['Overdue']++;
      } else if (diffDays <= 30) {
        groups['Due in next 30 days']++;
      } else if (diffDays <= 90) {
        groups['Due in 31-90 days']++;
      } else {
        groups['Due in > 90 days']++;
      }
    });

    console.log('\n--- Inspection Due Date Groups ---');
    console.log(`Total Assets Scanned: ${assets.length}`);
    console.log('------------------------------------');
    for (const [group, count] of Object.entries(groups)) {
      console.log(`${group}: ${count}`);
    }
    console.log('------------------------------------');

  } catch (error) {
    console.error('❌ Error during validation:', error);
    process.exit(1);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await validateDueDates();
  await mongoose.disconnect();
  process.exit(0);
};

main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
