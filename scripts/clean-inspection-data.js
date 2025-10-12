/**
 * Clean Inspection Data Script
 *
 * Removes all inspection documents from the database
 * Use with caution - this will permanently delete all inspection data
 */

const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
require('dotenv').config();

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/intellispec';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clean GridFS files associated with inspections
const cleanInspectionGridFS = async () => {
  try {
    console.log('🧹 Cleaning inspection-related GridFS files...');
    
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    
    // Find GridFS files with inspection-related metadata
    const inspectionFiles = await db.collection('uploads.files').find({
      $or: [
        { 'metadata.type': 'inspection-image' },
        { 'metadata.type': 'inspection-voice' },
        { 'metadata.type': 'inspection-signature' },
        { 'metadata.type': { $regex: /inspection/, $options: 'i' } }
      ]
    }).toArray();
    
    console.log(`🔍 Found ${inspectionFiles.length} inspection-related GridFS files`);
    
    if (inspectionFiles.length > 0) {
      // Delete each GridFS file
      for (const file of inspectionFiles) {
        try {
          await bucket.delete(file._id);
          console.log(`🗑️ Deleted GridFS file: ${file.filename} (${file._id})`);
        } catch (error) {
          console.warn(`⚠️ Failed to delete GridFS file ${file._id}:`, error.message);
        }
      }
      console.log(`✅ Cleaned up ${inspectionFiles.length} GridFS files`);
    }
  } catch (error) {
    console.error('❌ Error cleaning GridFS files:', error);
  }
};

// Clean inspection data
const cleanInspectionData = async () => {
  try {
    console.log('🧹 Starting inspection data cleanup...');

    // Get database stats before cleanup
    const db = mongoose.connection.db;
    const totalDocumentsBefore = await db.collection('documents').countDocuments();
    console.log(`📊 Total documents before cleanup: ${totalDocumentsBefore}`);

    // Count inspection documents
    const inspectionCount = await db.collection('documents').countDocuments({ type: 'inspection' });
    console.log(`🔍 Found ${inspectionCount} inspection documents`);

    if (inspectionCount === 0) {
      console.log('ℹ️ No inspection documents to clean');
      await cleanInspectionGridFS(); // Still clean GridFS files
      return;
    }

    // Clean GridFS files first (before deleting documents that reference them)
    await cleanInspectionGridFS();

    // Delete all inspection documents
    const deleteResult = await db.collection('documents').deleteMany({ type: 'inspection' });
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} inspection documents`);

    // Get total documents after cleanup
    const totalDocumentsAfter = await db.collection('documents').countDocuments();
    console.log(`📊 Total documents after cleanup: ${totalDocumentsAfter}`);

    // Also clean up any related wizard progress data
    const wizardProgressCount = await db.collection('documents').countDocuments({
      $or: [
        { type: { $regex: /wizard/, $options: 'i' } },
        { type: 'piping_inspection' },
        { workspaceId: { $regex: /wizard/, $options: 'i' } }
      ]
    });

    if (wizardProgressCount > 0) {
      console.log(`🔍 Found ${wizardProgressCount} wizard progress documents`);
      const wizardDeleteResult = await db.collection('documents').deleteMany({
        $or: [
          { type: { $regex: /wizard/, $options: 'i' } },
          { type: 'piping_inspection' },
          { workspaceId: { $regex: /wizard/, $options: 'i' } }
        ]
      });
      console.log(`🗑️ Deleted ${wizardDeleteResult.deletedCount} wizard progress documents`);
    }

    // Clean up any orphaned GridFS files that might have been missed
    console.log('🧹 Checking for orphaned GridFS files...');
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    const allGridFSFiles = await db.collection('uploads.files').find({}).toArray();
    const orphanedFiles = allGridFSFiles.filter(file => 
      !file.metadata || 
      (file.metadata.type && file.metadata.type.includes('inspection'))
    );
    
    if (orphanedFiles.length > 0) {
      console.log(`🔍 Found ${orphanedFiles.length} potentially orphaned GridFS files`);
      for (const file of orphanedFiles) {
        try {
          await bucket.delete(file._id);
          console.log(`🗑️ Deleted orphaned GridFS file: ${file.filename}`);
        } catch (error) {
          console.warn(`⚠️ Failed to delete orphaned file ${file._id}:`, error.message);
        }
      }
    }

    console.log('✅ Inspection data cleanup completed successfully');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
};

// Main execution
const main = async () => {
  console.log('🚨 INSPECTION DATA CLEANUP SCRIPT 🚨');
  console.log('⚠️  This will permanently delete:');
  console.log('   • ALL inspection documents (type: "inspection")');
  console.log('   • ALL wizard progress documents');
  console.log('   • ALL associated GridFS files (images, voice, signatures)');
  console.log('⚠️  Make sure to backup important data before proceeding');
  console.log('');

  // Check for confirmation flag
  const args = process.argv.slice(2);
  const confirmed = args.includes('--confirm') || args.includes('-y');
  
  if (!confirmed) {
    console.log('🛑 Add --confirm or -y flag to proceed with cleanup');
    console.log('   Example: node scripts/clean-inspection-data.js --confirm');
    process.exit(0);
  }

  console.log('✅ Confirmation received, proceeding with cleanup...');
  console.log('');

  await connectDB();
  await cleanInspectionData();

  console.log('');
  console.log('🎉 Cleanup complete! Database is now clean and ready for fresh inspection data.');
  console.log('💡 You can now test the wizard with a clean slate.');

  await mongoose.disconnect();
  process.exit(0);
};

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { cleanInspectionData };
