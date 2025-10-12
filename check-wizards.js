require('dotenv').config();
const mongoose = require('mongoose');

async function checkWizards() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('\n✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const documents = db.collection('documents');
    
    // Find all wizard documents (check multiple type variations)
    const wizards = await documents.find({ 
      $or: [
        { type: 'wizard' },
        { type: 'piping_inspection' },
        { gadgetId: { $exists: true } },
        { configId: { $exists: true } }
      ]
    }).sort({ created_date: -1 }).limit(5).toArray();
    
    console.log(`📋 Found ${wizards.length} wizards:\n`);
    
    wizards.forEach((wizard, i) => {
      console.log(`${i + 1}. ${wizard.id}`);
      console.log(`   Type: ${wizard.type}`);
      console.log(`   TenantID: ${wizard.tenantId || 'MISSING!'}`);
      console.log(`   Created By: ${wizard.created_by || 'MISSING!'}`);
      console.log(`   Status: ${wizard.status}`);
      console.log(`   Deleted: ${wizard.deleted}`);
      console.log(`   GadgetID: ${wizard.gadgetId}`);
      console.log(`   Data: ${JSON.stringify(wizard.data).substring(0, 100)}...\n`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkWizards();

