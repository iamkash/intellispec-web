/**
 * Check Inspection Data Script
 * 
 * Queries the database to show current inspection documents
 */

const mongoose = require('mongoose');
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

// Check inspection data
const checkInspectionData = async () => {
  try {
    console.log('🔍 Checking current inspection data...');

    const db = mongoose.connection.db;
    
    // Count all documents
    const totalDocuments = await db.collection('documents').countDocuments();
    console.log(`📊 Total documents in database: ${totalDocuments}`);

    // Count inspection documents
    const inspectionCount = await db.collection('documents').countDocuments({ type: 'inspection' });
    console.log(`🔍 Inspection documents: ${inspectionCount}`);

    // Get recent inspection documents
    if (inspectionCount > 0) {
      console.log('\n📋 Recent inspection documents:');
      const recentInspections = await db.collection('documents')
        .find({ type: 'inspection' })
        .sort({ created_date: -1 })
        .limit(10)
        .toArray();

      recentInspections.forEach((doc, index) => {
        console.log(`${index + 1}. ID: ${doc.id}`);
        console.log(`   Created: ${doc.created_date}`);
        console.log(`   Inspection Type: ${doc.inspectionType || 'N/A'}`);
        console.log(`   Equipment ID: ${doc.formData?.equipmentId || doc.formData?.equipment_id || 'N/A'}`);
        console.log(`   Company: ${doc.formData?.company_id || 'N/A'}`);
        console.log(`   Site: ${doc.formData?.site_id || 'N/A'}`);
        console.log(`   Status: ${doc.status || 'N/A'}`);
        console.log(`   Progress: ${doc.progress || 0}%`);
        console.log('   ---');
      });
    }

    // Check wizard progress documents
    const wizardProgressCount = await db.collection('documents').countDocuments({
      $or: [
        { type: { $regex: /wizard/, $options: 'i' } },
        { type: 'piping_inspection' },
        { workspaceId: { $regex: /wizard/, $options: 'i' } }
      ]
    });
    console.log(`🧙 Wizard progress documents: ${wizardProgressCount}`);

    // Check GridFS files
    const gridfsCount = await db.collection('uploads.files').countDocuments({
      $or: [
        { 'metadata.type': 'inspection-image' },
        { 'metadata.type': 'inspection-voice' },
        { 'metadata.type': 'inspection-signature' },
        { 'metadata.type': { $regex: /inspection/, $options: 'i' } }
      ]
    });
    console.log(`📁 Inspection GridFS files: ${gridfsCount}`);

    console.log('\n✅ Database check completed');

  } catch (error) {
    console.error('❌ Error during check:', error);
    process.exit(1);
  }
};

// Main execution
const main = async () => {
  console.log('🔍 INSPECTION DATA CHECK');
  console.log('========================');
  console.log('');

  await connectDB();
  await checkInspectionData();

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

module.exports = { checkInspectionData };