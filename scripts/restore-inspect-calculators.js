#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');

async function restoreInspect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const collection = db.collection('calculators');
    
    // Restore all inspect calculators that were wrongly deleted
    const result = await collection.updateMany(
      { 
        tenantId: 'system',
        module: 'inspect',
        deleted: true
      },
      { 
        $set: { 
          deleted: false
        },
        $unset: {
          deletedAt: ""
        }
      }
    );
    
    console.log(`\n✅ Restored ${result.modifiedCount} inspect calculators\n`);
    
    // Check final count
    const inspectCount = await collection.countDocuments({ 
      tenantId: 'system', 
      deleted: { $ne: true },
      module: 'inspect'
    });
    
    console.log(`Final inspect calculator count: ${inspectCount}\n`);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

restoreInspect();

