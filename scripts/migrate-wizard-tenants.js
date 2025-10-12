/**
 * Wizard Tenant Migration Script
 * 
 * Purpose: Add tenantId to existing wizard documents
 * 
 * CRITICAL: This script fixes the security vulnerability where wizard documents
 * were created without tenantId, allowing cross-tenant data access.
 * 
 * What it does:
 * 1. Finds all wizard documents without tenantId
 * 2. Assigns tenantId (default or based on logic)
 * 3. Adds audit fields (created_by, timestamps, etc.)
 * 4. Updates document type to 'wizard'
 * 
 * IMPORTANT: Review the tenant assignment logic before running!
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function migrateWizardTenants() {
  try {
    console.log('\n🚀 Starting Wizard Tenant Migration...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const documents = db.collection('documents');

    // Find all wizard/piping_inspection documents without tenantId
    const wizardsWithoutTenant = await documents.find({
      $or: [
        { type: 'piping_inspection' },
        { type: 'wizard' }
      ],
      tenantId: { $exists: false }
    }).toArray();

    console.log(`📋 Found ${wizardsWithoutTenant.length} wizards without tenantId\n`);

    if (wizardsWithoutTenant.length === 0) {
      console.log('✅ No migration needed - all wizards have tenantId!\n');
      process.exit(0);
    }

    // Display wizards for review
    console.log('📊 Wizard Details:');
    wizardsWithoutTenant.forEach((wizard, index) => {
      console.log(`\n${index + 1}. ID: ${wizard.id}`);
      console.log(`   Type: ${wizard.type}`);
      console.log(`   GadgetId: ${wizard.gadgetId || 'N/A'}`);
      console.log(`   ConfigId: ${wizard.configId || 'N/A'}`);
      console.log(`   Created: ${wizard.createdAt || 'N/A'}`);
    });

    console.log('\n\n⚠️  TENANT ASSIGNMENT STRATEGY:');
    console.log('─────────────────────────────────────────────────────');
    
    // OPTION 1: Assign to default tenant (SAFEST)
    const DEFAULT_TENANT_ID = 't_pk_inspections'; // ⚠️ CHANGE THIS IF NEEDED!
    
    console.log(`\n✅ Using DEFAULT tenant: ${DEFAULT_TENANT_ID}`);
    console.log('   All wizards will be assigned to this tenant.\n');
    
    // OPTION 2: Assign based on user/email (REQUIRES CUSTOM LOGIC)
    // Uncomment and modify if you need tenant-specific assignment
    /*
    console.log('\n⚠️  Using CUSTOM tenant assignment logic');
    console.log('   Implement custom logic in the migration loop below.\n');
    */

    // Confirm before proceeding
    console.log('\n⚠️  WARNING: This will modify', wizardsWithoutTenant.length, 'documents!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🔄 Starting migration...\n');

    let migratedCount = 0;
    let errorCount = 0;

    for (const wizard of wizardsWithoutTenant) {
      try {
        // OPTION 1: Default tenant assignment
        const tenantId = DEFAULT_TENANT_ID;
        
        // OPTION 2: Custom logic (UNCOMMENT AND MODIFY)
        /*
        let tenantId = DEFAULT_TENANT_ID;
        
        // Example: Assign based on configId
        if (wizard.configId?.includes('hf-sinclair')) {
          tenantId = 't_hf_sinclair';
        } else if (wizard.configId?.includes('pksti')) {
          tenantId = 't_pk_inspections';
        }
        
        // Example: Assign based on creation date
        // if (wizard.createdAt < new Date('2024-01-01')) {
        //   tenantId = 't_old_tenant';
        // }
        */

        // Prepare update
        const update = {
          $set: {
            tenantId: tenantId,
            type: 'wizard', // Standardize type
            
            // Audit fields
            created_by: wizard.created_by || 'migration-script',
            updated_by: 'migration-script',
            created_date: wizard.createdAt || new Date(),
            last_updated: new Date(),
            
            // Soft delete
            deleted: false
          }
        };

        // Update document
        await documents.updateOne(
          { _id: wizard._id },
          update
        );

        migratedCount++;
        console.log(`✅ Migrated wizard ${wizard.id} → Tenant: ${tenantId}`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating wizard ${wizard.id}:`, error.message);
      }
    }

    console.log('\n\n════════════════════════════════════════════════════════');
    console.log('📊 MIGRATION COMPLETE');
    console.log('════════════════════════════════════════════════════════');
    console.log(`✅ Successfully migrated: ${migratedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📋 Total processed: ${wizardsWithoutTenant.length}`);
    console.log('════════════════════════════════════════════════════════\n');

    // Verify migration
    console.log('🔍 Verifying migration...\n');
    
    const remainingWithoutTenant = await documents.find({
      type: 'wizard',
      tenantId: { $exists: false }
    }).toArray();

    if (remainingWithoutTenant.length === 0) {
      console.log('✅ VERIFICATION PASSED: All wizards now have tenantId!\n');
    } else {
      console.log(`⚠️  WARNING: ${remainingWithoutTenant.length} wizards still without tenantId`);
      console.log('Please review and run the script again.\n');
    }

    // Summary of tenant distribution
    console.log('📈 Tenant Distribution:');
    const tenantCounts = await documents.aggregate([
      { $match: { type: 'wizard', deleted: { $ne: true } } },
      { $group: { _id: '$tenantId', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    tenantCounts.forEach(({ _id, count }) => {
      console.log(`   ${_id}: ${count} wizards`);
    });

    console.log('\n🎉 Migration completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Test the new /api/wizards endpoints');
    console.log('2. Update frontend to use new endpoints');
    console.log('3. Delete old controller/service/repository files');
    console.log('4. Deploy to production\n');

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
    process.exit(0);
  }
}

// Run migration
migrateWizardTenants();

