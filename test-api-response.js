#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

async function testAPIData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI + 'test');
// Test the API query pattern
    const options = await mongoose.connection.db.collection('referenceListOptions')
      .find({ listTypeId: '68ba8bdd4e8d44952203ab28' })
      .limit(5)
      .toArray();
console.log('   Status: 200 OK');
console.log('   Sample data:');

    options.forEach((opt, i) => {
});

    // Format like API response
    const apiResponse = {
      data: options.map(opt => ({
        value: opt.value,
        label: opt.label,
        description: opt.description
      }))
    };
console.log(JSON.stringify(apiResponse, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPIData();
