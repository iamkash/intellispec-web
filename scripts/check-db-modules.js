#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');

async function checkModules() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const collection = db.collection('calculators');
    
    // Get all modules
    const modules = await collection.distinct('module', { tenantId: 'system', deleted: { $ne: true } });
    
    console.log('\n=== CALCULATOR MODULES IN DATABASE ===\n');
    
    for (const module of modules.sort()) {
      const count = await collection.countDocuments({ 
        tenantId: 'system', 
        deleted: { $ne: true },
        module: module
      });
      console.log(`${module}: ${count} calculators`);
    }
    
    console.log('\n=== DELETED CALCULATORS ===\n');
    const deletedByModule = await collection.aggregate([
      { $match: { tenantId: 'system', deleted: true } },
      { $group: { _id: '$module', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    deletedByModule.forEach(m => {
      console.log(`${m._id}: ${m.count} deleted`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkModules();

