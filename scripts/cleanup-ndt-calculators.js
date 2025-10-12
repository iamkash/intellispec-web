#!/usr/bin/env node
/**
 * NDT Calculator Cleanup Script
 * 
 * This script removes non-critical utility NDT calculators from both 
 * filesystem and MongoDB, keeping only high-value AI vision calculators.
 * 
 * Usage:
 *   node scripts/cleanup-ndt-calculators.js --delete-db    (delete from MongoDB)
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Define calculators to DELETE (non-critical utility calculators)
const CALCULATORS_TO_DELETE = [
  'beam-path-skip-distance',
  'near-surface-dead-zone-estimator',
  'velocity-temperature-correction',
  'a-scan-thickness-pick-repeatability',
  'long-seam-crawler-coverage-check',
  'dgs-sizing-helper',
  'dac-tcg-compliance-check',
  'coupling-quality-snr-check',
  'shear-wave-weld-coverage-map',
  'backwall-echo-loss-monitor'
];

// These 17 calculators will be KEPT (already deleted files above)
const CRITICAL_CALCULATORS_TO_KEEP = [
  // High-value AI Vision & Analysis (12 calculators)
  'flaw-sizing-calculator',
  'wall-loss-remaining-life-calculator',
  'pod-calculator',
  'snr-calculator',
  'paut-weld-defect-recognition',
  'coverage-scan-effort-estimator',
  'corrosion-map-analysis',
  'rt-defect-detection',
  'surface-crack-detection',
  'data-confidence-index',
  'pof-estimator',
  'defect-recognition-vision-calculator',
  
  // Critical Technical Calculators (5 calculators)
  'lamination-screening',
  'hic-sohic-indicator-count',
  'creep-damage-screening',
  'paut-sectorial-law-coverage',
  'corrosion-map-stats'
];

async function connectToDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intellispec';
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB:', MONGODB_URI.split('@')[1] || 'localhost');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    return false;
  }
}

async function deleteCalculatorsFromDB() {
  console.log('\n🗑️  Deleting calculators from MongoDB...\n');

  const Calculator = mongoose.model('Calculator', new mongoose.Schema({}, { strict: false }), 'calculators');
  
  let successCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  for (const calculatorId of CALCULATORS_TO_DELETE) {
    try {
      const result = await Calculator.deleteOne({ id: calculatorId });
      
      if (result.deletedCount > 0) {
        console.log(`   ✓ Deleted from DB: ${calculatorId}`);
        successCount++;
      } else {
        console.log(`   ⚠ Not found in DB: ${calculatorId}`);
        notFoundCount++;
      }
    } catch (error) {
      console.error(`   ✗ Error deleting ${calculatorId}: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n✅ Database cleanup complete:`);
  console.log(`   - Deleted: ${successCount}`);
  console.log(`   - Not found: ${notFoundCount}`);
  console.log(`   - Errors: ${errorCount}`);
  
  return { successCount, notFoundCount, errorCount };
}

async function verifyRemainingCalculators() {
  console.log('\n🔍 Verifying remaining calculators in DB...\n');
  
  const Calculator = mongoose.models.Calculator || mongoose.model('Calculator', new mongoose.Schema({}, { strict: false }), 'calculators');
  
  const remaining = await Calculator.find({ 
    id: { $in: CRITICAL_CALCULATORS_TO_KEEP } 
  }).select('id name').lean();
  
  console.log(`✅ Found ${remaining.length} critical calculators in DB:`);
  remaining.forEach(calc => {
    console.log(`   ✓ ${calc.id}`);
  });
  
  const missing = CRITICAL_CALCULATORS_TO_KEEP.filter(
    id => !remaining.find(calc => calc.id === id)
  );
  
  if (missing.length > 0) {
    console.log(`\n⚠️  Missing ${missing.length} calculators (will be seeded):`);
    missing.forEach(id => console.log(`   ✗ ${id}`));
  }
  
  return { remaining: remaining.length, missing: missing.length };
}

function printReport() {
  console.log('\n' + '='.repeat(80));
  console.log('NDT CALCULATOR CLEANUP REPORT');
  console.log('='.repeat(80));

  console.log(`\n✅ KEEPING (${CRITICAL_CALCULATORS_TO_KEEP.length} calculators):`);
  console.log('High-value AI vision and critical technical calculators:\n');
  CRITICAL_CALCULATORS_TO_KEEP.forEach(id => {
    console.log(`   ✓ ${id}`);
  });

  console.log(`\n\n🗑️  DELETING (${CALCULATORS_TO_DELETE.length} calculators):`);
  console.log('Non-critical utility calculators (simple formulas):\n');
  CALCULATORS_TO_DELETE.forEach(id => {
    console.log(`   ✗ ${id}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log(`SUMMARY: Keep ${CRITICAL_CALCULATORS_TO_KEEP.length} | Delete ${CALCULATORS_TO_DELETE.length}`);
  console.log('='.repeat(80) + '\n');
}

async function main() {
  const args = process.argv.slice(2);
  const shouldDeleteDB = args.includes('--delete-db');

  console.log('\n🔍 NDT Calculator Cleanup\n');
  
  printReport();

  if (shouldDeleteDB) {
    console.log('⚠️  Connecting to database to delete calculators...\n');
    
    const connected = await connectToDatabase();
    if (!connected) {
      console.error('❌ Cannot proceed without database connection.\n');
      process.exit(1);
    }

    await deleteCalculatorsFromDB();
    await verifyRemainingCalculators();
    
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed.\n');
    console.log('✅ Cleanup complete! Now run the seed script to reload critical calculators.\n');
    console.log('   Example: node scripts/seed-calculators-ndt.js\n');
  } else {
    console.log('ℹ️  No action taken. Use --delete-db flag to delete from MongoDB.\n');
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

