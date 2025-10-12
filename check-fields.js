#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

async function checkFieldNames() {
  try {
    await mongoose.connect(process.env.MONGODB_URI + 'test');
// Check the field names in existing working data
    const companyOptions = await mongoose.connection.db.collection('referenceListOptions')
      .find({ listTypeId: { $exists: true } })
      .limit(3)
      .toArray();
companyOptions.forEach((opt, i) => {
});

    // Check if there are any with listType field
    const oldFormatCount = await mongoose.connection.db.collection('referenceListOptions')
      .countDocuments({ listType: { $exists: true } });
// Check piping data specifically
    const pipingOptions = await mongoose.connection.db.collection('referenceListOptions')
      .find({ listTypeId: '68ba8bdd4e8d44952203ab28' })
      .limit(3)
      .toArray();
pipingOptions.forEach((opt, i) => {
});

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkFieldNames();
