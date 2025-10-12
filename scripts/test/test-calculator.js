// Test script for Dynamic Calculator Gadget
const mongoose = require('mongoose');
require('dotenv').config();

async function testCalculator() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/intellispec-dev';
    await mongoose.connect(mongoUri);
const db = mongoose.connection.db;
    const calculatorsCol = db.collection('calculators');

    // Check if scope-sizing calculator exists
    const calculator = await calculatorsCol.findOne({ id: 'scope-sizing' });

    if (!calculator) {
return;
    }
console.log('📋 Calculator fields:', Object.keys(calculator));
console.log('📝 Has UI definition:', !!calculator.uiDefinition);

    if (calculator.uiDefinition && calculator.uiDefinition.sections) {
calculator.uiDefinition.sections.forEach(section => {
});
    }
} catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

testCalculator();
