/**
 * Authentication Middleware Validator
 * 
 * This script validates that all routes use the centralized authentication middleware
 * from api/core/AuthMiddleware.js and not custom implementations.
 * 
 * Run: node api/scripts/validate-auth-middleware.js
 */

const fs = require('fs');
const path = require('path');

const ROUTES_DIR = path.join(__dirname, '../routes');
const REQUIRED_MIDDLEWARE = [
  'requireAuth',
  'requirePlatformAdmin',
  'requireTenantAdmin',
  'optionalAuth',
  'verifyPlatformAdmin',
  'requireSuperAdmin'
];

// Patterns that indicate custom auth implementations (bad)
const BAD_PATTERNS = [
  /const\s+requireSuperAdmin\s*=\s*async\s*\(/,
  /const\s+requirePlatformAdmin\s*=\s*async\s*\(/,
  /const\s+requireAuth\s*=\s*async\s*\(/,
  /function\s+requireSuperAdmin\s*\(/,
  /function\s+requirePlatformAdmin\s*\(/,
  /function\s+requireAuth\s*\(/,
  /jwt\.verify\(/,
  /fastify\.verifySuperAdmin/,
  /Authorization.*Bearer/
];

// Good patterns (importing from AuthMiddleware)
const GOOD_PATTERNS = [
  /require\(['"]\.\.\/core\/AuthMiddleware['"]\)/,
  /require\(['"]\.\.\/middleware\/platform-admin['"]\)/
];

const results = {
  totalFiles: 0,
  validFiles: 0,
  issuesFound: [],
  warnings: []
};

/**
 * Check if file imports auth middleware correctly
 */
function hasCorrectImport(content) {
  return GOOD_PATTERNS.some(pattern => pattern.test(content));
}

/**
 * Check for custom auth implementations
 */
function hasCustomAuth(content) {
  const issues = [];
  
  BAD_PATTERNS.forEach(pattern => {
    if (pattern.test(content)) {
      issues.push({
        pattern: pattern.toString(),
        description: 'Custom authentication implementation detected'
      });
    }
  });
  
  return issues;
}

/**
 * Extract route definitions from file
 */
function extractRoutes(content) {
  const routePattern = /fastify\.(get|post|put|patch|delete)\(['"`]([^'"`]+)['"`]/g;
  const routes = [];
  let match;
  
  while ((match = routePattern.exec(content)) !== null) {
    routes.push({
      method: match[1].toUpperCase(),
      path: match[2]
    });
  }
  
  return routes;
}

/**
 * Check if route has authentication
 */
function checkRouteAuth(content, route) {
  // Find the route definition
  const routeRegex = new RegExp(
    `fastify\\.${route.method.toLowerCase()}\\(['"\`]${route.path.replace(/\//g, '\\/')}['"\`][^)]*\\)`,
    'g'
  );
  
  const match = routeRegex.exec(content);
  if (!match) return { hasAuth: false, middleware: null };
  
  const routeDefinition = match[0];
  
  // Check for preHandler
  const hasPreHandler = /preHandler:\s*(\w+)/.test(routeDefinition);
  if (!hasPreHandler) return { hasAuth: false, middleware: null };
  
  const middlewareMatch = routeDefinition.match(/preHandler:\s*(\w+)/);
  const middleware = middlewareMatch ? middlewareMatch[1] : null;
  
  return { hasAuth: true, middleware };
}

/**
 * Validate a single route file
 */
function validateFile(filePath) {
  const fileName = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Skip non-route files
  if (!content.includes('fastify.get') && 
      !content.includes('fastify.post') && 
      !content.includes('fastify.put') &&
      !content.includes('fastify.delete') &&
      !content.includes('fastify.patch')) {
    return;
  }
  
  results.totalFiles++;
  
  const fileIssues = {
    file: fileName,
    path: filePath,
    issues: [],
    routes: []
  };
  
  // Check 1: Has correct import?
  if (!hasCorrectImport(content)) {
    // Check if file needs auth (has admin/protected routes)
    const needsAuth = /preHandler/.test(content) || 
                     /admin/.test(fileName) || 
                     /tenant-/.test(fileName);
    
    if (needsAuth) {
      fileIssues.issues.push({
        type: 'MISSING_IMPORT',
        severity: 'ERROR',
        message: 'File does not import from core/AuthMiddleware'
      });
    }
  }
  
  // Check 2: Has custom auth implementation?
  const customAuthIssues = hasCustomAuth(content);
  if (customAuthIssues.length > 0) {
    customAuthIssues.forEach(issue => {
      fileIssues.issues.push({
        type: 'CUSTOM_AUTH',
        severity: 'ERROR',
        message: `Custom auth implementation found: ${issue.description}`,
        pattern: issue.pattern
      });
    });
  }
  
  // Check 3: Validate each route
  const routes = extractRoutes(content);
  routes.forEach(route => {
    const authCheck = checkRouteAuth(content, route);
    
    // Public routes (auth-fastify, tenants discovery, health checks)
    const isPublicRoute = 
      fileName === 'auth-fastify.js' ||
      route.path.includes('/health') ||
      route.path.includes('/ready') ||
      route.path.includes('/alive') ||
      route.path.includes('/discover') ||
      route.path === '/tenants';
    
    if (!isPublicRoute && !authCheck.hasAuth) {
      fileIssues.routes.push({
        method: route.method,
        path: route.path,
        issue: 'NO_AUTH',
        severity: 'WARNING',
        message: 'Route has no authentication middleware'
      });
    }
    
    if (authCheck.hasAuth && authCheck.middleware) {
      // Check if middleware is from the approved list
      const isApproved = REQUIRED_MIDDLEWARE.includes(authCheck.middleware);
      
      if (!isApproved) {
        fileIssues.routes.push({
          method: route.method,
          path: route.path,
          issue: 'UNKNOWN_MIDDLEWARE',
          severity: 'WARNING',
          message: `Using unknown middleware: ${authCheck.middleware}`
        });
      }
    }
  });
  
  // Record results
  if (fileIssues.issues.length > 0 || fileIssues.routes.some(r => r.severity === 'ERROR')) {
    results.issuesFound.push(fileIssues);
  } else if (fileIssues.routes.some(r => r.severity === 'WARNING')) {
    results.warnings.push(fileIssues);
  } else {
    results.validFiles++;
  }
}

/**
 * Main validation logic
 */
function validate() {
  console.log('🔍 Validating authentication middleware usage...\n');
  
  // Get all route files
  const files = fs.readdirSync(ROUTES_DIR)
    .filter(file => file.endsWith('.js'))
    .map(file => path.join(ROUTES_DIR, file));
  
  // Validate each file
  files.forEach(validateFile);
  
  // Print results
  console.log('📊 Validation Results');
  console.log('═'.repeat(80));
  console.log(`Total route files: ${results.totalFiles}`);
  console.log(`✅ Valid files: ${results.validFiles}`);
  console.log(`❌ Files with errors: ${results.issuesFound.length}`);
  console.log(`⚠️  Files with warnings: ${results.warnings.length}\n`);
  
  // Print errors
  if (results.issuesFound.length > 0) {
    console.log('❌ ERRORS FOUND:\n');
    results.issuesFound.forEach(file => {
      console.log(`📁 ${file.file}`);
      console.log(`   Path: ${file.path}\n`);
      
      file.issues.forEach(issue => {
        console.log(`   [${issue.severity}] ${issue.type}: ${issue.message}`);
        if (issue.pattern) {
          console.log(`   Pattern: ${issue.pattern}`);
        }
      });
      
      file.routes.forEach(route => {
        if (route.severity === 'ERROR') {
          console.log(`   [${route.severity}] ${route.method} ${route.path}: ${route.message}`);
        }
      });
      
      console.log('');
    });
  }
  
  // Print warnings
  if (results.warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    results.warnings.forEach(file => {
      console.log(`📁 ${file.file}`);
      
      file.routes.forEach(route => {
        console.log(`   [${route.severity}] ${route.method} ${route.path}: ${route.message}`);
      });
      
      console.log('');
    });
  }
  
  // Print recommendations
  if (results.issuesFound.length > 0 || results.warnings.length > 0) {
    console.log('💡 RECOMMENDATIONS:\n');
    console.log('1. Import auth middleware from core:');
    console.log('   const { requireAuth, requirePlatformAdmin } = require(\'../core/AuthMiddleware\');\n');
    console.log('2. Use preHandler for authentication:');
    console.log('   fastify.get(\'/route\', { preHandler: requireAuth }, async (req, reply) => {...});\n');
    console.log('3. Remove custom auth implementations - use centralized middleware only!\n');
  }
  
  // Exit code
  if (results.issuesFound.length > 0) {
    console.log('❌ Validation FAILED - please fix errors above\n');
    process.exit(1);
  } else {
    console.log('✅ Validation PASSED - all routes use centralized auth middleware!\n');
    process.exit(0);
  }
}

// Run validation
try {
  validate();
} catch (error) {
  console.error('❌ Validation script failed:', error);
  process.exit(1);
}




