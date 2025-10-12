const mongoose = require('mongoose');
require('dotenv').config();

async function checkInspections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intellispec');

    // Simple check for any inspection documents
    const inspections = await mongoose.connection.db.collection('documents').find({
      type: 'inspection'
    }).toArray();
inspections.forEach((doc, i) => {
});

    // Check for documents with inspectionType field
    const withInspectionType = await mongoose.connection.db.collection('documents').find({
      inspectionType: { $exists: true }
    }).toArray();
await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkInspections();
