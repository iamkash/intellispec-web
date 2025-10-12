// Test the exact API query
const mongoose = require('mongoose');
require('dotenv').config();

async function testAPIQuery() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/intellispec-dev');
  const db = mongoose.connection.db;

  // Test the exact query the API uses
  const calculator = await db.collection('calculators').findOne({
    tenantId: 'default',
    id: 'scope-sizing',
    deleted: { $ne: true }
  });
console.log('calculator found:', !!calculator);
  if (calculator) {
console.log('aiPrompt length:', calculator.aiPrompt ? calculator.aiPrompt.length : 0);
}

  await mongoose.connection.close();
}

testAPIQuery().catch(console.error);
