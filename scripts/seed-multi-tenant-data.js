/**
 * Multi-Tenant B2B SaaS Seed Data Script
 * 
 * Seeds the database with organizations, tenants, subscriptions, entitlements,
 * users, and memberships for testing the multi-tenant system.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// For now, we'll create basic models here until the full schema integration is complete
const generateId = (prefix) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Basic models for seeding
const OrganizationModel = mongoose.model('Organization', new mongoose.Schema({
  id: String,
  name: String,
  status: { type: String, default: 'active' },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}));

const TenantModel = mongoose.model('Tenant', new mongoose.Schema({
  id: String,
  orgId: String,
  name: String,
  slug: String,
  status: { type: String, default: 'active' }, // active, suspended, inactive
  plan: { type: String, default: 'IntelliFlex' }, // IntelliFlex or IntelliEnterprise
  tenantType: { type: String, default: 'facility-based' }, // user-based, facility-based, enterprise
  maxUsers: Number, // For user-based plans
  maxFacilities: Number, // For facility-based plans
  trial: {
    enabled: { type: Boolean, default: false },
    trialDays: { type: Number, default: 30 },
    startMode: { type: String, default: 'auto' }, // auto or manual
    gracePeriodDays: { type: Number, default: 7 }
  },
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: String,
  lastModifiedBy: String
}));

const UserModel = mongoose.model('User', new mongoose.Schema({
  id: String,
  email: String,
  password: String,
  name: String,
  status: { type: String, default: 'active' },
  platformRole: { type: String, enum: ['platform_admin', 'user', null], default: null }, // Platform-level role
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}));

const MembershipModel = mongoose.model('Membership', new mongoose.Schema({
  id: String,
  userId: String,
  tenantId: String,
  role: String,
  createdAt: { type: Date, default: Date.now },
  createdBy: String
}));

const ModuleModel = mongoose.model('Module', new mongoose.Schema({
  key: String,
  name: String,
  status: { type: String, default: 'active' },
  category: String,
  defaultIncludedInFlex: Boolean,
  icon: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}));

const TenantEntitlementsModel = mongoose.model('TenantEntitlements', new mongoose.Schema({
  id: String,
  tenantId: String,
  modules: [String],
  sitesAllowed: Number,
  unlimitedUsers: Boolean,
  effectiveAt: Date,
  version: Number,
  changedBy: String,
  createdAt: { type: Date, default: Date.now }
}));

const SubscriptionModel = mongoose.model('Subscription', new mongoose.Schema({
  id: String,
  tenantId: String,
  termStartAt: Date,
  termEndAt: Date,
  autoRenew: Boolean,
  gracePeriodDays: Number,
  lifecycleStatus: String,
  cancelledAt: Date,
  suspendedAt: Date,
  terminatedAt: Date,
  lastLifecycleCheckAt: Date,
  metadata: Object,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}));

const SubscriptionHistoryModel = mongoose.model('SubscriptionHistory', new mongoose.Schema({
  id: String,
  tenantId: String,
  changeType: String,
  changedBy: String,
  changeReason: String,
  beforeSnapshot: Object,
  afterSnapshot: Object,
  diff: String,
  createdAt: { type: Date, default: Date.now }
}));

const AuditLogModel = mongoose.model('AuditLog', new mongoose.Schema({
  id: String,
  action: String, // create_organization, create_tenant, update_tenant, assign_admin, activate_tenant, deactivate_tenant, etc.
  entityType: String, // organization, tenant, user, subscription, entitlements
  entityId: String,
  entityName: String,
  performedBy: String,
  performedByName: String,
  changes: Object, // Before/after snapshot
  metadata: Object, // Additional context
  ipAddress: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now, index: true }
}));

const EntitlementsHistoryModel = mongoose.model('EntitlementsHistory', new mongoose.Schema({
  id: String,
  tenantId: String,
  version: Number,
  changeType: String,
  changedBy: String,
  changeReason: String,
  beforeSnapshot: Object,
  afterSnapshot: Object,
  diff: String,
  createdAt: { type: Date, default: Date.now }
}));

// Seed data configuration
const SEED_DATA = {
  organizations: [
    {
      id: "org_pk_companies",
      name: "PK Companies",
      status: "active",
      notes: "Multi-division industrial services company"
    }
  ],
  
  tenants: [
    {
      id: "t_pk_inspections",
      orgId: "org_pk_companies",
      name: "PK Inspections",
      slug: "pk-inspections",
      status: "active",
      plan: "IntelliEnterprise",
      tenantType: "facility-based",
      maxFacilities: 5,
      trial: {
        enabled: false,
        trialDays: 30,
        startMode: "auto",
        gracePeriodDays: 7
      },
      notes: "Primary inspections division - Enterprise plan with 5 facilities",
      createdBy: "super_admin@intellispec.com"
    },
    {
      id: "t_pk_safety",
      orgId: "org_pk_companies", 
      name: "PK Safety",
      slug: "pk-safety",
      status: "active",
      plan: "IntelliFlex",
      tenantType: "user-based",
      maxUsers: 10,
      trial: {
        enabled: false,
        trialDays: 30,
        startMode: "auto",
        gracePeriodDays: 5
      },
      notes: "Safety and rescue division - Flex plan with 10 users",
      createdBy: "super_admin@intellispec.com"
    },
    {
      id: "t_pk_industria",
      orgId: "org_pk_companies",
      name: "PK Industria", 
      slug: "pk-industria",
      status: "active",
      plan: "IntelliEnterprise",
      tenantType: "facility-based",
      maxFacilities: 8,
      trial: {
        enabled: false,
        trialDays: 30,
        startMode: "auto",
        gracePeriodDays: 14
      },
      notes: "Industrial manufacturing division - Enterprise with 8 facilities",
      createdBy: "super_admin@intellispec.com"
    },
    {
      id: "t_hf_sinclair",
      orgId: null,
      name: "HF Sinclair",
      slug: "hf-sinclair", 
      status: "active",
      plan: "IntelliEnterprise",
      tenantType: "enterprise",
      trial: {
        enabled: false,
        trialDays: 0,
        startMode: "auto",
        gracePeriodDays: 10
      },
      notes: "Independent oil refining company - Enterprise unlimited access",
      createdBy: "super_admin@intellispec.com"
    },
    {
      id: "t_sherwin_williams",
      orgId: null,
      name: "Sherwin Williams",
      slug: "sherwin-williams",
      status: "active", 
      plan: "IntelliFlex",
      tenantType: "facility-based",
      maxFacilities: 6,
      trial: {
        enabled: true,
        trialDays: 30,
        startMode: "auto",
        gracePeriodDays: 7
      },
      notes: "Paint and coatings manufacturer - Flex trial with 6 facilities",
      createdBy: "super_admin@intellispec.com"
    },
    {
      id: "t_demo_trial",
      orgId: null,
      name: "Demo Trial Account",
      slug: "demo-trial",
      status: "active",
      plan: "IntelliFlex",
      tenantType: "user-based",
      maxUsers: 5,
      trial: {
        enabled: true,
        trialDays: 14,
        startMode: "manual",
        gracePeriodDays: 3
      },
      notes: "Demo account for trial testing - Manual start, 14 days",
      createdBy: "super_admin@intellispec.com"
    }
  ],

  subscriptions: [
    {
      tenantId: "t_pk_inspections",
      termStartAt: new Date('2025-01-01'),
      termEndAt: new Date('2025-12-31'),
      autoRenew: true,
      gracePeriodDays: 7,
      lifecycleStatus: "active"
    },
    {
      tenantId: "t_pk_safety", 
      termStartAt: new Date('2024-12-01'),
      termEndAt: new Date('2025-02-15'), // Expiring soon
      autoRenew: false,
      gracePeriodDays: 5,
      lifecycleStatus: "active"
    },
    {
      tenantId: "t_pk_industria",
      termStartAt: new Date('2024-11-01'),
      termEndAt: new Date('2025-01-15'), // In grace period
      autoRenew: true,
      gracePeriodDays: 14,
      lifecycleStatus: "grace"
    },
    {
      tenantId: "t_hf_sinclair",
      termStartAt: new Date('2025-01-15'),
      termEndAt: new Date('2026-01-15'),
      autoRenew: true,
      gracePeriodDays: 10,
      lifecycleStatus: "active"
    },
    {
      tenantId: "t_sherwin_williams",
      termStartAt: new Date('2024-10-01'),
      termEndAt: new Date('2025-03-31'),
      autoRenew: false,
      gracePeriodDays: 7,
      lifecycleStatus: "active"
    },
    {
      tenantId: "t_demo_trial",
      termStartAt: new Date('2025-01-20'),
      termEndAt: new Date('2025-02-03'), // 14 days trial
      autoRenew: false,
      gracePeriodDays: 3,
      lifecycleStatus: "trialing"
    }
  ],

  entitlements: [
    {
      tenantId: "t_pk_inspections",
      modules: ["system", "inspect", "track", "comply", "vault"],
      sitesAllowed: 5,
      unlimitedUsers: true,
      effectiveAt: new Date('2025-01-01'),
      version: 1,
      changedBy: "super_admin@intellispec.com"
    },
    {
      tenantId: "t_pk_safety",
      modules: ["system", "track", "vault", "rescue"],
      sitesAllowed: 2,
      unlimitedUsers: true,
      effectiveAt: new Date('2024-12-01'),
      version: 1,
      changedBy: "super_admin@intellispec.com"
    },
    {
      tenantId: "t_pk_industria",
      modules: ["system", "inspect", "track", "comply"],
      sitesAllowed: 8,
      unlimitedUsers: true,
      effectiveAt: new Date('2024-11-01'),
      version: 1,
      changedBy: "super_admin@intellispec.com"
    },
    {
      tenantId: "t_hf_sinclair",
      modules: ["system", "inspect", "track", "comply", "vault", "turnaround"],
      sitesAllowed: 12,
      unlimitedUsers: true,
      effectiveAt: new Date('2025-01-15'),
      version: 1,
      changedBy: "super_admin@intellispec.com"
    },
    {
      tenantId: "t_sherwin_williams",
      modules: ["system", "inspect", "comply", "workforce"],
      sitesAllowed: 6,
      unlimitedUsers: true,
      effectiveAt: new Date('2024-10-01'),
      version: 1,
      changedBy: "super_admin@intellispec.com"
    },
    {
      tenantId: "t_demo_trial",
      modules: ["system", "inspect", "track"],
      sitesAllowed: 1,
      unlimitedUsers: false,
      effectiveAt: new Date('2025-01-20'),
      version: 1,
      changedBy: "super_admin@intellispec.com"
    }
  ],

  users: [
    {
      id: "u_super_admin",
      email: "super_admin@intellispec.com",
      name: "Super Administrator",
      status: "active",
      platformRole: "platform_admin" // Platform-level admin
    },
    {
      id: "u_superadmin_pksti",
      email: "superadmin@pksti.com",
      name: "PKSTI Super Admin",
      status: "active",
      platformRole: "platform_admin" // Platform-level admin
    },
    {
      id: "u_pk_owner",
      email: "owner@pk.com", 
      name: "PK Owner",
      status: "active"
    },
    {
      id: "u_pk_inspector",
      email: "inspector@pk.com",
      name: "John Inspector",
      status: "active"
    },
    {
      id: "u_pk_safety_mgr",
      email: "safety@pk.com",
      name: "Sarah Safety",
      status: "active"
    },
    {
      id: "u_hf_admin",
      email: "admin@hfsinclair.com",
      name: "HF Admin",
      status: "active"
    },
    {
      id: "u_hf_engineer",
      email: "engineer@hfsinclair.com", 
      name: "Mike Engineer",
      status: "active"
    },
    {
      id: "u_sw_admin",
      email: "admin@sherwin.com",
      name: "Sherwin Admin", 
      status: "active"
    },
    {
      id: "u_sw_qc",
      email: "qc@sherwin.com",
      name: "Quality Control",
      status: "active"
    },
    {
      id: "u_demo_admin",
      email: "admin@demo.com",
      name: "Demo Admin User",
      status: "active"
    }
  ],

  memberships: [
    // Super Admin - access to all tenants
    { userId: "u_super_admin", tenantId: "t_pk_inspections", role: "tenant_admin" },
    { userId: "u_super_admin", tenantId: "t_pk_safety", role: "tenant_admin" },
    { userId: "u_super_admin", tenantId: "t_pk_industria", role: "tenant_admin" },
    { userId: "u_super_admin", tenantId: "t_hf_sinclair", role: "tenant_admin" },
    { userId: "u_super_admin", tenantId: "t_sherwin_williams", role: "tenant_admin" },
    
    // PKSTI Super Admin - access to all tenants
    { userId: "u_superadmin_pksti", tenantId: "t_pk_inspections", role: "tenant_admin" },
    { userId: "u_superadmin_pksti", tenantId: "t_pk_safety", role: "tenant_admin" },
    { userId: "u_superadmin_pksti", tenantId: "t_pk_industria", role: "tenant_admin" },
    { userId: "u_superadmin_pksti", tenantId: "t_hf_sinclair", role: "tenant_admin" },
    { userId: "u_superadmin_pksti", tenantId: "t_sherwin_williams", role: "tenant_admin" },
    { userId: "u_superadmin_pksti", tenantId: "t_demo_trial", role: "tenant_admin" },
    
    // PK Owner - access to all PK divisions
    { userId: "u_pk_owner", tenantId: "t_pk_inspections", role: "tenant_admin" },
    { userId: "u_pk_owner", tenantId: "t_pk_safety", role: "tenant_admin" },
    { userId: "u_pk_owner", tenantId: "t_pk_industria", role: "tenant_admin" },
    
    // PK Inspector - access to inspections and industria
    { userId: "u_pk_inspector", tenantId: "t_pk_inspections", role: "user" },
    { userId: "u_pk_inspector", tenantId: "t_pk_industria", role: "user" },
    
    // PK Safety Manager - access to safety division
    { userId: "u_pk_safety_mgr", tenantId: "t_pk_safety", role: "tenant_admin" },
    
    // HF Sinclair users
    { userId: "u_hf_admin", tenantId: "t_hf_sinclair", role: "tenant_admin" },
    { userId: "u_hf_engineer", tenantId: "t_hf_sinclair", role: "user" },
    
    // Sherwin Williams users
    { userId: "u_sw_admin", tenantId: "t_sherwin_williams", role: "tenant_admin" },
    { userId: "u_sw_qc", tenantId: "t_sherwin_williams", role: "user" },
    
    // Demo Trial users
    { userId: "u_demo_admin", tenantId: "t_demo_trial", role: "tenant_admin" },
    { userId: "u_super_admin", tenantId: "t_demo_trial", role: "tenant_admin" }
  ],

  modules: [
    { key: "system", name: "System Administration", status: "active", category: "core", defaultIncludedInFlex: true, icon: "SettingOutlined" },
    { key: "inspect", name: "Inspection Intelligence", status: "active", category: "inspection", defaultIncludedInFlex: true, icon: "SearchOutlined" },
    { key: "track", name: "Asset Manager", status: "active", category: "asset", defaultIncludedInFlex: true, icon: "DatabaseOutlined" },
    { key: "comply", name: "Compliance Manager", status: "active", category: "compliance", defaultIncludedInFlex: false, icon: "SafetyCertificateOutlined" },
    { key: "vault", name: "Document Vault", status: "active", category: "document", defaultIncludedInFlex: false, icon: "FolderOutlined" },
    { key: "rescue", name: "Safety Command Center", status: "active", category: "safety", defaultIncludedInFlex: false, icon: "AlertOutlined" },
    { key: "turnaround", name: "Turnaround Digital", status: "active", category: "project", defaultIncludedInFlex: false, icon: "ProjectOutlined" },
    { key: "workforce", name: "Workforce Manager", status: "active", category: "hr", defaultIncludedInFlex: false, icon: "TeamOutlined" }
  ]
};

async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/intellispec-dev';
    await mongoose.connect(mongoUri, { maxPoolSize: 10 });
} catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

async function clearExistingData() {
  console.log('⚠️  WARNING: This will DELETE all multi-tenant data!');
  console.log('⚠️  Use --clear flag to enable this destructive operation.');
  
  await Promise.all([
    // Clear all multi-tenant collections
    MembershipModel.deleteMany({}),
    TenantEntitlementsModel.deleteMany({}),
    SubscriptionModel.deleteMany({}),
    TenantModel.deleteMany({}),
    OrganizationModel.deleteMany({}),
    // Only clear users that will be seeded by this script
    UserModel.deleteMany({ id: { $in: SEED_DATA.users.map(u => u.id) } }),
    // Only clear modules that will be seeded by this script
    ModuleModel.deleteMany({ key: { $in: SEED_DATA.modules.map(m => m.key) } })
  ]);
  
  console.log('✅ All existing data cleared.');
}

async function seedModules() {
  console.log('📦 Seeding modules (upsert mode)...');
  for (const moduleData of SEED_DATA.modules) {
    await ModuleModel.updateOne(
      { key: moduleData.key },
      { 
        $set: { ...moduleData, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );
  }
  console.log(`✅ Seeded ${SEED_DATA.modules.length} modules`);
}

async function seedOrganizations() {
  console.log('🏢 Seeding organizations (upsert mode)...');
  for (const orgData of SEED_DATA.organizations) {
    await OrganizationModel.updateOne(
      { id: orgData.id },
      { 
        $set: { ...orgData, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );
  }
  console.log(`✅ Seeded ${SEED_DATA.organizations.length} organizations`);
}

async function seedTenants() {
  console.log('🏬 Seeding tenants (upsert mode)...');
  for (const tenantData of SEED_DATA.tenants) {
    await TenantModel.updateOne(
      { id: tenantData.id },
      { 
        $set: { ...tenantData, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );
  }
  console.log(`✅ Seeded ${SEED_DATA.tenants.length} tenants`);
}

async function seedSubscriptions() {
  console.log('📅 Seeding subscriptions (upsert mode)...');
  for (const subData of SEED_DATA.subscriptions) {
    // Check if subscription already exists for this tenant
    const existing = await SubscriptionModel.findOne({ tenantId: subData.tenantId });
    
    if (existing) {
      // Update existing subscription
      await SubscriptionModel.updateOne(
        { tenantId: subData.tenantId },
        { 
          $set: { ...subData, updatedAt: new Date() }
        }
      );
    } else {
      // Create new subscription with generated ID
      await SubscriptionModel.create({
        id: generateId('subscription'),
        ...subData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }
  console.log(`✅ Seeded ${SEED_DATA.subscriptions.length} subscriptions`);
}

async function seedEntitlements() {
  console.log('🎟️  Seeding entitlements (upsert mode)...');
  for (const entData of SEED_DATA.entitlements) {
    // Check if entitlements already exist for this tenant
    const existing = await TenantEntitlementsModel.findOne({ tenantId: entData.tenantId });
    
    if (existing) {
      // Update existing entitlements, increment version
      await TenantEntitlementsModel.updateOne(
        { tenantId: entData.tenantId },
        { 
          $set: { 
            ...entData, 
            version: existing.version + 1,
            effectiveAt: new Date()
          }
        }
      );
    } else {
      // Create new entitlements with generated ID
      await TenantEntitlementsModel.create({
        id: generateId('entitlements'),
        ...entData,
        createdAt: new Date()
      });
    }
  }
  console.log(`✅ Seeded ${SEED_DATA.entitlements.length} entitlements`);
}

async function seedUsers() {
  console.log('👥 Seeding users (upsert mode)...');
  const defaultPassword = await bcrypt.hash('password123', 12);
  const adminPassword = await bcrypt.hash('Admin@12345', 12);
  
  for (const userData of SEED_DATA.users) {
    // Use Admin@12345 for super admins, password123 for everyone else
    const password = (userData.id === 'u_super_admin' || userData.id === 'u_superadmin_pksti') 
      ? adminPassword 
      : defaultPassword;
    
    await UserModel.updateOne(
      { id: userData.id },
      { 
        $set: { ...userData, password, updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );
  }
  console.log(`✅ Seeded ${SEED_DATA.users.length} users`);
}

async function seedMemberships() {
  console.log('🔗 Seeding memberships (upsert mode)...');
  for (const membershipData of SEED_DATA.memberships) {
    // Check if membership already exists
    const existing = await MembershipModel.findOne({
      userId: membershipData.userId,
      tenantId: membershipData.tenantId,
      role: membershipData.role
    });
    
    if (!existing) {
      // Only create if it doesn't exist (memberships are typically unique)
      await MembershipModel.create({
        id: generateId('membership'),
        ...membershipData,
        createdAt: new Date(),
        createdBy: 'seed_script'
      });
    }
  }
  console.log(`✅ Seeded ${SEED_DATA.memberships.length} memberships (skipped duplicates)`);
}

async function printSummary() {
const [orgCount, tenantCount, userCount, membershipCount, moduleCount] = await Promise.all([
    OrganizationModel.countDocuments(),
    TenantModel.countDocuments(),
    UserModel.countDocuments(),
    MembershipModel.countDocuments(),
    ModuleModel.countDocuments()
  ]);
console.log(`Tenants: ${tenantCount}`);
console.log(`Memberships: ${membershipCount}`);
console.log('\n=== TENANT DETAILS ===');
  const tenants = await TenantModel.find().lean();
  for (const tenant of tenants) {
    const subscription = await SubscriptionModel.findOne({ tenantId: tenant.id }).lean();
    const entitlements = await TenantEntitlementsModel.findOne({ tenantId: tenant.id }).lean();
    const memberCount = await MembershipModel.countDocuments({ tenantId: tenant.id });
console.log(`  Status: ${tenant.status}`);
console.log(`  Term: ${subscription?.termStartAt?.toISOString().split('T')[0]} - ${subscription?.termEndAt?.toISOString().split('T')[0]}`);
console.log(`  Modules: ${entitlements?.modules?.join(', ') || 'None'}`);
}
console.log('\n=== LOGIN CREDENTIALS ===');
console.log('Platform Admins (password: Admin@12345) - tenant_admin role on ALL tenants:');
console.log('  • superadmin@pksti.com - Multi-Tenant Admin (access to 6 tenants)');
console.log('  • super_admin@intellispec.com - Multi-Tenant Admin (access to 6 tenants)');
console.log('\nTenant Admins (password: password123):');
console.log('  • owner@pk.com - PK Owner (tenant_admin on 3 tenants)');
console.log('  • admin@hfsinclair.com - HF Sinclair Admin (tenant_admin on 1 tenant)');
console.log('  • admin@sherwin.com - Sherwin Williams Admin (tenant_admin on 1 tenant)');
console.log('\n=== TENANT URLS ===');
for (const tenant of tenants) {
}
}

async function main() {
  try {
    const shouldClear = process.argv.includes('--clear');
    
    await connectToDatabase();
    
    console.log('\n🌱 IntelliSpec Multi-Tenant Seed Script');
    console.log('========================================\n');
    
    if (shouldClear) {
      console.log('⚠️  DESTRUCTIVE MODE: Clearing all existing data...\n');
      await clearExistingData();
      console.log('\n');
    } else {
      console.log('✅ UPSERT MODE: Updating existing records, inserting new ones');
      console.log('💡 Use --clear flag to delete all data before seeding\n');
    }
    
    await seedModules();
    await seedOrganizations();
    await seedTenants();
    await seedSubscriptions();
    await seedEntitlements();
    await seedUsers();
    await seedMemberships();
    
    console.log('\n========================================');
    await printSummary();
    console.log('\n✅ Seed process completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Seed process failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the seed script
if (require.main === module) {
  main();
}

module.exports = { main, SEED_DATA };
