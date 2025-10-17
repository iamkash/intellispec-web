// Seed script to create modules and their reference data
// Usage: node scripts/seed-modules.js

const path = require('path');
try { require('dotenv').config({ path: path.resolve(process.cwd(), '.env') }); } catch (_) {}

const mongoose = require('mongoose');
const fs = require('fs');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/intellispec-dev';

async function run() {
  await mongoose.connect(MONGODB_URI, { maxPoolSize: 5 });

  const db = mongoose.connection.db;

  const modulesCol = db.collection('modules');
  const referenceListTypesCol = db.collection('referenceListTypes');
  const referenceListOptionsCol = db.collection('referenceListOptions');
// ===================== SEED REFERENCE DATA =====================
// Create module_status reference data
  const moduleStatusType = {
    name: 'module_status',
    displayName: 'Module Status',
    description: 'Status options for B2B SaaS modules',
    category: 'system',
    sortBy: 'order',
    allowCustom: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const moduleStatusResult = await referenceListTypesCol.findOneAndUpdate(
    { name: 'module_status' },
    { $setOnInsert: moduleStatusType },
    { upsert: true, returnDocument: 'after' }
  );
  
  let moduleStatusDoc = moduleStatusResult.value;
  if (!moduleStatusDoc) {
    // If the result is null, find the existing document
    moduleStatusDoc = await referenceListTypesCol.findOne({ name: 'module_status' });
  }
  
  const moduleStatusId = moduleStatusDoc._id;
// Create module_status options
  const moduleStatusOptions = [
    {
      listTypeId: moduleStatusId,
      label: 'Active',
      value: 'active',
      description: 'Module is active and available for tenants',
      sortOrder: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      listTypeId: moduleStatusId,
      label: 'Hidden',
      value: 'hidden',
      description: 'Module is archived/hidden from new tenant setups',
      sortOrder: 2,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Delete existing options and insert new ones
  await referenceListOptionsCol.deleteMany({ listTypeId: moduleStatusId });
  await referenceListOptionsCol.insertMany(moduleStatusOptions);
// Create module_category reference data
  const moduleCategoryType = {
    name: 'module_category',
    displayName: 'Module Category',
    description: 'Categories for organizing B2B SaaS modules',
    category: 'system',
    sortBy: 'label',
    allowCustom: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const moduleCategoryResult = await referenceListTypesCol.findOneAndUpdate(
    { name: 'module_category' },
    { $setOnInsert: moduleCategoryType },
    { upsert: true, returnDocument: 'after' }
  );
  
  let moduleCategoryDoc = moduleCategoryResult.value;
  if (!moduleCategoryDoc) {
    // If the result is null, find the existing document
    moduleCategoryDoc = await referenceListTypesCol.findOne({ name: 'module_category' });
  }
  
  const moduleCategoryId = moduleCategoryDoc._id;
// Create module_category options
  const moduleCategoryOptions = [
    {
      listTypeId: moduleCategoryId,
      label: 'Admin',
      value: 'Admin',
      description: 'System administration and management modules',
      sortOrder: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      listTypeId: moduleCategoryId,
      label: 'AI',
      value: 'AI',
      description: 'Artificial intelligence and machine learning modules',
      sortOrder: 2,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      listTypeId: moduleCategoryId,
      label: 'Compliance',
      value: 'Compliance',
      description: 'Regulatory compliance and audit management modules',
      sortOrder: 3,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      listTypeId: moduleCategoryId,
      label: 'Documents',
      value: 'Documents',
      description: 'Document management and storage modules',
      sortOrder: 4,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      listTypeId: moduleCategoryId,
      label: 'Inspection',
      value: 'Inspection',
      description: 'Inspection and testing modules',
      sortOrder: 5,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      listTypeId: moduleCategoryId,
      label: 'Operations',
      value: 'Operations',
      description: 'Day-to-day operations and workflow modules',
      sortOrder: 6,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Delete existing options and insert new ones
  await referenceListOptionsCol.deleteMany({ listTypeId: moduleCategoryId });
  await referenceListOptionsCol.insertMany(moduleCategoryOptions);
// ===================== SEED MODULES =====================
// Check if modules already exist
  const existingModulesCount = await modulesCol.countDocuments();
  if (existingModulesCount > 0) {
}

  // Load modules from seed file
  const modulesPath = path.join(__dirname, '..', 'public', 'data', 'seed', 'modules.json');
  const modulesData = JSON.parse(fs.readFileSync(modulesPath, 'utf8'));
  
  let createdCount = 0;
  let updatedCount = 0;
  
  for (const moduleData of modulesData.modules) {
    const moduleDoc = {
      key: moduleData.key,
      name: moduleData.name,
      status: moduleData.status,
      category: moduleData.category,
      defaultIncludedInFlex: moduleData.defaultIncludedInFlex,
      icon: moduleData.icon,
      description: moduleData.description,
      isSystemModule: moduleData.isSystemModule || false,
      createdAt: new Date(moduleData.createdAt),
      updatedAt: new Date()
    };
    
    // Upsert module (update if exists, create if not)
    const updateDoc = { ...moduleDoc };
    delete updateDoc.createdAt; // Remove createdAt from the main update
    
    const result = await modulesCol.findOneAndUpdate(
      { key: moduleData.key },
      { 
        $set: updateDoc,
        $setOnInsert: { createdAt: new Date(moduleData.createdAt) }
      },
      { upsert: true, returnDocument: 'after' }
    );
    
    if (result.lastErrorObject?.upserted) {
      createdCount++;
} else {
      updatedCount++;
}
  }
console.log(`📊 Summary:`);
console.log(`   - Created: ${createdCount} modules`);
console.log(`   - Updated: ${updatedCount} modules`);
// Create indexes for better performance
await modulesCol.createIndex({ key: 1 }, { unique: true }).catch(() => {});
  await modulesCol.createIndex({ status: 1 }).catch(() => {});
  await modulesCol.createIndex({ category: 1 }).catch(() => {});
  await modulesCol.createIndex({ defaultIncludedInFlex: 1 }).catch(() => {});
await mongoose.connection.close();
}

run().catch(async (err) => {
  console.error('❌ Seed failed:', err);
  try { await mongoose.connection.close(); } catch (_) {}
  process.exit(1);
});
