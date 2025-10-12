/**
 * MongoDB Tenant Data Cleanup Script
 * 
 * This script safely deletes all data associated with a specific tenant
 * from all collections in the MongoDB database.
 * 
 * Usage: node scripts/cleanup-tenant-data.js <tenantId>
 * Example: node scripts/cleanup-tenant-data.js t_pk_inspections
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

// Get tenant ID from command line arguments
const tenantId = process.argv[2];

if (!tenantId) {
  console.error('❌ Error: Please provide a tenant ID');
console.log('Example: node scripts/cleanup-tenant-data.js t_pk_inspections');
  process.exit(1);
}

// MongoDB connection configuration
const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI;

if (!mongoUri) {
  console.error('❌ Error: MongoDB connection string not found in environment variables');
  console.error('Please set MONGODB_URI or MONGODB_ATLAS_URI in your .env file');
  process.exit(1);
}

// Collections that contain tenant data
const TENANT_COLLECTIONS = [
  'documents',        // Main documents collection (paintInvoice, company, site, paint_specifications)
  'ragdocuments',     // RAG/Vector documents
  'tenants',          // Tenant configuration
  'users',            // Tenant users
  'roles',            // Tenant roles
  'authlogs',         // Authentication logs
  'memberships',      // User-tenant memberships
  'subscriptions',    // Tenant subscriptions
  'tenantEntitlements', // Tenant entitlements
  'wizardSessions',   // AI wizard sessions
  'wizardResponses',  // AI wizard responses
];

async function cleanupTenantData() {
  let client;
  
  try {
console.log(`📡 Connecting to MongoDB...`);
    
    // Connect to MongoDB
    client = new MongoClient(mongoUri);
    await client.connect();
    
    const db = client.db();
// First, let's check what data exists for this tenant
const dataAnalysis = {};
    for (const collectionName of TENANT_COLLECTIONS) {
      try {
        const collection = db.collection(collectionName);
        
        // Check different tenant field patterns
        const queries = [
          { tenantId: tenantId },
          { tenantSlug: tenantId },
          { tenant: tenantId }
        ];
        
        let totalCount = 0;
        for (const query of queries) {
          const count = await collection.countDocuments(query);
          totalCount += count;
        }
        
        if (totalCount > 0) {
          dataAnalysis[collectionName] = totalCount;
}
      } catch (error) {
        // Collection might not exist, skip silently
        continue;
      }
    }
    
    if (Object.keys(dataAnalysis).length === 0) {
console.log(`The tenant either doesn't exist or has already been cleaned up.`);
      return;
    }
console.log(`📊 Summary of data to be deleted:`);
    
    let totalDocuments = 0;
    for (const [collection, count] of Object.entries(dataAnalysis)) {
totalDocuments += count;
    }
console.log(`\n⏳ Starting deletion in 5 seconds... (Press Ctrl+C to cancel)`);
    
    // Wait 5 seconds to allow cancellation
    await new Promise(resolve => setTimeout(resolve, 5000));
// Delete data from each collection
    const deletionResults = {};
    
    for (const collectionName of Object.keys(dataAnalysis)) {
      try {
const collection = db.collection(collectionName);
        
        // Try different tenant field patterns
        const queries = [
          { tenantId: tenantId },
          { tenantSlug: tenantId },
          { tenant: tenantId }
        ];
        
        let totalDeleted = 0;
        
        for (const query of queries) {
          const result = await collection.deleteMany(query);
          totalDeleted += result.deletedCount;
          
          if (result.deletedCount > 0) {
}
        }
        
        deletionResults[collectionName] = totalDeleted;
        
      } catch (error) {
        console.error(`  ❌ Error deleting from ${collectionName}:`, error.message);
        deletionResults[collectionName] = `Error: ${error.message}`;
      }
    }
    
    // Summary
console.log(`=====================================`);
    
    let totalDeleted = 0;
    for (const [collection, result] of Object.entries(deletionResults)) {
      if (typeof result === 'number') {
totalDeleted += result;
      } else {
}
    }
console.log(`🎉 Total documents deleted: ${totalDeleted}`);
// Verify cleanup
let remainingData = false;
    
    for (const collectionName of TENANT_COLLECTIONS) {
      try {
        const collection = db.collection(collectionName);
        const queries = [
          { tenantId: tenantId },
          { tenantSlug: tenantId },
          { tenant: tenantId }
        ];
        
        let totalRemaining = 0;
        for (const query of queries) {
          const count = await collection.countDocuments(query);
          totalRemaining += count;
        }
        
        if (totalRemaining > 0) {
remainingData = true;
        }
      } catch (error) {
        // Collection might not exist, skip
        continue;
      }
    }
    
    if (!remainingData) {
} else {
}
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
}
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
process.exit(0);
});

// Run the cleanup
cleanupTenantData().catch(console.error);
