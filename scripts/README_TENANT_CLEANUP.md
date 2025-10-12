# MongoDB Tenant Data Cleanup Guide

This guide provides multiple methods to safely delete all data associated with a specific tenant from your MongoDB database.

## ⚠️ Important Warning

**These scripts will permanently delete ALL data associated with the specified tenant. This action cannot be undone. Always backup your data before running cleanup operations.**

## Available Methods

### Method 1: PowerShell Script (Recommended for Windows)

The easiest method for Windows users:

```powershell
# Interactive mode
.\scripts\Connect-MongoDB.ps1

# Direct cleanup
.\scripts\Connect-MongoDB.ps1 -TenantId "t_pk_inspections"

# Analyze only (no deletion)
.\scripts\Connect-MongoDB.ps1 -AnalyzeOnly

# Show help
.\scripts\Connect-MongoDB.ps1 -Help
```

### Method 2: Node.js Script

Direct execution using Node.js:

```bash
# Analyze tenant data first (recommended)
node scripts/cleanup-tenant-data.js t_pk_inspections

# The script will show you what data exists before deletion
```

### Method 3: MongoDB Shell (mongosh)

For direct database access:

```bash
# Connect to MongoDB
mongosh "your-mongodb-connection-string"

# Load the cleanup script
load("scripts/cleanup-tenant-mongo-shell.js")

# Analyze data first
analyzeTenant("t_pk_inspections")

# Delete all tenant data
cleanupTenant("t_pk_inspections")
```

### Method 4: Batch File (Windows)

Simple Windows batch file:

```cmd
scripts\connect-mongodb.bat
```

## Prerequisites

1. **Environment Setup**: Ensure you have a `.env` file with your MongoDB connection string:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/intellispec?retryWrites=true&w=majority
   ```

2. **Required Tools**:
   - Node.js (for Node.js scripts)
   - MongoDB Shell (mongosh) for direct database access
   - PowerShell (for PowerShell scripts)

## What Data Gets Deleted

The cleanup scripts target the following collections and remove all documents where `tenantId`, `tenantSlug`, or `tenant` matches the specified tenant:

### Core Collections
- **documents** - Main business documents (paintInvoice, company, site, paint_specifications)
- **ragdocuments** - RAG/Vector search documents
- **tenants** - Tenant configuration data
- **users** - User accounts associated with the tenant
- **roles** - Custom roles for the tenant
- **memberships** - User-tenant relationship mappings

### Operational Collections
- **authlogs** - Authentication and access logs
- **subscriptions** - Tenant subscription data
- **tenantEntitlements** - Feature entitlements and permissions
- **wizardSessions** - AI wizard session data
- **wizardResponses** - AI wizard response history

## Safety Features

### Pre-Deletion Analysis
All scripts first analyze the data to show you exactly what will be deleted:

```
📊 Analyzing tenant data...
  📄 documents: 150 documents
  📄 ragdocuments: 45 documents
  📄 users: 5 documents
  📄 authlogs: 230 documents

🔥 Total documents to delete: 430
```

### Confirmation Required
- Interactive confirmation before deletion
- 5-second delay to allow cancellation
- Clear warnings about permanent data loss

### Post-Deletion Verification
After deletion, scripts verify that all tenant data has been removed and report any remaining documents.

## Step-by-Step Usage

### For Tenant: t_pk_inspections

1. **First, analyze the data** (recommended):
   ```powershell
   .\scripts\Connect-MongoDB.ps1 -AnalyzeOnly
   ```

2. **Review what will be deleted** and ensure it's correct

3. **Run the cleanup**:
   ```powershell
   .\scripts\Connect-MongoDB.ps1 -TenantId "t_pk_inspections"
   ```

4. **Confirm deletion** by typing `YES` when prompted

5. **Verify results** - the script will confirm successful deletion

## Manual MongoDB Commands

If you prefer to run commands directly in MongoDB shell:

```javascript
// Connect to your database first
use intellispec

// Count documents for tenant
db.documents.countDocuments({tenantId: "t_pk_inspections"})
db.ragdocuments.countDocuments({tenantId: "t_pk_inspections"})
db.users.countDocuments({tenantId: "t_pk_inspections"})
db.authlogs.countDocuments({tenantId: "t_pk_inspections"})

// Delete all tenant data (BE CAREFUL!)
db.documents.deleteMany({tenantId: "t_pk_inspections"})
db.ragdocuments.deleteMany({tenantId: "t_pk_inspections"})
db.users.deleteMany({tenantId: "t_pk_inspections"})
db.authlogs.deleteMany({tenantId: "t_pk_inspections"})
db.tenants.deleteMany({tenantId: "t_pk_inspections"})
db.roles.deleteMany({tenantId: "t_pk_inspections"})
db.memberships.deleteMany({tenantId: "t_pk_inspections"})
db.subscriptions.deleteMany({tenantId: "t_pk_inspections"})
db.tenantEntitlements.deleteMany({tenantId: "t_pk_inspections"})
db.wizardSessions.deleteMany({tenantId: "t_pk_inspections"})
db.wizardResponses.deleteMany({tenantId: "t_pk_inspections"})

// Verify deletion
db.documents.countDocuments({tenantId: "t_pk_inspections"})
```

## Troubleshooting

### Common Issues

1. **Connection String Not Found**
   - Ensure `.env` file exists in the project root
   - Verify `MONGODB_URI` is set correctly

2. **Permission Denied**
   - Ensure your MongoDB user has delete permissions
   - Check that you're connected to the correct database

3. **Script Not Found**
   - Run scripts from the project root directory
   - Ensure all script files are present in the `scripts/` folder

4. **PowerShell Execution Policy**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

### Verification Commands

After cleanup, verify the tenant is completely removed:

```javascript
// In MongoDB shell
db.runCommand({
  "aggregate": "documents",
  "pipeline": [
    {"$match": {"tenantId": "t_pk_inspections"}},
    {"$count": "remaining"}
  ]
})
```

## Recovery

**There is no built-in recovery mechanism.** If you need to recover deleted data:

1. Restore from your most recent database backup
2. Use MongoDB Atlas point-in-time recovery (if available)
3. Contact your database administrator

## Support

If you encounter issues:

1. Check the console output for specific error messages
2. Verify your MongoDB connection string and permissions
3. Ensure all required Node.js packages are installed
4. Review the MongoDB server logs for additional details

---

**Remember: Always backup your data before running any cleanup operations!**
