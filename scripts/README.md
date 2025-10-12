# Production Seed Scripts

This directory contains the official seed scripts for production deployment.

## 🌱 Reference Data Seeding

**Primary Script:** `seed-reference-data.js`
- **Purpose:** Seeds all reference data for asset management system
- **Status:** ✅ PRODUCTION READY
- **Usage:** `node scripts/seed-reference-data.js`
- **Dependencies:** Requires `MONGODB_URI` in `.env`

This script creates complete hierarchical data for **11 industries**:
- Oil & Gas, Power Generation, Manufacturing, Chemicals
- Pharmaceutical, Maritime, Paint Manufacturing
- Scaffolding Services, Construction, Mining, Other
- Site types by industry (66 total site types)
- Asset group types by industry (67 total group types)  
- Asset types by group (94 total asset types)
- General status options (5 statuses)
- Site status options (6 statuses)

## 🏢 Multi-Tenant Data Seeding

**Script:** `seed-multi-tenant-data.js`
- **Purpose:** Seeds tenant, organization, and user data
- **Status:** ✅ PRODUCTION READY
- **Usage:** `node scripts/seed-multi-tenant-data.js`

## 📦 Module Seeding

**Script:** `seed-modules.js`
- **Purpose:** Seeds system modules and entitlements
- **Status:** ✅ PRODUCTION READY
- **Usage:** `node scripts/seed-modules.js`

## 👤 Super Admin Setup

**Script:** `seed-super-admin.js`
- **Purpose:** Creates initial super admin user
- **Status:** ✅ PRODUCTION READY
- **Usage:** `node scripts/seed-super-admin.js`

## 🚀 Production Deployment Order

1. `seed-modules.js` - System modules first
2. `seed-multi-tenant-data.js` - Organizations and tenants
3. `seed-reference-data.js` - Reference data for forms
4. `seed-super-admin.js` - Admin user access

## 📋 Database Backup

**Script:** `backup-database.js`
- **Purpose:** Creates database backups
- **Usage:** `node scripts/backup-database.js`
