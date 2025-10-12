/**
 * Tenant Security Middleware
 * 
 * PURE MIDDLEWARE - Only HTTP request/response validation
 * All business logic delegated to AuthorizationService
 * 
 * Note: Tenant filtering and soft delete handling is automatic via BaseRepository.
 * This middleware only validates that requests have proper authentication/tenant context.
 */

const { logger } = require('../core/Logger');
const AuthorizationService = require('../core/AuthorizationService');

/**
 * Middleware to validate tenant context on all requests
 * 
 * Ensures user is authenticated and has tenant context
 * (Actual tenant filtering is handled by BaseRepository)
 */
async function validateTenantContext(request, reply) {
  try {
    // Skip validation for public endpoints
    const skipPaths = ['/api/auth', '/api/health', '/api/metrics', '/api/ping'];
    if (skipPaths.some(path => request.url.startsWith(path))) {
      return;
    }
    
    // Ensure user is authenticated
    if (!request.user) {
      logger.warn('Tenant security: No user context', { url: request.url });
      return reply.code(401).send({
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    // Platform admins don't need tenant context
    if (request.user.isPlatformAdmin) {
      return; // Allow platform admins
    }
    
    // Regular users must have tenant context
    if (!request.user.tenantId) {
      logger.warn('Tenant security: No tenant ID', { 
        userId: request.user.userId,
        url: request.url 
      });
      return reply.code(403).send({
        error: 'Tenant context required',
        code: 'TENANT_REQUIRED'
      });
    }
    
    // Tenant context validated successfully
    
  } catch (error) {
    logger.error('Tenant validation error', { 
      error: error.message,
      url: request.url
    });
    return reply.code(500).send({
      error: 'Tenant validation failed',
      code: 'TENANT_VALIDATION_ERROR'
    });
  }
}

/**
 * Deprecated: Use AuthorizationService.applyTenantFilter() instead
 * 
 * @deprecated Use AuthorizationService.applyTenantFilter()
 */
function addTenantFilter(baseFilter, tenantId) {
  const allowedTenants = tenantId ? [tenantId] : 'all';
  return AuthorizationService.applyTenantFilter(baseFilter, allowedTenants);
}

/**
 * Deprecated: Use AuthorizationService.validateResultsTenant() instead
 * 
 * @deprecated Use AuthorizationService.validateResultsTenant()
 */
function validateResultsTenant(results, expectedTenantId) {
  return AuthorizationService.validateResultsTenant(results, expectedTenantId);
}

module.exports = {
  // TRUE MIDDLEWARE (HTTP request/response handlers)
  validateTenantContext,
  
  // DEPRECATED HELPERS (use AuthorizationService instead)
  addTenantFilter, // @deprecated
  validateResultsTenant // @deprecated
};
