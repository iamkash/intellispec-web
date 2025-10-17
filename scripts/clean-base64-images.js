const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/intellispec';

async function cleanBase64Images() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('documents');
    
    // Find all inspections with wizardState.sections containing base64 images
    const inspections = await collection.find({
      type: 'inspection',
      'wizardState.sections': { $exists: true }
    }).toArray();
    
    console.log(`Found ${inspections.length} inspections to check`);
    
    let totalCleaned = 0;
    let totalBase64Removed = 0;
    
    for (const inspection of inspections) {
      let needsUpdate = false;
      let inspectionBase64Removed = 0;
      
      if (inspection.wizardState?.sections && Array.isArray(inspection.wizardState.sections)) {
        for (const section of inspection.wizardState.sections) {
          if (section?.images && Array.isArray(section.images)) {
            const originalCount = section.images.length;
            
            // Remove any images that contain base64 data
            const cleanedImages = [];
            for (const img of section.images) {
              const isBase64 = img.url && (img.url.startsWith('data:') || img.url.includes('base64'));
              if (isBase64) {
                inspectionBase64Removed++;
                totalBase64Removed++;
                needsUpdate = true;
              } else {
                cleanedImages.push(img);
              }
            }
            section.images = cleanedImages;
            
            if (originalCount !== section.images.length) {
              console.log(`🧹 Cleaned section ${section.id}: removed ${originalCount - section.images.length} base64 images`);
            }
          }
        }
      }
      
      // Also clean sections array if it exists
      if (inspection.sections && Array.isArray(inspection.sections)) {
        for (const section of inspection.sections) {
          if (section?.images && Array.isArray(section.images)) {
            const originalCount = section.images.length;
            
            const cleanedImages = [];
            for (const img of section.images) {
              const isBase64 = img.url && (img.url.startsWith('data:') || img.url.includes('base64'));
              if (isBase64) {
                inspectionBase64Removed++;
                totalBase64Removed++;
                needsUpdate = true;
              } else {
                cleanedImages.push(img);
              }
            }
            section.images = cleanedImages;
            
            if (originalCount !== section.images.length) {
              console.log(`🧹 Cleaned main section ${section.id}: removed ${originalCount - section.images.length} base64 images`);
            }
          }
        }
      }
      
      if (needsUpdate) {
        await collection.updateOne(
          { _id: inspection._id },
          { 
            $set: { 
              wizardState: inspection.wizardState,
              sections: inspection.sections,
              last_updated: new Date()
            }
          }
        );
        
        totalCleaned++;
        console.log(`✅ Cleaned inspection ${inspection.id}: removed ${inspectionBase64Removed} base64 images`);
      }
    }
    
    console.log(`\n🎉 Cleanup complete!`);
    console.log(`📊 Inspections cleaned: ${totalCleaned}`);
    console.log(`🗑️  Total base64 images removed: ${totalBase64Removed}`);
    
  } catch (error) {
    console.error('Error cleaning base64 images:', error);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  cleanBase64Images().then(() => process.exit(0));
}

module.exports = { cleanBase64Images };
