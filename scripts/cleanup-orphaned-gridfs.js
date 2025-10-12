/**
 * Cleanup Orphaned GridFS Files
 * 
 * This script identifies and optionally removes GridFS files that:
 * 1. Have zero reference count
 * 2. Are not referenced by any inspection documents
 * 3. Are older than a specified age (default: 7 days)
 * 
 * Run with: node scripts/cleanup-orphaned-gridfs.js [--dry-run] [--days=7]
 */

const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intellispec';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const daysArg = args.find(arg => arg.startsWith('--days='));
const daysOld = daysArg ? parseInt(daysArg.split('=')[1]) : 7;

async function cleanupOrphanedFiles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'fs' });
    
    // Get all GridFS files
    const files = await bucket.find({}).toArray();
    console.log(`Found ${files.length} total files in GridFS`);
    
    // Get all inspection documents
    const inspections = await db.collection('documents').find({ 
      type: 'inspection' 
    }).toArray();
    console.log(`Found ${inspections.length} inspection documents`);
    
    // Build set of referenced GridFS IDs
    const referencedIds = new Set();
    
    inspections.forEach(inspection => {
      // Check sections for image references
      if (inspection.sections && Array.isArray(inspection.sections)) {
        inspection.sections.forEach(section => {
          if (section?.images && Array.isArray(section.images)) {
            section.images.forEach(img => {
              if (img.gridfsId) {
                referencedIds.add(img.gridfsId);
              }
            });
          }
        });
      }
      
      // Check wizardState.sections
      if (inspection.wizardState?.sections && Array.isArray(inspection.wizardState.sections)) {
        inspection.wizardState.sections.forEach(section => {
          if (section?.images && Array.isArray(section.images)) {
            section.images.forEach(img => {
              if (img.gridfsId) {
                referencedIds.add(img.gridfsId);
              }
            });
          }
        });
      }
      
      // Check attachments
      if (inspection.attachments && Array.isArray(inspection.attachments)) {
        inspection.attachments.forEach(att => {
          if (att.gridfsId) {
            referencedIds.add(att.gridfsId);
          }
        });
      }
    });
    
    console.log(`Found ${referencedIds.size} unique GridFS references in inspections`);
    
    // Find orphaned files
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const orphanedFiles = [];
    const stats = {
      totalSize: 0,
      byReferenceCount: { zero: 0, low: 0, orphaned: 0 },
      byAge: { old: 0, recent: 0 }
    };
    
    for (const file of files) {
      const fileId = file._id.toString();
      const referenceCount = file.metadata?.referenceCount || 0;
      const isReferenced = referencedIds.has(fileId);
      const isOld = file.uploadDate < cutoffDate;
      
      // File is orphaned if:
      // 1. It has zero reference count OR
      // 2. It's not referenced by any inspection
      // AND it's older than the cutoff date
      if ((referenceCount === 0 || !isReferenced) && isOld) {
        orphanedFiles.push({
          id: fileId,
          filename: file.filename,
          size: file.length,
          uploadDate: file.uploadDate,
          referenceCount: referenceCount,
          isReferenced: isReferenced
        });
        
        stats.totalSize += file.length;
        
        if (referenceCount === 0) stats.byReferenceCount.zero++;
        else if (referenceCount < 2) stats.byReferenceCount.low++;
        if (!isReferenced) stats.byReferenceCount.orphaned++;
        
        if (isOld) stats.byAge.old++;
        else stats.byAge.recent++;
      }
    }
    
    console.log(`\n📊 Orphaned Files Statistics:`);
    console.log(`   Total orphaned files: ${orphanedFiles.length}`);
    console.log(`   Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Zero references: ${stats.byReferenceCount.zero}`);
    console.log(`   Not in inspections: ${stats.byReferenceCount.orphaned}`);
    console.log(`   Older than ${daysOld} days: ${stats.byAge.old}`);
    
    if (orphanedFiles.length === 0) {
      console.log('\n✅ No orphaned files found!');
      return;
    }
    
    // Show sample of orphaned files
    console.log(`\n📋 Sample orphaned files (first 5):`);
    orphanedFiles.slice(0, 5).forEach(file => {
      console.log(`   - ${file.filename}`);
      console.log(`     ID: ${file.id}`);
      console.log(`     Size: ${(file.size / 1024).toFixed(2)} KB`);
      console.log(`     Uploaded: ${file.uploadDate.toISOString()}`);
      console.log(`     Ref Count: ${file.referenceCount}`);
      console.log(`     In Inspections: ${file.isReferenced}`);
    });
    
    if (isDryRun) {
      console.log('\n🔍 DRY RUN - No files were deleted');
      console.log('   Run without --dry-run to actually delete orphaned files');
    } else {
      console.log(`\n🗑️  Deleting ${orphanedFiles.length} orphaned files...`);
      
      let deletedCount = 0;
      let failedCount = 0;
      
      for (const file of orphanedFiles) {
        try {
          await bucket.delete(new mongoose.Types.ObjectId(file.id));
          deletedCount++;
          
          if (deletedCount % 10 === 0) {
            console.log(`   Deleted ${deletedCount}/${orphanedFiles.length} files...`);
          }
        } catch (error) {
          console.error(`   Failed to delete ${file.filename}: ${error.message}`);
          failedCount++;
        }
      }
      
      console.log(`\n✅ Cleanup complete!`);
      console.log(`   Deleted: ${deletedCount} files`);
      console.log(`   Failed: ${failedCount} files`);
      console.log(`   Space freed: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    }
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the cleanup
cleanupOrphanedFiles();
