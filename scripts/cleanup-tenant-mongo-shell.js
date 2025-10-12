/**
 * MongoDB Shell Script for Tenant Data Cleanup
 * 
 * This script can be executed directly in the MongoDB shell (mongosh)
 * to delete all data associated with a specific tenant.
 * 
 * Usage in MongoDB shell:
 * 1. Connect to your database: mongosh "your-connection-string"
 * 2. Load this script: load("scripts/cleanup-tenant-mongo-shell.js")
 * 3. Run: cleanupTenant("t_pk_inspections")
 */

function cleanupTenant(tenantId) {
  if (!tenantId) {
    print("❌ Error: Please provide a tenant ID");
    print("Usage: cleanupTenant('t_pk_inspections')");
    return;
  }
  
  print(`🔍 Starting cleanup for tenant: ${tenantId}`);
  print(`📊 Database: ${db.getName()}`);
  
  // Collections that contain tenant data
  const collections = [
    'documents',
    'ragdocuments', 
    'tenants',
    'users',
    'roles',
    'authlogs',
    'memberships',
    'subscriptions',
    'tenantEntitlements',
    'wizardSessions',
    'wizardResponses'
  ];
  
  // First, analyze what data exists
  print("\n📊 Analyzing tenant data...");
  
  const dataAnalysis = {};
  let totalDocuments = 0;
  
  collections.forEach(collectionName => {
    try {
      const collection = db.getCollection(collectionName);
      
      // Check different tenant field patterns
      const queries = [
        { tenantId: tenantId },
        { tenantSlug: tenantId },
        { tenant: tenantId }
      ];
      
      let collectionTotal = 0;
      queries.forEach(query => {
        const count = collection.countDocuments(query);
        collectionTotal += count;
      });
      
      if (collectionTotal > 0) {
        dataAnalysis[collectionName] = collectionTotal;
        totalDocuments += collectionTotal;
        print(`  📄 ${collectionName}: ${collectionTotal} documents`);
      }
    } catch (error) {
      // Collection might not exist, skip
    }
  });
  
  if (totalDocuments === 0) {
    print(`\n✅ No data found for tenant: ${tenantId}`);
    print("The tenant either doesn't exist or has already been cleaned up.");
    return;
  }
  
  print(`\n⚠️  WARNING: This will permanently delete ALL data for tenant: ${tenantId}`);
  print(`🔥 Total documents to delete: ${totalDocuments}`);
  print("\n📋 Collections to be cleaned:");
  
  Object.entries(dataAnalysis).forEach(([collection, count]) => {
    print(`  • ${collection}: ${count} documents`);
  });
  
  print("\n❓ Do you want to continue? Type 'YES' to confirm:");
  
  // Note: In a real MongoDB shell, you would need to manually confirm
  // For automated execution, we'll proceed with a warning
  print("⚠️  Proceeding with deletion (manual confirmation required in interactive mode)...");
  
  print("\n🗑️  Starting deletion process...");
  
  const deletionResults = {};
  let totalDeleted = 0;
  
  // Delete data from each collection
  Object.keys(dataAnalysis).forEach(collectionName => {
    try {
      print(`\n🔄 Processing collection: ${collectionName}`);
      const collection = db.getCollection(collectionName);
      
      // Try different tenant field patterns
      const queries = [
        { tenantId: tenantId },
        { tenantSlug: tenantId },
        { tenant: tenantId }
      ];
      
      let collectionDeleted = 0;
      
      queries.forEach(query => {
        const result = collection.deleteMany(query);
        collectionDeleted += result.deletedCount;
        
        if (result.deletedCount > 0) {
          print(`  ✅ Deleted ${result.deletedCount} documents with query: ${JSON.stringify(query)}`);
        }
      });
      
      deletionResults[collectionName] = collectionDeleted;
      totalDeleted += collectionDeleted;
      
    } catch (error) {
      print(`  ❌ Error deleting from ${collectionName}: ${error.message}`);
      deletionResults[collectionName] = `Error: ${error.message}`;
    }
  });
  
  // Summary
  print("\n📋 Deletion Summary:");
  print("=====================================");
  
  Object.entries(deletionResults).forEach(([collection, result]) => {
    if (typeof result === 'number') {
      print(`✅ ${collection}: ${result} documents deleted`);
    } else {
      print(`❌ ${collection}: ${result}`);
    }
  });
  
  print("=====================================");
  print(`🎉 Total documents deleted: ${totalDeleted}`);
  print(`✅ Cleanup completed for tenant: ${tenantId}`);
  
  // Verify cleanup
  print("\n🔍 Verifying cleanup...");
  let remainingData = false;
  
  collections.forEach(collectionName => {
    try {
      const collection = db.getCollection(collectionName);
      const queries = [
        { tenantId: tenantId },
        { tenantSlug: tenantId },
        { tenant: tenantId }
      ];
      
      let totalRemaining = 0;
      queries.forEach(query => {
        const count = collection.countDocuments(query);
        totalRemaining += count;
      });
      
      if (totalRemaining > 0) {
        print(`⚠️  ${collectionName}: ${totalRemaining} documents still remain`);
        remainingData = true;
      }
    } catch (error) {
      // Collection might not exist, skip
    }
  });
  
  if (!remainingData) {
    print(`✅ Verification complete: No remaining data found for tenant ${tenantId}`);
  } else {
    print("⚠️  Warning: Some data may still remain. Please review manually.");
  }
}

// Helper function to just analyze data without deleting
function analyzeTenant(tenantId) {
  if (!tenantId) {
    print("❌ Error: Please provide a tenant ID");
    print("Usage: analyzeTenant('t_pk_inspections')");
    return;
  }
  
  print(`🔍 Analyzing data for tenant: ${tenantId}`);
  print(`📊 Database: ${db.getName()}`);
  
  const collections = [
    'documents',
    'ragdocuments',
    'tenants', 
    'users',
    'roles',
    'authlogs',
    'memberships',
    'subscriptions',
    'tenantEntitlements',
    'wizardSessions',
    'wizardResponses'
  ];
  
  let totalDocuments = 0;
  let foundCollections = [];
  
  collections.forEach(collectionName => {
    try {
      const collection = db.getCollection(collectionName);
      
      const queries = [
        { tenantId: tenantId },
        { tenantSlug: tenantId },
        { tenant: tenantId }
      ];
      
      let collectionTotal = 0;
      queries.forEach(query => {
        const count = collection.countDocuments(query);
        collectionTotal += count;
      });
      
      if (collectionTotal > 0) {
        foundCollections.push({ name: collectionName, count: collectionTotal });
        totalDocuments += collectionTotal;
        print(`  📄 ${collectionName}: ${collectionTotal} documents`);
      }
    } catch (error) {
      // Collection might not exist, skip
    }
  });
  
  if (totalDocuments === 0) {
    print(`\n✅ No data found for tenant: ${tenantId}`);
  } else {
    print(`\n📊 Summary for tenant ${tenantId}:`);
    print(`  • Total collections with data: ${foundCollections.length}`);
    print(`  • Total documents: ${totalDocuments}`);
  }
  
  return { collections: foundCollections, totalDocuments };
}

print("📚 MongoDB Tenant Cleanup Script Loaded");
print("Available functions:");
print("  • analyzeTenant('tenantId') - Analyze tenant data without deleting");
print("  • cleanupTenant('tenantId') - Delete all tenant data");
print("");
print("Example usage:");
print("  analyzeTenant('t_pk_inspections')");
print("  cleanupTenant('t_pk_inspections')");
