const mongoose = require('mongoose');
require('dotenv').config();

async function testPaintInvoices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intellispec');
    const db = mongoose.connection.db;
    const collection = db.collection('documents');

    console.log('🔍 Testing paint invoice API logic...');

    // Get paint invoices (simulating API query)
    const documents = await collection.find({
      type: 'paintInvoice',
      deleted: { $ne: true }
    }).limit(5).toArray();

    console.log(`Found ${documents.length} paint invoices`);

    if (documents.length > 0) {
      // Get unique company and facility IDs
      const companyIds = [...new Set(documents.map(doc => doc.companyId).filter(Boolean))];
      const facilityIds = [...new Set(documents.map(doc => doc.facilityId).filter(Boolean))];

      console.log(`Company IDs: ${companyIds}`);
      console.log(`Facility IDs: ${facilityIds}`);

      // Fetch company and facility data
      const tenantId = 'default-tenant'; // Assuming default tenant
      const companies = companyIds.length > 0 ? await collection.find({
        id: { $in: companyIds },
        type: 'company',
        tenantId: tenantId,
        deleted: { $ne: true }
      }).toArray() : [];

      const facilities = facilityIds.length > 0 ? await collection.find({
        id: { $in: facilityIds },
        type: 'site',
        tenantId: tenantId,
        deleted: { $ne: true }
      }).toArray() : [];

      console.log(`Found ${companies.length} companies and ${facilities.length} facilities`);

      // Create lookup maps
      const companyMap = Object.fromEntries(companies.map(c => [c.id, c.name]));
      const facilityMap = Object.fromEntries(facilities.map(f => [f.id, f.name]));

      // Enhance documents with resolved names
      const enhanced = documents.map(doc => ({
        ...doc,
        companyName: companyMap[doc.companyId] || doc.companyId,
        facilityName: facilityMap[doc.facilityId] || doc.facilityId,
        lineItemCount: Array.isArray(doc.lineItems) ? doc.lineItems.length : 0
      }));

      console.log('\nEnhanced documents:');
      enhanced.forEach((doc, i) => {
        console.log(`${i+1}. Invoice: ${doc.invoiceNumber}, Company: ${doc.companyName}, Facility: ${doc.facilityName}, Items: ${doc.lineItemCount}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testPaintInvoices();
