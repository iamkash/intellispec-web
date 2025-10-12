// Clean up calculator fields
const path = require('path');
try { require('dotenv').config({ path: path.resolve(process.cwd(), '.env') }); } catch (_) {}

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/intellispec-dev';

async function cleanCalculator() {
  await mongoose.connect(MONGODB_URI, { maxPoolSize: 5 });

  const db = mongoose.connection.db;
  const calculatorsCol = db.collection('calculators');
const result = await calculatorsCol.updateOne(
    { id: 'scope-sizing' },
    { $unset: { aiPrompts: '', calculations: '' } }
  );

  if (result.modifiedCount > 0) {
} else {
}

  // Verify
  const updated = await calculatorsCol.findOne({ id: 'scope-sizing' });
console.log('  - aiPrompt:', !!updated.aiPrompt);
console.log('  - calculations:', !!updated.calculations);

  await mongoose.connection.close();
}

cleanCalculator().catch(console.error);
