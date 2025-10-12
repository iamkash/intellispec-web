const mongoose = require('mongoose');
require('dotenv').config();

async function checkTenants() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    console.log('=== CHECKING TENANT DATA ===');
    
    // Get distinct tenant IDs from documents
    const tenants = await db.collection('documents').distinct('tenantId');
    console.log('Tenant IDs in documents:', tenants);
    
    // Count inspections by tenant
    for (const tenantId of tenants) {
      const count = await db.collection('documents').countDocuments({
        type: 'inspection',
        tenantId: tenantId
      });
      console.log(`Inspections for tenant "${tenantId}": ${count}`);
      
      if (count > 0) {
        // Get sample inspection
        const sample = await db.collection('documents').findOne({
          type: 'inspection',
          tenantId: tenantId
        });
        console.log(`  Sample inspection type: ${sample.inspectionType}`);
        console.log(`  Sample status: ${sample.status}`);
        console.log(`  Sample deleted: ${sample.deleted}`);
      }
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

checkTenants();
