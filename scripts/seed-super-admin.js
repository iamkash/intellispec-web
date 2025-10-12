// Seed script to create a tenant, Super Admin role, and a super admin user
// Usage: node scripts/seed-super-admin.js

const path = require('path');
try { require('dotenv').config({ path: path.resolve(process.cwd(), '.env') }); } catch (_) {}

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/intellispec-dev';

const TENANT_SLUG = process.env.SEED_TENANT_SLUG || 'pksti';
const TENANT_NAME = process.env.SEED_TENANT_NAME || 'PKSTI';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'superadmin@pksti.com';
const ADMIN_USER_ID = process.env.SEED_ADMIN_USER_ID || 'superadmin';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

async function run() {
  await mongoose.connect(MONGODB_URI, { maxPoolSize: 5 });

  const db = mongoose.connection.db;

  const tenants = db.collection('tenants');
  const roles = db.collection('roles');
  const users = db.collection('users');

  // Ensure indexes minimal
  await tenants.createIndex({ tenantSlug: 1 }, { unique: true }).catch(() => {});
  await roles.createIndex({ tenantId: 1, name: 1 }, { unique: true }).catch(() => {});
  await users.createIndex({ tenantId: 1, email: 1 }, { unique: true }).catch(() => {});

  // Upsert tenant
  const tenantUpsert = await tenants.findOneAndUpdate(
    { tenantSlug: TENANT_SLUG },
    {
      $setOnInsert: {
        tenantSlug: TENANT_SLUG,
        name: TENANT_NAME,
        status: 'active',
        subscription: {
          plan: 'trial',
          status: 'trial',
          startDate: new Date()
        },
        settings: {
          maxUsers: 100,
          features: ['*']
        }
      }
    },
    { upsert: true, returnDocument: 'after' }
  );
  const tenantDoc = tenantUpsert && tenantUpsert.value
    ? tenantUpsert.value
    : await tenants.findOne({ tenantSlug: TENANT_SLUG });
  if (!tenantDoc) {
    throw new Error('Failed to upsert or fetch tenant document');
  }
  const tenantId = tenantDoc._id;

  // Upsert Super Admin role
  const roleUpsert = await roles.findOneAndUpdate(
    { tenantId, name: 'Super Admin' },
    {
      $setOnInsert: {
        tenantId,
        name: 'Super Admin',
        description: 'Full system access',
        permissions: ['*'],
        isSystemRole: true,
        isExternalCustomer: false,
        allowedRoutes: ['*']
      }
    },
    { upsert: true, returnDocument: 'after' }
  );
  const roleDoc = roleUpsert && roleUpsert.value
    ? roleUpsert.value
    : await roles.findOne({ tenantId, name: 'Super Admin' });
  if (!roleDoc) {
    throw new Error('Failed to upsert or fetch role document');
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  // Upsert super admin user
  await users.updateOne(
    { tenantId, email: ADMIN_EMAIL.toLowerCase() },
    {
      $set: {
        tenantId,
        userId: ADMIN_USER_ID,
        email: ADMIN_EMAIL.toLowerCase(),
        password: passwordHash,
        firstName: 'Super',
        lastName: 'Admin',
        status: 'active',
        emailVerified: true,
        roleIds: [roleDoc._id],
        loginAttempts: 0,
        passwordChangedAt: new Date()
      },
      $setOnInsert: {
        createdAt: new Date()
      }
    },
    { upsert: true }
  );
console.log(`Tenant Slug: ${TENANT_SLUG}`);
console.log(`Password:    ${ADMIN_PASSWORD}`);

  await mongoose.connection.close();
}

run().catch(async (err) => {
  console.error('Seed failed:', err);
  try { await mongoose.connection.close(); } catch (_) {}
  process.exit(1);
});


