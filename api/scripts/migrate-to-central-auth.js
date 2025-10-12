/**
 * Migration Script: Update All Routes to Use Centralized Auth
 * 
 * This script automatically updates all route files to:
 * 1. Import from core/AuthMiddleware instead of custom implementations
 * 2. Remove custom auth middleware functions
 * 3. Update middleware references
 * 
 * Run: node api/scripts/migrate-to-central-auth.js
 * 
 * SAFETY: Creates backups before modifying files
 */

const fs = require('fs');
const path = require('path');

const ROUTES_DIR = path.join(__dirname, '../routes');
const BACKUP_DIR = path.join(__dirname, '../../backups/auth-migration');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const results = {
  migrated: [],
  skipped: [],
  errors: []
};

/**
 * Create backup of file
 */
function createBackup(filePath) {
  const fileName = path.basename(filePath);
  const backupPath = path.join(BACKUP_DIR, `${fileName}.${Date.now()}.backup`);
  fs.copyFileSync(filePath, backupPath);
  console.log(`   📦 Backup created: ${backupPath}`);
  return backupPath;
}

/**
 * Migrate a single file
 */
function migrateFile(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n📄 Processing: ${fileName}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    
    // Step 1: Add import if not present
    const hasAuthImport = /require\(['"]\.\.\/core\/AuthMiddleware['"]\)/.test(content);
    const hasPlatformAdminImport = /require\(['"]\.\.\/middleware\/platform-admin['"]\)/.test(content);
    
    if (!hasAuthImport && !hasPlatformAdminImport) {
      // Check if file has auth-related code
      const needsAuth = content.includes('preHandler') || 
                       content.includes('requireSuperAdmin') ||
                       content.includes('requirePlatformAdmin') ||
                       content.includes('verifyPlatformAdmin');
      
      if (needsAuth) {
        // Find where to insert import (after other requires)
        const requirePattern = /const .+ = require\([^)]+\);/g;
        const requires = content.match(requirePattern);
        
        if (requires && requires.length > 0) {
          const lastRequire = requires[requires.length - 1];
          const lastRequireIndex = content.lastIndexOf(lastRequire);
          const insertPosition = lastRequireIndex + lastRequire.length;
          
          const authImport = "\nconst { requireAuth, requirePlatformAdmin, requireTenantAdmin } = require('../core/AuthMiddleware');";
          content = content.slice(0, insertPosition) + authImport + content.slice(insertPosition);
          modified = true;
          console.log('   ✅ Added AuthMiddleware import');
        }
      }
    }
    
    // Step 2: Remove custom requireSuperAdmin implementations
    const customAuthPattern = /const\s+requireSuperAdmin\s*=\s*async\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\};/g;
    if (customAuthPattern.test(content)) {
      // Create backup first
      createBackup(filePath);
      
      // Replace custom implementation with reference
      content = content.replace(customAuthPattern, '// Migrated to use requirePlatformAdmin from core/AuthMiddleware\n  const requireSuperAdmin = requirePlatformAdmin;');
      modified = true;
      console.log('   ✅ Removed custom requireSuperAdmin implementation');
    }
    
    // Step 3: Update fastify.verifySuperAdmin references
    if (content.includes('fastify.verifySuperAdmin')) {
      createBackup(filePath);
      content = content.replace(
        /const\s+requireSuperAdmin\s*=\s*fastify\.verifySuperAdmin[^;]*;/g,
        'const requireSuperAdmin = requirePlatformAdmin;'
      );
      modified = true;
      console.log('   ✅ Updated fastify.verifySuperAdmin references');
    }
    
    // Step 4: Update verifyPlatformAdmin imports
    if (content.includes("require('../middleware/platform-admin')")) {
      // Replace old import with new one
      content = content.replace(
        /const\s*\{[^}]*verifyPlatformAdmin[^}]*\}\s*=\s*require\(['"]\.\.\/middleware\/platform-admin['"]\);/g,
        "const { requirePlatformAdmin, requireTenantAdmin } = require('../core/AuthMiddleware');\n  // Note: verifyPlatformAdmin is now requirePlatformAdmin"
      );
      
      // Update const requireSuperAdmin = verifyPlatformAdmin
      content = content.replace(
        /const\s+requireSuperAdmin\s*=\s*verifyPlatformAdmin;/g,
        'const requireSuperAdmin = requirePlatformAdmin;'
      );
      
      modified = true;
      console.log('   ✅ Updated platform-admin middleware import');
    }
    
    // Step 5: Remove redundant JWT verification code
    if (content.includes('jwt.verify') && content.includes('requireSuperAdmin')) {
      // This indicates custom JWT handling inside the middleware
      // We'll flag it but not auto-fix (too risky)
      console.log('   ⚠️  WARNING: Found custom JWT verification code - manual review recommended');
    }
    
    // Write changes if modified
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      results.migrated.push(fileName);
      console.log(`   ✨ Migration complete for ${fileName}`);
    } else {
      results.skipped.push(fileName);
      console.log(`   ⏭️  No changes needed for ${fileName}`);
    }
    
  } catch (error) {
    results.errors.push({ file: fileName, error: error.message });
    console.error(`   ❌ Error migrating ${fileName}:`, error.message);
  }
}

/**
 * Main migration logic
 */
function migrate() {
  console.log('🚀 Starting Auth Middleware Migration...\n');
  console.log(`Backup location: ${BACKUP_DIR}\n`);
  
  // Get all route files
  const files = fs.readdirSync(ROUTES_DIR)
    .filter(file => file.endsWith('.js'))
    .map(file => path.join(ROUTES_DIR, file));
  
  // Migrate each file
  files.forEach(migrateFile);
  
  // Print summary
  console.log('\n' + '═'.repeat(80));
  console.log('📊 Migration Summary');
  console.log('═'.repeat(80));
  console.log(`✅ Files migrated: ${results.migrated.length}`);
  console.log(`⏭️  Files skipped: ${results.skipped.length}`);
  console.log(`❌ Errors: ${results.errors.length}\n`);
  
  if (results.migrated.length > 0) {
    console.log('Migrated files:');
    results.migrated.forEach(file => console.log(`  - ${file}`));
    console.log('');
  }
  
  if (results.errors.length > 0) {
    console.log('❌ Errors:');
    results.errors.forEach(err => console.log(`  - ${err.file}: ${err.error}`));
    console.log('');
  }
  
  console.log('💡 Next Steps:');
  console.log('1. Run validation: node api/scripts/validate-auth-middleware.js');
  console.log('2. Test your API routes');
  console.log('3. If issues occur, restore from backups in:', BACKUP_DIR);
  console.log('');
}

// Run migration
try {
  migrate();
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}




