/**
 * Tenant Scope Middleware
 * 
 * PURE MIDDLEWARE - Only HTTP request/response handling
 * All business logic delegated to AuthorizationService
 */

const { logger } = require('../core/Logger');
const AuthorizationService = require('../core/AuthorizationService');

/**
 * Middleware: Enforce tenant scope on queries
 * 
 * Usage: Add to routes that should be tenant-scoped
 * Example: router.get('/data', enforceTenantScope, handler)
 * 
 * Behavior:
 * - Platform Admin: No restrictions (can access all tenants)
 * - Tenant Admin: Automatically filters queries to their tenant(s)
 * - Regular User: Automatically filters queries to their tenant(s)
 */
function enforceTenantScope(options = {}) {
  return async (request, reply) => {
    try {
      const user = request.user;

      if (!user || !user.id) {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized: User not authenticated'
        });
      }

      // Platform Admin: Full access, no restrictions
      if (AuthorizationService.isPlatformAdmin(user)) {
        request.tenantScoped = false;
        request.allowedTenants = 'all';
        return; // Continue to route handler
      }

      // Get user's tenants via AuthorizationService
      const userTenants = await AuthorizationService.getUserTenants(user.id);

      if (!userTenants || userTenants.length === 0) {
        return reply.code(403).send({
          success: false,
          error: 'Forbidden: User has no tenant access'
        });
      }

      // Store tenant scope in request for use in handlers
      request.tenantScoped = true;
      request.allowedTenants = userTenants;

      // If route requires specific tenant ID, validate access
      const requestedTenantId = request.params.tenantId || 
                                request.query.tenantId || 
                                request.body?.tenantId;

      if (requestedTenantId && !userTenants.includes(requestedTenantId)) {
        return reply.code(403).send({
          success: false,
          error: 'Forbidden: You do not have access to this tenant'
        });
      }

      // Continue to route handler
      return;

    } catch (error) {
      logger.error('Tenant scope middleware error', { 
        error: error.message,
        userId: request.user?.id,
        url: request.url
      });
      return reply.code(500).send({
        success: false,
        error: 'Internal server error checking tenant scope'
      });
    }
  };
}

/**
 * Helper: Apply tenant filter to MongoDB query
 * 
 * @deprecated Use AuthorizationService.applyTenantFilter() instead
 * @param {Object} query - MongoDB query object
 * @param {Object} request - Fastify request object
 * @returns {Object} - Query with tenant filter applied
 */
function applyTenantFilter(query, request) {
  // If not tenant-scoped (Platform Admin), return query as-is
  if (!request.tenantScoped) {
    return query;
  }

  return AuthorizationService.applyTenantFilter(query, request.allowedTenants);
}

/**
 * Middleware: Require Tenant Admin role
 * 
 * Ensures user is either:
 * - Platform Admin (full access)
 * - Tenant Admin for the requested tenant
 */
function requireTenantAdmin(request, reply, done) {
  const user = request.user;

  if (!user || !user.id) {
    return reply.code(401).send({
      success: false,
      error: 'Unauthorized: User not authenticated'
    });
  }

  // Platform Admin: Allow
  if (AuthorizationService.isPlatformAdmin(user)) {
    return done();
  }

  // Get requested tenant ID
  const requestedTenantId = request.params.tenantId || 
                           request.query.tenantId || 
                           request.body?.tenantId;

  if (!requestedTenantId) {
    return reply.code(400).send({
      success: false,
      error: 'Bad Request: Tenant ID required'
    });
  }

  // Check if user is tenant admin for this tenant via AuthorizationService
  AuthorizationService.isTenantAdmin(user.id, requestedTenantId)
    .then(isAdmin => {
      if (isAdmin) {
        done();
      } else {
        reply.code(403).send({
          success: false,
          error: 'Forbidden: Tenant Admin role required for this tenant'
        });
      }
    })
    .catch(error => {
      logger.error('Error checking tenant admin', { 
        error: error.message,
        userId: request.user?.id,
        tenantId: requestedTenantId
      });
      reply.code(500).send({
        success: false,
        error: 'Internal server error checking permissions'
      });
    });
}

/**
 * Helper: Get user's default tenant
 * 
 * @deprecated Use AuthorizationService.getUserDefaultTenant() instead
 */
async function getUserDefaultTenant(userId) {
  return await AuthorizationService.getUserDefaultTenant(userId);
}

module.exports = {
  // TRUE MIDDLEWARE (HTTP request/response handlers)
  enforceTenantScope,
  requireTenantAdmin,
  
  // DEPRECATED HELPERS (use AuthorizationService instead)
  applyTenantFilter, // @deprecated
  getUserDefaultTenant // @deprecated
};

