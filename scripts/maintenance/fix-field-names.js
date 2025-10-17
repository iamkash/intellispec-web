#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

async function fixFieldNames() {
  try {
    await mongoose.connect(process.env.MONGODB_URI + 'test');
// Find all piping options with the wrong field name
    const pipingOptions = await mongoose.connection.db.collection('referenceListOptions')
      .find({ listType: '68ba8bdd4e8d44952203ab28' })
      .toArray();
// Update each option to use the correct field name
    let updated = 0;
    for (const option of pipingOptions) {
      await mongoose.connection.db.collection('referenceListOptions').updateOne(
        { _id: option._id },
        {
          $set: { listTypeId: option.listType },
          $unset: { listType: 1 }
        }
      );
      updated++;
    }
    console.log(`Updated ${updated} reference list options with corrected field names.`);
// Verify the fix
    const fixedCount = await mongoose.connection.db.collection('referenceListOptions')
      .countDocuments({ listTypeId: '68ba8bdd4e8d44952203ab28' });
    console.log(`Verified ${fixedCount} documents now use listTypeId.`);
// Sample of fixed data
    const sampleFixed = await mongoose.connection.db.collection('referenceListOptions')
      .find({ listTypeId: '68ba8bdd4e8d44952203ab28' })
      .limit(2)
      .toArray();
    sampleFixed.forEach((opt, i) => {
      console.log(`Sample ${i + 1}:`, opt);
    });

    await mongoose.disconnect();
} catch (error) {
    console.error('Error:', error.message);
  }
}

fixFieldNames();
