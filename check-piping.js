const mongoose = require('mongoose');
require('dotenv').config();

async function checkPipingInspections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    console.log('=== CHECKING PIPING INSPECTIONS ===');
    
    // Check inspection types under pksti tenant
    const inspectionTypes = await db.collection('documents').distinct('inspectionType', {
      type: 'inspection',
      tenantId: 'pksti'
    });
    console.log('Inspection types under pksti tenant:', inspectionTypes);
    
    // Count by inspection type
    for (const inspType of inspectionTypes) {
      const count = await db.collection('documents').countDocuments({
        type: 'inspection',
        tenantId: 'pksti',
        inspectionType: inspType
      });
      console.log(`${inspType} inspections: ${count}`);
    }
    
    // Look for piping inspections specifically
    const pipingInspections = await db.collection('documents').find({
      type: 'inspection',
      tenantId: 'pksti',
      inspectionType: 'piping'
    }).toArray();
    
    console.log(`\nPiping inspections found: ${pipingInspections.length}`);
    
    if (pipingInspections.length > 0) {
      pipingInspections.forEach((doc, i) => {
        console.log(`${i+1}. ID: ${doc.id}, Status: ${doc.status}, Equipment: ${doc.formData?.equipmentType || 'N/A'}`);
      });
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

checkPipingInspections();
