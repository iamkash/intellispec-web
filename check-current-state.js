const mongoose = require('mongoose');
require('dotenv').config();

async function checkCurrentState() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intellispec');
    const db = mongoose.connection.db;
    const collection = db.collection('documents');

    console.log('🔍 Checking current database state...\n');

    // Check paint invoices
    const paintInvoices = await collection.find({
      type: 'paintInvoice',
      deleted: { $ne: true }
    }).toArray();

    console.log(`Found ${paintInvoices.length} paint invoices`);

    if (paintInvoices.length > 0) {
      // Check tenant IDs
      const tenantIds = [...new Set(paintInvoices.map(inv => inv.tenantId))];
      console.log('Paint invoice tenant IDs:', tenantIds);

      // Check a sample invoice
      console.log('Sample invoice tenantId:', paintInvoices[0].tenantId);
      console.log('Sample invoice companyId:', paintInvoices[0].companyId);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkCurrentState();
