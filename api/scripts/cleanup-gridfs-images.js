/**
 * GridFS Image Cleanup Script
 * 
 * Deletes all stored images from MongoDB GridFS to save space.
 * Use this to clean up duplicate images and free storage.
 */

const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const path = require('path');

// Load .env from project root
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function cleanupGridFSImages() {
  try {
    console.log('🧹 Starting GridFS image cleanup...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    
    // Get all files in GridFS
    const files = await bucket.find({}).toArray();
    console.log(`📁 Found ${files.length} files in GridFS`);
    
    if (files.length === 0) {
      console.log('✅ No files to delete');
      return;
    }
    
    // Group files by type for reporting
    const filesByType = files.reduce((acc, file) => {
      const type = file.metadata?.type || 'unknown';
      if (!acc[type]) acc[type] = [];
      acc[type].push(file);
      return acc;
    }, {});
    
    console.log('📊 Files by type:');
    Object.entries(filesByType).forEach(([type, typeFiles]) => {
      const totalSize = typeFiles.reduce((sum, f) => sum + f.length, 0);
      console.log(`  ${type}: ${typeFiles.length} files (${(totalSize / 1024 / 1024).toFixed(2)}MB)`);
    });
    
    const totalSize = files.reduce((sum, file) => sum + file.length, 0);
    console.log(`📊 Total size to delete: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    
    // Ask for confirmation in interactive mode
    if (process.argv.includes('--confirm') || process.argv.includes('-y')) {
      console.log('🗑️ Proceeding with deletion (confirmed via command line)...');
    } else {
      console.log('⚠️ This will delete ALL GridFS files. Run with --confirm or -y to proceed.');
      console.log('   Example: node cleanup-gridfs-images.js --confirm');
      return;
    }
    
    // Delete all files
    let deletedCount = 0;
    let deletedSize = 0;
    
    for (const file of files) {
      try {
        await bucket.delete(file._id);
        deletedCount++;
        deletedSize += file.length;
        
        // Log progress every 10 files
        if (deletedCount % 10 === 0) {
          console.log(`🗑️ Deleted ${deletedCount}/${files.length} files...`);
        }
      } catch (error) {
        console.error(`❌ Failed to delete file ${file._id}:`, error.message);
      }
    }
    
    console.log('✅ GridFS cleanup completed!');
    console.log(`📊 Results:`);
    console.log(`   Files deleted: ${deletedCount}/${files.length}`);
    console.log(`   Space freed: ${(deletedSize / 1024 / 1024).toFixed(2)}MB`);
    
    if (deletedCount < files.length) {
      console.log(`⚠️ ${files.length - deletedCount} files could not be deleted`);
    }
    
  } catch (error) {
    console.error('❌ Error during GridFS cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

/**
 * List GridFS files without deleting
 */
async function listGridFSFiles() {
  try {
    console.log('📋 Listing GridFS files...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    
    const files = await bucket.find({}).toArray();
    console.log(`📁 Found ${files.length} files in GridFS`);
    
    if (files.length === 0) {
      console.log('✅ No files found');
      return;
    }
    
    // Show detailed file list
    files.forEach((file, index) => {
      const type = file.metadata?.type || 'unknown';
      const size = (file.length / 1024).toFixed(1);
      const uploadDate = file.uploadDate.toISOString().split('T')[0];
      console.log(`${index + 1}. ${file.filename} (${type}) - ${size}KB - ${uploadDate}`);
    });
    
    const totalSize = files.reduce((sum, file) => sum + file.length, 0);
    console.log(`📊 Total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    
  } catch (error) {
    console.error('❌ Error listing GridFS files:', error);
  } finally {
    await mongoose.connection.close();
  }
}

/**
 * Delete files older than specified days
 */
async function cleanupOldFiles(daysOld = 7) {
  try {
    console.log(`🧹 Cleaning up GridFS files older than ${daysOld} days...`);
    
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const files = await bucket.find({
      uploadDate: { $lt: cutoffDate }
    }).toArray();
    
    console.log(`📁 Found ${files.length} files older than ${daysOld} days`);
    
    if (files.length === 0) {
      console.log('✅ No old files to delete');
      return;
    }
    
    const totalSize = files.reduce((sum, file) => sum + file.length, 0);
    console.log(`📊 Size to delete: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    
    if (!process.argv.includes('--confirm') && !process.argv.includes('-y')) {
      console.log('⚠️ Run with --confirm to proceed with deletion');
      return;
    }
    
    let deletedCount = 0;
    for (const file of files) {
      try {
        await bucket.delete(file._id);
        deletedCount++;
      } catch (error) {
        console.error(`❌ Failed to delete file ${file._id}:`, error.message);
      }
    }
    
    console.log(`✅ Deleted ${deletedCount} old files, freed ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    
  } catch (error) {
    console.error('❌ Error during old file cleanup:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'list':
    listGridFSFiles();
    break;
  case 'cleanup-old':
    const days = parseInt(process.argv[3]) || 7;
    cleanupOldFiles(days);
    break;
  case 'cleanup-all':
    cleanupGridFSImages();
    break;
  default:
    console.log('GridFS Management Script');
    console.log('');
    console.log('Usage:');
    console.log('  node cleanup-gridfs-images.js list                    # List all files');
    console.log('  node cleanup-gridfs-images.js cleanup-all --confirm   # Delete ALL files');
    console.log('  node cleanup-gridfs-images.js cleanup-old 7 --confirm # Delete files older than 7 days');
    console.log('');
    console.log('Examples:');
    console.log('  node cleanup-gridfs-images.js list');
    console.log('  node cleanup-gridfs-images.js cleanup-all --confirm');
    console.log('  node cleanup-gridfs-images.js cleanup-old 3 --confirm');
    break;
}
