/**
 * Centralized Authentication Middleware Framework
 * 
 * CRITICAL: This is the ONLY place authentication logic should live.
 * All routes must use these middleware functions - no custom implementations!
 * 
 * Design Patterns:
 * - Factory Pattern: Create middleware for different auth levels
 * - Strategy Pattern: Different authentication strategies
 * - Decorator Pattern: Attach user context to requests
 * 
 * Usage:
 *   const { requireAuth, requirePlatformAdmin, requireTenantAdmin } = require('../core/AuthMiddleware');
 *   
 *   fastify.get('/api/resource', { preHandler: requireAuth }, async (req, reply) => {
 *     // req.user is populated
 *   });
 */

const jwt = require('jsonwebtoken');
const { logger } = require('./Logger');
const { NotFoundError, AuthenticationError, AuthorizationError } = require('./ErrorHandler');

/**
 * Get JWT secret from environment
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'your-super-secret-jwt-key-change-in-production') {
    logger.warn('[Auth] Using default JWT secret - CHANGE IN PRODUCTION!');
  }
  return secret || 'your-super-secret-jwt-key-change-in-production';
}

/**
 * Extract and verify JWT token from request
 * 
 * @param {Object} request - Fastify request
 * @returns {Object} - Decoded JWT payload
 * @throws {AuthenticationError} - If token is missing or invalid
 */
function extractAndVerifyToken(request) {
  // Extract token from Authorization header
  const authHeader = request.headers.authorization || request.headers.Authorization;
  
  if (!authHeader) {
    throw new AuthenticationError('No authorization header provided');
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('Invalid authorization format. Expected: Bearer <token>');
  }
  
  const token = authHeader.substring(7).trim();
  
  if (!token) {
    throw new AuthenticationError('No token provided in authorization header');
  }
  
  // Verify JWT token
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Invalid token');
    }
    throw new AuthenticationError(`Token verification failed: ${error.message}`);
  }
}

/**
 * Base authentication middleware
 * Verifies JWT token and attaches user to request
 * 
 * @param {Object} request - Fastify request
 * @param {Object} reply - Fastify reply
 */
async function requireAuth(request, reply) {
  try {
    const decoded = extractAndVerifyToken(request);
    
    // Attach user info to request for downstream use
    request.user = {
      userId: decoded.userId,
      email: decoded.email,
      tenantId: decoded.tenantId,
      tenantSlug: decoded.tenantSlug,
      platformRole: decoded.platformRole,
      roles: decoded.roles || []
    };
    
    logger.debug('[Auth] User authenticated', {
      userId: request.user.userId,
      tenantId: request.user.tenantId,
      platformRole: request.user.platformRole
    });
    
  } catch (error) {
    logger.warn('[Auth] Authentication failed', {
      error: error.message,
      path: request.url,
      ip: request.ip
    });
    
    return reply.code(401).send({
      error: error.message || 'Authentication required',
      code: 'NOT_AUTHENTICATED'
    });
  }
}

/**
 * Platform Admin middleware
 * Requires platformRole: 'platform_admin' in JWT
 * 
 * Platform admins have full access to:
 * - All tenants
 * - System configuration
 * - User management across tenants
 * - Organization management
 * 
 * @param {Object} request - Fastify request
 * @param {Object} reply - Fastify reply
 */
async function requirePlatformAdmin(request, reply) {
  try {
    const decoded = extractAndVerifyToken(request);
    
    // CRITICAL: Check platformRole in JWT - no database lookup needed!
    if (decoded.platformRole !== 'platform_admin') {
      throw new AuthorizationError('Platform administrator privileges required');
    }
    
    // Attach user info to request
    request.user = {
      userId: decoded.userId,
      email: decoded.email,
      tenantId: decoded.tenantId,
      tenantSlug: decoded.tenantSlug,
      platformRole: decoded.platformRole,
      isPlatformAdmin: true
    };
    
    logger.debug('[Auth] Platform admin authenticated', {
      userId: request.user.userId,
      email: request.user.email
    });
    
  } catch (error) {
    logger.warn('[Auth] Platform admin authentication failed', {
      error: error.message,
      path: request.url,
      ip: request.ip
    });
    
    const statusCode = error.statusCode || (error.message.includes('privileges') ? 403 : 401);
    
    return reply.code(statusCode).send({
      error: error.message || 'Platform admin access required',
      code: error.message.includes('privileges') ? 'INSUFFICIENT_PRIVILEGES' : 'NOT_AUTHENTICATED'
    });
  }
}

/**
 * Tenant Admin middleware
 * Requires tenant_admin role within the tenant
 * 
 * @param {Object} request - Fastify request
 * @param {Object} reply - Fastify reply
 */
async function requireTenantAdmin(request, reply) {
  try {
    const decoded = extractAndVerifyToken(request);
    
    // Platform admins can access tenant admin routes
    if (decoded.platformRole === 'platform_admin') {
      request.user = {
        userId: decoded.userId,
        email: decoded.email,
        tenantId: decoded.tenantId,
        tenantSlug: decoded.tenantSlug,
        platformRole: decoded.platformRole,
        isPlatformAdmin: true,
        isTenantAdmin: true
      };
      return;
    }
    
    // Check if user has tenant_admin role
    const roles = decoded.roles || [];
    const isTenantAdmin = roles.includes('tenant_admin') || roles.includes('admin');
    
    if (!isTenantAdmin) {
      throw new AuthorizationError('Tenant administrator privileges required');
    }
    
    request.user = {
      userId: decoded.userId,
      email: decoded.email,
      tenantId: decoded.tenantId,
      tenantSlug: decoded.tenantSlug,
      roles: decoded.roles,
      isTenantAdmin: true
    };
    
    logger.debug('[Auth] Tenant admin authenticated', {
      userId: request.user.userId,
      tenantId: request.user.tenantId
    });
    
  } catch (error) {
    logger.warn('[Auth] Tenant admin authentication failed', {
      error: error.message,
      path: request.url,
      ip: request.ip
    });
    
    const statusCode = error.statusCode || (error.message.includes('privileges') ? 403 : 401);
    
    return reply.code(statusCode).send({
      error: error.message || 'Tenant admin access required',
      code: error.message.includes('privileges') ? 'INSUFFICIENT_PRIVILEGES' : 'NOT_AUTHENTICATED'
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't fail if missing
 * 
 * @param {Object} request - Fastify request
 * @param {Object} reply - Fastify reply
 */
async function optionalAuth(request, reply) {
  try {
    const decoded = extractAndVerifyToken(request);
    
    request.user = {
      userId: decoded.userId,
      email: decoded.email,
      tenantId: decoded.tenantId,
      tenantSlug: decoded.tenantSlug,
      platformRole: decoded.platformRole,
      roles: decoded.roles || []
    };
  } catch (error) {
    // Silently fail - user remains undefined
    request.user = null;
  }
}

/**
 * Permission-based middleware factory
 * Creates middleware that checks for specific permissions
 * 
 * @param {string|string[]} permissions - Required permission(s)
 * @returns {Function} - Middleware function
 * 
 * @example
 *   const requireViewUsers = requirePermission('users.view');
 *   fastify.get('/users', { preHandler: requireViewUsers }, ...);
 */
function requirePermission(permissions) {
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
  
  return async (request, reply) => {
    try {
      const decoded = extractAndVerifyToken(request);
      
      // Platform admins have all permissions
      if (decoded.platformRole === 'platform_admin') {
        request.user = {
          userId: decoded.userId,
          email: decoded.email,
          tenantId: decoded.tenantId,
          platformRole: decoded.platformRole,
          isPlatformAdmin: true
        };
        return;
      }
      
      // Check permissions in JWT
      const userPermissions = decoded.permissions || [];
      const hasPermission = requiredPermissions.some(perm => 
        userPermissions.includes(perm) || userPermissions.includes('*')
      );
      
      if (!hasPermission) {
        throw new AuthorizationError(
          `Required permission(s): ${requiredPermissions.join(', ')}`
        );
      }
      
      request.user = {
        userId: decoded.userId,
        email: decoded.email,
        tenantId: decoded.tenantId,
        permissions: decoded.permissions
      };
      
    } catch (error) {
      const statusCode = error.statusCode || (error.message.includes('permission') ? 403 : 401);
      
      return reply.code(statusCode).send({
        error: error.message || 'Insufficient permissions',
        code: error.message.includes('permission') ? 'INSUFFICIENT_PERMISSIONS' : 'NOT_AUTHENTICATED'
      });
    }
  };
}

/**
 * Combine multiple middleware functions
 * Useful for routes that need multiple checks
 * 
 * @param  {...Function} middlewares - Middleware functions to combine
 * @returns {Function} - Combined middleware function
 * 
 * @example
 *   const checkAuth = combineMiddleware(requireAuth, checkRateLimit);
 *   fastify.get('/data', { preHandler: checkAuth }, ...);
 */
function combineMiddleware(...middlewares) {
  return async (request, reply) => {
    for (const middleware of middlewares) {
      await middleware(request, reply);
      if (reply.sent) return; // Stop if response already sent
    }
  };
}

/**
 * Create custom auth middleware with options
 * Advanced: For special authentication requirements
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.requirePlatformAdmin - Require platform admin
 * @param {boolean} options.requireTenantAdmin - Require tenant admin
 * @param {string[]} options.requirePermissions - Required permissions
 * @param {boolean} options.optional - Make auth optional
 * @returns {Function} - Middleware function
 */
function createAuthMiddleware(options = {}) {
  return async (request, reply) => {
    if (options.requirePlatformAdmin) {
      return requirePlatformAdmin(request, reply);
    }
    
    if (options.requireTenantAdmin) {
      return requireTenantAdmin(request, reply);
    }
    
    if (options.requirePermissions) {
      return requirePermission(options.requirePermissions)(request, reply);
    }
    
    if (options.optional) {
      return optionalAuth(request, reply);
    }
    
    return requireAuth(request, reply);
  };
}

module.exports = {
  // Core middleware functions
  requireAuth,
  requirePlatformAdmin,
  requireTenantAdmin,
  optionalAuth,
  
  // Advanced middleware
  requirePermission,
  combineMiddleware,
  createAuthMiddleware,
  
  // Utilities
  extractAndVerifyToken,
  getJwtSecret,
  
  // Aliases for backward compatibility
  verifyPlatformAdmin: requirePlatformAdmin,
  requireSuperAdmin: requirePlatformAdmin
};




