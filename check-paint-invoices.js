const mongoose = require('mongoose');
require('dotenv').config();

async function checkPaintInvoices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intellispec');
    const db = mongoose.connection.db;
    const collection = db.collection('documents');

    console.log('🔍 Checking paint invoices...');

    const count = await collection.countDocuments({ type: 'paintInvoice' });
    console.log(`Total paint invoices: ${count}`);

    if (count > 0) {
      const sample = await collection.find({ type: 'paintInvoice' }).limit(1).toArray();
      console.log('Sample invoice structure:');
      console.log(JSON.stringify(sample[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkPaintInvoices();
