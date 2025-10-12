#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const ndtCalcs = await db.collection('calculators')
    .find({ module: 'ndt' })
    .sort({ id: 1 })
    .toArray();
  
  console.log('\n📊 NDT Calculators in Database (' + ndtCalcs.length + ' total):\n');
  ndtCalcs.forEach((c, i) => {
    console.log(`${(i+1).toString().padStart(2)}. ${c.id.padEnd(40)} - ${c.name}`);
  });
  
  console.log('\n✅ Expected: 17 critical calculators');
  console.log('✅ Actual: ' + ndtCalcs.length + ' calculators\n');
  
  if (ndtCalcs.length === 17) {
    console.log('✅ SUCCESS: Cleanup complete - only critical calculators remain!\n');
  } else {
    console.log('⚠️  WARNING: Count mismatch!\n');
  }
  
  await mongoose.disconnect();
}

verify().catch(console.error);

