const mongoose = require('mongoose');
require('dotenv').config();

const main = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/intellispec';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const inspections = await db.collection('documents')
      .find({ type: 'inspection' })
      .sort({ created_date: -1 })
      .limit(1)
      .toArray();

    if (inspections.length > 0) {
      const inspection = inspections[0];
      console.log('\n📋 DETAILED INSPECTION DATA:');
      console.log('ID:', inspection.id);
      console.log('Type:', inspection.type);
      console.log('Inspection Type (top-level):', inspection.inspectionType);
      console.log('Status:', inspection.status);
      console.log('Progress:', inspection.progress);
      console.log('\n📝 FORM DATA:');
      console.log(JSON.stringify(inspection.formData, null, 2));
      console.log('\n📂 SECTIONS:');
      if (inspection.sections) {
        inspection.sections.forEach((section, index) => {
          if (section) {
            console.log(`Section ${index} (${section.id}):`, {
              hasFormData: !!section.formData,
              formDataKeys: section.formData ? Object.keys(section.formData) : []
            });
          } else {
            console.log(`Section ${index}: null`);
          }
        });
      }
    } else {
      console.log('No inspections found');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

main();
