#!/usr/bin/env node
/**
 * Scaffolding Calculator Cleanup Script
 * 
 * This script helps identify and remove non-critical scaffolding calculators,
 * keeping only the most essential ones for core functionality.
 * 
 * Usage:
 *   node scripts/cleanup-scaffolding-calculators.js --dry-run   (preview only)
 *   node scripts/cleanup-scaffolding-calculators.js --delete    (actually delete)
 */

const fs = require('fs');
const path = require('path');

// Define critical calculators that should be KEPT
const CRITICAL_CALCULATORS = [
  // Core planning (time estimators moved to quote folder as vision-based)
  'erection-planner.js',
  'dismantling-planner.js',
  'cost-estimator.js',
  
  // Core design and safety
  'scaffold-bay-design.js',
  'scaffold-stability-estimator.js',
  'load-capacity-calculator.js',
  'foundation-pressure-calculator.js',
  'bracing-pattern-calculator.js',
  
  // Important specialized calculators
  'cantilever-scaffold-calculator.js',
  'scaffold-load-chart-generator.js',
  'fall-clearance-calculator.js',
  
  // Documentation
  'README.md'
];

// Special calculators that don't belong in scaffolding folder (wrong category)
const WRONG_CATEGORY = [
  'material-quantity-estimator.js'  // General - could be in multiple categories
];

const SCAFFOLDING_DIR = path.join(__dirname, 'calculators', 'scaffolding');

function getAllCalculators() {
  try {
    return fs.readdirSync(SCAFFOLDING_DIR)
      .filter(file => file.endsWith('.js') || file === 'README.md');
  } catch (error) {
    console.error(`Error reading directory: ${error.message}`);
    process.exit(1);
  }
}

function categorizeCalculators(allFiles) {
  const keep = [];
  const deleteNonCritical = [];
  const deleteWrongCategory = [];

  allFiles.forEach(file => {
    if (CRITICAL_CALCULATORS.includes(file)) {
      keep.push(file);
    } else if (WRONG_CATEGORY.includes(file)) {
      deleteWrongCategory.push(file);
    } else {
      deleteNonCritical.push(file);
    }
  });

  return { keep, deleteNonCritical, deleteWrongCategory };
}

function printReport(categorized) {
  const { keep, deleteNonCritical, deleteWrongCategory } = categorized;
  const totalToDelete = deleteNonCritical.length + deleteWrongCategory.length;

  console.log('\n' + '='.repeat(80));
  console.log('SCAFFOLDING CALCULATOR CLEANUP REPORT');
  console.log('='.repeat(80));

  console.log(`\n✅ KEEPING (${keep.length} files):`);
  console.log('These are critical calculators for core scaffolding functionality:\n');
  keep.forEach(file => {
    console.log(`   ✓ ${file}`);
  });

  console.log(`\n\n🗑️  DELETING - Non-Critical (${deleteNonCritical.length} files):`);
  console.log('These are specialized/nice-to-have calculators:\n');
  deleteNonCritical.sort().forEach(file => {
    console.log(`   ✗ ${file}`);
  });

  if (deleteWrongCategory.length > 0) {
    console.log(`\n\n⚠️  DELETING - Wrong Category (${deleteWrongCategory.length} files):`);
    console.log('These belong in different calculator categories:\n');
    deleteWrongCategory.sort().forEach(file => {
      console.log(`   ✗ ${file} (should be moved to appropriate folder)`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log(`SUMMARY: Keep ${keep.length} | Delete ${totalToDelete} | Total ${keep.length + totalToDelete}`);
  console.log('='.repeat(80) + '\n');
}

function deleteFiles(filesToDelete) {
  let successCount = 0;
  let errorCount = 0;

  console.log('\n🔥 Starting deletion...\n');

  filesToDelete.forEach(file => {
    const filePath = path.join(SCAFFOLDING_DIR, file);
    try {
      fs.unlinkSync(filePath);
      console.log(`   ✓ Deleted: ${file}`);
      successCount++;
    } catch (error) {
      console.error(`   ✗ Error deleting ${file}: ${error.message}`);
      errorCount++;
    }
  });

  console.log(`\n✅ Deletion complete: ${successCount} deleted, ${errorCount} errors\n`);
}

function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const shouldDelete = args.includes('--delete');

  console.log('\n🔍 Scanning scaffolding calculators folder...\n');

  const allCalculators = getAllCalculators();
  const categorized = categorizeCalculators(allCalculators);
  
  printReport(categorized);

  const allFilesToDelete = [
    ...categorized.deleteNonCritical,
    ...categorized.deleteWrongCategory
  ];

  if (isDryRun) {
    console.log('ℹ️  DRY RUN MODE - No files were deleted.');
    console.log('   Run with --delete flag to actually delete files.\n');
  } else if (shouldDelete) {
    console.log('⚠️  WARNING: You are about to delete ' + allFilesToDelete.length + ' files!');
    console.log('   Press Ctrl+C within 5 seconds to cancel...\n');
    
    setTimeout(() => {
      deleteFiles(allFilesToDelete);
      console.log('✅ Cleanup complete! Run your app to verify everything works.\n');
    }, 5000);
  } else {
    console.log('ℹ️  No action taken. Use one of the following flags:');
    console.log('   --dry-run   Preview what will be deleted (no changes)');
    console.log('   --delete    Actually delete the non-critical files\n');
  }
}

// Run the script
main();

