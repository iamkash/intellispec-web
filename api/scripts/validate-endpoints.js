/**
 * API Endpoint Validator
 * 
 * Validates that:
 * 1. All frontend API calls use getApiFullUrl() (not relative URLs)
 * 2. All endpoints called by frontend are registered in backend
 * 3. No endpoints are missing
 * 
 * Run: npm run validate-endpoints
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../../src');
const API_DIR = path.join(__dirname, '..');

const results = {
  frontendCalls: new Map(), // endpoint -> files that call it
  backendEndpoints: new Set(),
  issues: [],
  warnings: []
};

/**
 * Extract API endpoints from frontend files
 */
function scanFrontendFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(SRC_DIR, filePath);
  
  // Pattern 1: getApiFullUrl('/api/...')
  const apiFullUrlPattern = /getApiFullUrl\(['"`]([^'"`]+)['"`]\)/g;
  let match;
  while ((match = apiFullUrlPattern.exec(content)) !== null) {
    const endpoint = match[1];
    if (endpoint.startsWith('/api/')) {
      if (!results.frontendCalls.has(endpoint)) {
        results.frontendCalls.set(endpoint, []);
      }
      results.frontendCalls.get(endpoint).push(relativePath);
    }
  }
  
  // Pattern 2: Relative URLs - these are BAD
  const relativeUrlPattern = /fetch\(['"`](\/api\/[^'"`]+)['"`]/g;
  while ((match = relativeUrlPattern.exec(content)) !== null) {
    const endpoint = match[1];
    
    // Check if this line also has getApiFullUrl (false positive)
    const lineStart = content.lastIndexOf('\n', match.index);
    const lineEnd = content.indexOf('\n', match.index);
    const line = content.substring(lineStart, lineEnd);
    
    if (!line.includes('getApiFullUrl')) {
      results.issues.push({
        type: 'RELATIVE_URL',
        severity: 'ERROR',
        file: relativePath,
        endpoint: endpoint,
        message: `Using relative URL instead of getApiFullUrl()`,
        line: line.trim()
      });
      
      // Still track it
      if (!results.frontendCalls.has(endpoint)) {
        results.frontendCalls.set(endpoint, []);
      }
      results.frontendCalls.get(endpoint).push(relativePath);
    }
  }
  
  // Pattern 3: BaseGadget.makeAuthenticatedFetch() - these are OK
  const baseGadgetPattern = /makeAuthenticatedFetch\(['"`]([^'"`]+)['"`]/g;
  while ((match = baseGadgetPattern.exec(content)) !== null) {
    const endpoint = match[1];
    if (endpoint.startsWith('/api/')) {
      if (!results.frontendCalls.has(endpoint)) {
        results.frontendCalls.set(endpoint, []);
      }
      if (!results.frontendCalls.get(endpoint).includes(relativePath)) {
        results.frontendCalls.get(endpoint).push(relativePath);
      }
    }
  }
}

/**
 * Extract registered endpoints from backend
 */
function scanBackendFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Pattern: fastify.get('/api/...', ...)
  const endpointPattern = /fastify\.(get|post|put|patch|delete|options)\(['"`](\/api\/[^'"`]+)['"`]/g;
  let match;
  while ((match = endpointPattern.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const endpoint = match[2];
    
    // Remove :params for comparison
    const normalizedEndpoint = endpoint.replace(/:[^/]+/g, ':param');
    
    results.backendEndpoints.add(`${method} ${normalizedEndpoint}`);
  }
}

/**
 * Recursively scan directory
 */
function scanDirectory(dir, callback) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, build, etc.
      if (!['node_modules', 'build', 'dist', '.git', 'backups'].includes(file)) {
        scanDirectory(fullPath, callback);
      }
    } else if (stat.isFile()) {
      callback(fullPath);
    }
  }
}

/**
 * Validate endpoints
 */
function validate() {
  console.log('🔍 Scanning frontend for API calls...\n');
  
  // Scan frontend files
  scanDirectory(SRC_DIR, (filePath) => {
    if (['.tsx', '.ts', '.jsx', '.js'].some(ext => filePath.endsWith(ext))) {
      scanFrontendFile(filePath);
    }
  });
  
  console.log(`Found ${results.frontendCalls.size} unique API endpoints called from frontend\n`);
  
  console.log('🔍 Scanning backend for registered endpoints...\n');
  
  // Scan backend files
  scanDirectory(API_DIR, (filePath) => {
    if (filePath.endsWith('.js') && !filePath.includes('node_modules')) {
      scanBackendFile(filePath);
    }
  });
  
  console.log(`Found ${results.backendEndpoints.size} registered backend endpoints\n`);
  
  // Validate each frontend call
  console.log('🔍 Validating endpoints...\n');
  
  for (const [endpoint, files] of results.frontendCalls.entries()) {
    // Check if endpoint exists in backend
    // We need to check all HTTP methods since frontend might use any
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    let found = false;
    
    for (const method of methods) {
      const normalizedEndpoint = endpoint.replace(/\/:[^/]+/g, '/:param');
      if (results.backendEndpoints.has(`${method} ${normalizedEndpoint}`)) {
        found = true;
        break;
      }
    }
    
    if (!found) {
      results.issues.push({
        type: 'MISSING_ENDPOINT',
        severity: 'ERROR',
        endpoint: endpoint,
        usedIn: files,
        message: `Endpoint called by frontend but not registered in backend`
      });
    }
  }
  
  // Print results
  console.log('═'.repeat(80));
  console.log('📊 Validation Results');
  console.log('═'.repeat(80));
  console.log(`Frontend API calls: ${results.frontendCalls.size}`);
  console.log(`Backend endpoints: ${results.backendEndpoints.size}`);
  console.log(`Issues found: ${results.issues.length}`);
  console.log(`Warnings: ${results.warnings.length}\n`);
  
  // Print issues
  if (results.issues.length > 0) {
    console.log('❌ ISSUES FOUND:\n');
    
    const missingEndpoints = results.issues.filter(i => i.type === 'MISSING_ENDPOINT');
    const relativeUrls = results.issues.filter(i => i.type === 'RELATIVE_URL');
    
    if (missingEndpoints.length > 0) {
      console.log('🚫 Missing Backend Endpoints:\n');
      missingEndpoints.forEach(issue => {
        console.log(`   Endpoint: ${issue.endpoint}`);
        console.log(`   Used in:`);
        issue.usedIn.forEach(file => console.log(`     - ${file}`));
        console.log('');
      });
    }
    
    if (relativeUrls.length > 0) {
      console.log('🚫 Relative URLs (should use getApiFullUrl):\n');
      relativeUrls.forEach(issue => {
        console.log(`   File: ${issue.file}`);
        console.log(`   Endpoint: ${issue.endpoint}`);
        console.log(`   Line: ${issue.line}`);
        console.log('');
      });
    }
  }
  
  // Print warnings
  if (results.warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    results.warnings.forEach(warning => {
      console.log(`   ${warning}`);
    });
    console.log('');
  }
  
  // Print recommendations
  if (results.issues.length > 0) {
    const missingEndpoints = results.issues.filter(i => i.type === 'MISSING_ENDPOINT');
    const relativeUrls = results.issues.filter(i => i.type === 'RELATIVE_URL');
    
    console.log('💡 RECOMMENDATIONS:\n');
    
    if (missingEndpoints.length > 0) {
      console.log('1. Add missing endpoints to backend:');
      console.log('   - Check api/routes/ for similar endpoints');
      console.log('   - Or add to api/server.js for auth endpoints\n');
    }
    
    if (relativeUrls.length > 0) {
      console.log('2. Fix relative URLs:');
      console.log('   - Import: import { getApiFullUrl } from \'../config/api.config\';');
      console.log('   - Replace: fetch(\'/api/endpoint\') → fetch(getApiFullUrl(\'/api/endpoint\'))\n');
    }
  }
  
  // Summary
  if (results.issues.length === 0) {
    console.log('✅ All endpoints validated successfully!\n');
    console.log('All frontend API calls:');
    for (const endpoint of results.frontendCalls.keys()) {
      console.log(`  ✅ ${endpoint}`);
    }
    console.log('');
    process.exit(0);
  } else {
    console.log('❌ Validation FAILED - please fix issues above\n');
    process.exit(1);
  }
}

// Run validation
try {
  validate();
} catch (error) {
  console.error('❌ Validation script failed:', error);
  process.exit(1);
}

