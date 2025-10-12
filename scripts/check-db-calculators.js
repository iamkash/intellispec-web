#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');

async function checkCalculators() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    // Get all scaffolding calculators
    const scaffolding = await db.collection('calculators')
      .find({ 
        tenantId: 'system', 
        deleted: { $ne: true }, 
        module: 'scaffolding' 
      })
      .sort({ name: 1 })
      .toArray();
    
    console.log('\n=== SCAFFOLDING MODULE CALCULATORS ===');
    console.log(`Total: ${scaffolding.length}\n`);
    scaffolding.forEach(c => {
      console.log(`  ✓ ${c.name}`);
      console.log(`    ID: ${c.id}`);
      console.log(`    Category: ${c.category || 'N/A'}`);
      console.log('');
    });
    
    // Get all quote calculators
    const quote = await db.collection('calculators')
      .find({ 
        tenantId: 'system', 
        deleted: { $ne: true }, 
        module: 'quote' 
      })
      .sort({ name: 1 })
      .toArray();
    
    console.log('\n=== QUOTE MODULE CALCULATORS ===');
    console.log(`Total: ${quote.length}\n`);
    quote.forEach(c => {
      console.log(`  ✓ ${c.name}`);
      console.log(`    ID: ${c.id}`);
      console.log(`    Category: ${c.category || 'N/A'}`);
      console.log('');
    });
    
    // Get total count
    const total = await db.collection('calculators')
      .countDocuments({ tenantId: 'system', deleted: { $ne: true } });
    
    console.log('\n=== SUMMARY ===');
    console.log(`Scaffolding: ${scaffolding.length}`);
    console.log(`Quote: ${quote.length}`);
    console.log(`Total (all modules): ${total}`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkCalculators();

