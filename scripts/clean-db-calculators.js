#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function cleanDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const collection = db.collection('calculators');
    
    // Get all existing calculator IDs from files
    const validIds = new Set();
    
    // Scan all calculator directories
    const calcDirs = ['inspect', 'scaffolding', 'ndt', 'quote'];
    for (const dir of calcDirs) {
      const dirPath = path.join(__dirname, 'calculators', dir);
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
        for (const file of files) {
          try {
            const calc = require(path.join(dirPath, file));
            if (calc && calc.id) {
              validIds.add(calc.id);
            }
          } catch (err) {
            console.warn(`⚠️  Error loading ${file}:`, err.message);
          }
        }
      }
    }
    
    console.log(`\n✅ Found ${validIds.size} valid calculator files\n`);
    
    // Get all calculator IDs from database
    const dbCalcs = await collection.find({ 
      tenantId: 'system', 
      deleted: { $ne: true } 
    }).toArray();
    
    console.log(`📊 Found ${dbCalcs.length} calculators in database\n`);
    
    // Find calculators in database that don't have files
    const toDelete = dbCalcs.filter(calc => !validIds.has(calc.id));
    
    if (toDelete.length === 0) {
      console.log('✅ Database is already clean - no orphaned entries found');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`🗑️  Found ${toDelete.length} orphaned calculators to remove:\n`);
    toDelete.forEach(calc => {
      console.log(`   ✗ ${calc.name} (${calc.id})`);
    });
    
    // Mark them as deleted
    const result = await collection.updateMany(
      { 
        tenantId: 'system',
        id: { $in: toDelete.map(c => c.id) }
      },
      { 
        $set: { 
          deleted: true,
          deletedAt: new Date()
        } 
      }
    );
    
    console.log(`\n✅ Marked ${result.modifiedCount} calculators as deleted\n`);
    
    // Show final counts
    const finalScaff = await collection.countDocuments({ 
      tenantId: 'system', 
      deleted: { $ne: true },
      module: 'scaffolding'
    });
    
    const finalQuote = await collection.countDocuments({ 
      tenantId: 'system', 
      deleted: { $ne: true },
      module: 'quote'
    });
    
    const finalTotal = await collection.countDocuments({ 
      tenantId: 'system', 
      deleted: { $ne: true }
    });
    
    console.log('=== FINAL COUNTS ===');
    console.log(`Scaffolding: ${finalScaff}`);
    console.log(`Quote: ${finalQuote}`);
    console.log(`Total: ${finalTotal}\n`);
    
    await mongoose.disconnect();
    console.log('✅ Database cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanDatabase();

