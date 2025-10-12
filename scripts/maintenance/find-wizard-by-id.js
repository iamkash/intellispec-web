require('dotenv').config();
const mongoose = require('mongoose');

async function findWizard() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('\n✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const documents = db.collection('documents');
    
    // Search for the wizard by ID
    const wizardId = 'wizard_M44L6El6jWQ1';
    
    console.log(`🔍 Searching for wizard: ${wizardId}\n`);
    
    const wizard = await documents.findOne({ id: wizardId });
    
    if (wizard) {
      console.log('✅ FOUND WIZARD:');
      console.log(JSON.stringify(wizard, null, 2));
    } else {
      console.log('❌ Wizard not found with id field');
      
      // Try finding by any field
      const anyMatch = await documents.findOne({
        $or: [
          { _id: mongoose.Types.ObjectId('68e11775b68bdef17c831771') },
          { 'data.step': 1 },
          { tenantId: 't_hf_sinclair' }
        ]
      });
      
      if (anyMatch) {
        console.log('\n✅ Found a document:');
        console.log(JSON.stringify(anyMatch, null, 2));
      } else {
        console.log('\n❌ No documents found at all');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

findWizard();

