/**
 * Route Auto-Loader
 * 
 * Automatically discovers and registers all route files from api/routes/
 * Convention-based routing with minimal configuration.
 * 
 * Features:
 * - Auto-discovery of route files
 * - Convention-based prefixes
 * - Configurable route registration
 * - Logging and error handling
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('./Logger');

/**
 * Route configuration map
 * Key: filename (without .js), Value: { prefix, enabled }
 */
const ROUTE_CONFIG = {
  // Admin routes
  'admin': { prefix: '/api', enabled: true },
  'admin-stats': { prefix: '/api/admin', enabled: true },
  'platform-admin': { prefix: '/api', enabled: true },
  
  // Tenant routes
  'tenant-admin': { prefix: '/api/multi-tenant', enabled: true },
  'tenant-creation': { prefix: '/api', enabled: true },
  'tenant-data': { prefix: '/api/tenant-scoped', enabled: true },
  'tenants': { prefix: '/api', enabled: true },
  
  // Core data routes
  'documents': { prefix: '/api', enabled: true },
  'reference-data': { prefix: '/api', enabled: true },
  'audit-logs': { prefix: '/api/audit-logs', enabled: true },
  
  // Workflow routes
  'workflows': { prefix: '/api/workflows', enabled: true },
  'executions': { prefix: '/api/executions', enabled: true },
  
  // Inspection routes
  'inspections-fastify': { prefix: '/api', enabled: true },
  'wizards': { prefix: '/api', enabled: true },
  'calculators': { prefix: '/api', enabled: true },
  
  // Bulk operations
  'bulk-operations': { prefix: '/api', enabled: true },
  'aggregation': { prefix: '/api', enabled: true },
  
  // Communication routes
  'realtime': { prefix: '/api/realtime', enabled: true },
  'rag-chat': { prefix: '/api', enabled: true },
  'rag-tools-fastify': { prefix: '/api', enabled: true },
  'options': { prefix: '/api', enabled: true },
  'hierarchy-search': { prefix: '/api', enabled: true },
  
  // AI services
  'ai-column-mapping': { prefix: '/api', enabled: true },
  'ai-stream': { prefix: '/api', enabled: true },
  
  // File uploads
  'uploads': { prefix: '/api/uploads', enabled: true },
  
  // Auth (handled separately in server.js)
  'auth-fastify': { prefix: '/api/auth', enabled: false }
};

class RouteLoader {
  /**
   * Auto-register all routes from api/routes/
   * 
   * @param {Object} fastify - Fastify instance
   * @param {String} routesDir - Path to routes directory
   */
  static async autoRegisterRoutes(fastify, routesDir = path.join(__dirname, '../routes')) {
    logger.info('Starting auto-registration of routes', { routesDir });
    
    const registeredCount = { success: 0, skipped: 0, failed: 0 };
    
    try {
      // Read all files in routes directory
      const files = fs.readdirSync(routesDir)
        .filter(file => file.endsWith('.js'))
        .sort(); // Alphabetical order for consistency
      
      logger.debug('Found route files', { count: files.length, files });
      
      for (const file of files) {
        const routeName = file.replace('.js', '');
        const config = ROUTE_CONFIG[routeName];
        
        // Skip if not configured or disabled
        if (!config || !config.enabled) {
          logger.debug('Skipping route', { routeName, reason: !config ? 'not configured' : 'disabled' });
          registeredCount.skipped++;
          continue;
        }
        
        try {
          const routePath = path.join(routesDir, file);
          const routeModule = require(routePath);
          
          // Handle different export patterns
          const registerFunction = RouteLoader.getRegisterFunction(routeModule, routeName);
          
          if (!registerFunction) {
            logger.warn('No register function found for route', { routeName, file });
            registeredCount.skipped++;
            continue;
          }
          
          // Register the route with prefix
          await fastify.register(async (instance) => {
            await registerFunction(instance);
          }, { prefix: config.prefix });
          
          logger.info('Route registered successfully', {
            routeName,
            prefix: config.prefix,
            file
          });
          
          registeredCount.success++;
          
        } catch (error) {
          logger.error('Failed to register route', {
            routeName,
            file,
            error: error.message,
            stack: error.stack
          });
          registeredCount.failed++;
        }
      }
      
      logger.info('Route auto-registration completed', registeredCount);
      
      return registeredCount;
      
    } catch (error) {
      logger.error('Route auto-registration failed', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * Extract register function from route module
   * Handles various export patterns
   * 
   * @param {Object} routeModule - Required route module
   * @param {String} routeName - Route name for logging
   * @returns {Function|null} Register function
   */
  static getRegisterFunction(routeModule, routeName) {
    // Pattern 1: Direct function export (most common)
    if (typeof routeModule === 'function') {
      return routeModule;
    }
    
    // Pattern 2: Named export with register prefix
    const registerKey = `register${routeName.split('-').map(s => 
      s.charAt(0).toUpperCase() + s.slice(1)
    ).join('')}Routes`;
    
    if (routeModule[registerKey] && typeof routeModule[registerKey] === 'function') {
      return routeModule[registerKey];
    }
    
    // Pattern 3: Common named exports
    const commonNames = [
      'registerRoutes',
      'register',
      routeName,
      Object.keys(routeModule).find(key => key.includes('register'))
    ];
    
    for (const name of commonNames) {
      if (name && routeModule[name] && typeof routeModule[name] === 'function') {
        return routeModule[name];
      }
    }
    
    return null;
  }
  
  /**
   * Get list of all available routes
   * 
   * @returns {Array} List of route configurations
   */
  static getAvailableRoutes() {
    return Object.entries(ROUTE_CONFIG).map(([name, config]) => ({
      name,
      ...config
    }));
  }
  
  /**
   * Update route configuration at runtime
   * 
   * @param {String} routeName - Route name
   * @param {Object} config - New configuration
   */
  static updateRouteConfig(routeName, config) {
    if (ROUTE_CONFIG[routeName]) {
      ROUTE_CONFIG[routeName] = { ...ROUTE_CONFIG[routeName], ...config };
      logger.info('Route configuration updated', { routeName, config });
    } else {
      logger.warn('Route not found in configuration', { routeName });
    }
  }
}

module.exports = RouteLoader;

