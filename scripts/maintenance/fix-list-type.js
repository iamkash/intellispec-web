#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

async function fixListTypeValues() {
  try {
    await mongoose.connect(process.env.MONGODB_URI + 'test');
// Get the piping type
    const pipingType = await mongoose.connection.db.collection('referenceListTypes')
      .findOne({ name: 'piping_inspection_observations' });

    if (!pipingType) {
return;
    }

    const typeId = pipingType._id.toString();
// Update all piping options to use the ID instead of the name
    const updateResult = await mongoose.connection.db.collection('referenceListOptions')
      .updateMany(
        { listType: 'piping_inspection_observations' },
        { $set: { listType: typeId } }
      );
    console.log(`Updated ${updateResult.modifiedCount} reference list options to use list type ID.`);
// Verify the update
    const optionsById = await mongoose.connection.db.collection('referenceListOptions')
      .countDocuments({ listType: typeId });
    console.log(`Verified ${optionsById} options now reference the ID.`);
// Sample updated options
    const sampleOptions = await mongoose.connection.db.collection('referenceListOptions')
      .find({ listType: typeId })
      .limit(2)
      .toArray();
    sampleOptions.forEach((opt, index) => {
      console.log(`Sample option ${index + 1}:`, opt);
    });

    await mongoose.disconnect();
} catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixListTypeValues();
